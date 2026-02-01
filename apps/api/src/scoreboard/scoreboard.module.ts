import { Module } from '@nestjs/common';
import { ScoreboardController } from './scoreboard.controller';
import { ScoreboardService } from './scoreboard.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ScoreboardController],
    providers: [ScoreboardService],
})
export class ScoreboardModule { }
