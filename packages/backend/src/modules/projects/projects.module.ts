import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectStatsController } from './project-stats.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [ProjectsController, ProjectStatsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
