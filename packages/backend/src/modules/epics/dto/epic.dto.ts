import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateEpicDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsEnum(['backlog', 'in_progress', 'completed', 'cancelled'])
  @IsOptional()
  status?: 'backlog' | 'in_progress' | 'completed' | 'cancelled';
}

export class UpdateEpicDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsEnum(['backlog', 'in_progress', 'completed', 'cancelled'])
  @IsOptional()
  status?: 'backlog' | 'in_progress' | 'completed' | 'cancelled';
}
