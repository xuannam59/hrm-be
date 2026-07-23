import { ERole, EUserStatus } from '@/common/constants/user.constant';
import type { IPayloadToken } from '@/common/types/auths.type';
import { type IUser } from '@/common/types/user.type';
import { compareHashedString, hashString } from '@/common/utils/crypto.util';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import ms, { type StringValue } from 'ms';
import { MoreThan, Not, Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { generateRandomString } from '@/common/utils/string.util';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';
import { RefreshTokenEntity } from '../users/entities/refresh_token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message ?? 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async login(user: IUser, res: Response) {
    try {
      const payloadToken: IPayloadToken = {
        userId: user.id,
        email: user.email,
        status: user.status,
      };

      const accessToken = this.jwtService.sign(payloadToken);

      const refreshToken = await this.createRefreshToken(user.id);

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
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message ?? 'Internal server error',
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
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message ?? 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async refreshToken(res: Response, refreshToken: string) {
    try {
      const validRefreshToken = await this.refreshTokenRepository.findOne({
        where: {
          value: refreshToken,
          expiresAt: MoreThan(new Date()),
        },
        relations: {
          user: true,
        },
        select: {
          id: true,
          expiresAt: true,
          user: {
            id: true,
            email: true,
            status: true,
          },
        },
      });

      if (!validRefreshToken || !validRefreshToken.user) {
        throw new BadRequestException('Refresh token is invalid or expired');
      }

      const user = validRefreshToken.user;

      const payloadToken: IPayloadToken = {
        email: user.email,
        userId: user.id,
        status: user.status,
      };

      const accessToken = this.jwtService.sign(payloadToken);
      const newRefreshToken = await this.updateRefreshToken(
        validRefreshToken.id,
      );

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        maxAge: ms(
          this.configService.get<StringValue>('JWT_REFRESH_EXPIRES', '7d'),
        ),
      });

      return {
        access_token: accessToken,
      };
    } catch (error: any) {
      res.clearCookie('refresh_token');
      throw error;
    }
  }

  async logout(req: Request, res: Response, user: IUser) {
    try {
      const authorization = req.headers.authorization;
      const refreshToken: string = req.cookies.refresh_token;
      const accessToken = authorization ? authorization.split(' ')[1] : '';
      await this.cacheManager.del(`blacklist_token:${user.id}`);
      await this.cacheManager.set(
        `blacklist_token:${user.id}`,
        accessToken,
        ms(this.configService.get<StringValue>('JWT_ACCESS_EXPIRES', '15m')),
      );
      if (refreshToken) {
        await this.refreshTokenRepository.softDelete({
          value: refreshToken,
          userId: user.id,
        });
      }
      res.clearCookie('refresh_token');
      return 'Logout successful';
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message ?? 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
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
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message ?? 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async resetPassword(userId: number) {
    try {
      const userInfo = await this.userRepository.findOne({
        where: {
          id: userId,
          status: EUserStatus.ACTIVE,
          role: Not(ERole.ADMIN),
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (!userInfo) {
        throw new BadRequestException('User not found');
      }

      const password = generateRandomString(10);
      const hashedPassword = await hashString(password);
      await this.userRepository.update(userInfo.id, {
        password: hashedPassword,
      });

      this.logger.log(`User ${userInfo.email} reset password successfully`);
      return { password };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async getListRefreshToken(user: IUser, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      const [refreshTokens, total] =
        await this.refreshTokenRepository.findAndCount({
          where: { userId: user.id },
          skip,
          take: limit,
          order: {
            createdAt: 'DESC',
          },
        });
      return {
        results: refreshTokens,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async revokeRefreshToken(refreshTokenId: number, user: IUser) {
    try {
      const record = await this.refreshTokenRepository.findOne({
        where: {
          id: refreshTokenId,
          userId: user.id,
        },
      });

      if (!record) {
        throw new BadRequestException('Refresh token not found');
      }

      await this.refreshTokenRepository.softDelete(refreshTokenId);
      return 'Revoke refresh token successful';
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message ?? 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  private async createRefreshToken(userId: number) {
    const refreshToken = await this.refreshTokenRepository.save({
      value: generateRandomString(20),
      expiresAt: new Date(
        Date.now() +
          ms(this.configService.get<StringValue>('JWT_REFRESH_EXPIRES', '7d')),
      ),
      userId: userId,
    });
    return refreshToken.value;
  }

  private async updateRefreshToken(refreshTokenId: number) {
    const value = generateRandomString(20);
    await this.refreshTokenRepository.update(refreshTokenId, {
      value,
      expiresAt: new Date(
        Date.now() +
          ms(this.configService.get<StringValue>('JWT_REFRESH_EXPIRES', '7d')),
      ),
    });
    return value;
  }
}
