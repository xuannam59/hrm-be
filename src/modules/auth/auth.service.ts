import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { UserStatus } from 'generated/prisma/client';
import { compareHashedString, hashString } from '@/common/utils/crypto.util';
import type { IPayloadToken } from '@/common/types/auths.type';
import { type IUser } from '@/common/types/user.type';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import ms, { type StringValue } from 'ms';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string) {
    const userInfo = await this.prismaService.user.findUnique({
      where: {
        email,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        password: true,
        roleId: true,
        displayName: true,
        status: true,
      },
    });
    if (userInfo && (await compareHashedString(password, userInfo.password))) {
      const { password, ...result } = userInfo;
      return result;
    }
    return null;
  }

  async login(user: IUser, res: Response) {
    try {
      const payloadToken: IPayloadToken = {
        sub: user.id,
        email: user.email,
        role: user.roleId,
        status: user.status,
      };

      const accessToken = this.jwtService.sign(payloadToken);

      const refreshToken = this.createRefreshToken(payloadToken);

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: ms(
          this.configService.get<StringValue>('JWT_REFRESH_EXPIRES', '7d'),
        ),
      });

      await this.prismaService.user.update({
        where: {
          email: user.email,
        },
        data: {
          lastLogin: new Date(),
        },
      });

      const result = {
        access_token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          roleId: user.roleId,
          status: user.status,
        },
      };

      return result;
    } catch (error) {
      throw new BadRequestException('Invalid email or password');
    }
  }

  async getAccount(user: IUser) {
    try {
      const account = await this.prismaService.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          status: true,
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });
      return account;
    } catch (error) {
      throw new BadRequestException('User not found');
    }
  }

  createRefreshToken(payloadToken: IPayloadToken) {
    return this.jwtService.sign(payloadToken, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES', '7d'),
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refresh_token;
      const decoded: IPayloadToken = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findByEmail(decoded.email);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const payloadToken: IPayloadToken = {
        email: user.email,
        sub: user.id,
        role: user.roleId,
        status: user.status,
      };

      const accessToken = this.jwtService.sign(payloadToken);
      const newRefreshToken = this.createRefreshToken(payloadToken);

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        maxAge: ms(
          this.configService.get<StringValue>('JWT_REFRESH_EXPIRES', '7d'),
        ),
      });

      return accessToken;
    } catch (error) {
      res.clearCookie('refresh_token');
      throw new BadRequestException('Refresh token is invalid or expired');
    }
  }

  logout(res: Response) {
    res.clearCookie('refresh_token');
    // đưa token vào redis để xóa
    return 'Logout successful';
  }

  async changePassword(user: IUser, changePasswordDto: ChangePasswordDto) {
    const userInfo = await this.prismaService.user.findUnique({
      where: {
        email: user.email,
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!userInfo) {
      throw new BadRequestException('User not found');
    }

    if (
      !(await compareHashedString(
        changePasswordDto.oldPassword,
        userInfo.password,
      ))
    ) {
      throw new BadRequestException('Old password is incorrect');
    }

    if (
      changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword
    ) {
      throw new BadRequestException(
        'New password and confirm new password do not match',
      );
    }
    const hashedPassword = await hashString(changePasswordDto.newPassword);
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return 'Change password successful';
  }
}
