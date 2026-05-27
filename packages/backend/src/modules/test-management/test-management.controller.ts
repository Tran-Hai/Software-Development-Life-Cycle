import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TestManagementService } from './test-management.service';
import {
  CreateTestSuiteDto,
  UpdateTestSuiteDto,
  CreateTestCaseDto,
  UpdateTestCaseDto,
  CreateTestRunDto,
  UpdateTestRunStatusDto,
  CreateTestResultDto,
} from './dto/test-management.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectPermissionGuard } from '../../common/guards/project-permission.guard';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects/:projectId/test-suites')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
export class TestSuitesController {
  constructor(private testManagementService: TestManagementService) {}

  @Get()
  @RequiredPermission('test_case', 'read')
  async findAll(@Param('projectId') projectId: string) {
    return this.testManagementService.findAllSuites(projectId);
  }

  @Post()
  @RequiredPermission('test_case', 'create')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTestSuiteDto,
  ) {
    return this.testManagementService.createSuite(projectId, dto);
  }

  @Get(':id')
  @RequiredPermission('test_case', 'read')
  async findOne(@Param('id') id: string) {
    return this.testManagementService.findSuite(id);
  }

  @Patch(':id')
  @RequiredPermission('test_case', 'update')
  async update(@Param('id') id: string, @Body() dto: UpdateTestSuiteDto) {
    return this.testManagementService.updateSuite(id, dto);
  }

  @Delete(':id')
  @RequiredPermission('test_case', 'delete')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.testManagementService.deleteSuite(id, user.id);
  }
}

@Controller('projects/:projectId/test-cases')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
export class TestCasesController {
  constructor(private testManagementService: TestManagementService) {}

  @Get()
  @RequiredPermission('test_case', 'read')
  async findAll(
    @Param('projectId') projectId: string,
    @Query('suiteId') suiteId?: string,
  ) {
    return this.testManagementService.findAllCases(projectId, suiteId);
  }

  @Post()
  @RequiredPermission('test_case', 'create')
  async create(
    @Param('projectId') projectId: string,
    @Query('suiteId') suiteId: string,
    @Body() dto: CreateTestCaseDto,
    @CurrentUser() user: any,
  ) {
    return this.testManagementService.createCase(projectId, suiteId, user.id, dto);
  }

  @Get(':id')
  @RequiredPermission('test_case', 'read')
  async findOne(@Param('id') id: string) {
    return this.testManagementService.findCase(id);
  }

  @Patch(':id')
  @RequiredPermission('test_case', 'update')
  async update(@Param('id') id: string, @Body() dto: UpdateTestCaseDto) {
    return this.testManagementService.updateCase(id, dto);
  }

  @Delete(':id')
  @RequiredPermission('test_case', 'delete')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.testManagementService.deleteCase(id, user.id);
  }
}

@Controller('test-suites/:suiteId/test-runs')
@UseGuards(JwtAuthGuard)
export class TestRunsController {
  constructor(private testManagementService: TestManagementService) {}

  @Post()
  async create(
    @Param('suiteId') suiteId: string,
    @Body() dto: CreateTestRunDto,
    @CurrentUser() user: any,
  ) {
    return this.testManagementService.createRun(
      '',
      suiteId,
      user.id,
      dto,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.testManagementService.findRun(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTestRunStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.testManagementService.updateRunStatus(id, dto, user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.testManagementService.deleteRun(id, user.id);
  }
}

@Controller('projects/:projectId/test-runs')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
export class TestProjectRunsController {
  constructor(private testManagementService: TestManagementService) {}

  @Get()
  @RequiredPermission('test_run', 'read')
  async findAll(
    @Param('projectId') projectId: string,
    @Query('suiteId') suiteId?: string,
  ) {
    return this.testManagementService.findAllRuns(projectId, suiteId);
  }
}

@Controller('test-runs/:runId/results')
@UseGuards(JwtAuthGuard)
export class TestResultsController {
  constructor(private testManagementService: TestManagementService) {}

  @Post()
  async create(
    @Param('runId') runId: string,
    @Body() dto: CreateTestResultDto,
    @CurrentUser() user: any,
  ) {
    return this.testManagementService.createResult(runId, user.id, dto);
  }

  @Patch(':resultId')
  async update(
    @Param('resultId') resultId: string,
    @Body() dto: CreateTestResultDto,
  ) {
    return this.testManagementService.updateResult(resultId, dto);
  }
}
