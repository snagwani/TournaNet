import { Controller, Post, Get, Patch, Query, Param, Body, UsePipes, ValidationPipe, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventDto } from './dto/event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SCORER)
    async findAll(@Query('date') date?: string): Promise<EventDto[]> {
        return this.eventsService.findAll(date);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SCORER)
    async findOne(@Param('id') id: string) {
        return this.eventsService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.SCORER)
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: 422
    }))
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateEventDto
    ): Promise<EventDto> {
        return this.eventsService.update(id, dto);
    }

    @Post()
    @Roles(UserRole.ADMIN)
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: 422
    }))
    async create(@Body() createEventDto: CreateEventDto): Promise<EventDto> {
        return this.eventsService.create(createEventDto);
    }

    @Post('bulk-import')
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('file'))
    async bulkImport(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new Error('CSV file is required');
        }
        return this.eventsService.bulkImport(file.buffer);
    }
}
