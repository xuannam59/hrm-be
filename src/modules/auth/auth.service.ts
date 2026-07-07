import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EUserStatus } from '@/common/types/user.type';
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
import { ERole } from '@/common/constants/role.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async validateUser(email: string, password: string) {
    try {
      const userInfo = await this.userRepository.findOne({
        where: {
          email,
          status: EUserStatus.ACTIVE,
        },
        relations: { employee: true },
        select: {
          id: true,
          email: true,
          password: true,
          role: true,
          displayName: true,
          status: true,
          employee: {
            id: true,
            departmentId: true,
            employeeCode: true,
          },
        },
      });
      if (
        userInfo &&
        (await compareHashedString(password, userInfo.password))
      ) {
        const { password, ...result } = userInfo;
        return result;
      }
      return null;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async login(user: IUser, res: Response) {
    try {
      const payloadToken: IPayloadToken = {
        sub: user.id,
        email: user.email,
        role: user.role,
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

      this.logger.log(`User ${user.email} logged in successfully`);
      return {
        access_token: accessToken,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async getAccount(user: IUser) {
    try {
      const account = await this.userRepository.findOne({
        where: { id: user.id },
        relations: { employee: { department: true } },
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
            department: {
              id: true,
              name: true,
            },
          },
        },
      });
      return account;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
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
        role: user.role,
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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Refresh token is invalid or expired');
    }
  }

  logout(res: Response) {
    res.clearCookie('refresh_token');
    return 'Logout successful';
  }

  async changePassword(user: IUser, changePasswordDto: ChangePasswordDto) {
    try {
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
      this.logger.log(`User ${userInfo.email} changed password successfully`);
      return 'Change password successful';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  private createRefreshToken(payloadToken: IPayloadToken) {
    return this.jwtService.sign(payloadToken, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES', '7d'),
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });
  }
}
