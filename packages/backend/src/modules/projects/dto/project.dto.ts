import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['private', 'internal', 'public'])
  @IsOptional()
  visibility?: 'private' | 'internal' | 'public';
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['private', 'internal', 'public'])
  @IsOptional()
  visibility?: 'private' | 'internal' | 'public';

  @IsEnum(['active', 'archived'])
  @IsOptional()
  status?: 'active' | 'archived';
}
