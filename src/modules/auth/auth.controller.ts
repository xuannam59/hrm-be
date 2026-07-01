import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { User } from '@/common/decorators/user.decorator';
import { ApiBody } from '@nestjs/swagger';
import { Role } from '@/common/constants/role.constant';
import { type IUser } from '@/common/types/user.type';
import type { Request, Response } from 'express';
import { LocalAuthGuard } from '@/common/guards/local-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ResponseMessage } from '@/common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
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
  @Roles(Role.ADMIN, Role.MANAGER)
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Post('change-password')
  async changePassword(
    @User() user: IUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, changePasswordDto);
  }
}
