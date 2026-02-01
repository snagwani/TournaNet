import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';

@Controller('schedule')
export class ScheduleController {
    constructor(private readonly scheduleService: ScheduleService) { }

    @Post('generate')
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: 422
    }))
    async generate(@Body() dto: GenerateScheduleDto) {
        return this.scheduleService.generate(dto);
    }
}
