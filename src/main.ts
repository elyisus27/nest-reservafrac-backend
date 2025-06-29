import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_PORT } from './config/constants';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = [
    'http://192.168.196.2',   //sequoia production LAN
    'http://192.168.196.10:4200',   //phone test
    'http://192.168.11.136:4200',   //phone test
    'http://localhost:4200',

    'http://184.73.212.190' //AWS Elastic IP for production environment


  ];
  // Reflect the origin if it's in the allowed list or not defined (cURL, Postman, etc.)
  const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        console.log(origin)
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true
  };

  app.enableCors(corsOptions);
  app.use(
    session({
      secret: 'my-secret',
      resave: false,
      saveUninitialized: false,
    }),
  );


  const config: ConfigService = app.get(ConfigService);
  await app.listen(config.get<any>(APP_PORT));
}
bootstrap();
