import { Module } from '@nestjs/common';
import { BondAssetsService } from './bond-assets.service';
import { BondAssetsController } from './bond-assets.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BondAssetsController],
    providers: [BondAssetsService],
    exports: [BondAssetsService],
})
export class BondAssetsModule { }
