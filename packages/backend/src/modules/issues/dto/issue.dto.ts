import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CreateIssueDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  issueTypeId: string;

  @IsString()
  @IsOptional()
  epicId?: string;

  @IsString()
  @IsOptional()
  sprintId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsEnum(['backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done'])
  @IsOptional()
  status?: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'testing' | 'done';

  @IsEnum(['lowest', 'low', 'medium', 'high', 'highest', 'critical'])
  @IsOptional()
  priority?: 'lowest' | 'low' | 'medium' | 'high' | 'highest' | 'critical';

  @IsInt()
  @IsOptional()
  storyPoints?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateIssueDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  issueTypeId?: string;

  @IsString()
  @IsOptional()
  epicId?: string;

  @IsString()
  @IsOptional()
  sprintId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsEnum(['backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done'])
  @IsOptional()
  status?: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'testing' | 'done';

  @IsEnum(['lowest', 'low', 'medium', 'high', 'highest', 'critical'])
  @IsOptional()
  priority?: 'lowest' | 'low' | 'medium' | 'high' | 'highest' | 'critical';

  @IsInt()
  @IsOptional()
  storyPoints?: number;

  @IsInt()
  @IsOptional()
  position?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class CreateIssueCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
