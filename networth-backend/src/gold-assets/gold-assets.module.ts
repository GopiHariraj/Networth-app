import { Module } from '@nestjs/common';
import { GoldAssetsController } from './gold-assets.controller';
import { GoldAssetsService } from './gold-assets.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Module({
  controllers: [GoldAssetsController],
  providers: [GoldAssetsService, PrismaService],
  exports: [GoldAssetsService],
})
export class GoldAssetsModule {}
