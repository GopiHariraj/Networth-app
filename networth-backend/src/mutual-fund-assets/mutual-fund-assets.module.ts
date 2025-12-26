import { Module } from '@nestjs/common';
import { MutualFundAssetsService } from './mutual-fund-assets.service';
import { MutualFundAssetsController } from './mutual-fund-assets.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MutualFundAssetsController],
    providers: [MutualFundAssetsService],
    exports: [MutualFundAssetsService],
})
export class MutualFundAssetsModule { }
