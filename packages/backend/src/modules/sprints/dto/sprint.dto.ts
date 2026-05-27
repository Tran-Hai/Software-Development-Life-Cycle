import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsInt } from 'class-validator';

export class CreateSprintDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(['planning', 'active', 'completed', 'cancelled'])
  @IsOptional()
  status?: 'planning' | 'active' | 'completed' | 'cancelled';

  @IsInt()
  @IsOptional()
  position?: number;
}

export class UpdateSprintDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(['planning', 'active', 'completed', 'cancelled'])
  @IsOptional()
  status?: 'planning' | 'active' | 'completed' | 'cancelled';

  @IsInt()
  @IsOptional()
  position?: number;
}

export class UpdateSprintStatusDto {
  @IsEnum(['planning', 'active', 'completed', 'cancelled'])
  @IsNotEmpty()
  status: 'planning' | 'active' | 'completed' | 'cancelled';
}
