import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_PORT } from './config/constants';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //await app.listen(3000);
  const config: ConfigService = app.get(ConfigService);
  await app.listen(config.get<any>(APP_PORT))
}
bootstrap();
