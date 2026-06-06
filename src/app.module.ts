import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { VisitorsModule } from './visitors/visitors.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.ENV_TYPE || 'development'}`,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URL');

        if (!uri) {
          throw new Error(
            'Application startup failed: MONGODB_URL is not configured',
          );
        }

        return {
          uri,
          connectionFactory: (conn: Connection) => {
            conn.on('connected', () => {
              console.log('DB CONNECTION: SUCCESSFUL');
            });

            conn.on('disconnected', () => {
              console.log('DB CONNECTION: DISCONNECTED');
            });

            conn.on('error', (err: Error) => {
              console.log('DB CONNECTION: ERROR', err.message);
            });

            return conn;
          },
        };
      },
    }),
    VisitorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
