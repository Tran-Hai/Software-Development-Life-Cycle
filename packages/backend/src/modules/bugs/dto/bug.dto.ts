import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateBugDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  stepsToReproduce?: string;

  @IsEnum(['low', 'medium', 'high', 'critical', 'blocker'])
  @IsOptional()
  severity?: 'low' | 'medium' | 'high' | 'critical' | 'blocker';

  @IsEnum(['open', 'in_progress', 'fixed', 'verified', 'rejected', 'closed'])
  @IsOptional()
  status?: 'open' | 'in_progress' | 'fixed' | 'verified' | 'rejected' | 'closed';

  @IsString()
  @IsOptional()
  environment?: string;

  @IsString()
  @IsOptional()
  testResultId?: string;

  @IsString()
  @IsOptional()
  issueId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;
}

export class UpdateBugDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  stepsToReproduce?: string;

  @IsEnum(['low', 'medium', 'high', 'critical', 'blocker'])
  @IsOptional()
  severity?: 'low' | 'medium' | 'high' | 'critical' | 'blocker';

  @IsEnum(['open', 'in_progress', 'fixed', 'verified', 'rejected', 'closed'])
  @IsOptional()
  status?: 'open' | 'in_progress' | 'fixed' | 'verified' | 'rejected' | 'closed';

  @IsString()
  @IsOptional()
  environment?: string;

  @IsString()
  @IsOptional()
  issueId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;
}
