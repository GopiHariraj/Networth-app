import { Module } from '@nestjs/common';
import { CreditCardsService } from './credit-cards.service';
import { CreditCardsController } from './credit-cards.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CreditCardsController],
    providers: [CreditCardsService],
    exports: [CreditCardsService],
})
export class CreditCardsModule { }
