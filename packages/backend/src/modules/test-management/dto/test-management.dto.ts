import { IsNotEmpty, IsString, IsOptional, IsEnum, IsInt } from 'class-validator';

export class CreateTestSuiteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['active', 'archived'])
  @IsOptional()
  status?: 'active' | 'archived';
}

export class UpdateTestSuiteDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['active', 'archived'])
  @IsOptional()
  status?: 'active' | 'archived';
}

export class CreateTestCaseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  preconditions?: string;

  @IsString()
  @IsOptional()
  steps?: string;

  @IsString()
  @IsOptional()
  expectedResult?: string;

  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'critical';

  @IsEnum(['draft', 'ready', 'deprecated'])
  @IsOptional()
  status?: 'draft' | 'ready' | 'deprecated';
}

export class UpdateTestCaseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  preconditions?: string;

  @IsString()
  @IsOptional()
  steps?: string;

  @IsString()
  @IsOptional()
  expectedResult?: string;

  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'critical';

  @IsEnum(['draft', 'ready', 'deprecated'])
  @IsOptional()
  status?: 'draft' | 'ready' | 'deprecated';
}

export class CreateTestRunDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  sprintId?: string;

  @IsInt()
  @IsOptional()
  testCaseIds?: number[];
}

export class UpdateTestRunStatusDto {
  @IsEnum(['planned', 'in_progress', 'passed', 'failed', 'blocked'])
  @IsNotEmpty()
  status: 'planned' | 'in_progress' | 'passed' | 'failed' | 'blocked';
}

export class CreateTestResultDto {
  @IsString()
  @IsNotEmpty()
  testCaseId: string;

  @IsEnum(['pass', 'fail', 'blocked', 'skipped'])
  @IsNotEmpty()
  status: 'pass' | 'fail' | 'blocked' | 'skipped';

  @IsString()
  @IsOptional()
  actualResult?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
