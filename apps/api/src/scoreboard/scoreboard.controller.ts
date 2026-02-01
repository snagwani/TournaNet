import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ScoreboardService } from './scoreboard.service';
import { UpcomingQueryDto, ResultsQueryDto, AthleteSearchQueryDto } from './dto/scoreboard-query.dto';

@Controller('scoreboard')
export class ScoreboardController {
    constructor(private readonly service: ScoreboardService) { }

    @Get('current')
    async getCurrent() {
        return this.service.getCurrentEvents();
    }

    @Get('upcoming')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getUpcoming(@Query() query: UpcomingQueryDto) {
        return this.service.getUpcomingEvents(query);
    }

    @Get('results')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getResults(@Query() query: ResultsQueryDto) {
        return this.service.getResults(query);
    }

    @Get('medals')
    async getMedals() {
        return this.service.getMedals();
    }

    @Get('athletes/search')
    async searchAthletes(@Query() query: AthleteSearchQueryDto) {
        return this.service.searchAthletes(query);
    }
}
