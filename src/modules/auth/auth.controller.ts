import { ERole } from '@/common/constants/user.constant';
import { Public, ResponseMessage } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { LocalAuthGuard } from '@/common/guards/local-auth.guard';
import { type IUser } from '@/common/types/user.type';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import CheckIpGuard from '@/common/guards/check-ip.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(CheckIpGuard)
  @Get('check-ip')
  checkIp() {
    return {
      message: 'IP is valid',
    };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ResponseMessage('Login successful')
  async login(@User() user: IUser, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(user, res);
  }

  @Get('get-account')
  @ResponseMessage('Get account successful')
  async getAccount(@User() user: IUser) {
    return this.authService.getAccount(user);
  }

  @Public()
  @Get('refresh-token')
  @ResponseMessage('Refresh token successful')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken: string = req.cookies.refresh_token;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is invalid');
    }
    return this.authService.refreshToken(res, refreshToken);
  }

  @Get('list-refresh-token')
  @ResponseMessage('List refresh token successful')
  async listRefreshToken(
    @User() user: IUser,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.authService.getListRefreshToken(user, page, limit);
  }

  @Delete('refresh-token/:id')
  @ResponseMessage('Delete refresh token successful')
  async revokeRefreshToken(
    @Param('id', ParseIntPipe) id: number,
    @User() user: IUser,
  ) {
    return this.authService.revokeRefreshToken(id, user);
  }

  @Post('logout')
  @ResponseMessage('Logout successful')
  async logout(
    @Res({ passthrough: true }) res: Response,
    @User() user: IUser,
    @Req() req: Request,
  ) {
    return this.authService.logout(req, res, user);
  }

  @Patch('change-password')
  async changePassword(
    @User() user: IUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, changePasswordDto);
  }

  @Patch('reset-password/:id')
  @Roles(ERole.ADMIN)
  async resetPassword(@Param('id', ParseIntPipe) userId: number) {
    return this.authService.resetPassword(userId);
  }
}
