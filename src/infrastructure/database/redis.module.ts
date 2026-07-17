import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ms, { type StringValue } from 'ms';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        stores: [new KeyvRedis(configService.get('REDIS_URL'))],
        ttl: ms(configService.get<StringValue>('CACHE_TTL', '3m')),
      }),
      isGlobal: true,
      inject: [ConfigService],
    }),
  ],
})
export class RedisModule {}
