import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { User } from '@/common/decorators/user.decorator';
import { ApiBody } from '@nestjs/swagger';
import { type IUser } from '@/common/types/user.type';
import type { Request, Response } from 'express';
import { LocalAuthGuard } from '@/common/guards/local-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ERole } from '@/common/constants/user.constant';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    return this.authService.refreshToken(req, res);
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
