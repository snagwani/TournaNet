import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { ResultsGlobalController } from './results-global.controller';
import { ResultsService } from './results.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ResultsController, ResultsGlobalController],
    providers: [ResultsService],
})
export class ResultsModule { }
