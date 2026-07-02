import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@/common/enums/user-status.enum';
import { compareHashedString, hashString } from '@/common/utils/crypto.util';
import type { IPayloadToken } from '@/common/types/auths.type';
import { type IUser } from '@/common/types/user.type';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import ms, { type StringValue } from 'ms';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string) {
    const userInfo = await this.userRepository.findOne({
      where: {
        email,
        status: UserStatus.ACTIVE,
      },
      relations: { employee: true },
      select: {
        id: true,
        email: true,
        password: true,
        roleId: true,
        displayName: true,
        status: true,
        employee: {
          id: true,
          departmentId: true,
          employeeCode: true,
        },
      },
    });
    if (userInfo && (await compareHashedString(password, userInfo.password))) {
      const { password, ...result } = userInfo;
      return result;
    }
    return null;
  }

  async login(user: IUser, res: Response) {
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

    await this.userRepository.update(user.id, {
      lastLogin: new Date(),
    });

    return {
      access_token: accessToken,
    };
  }

  async getAccount(user: IUser) {
    try {
      const account = await this.userRepository.findOne({
        where: { id: user.id },
        relations: { employee: true },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          employee: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            avatar: true,
            departmentId: true,
          },
        },
      });
      return account;
    } catch (error) {
      throw new BadRequestException('User not found');
    }
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

      return {
        access_token: accessToken,
      };
    } catch (error) {
      res.clearCookie('refresh_token');
      throw new BadRequestException('Refresh token is invalid or expired');
    }
  }

  logout(res: Response) {
    res.clearCookie('refresh_token');
    return 'Logout successful';
  }

  async changePassword(user: IUser, changePasswordDto: ChangePasswordDto) {
    const userInfo = await this.userRepository.findOne({
      where: {
        id: user.id,
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
    await this.userRepository.update(userInfo.id, {
      password: hashedPassword,
    });

    return 'Change password successful';
  }

  private createRefreshToken(payloadToken: IPayloadToken) {
    return this.jwtService.sign(payloadToken, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES', '7d'),
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });
  }
}
