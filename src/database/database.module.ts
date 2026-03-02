import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        // the '+' converts the string from .env to a number, '!' asserts it's not undefined
        port: +configService.get<string>('DB_PORT')!,
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASS'),
        database: configService.get('DB_NAME'),
        // auto-finds all entity files so we don't have to list them manually
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        // synchronize:true auto-creates/updates tables from entities — only for dev!
        // never use this in production, use migrations instead
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}