import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_PORT } from './config/constants';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = [
    //'http://localhost', //without port doesnt work
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    // 'http://192.168.100.5:4200', //wsl2 localnetwork forwarding
    // 'http://172.17.209.23:4200',//wsl2 localnetwork forwarding
    // 'http://192.168.100.50:4200',//wsl2 localnetwork forwarding
    // 'http://0.0.0.0:4200',//wsl2 localnetwork forwarding
  ];
  // Reflect the origin if it's in the allowed list or not defined (cURL, Postman, etc.)
  const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials:true
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
