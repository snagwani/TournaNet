import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventDto } from './dto/event.dto';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: 422
    }))
    async create(@Body() createEventDto: CreateEventDto): Promise<EventDto> {
        return this.eventsService.create(createEventDto);
    }
}
