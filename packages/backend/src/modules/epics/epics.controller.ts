import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EpicsService } from './epics.service';
import { CreateEpicDto, UpdateEpicDto } from './dto/epic.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('projects/:projectId/epics')
@UseGuards(JwtAuthGuard)
export class EpicsController {
  constructor(private epicsService: EpicsService) {}

  @Get()
  async findAll(@Param('projectId') projectId: string) {
    return this.epicsService.findAll(projectId);
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateEpicDto,
  ) {
    return this.epicsService.create(projectId, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.epicsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEpicDto) {
    return this.epicsService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.epicsService.delete(id);
  }
}
