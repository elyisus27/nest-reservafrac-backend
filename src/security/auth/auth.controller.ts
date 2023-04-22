import { Controller, Get, Post, Body, ValidationPipe, UsePipes, UnauthorizedException, } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
//mport { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Post('login')
  create(@Body() createAuthDto: LoginDto) {
    return this.authService.login(createAuthDto);
  }

  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Get('getest')
  gettest(@Body() createAuthDto: LoginDto) {
    throw new UnauthorizedException();
  }

  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Post('postest')
  posttest(@Body() createAuthDto: LoginDto) {
    return new UnauthorizedException();
  }

  // @Post()
  // create(@Body() createAuthDto: CreateAuthDto) {
  //   return this.authService.create(createAuthDto);
  // }

  // @Get()
  // findAll() {
  //   return this.authService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.authService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.authService.remove(+id);
  // }
}
