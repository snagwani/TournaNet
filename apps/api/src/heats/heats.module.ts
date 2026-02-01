import { Module } from '@nestjs/common';
import { HeatsController } from './heats.controller';
import { HeatsService } from './heats.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [HeatsController],
    providers: [HeatsService],
})
export class HeatsModule { }
