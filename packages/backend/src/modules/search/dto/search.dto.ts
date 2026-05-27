import { IsNotEmpty, IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  q: string;

  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsEnum(['issue', 'document', 'bug'])
  @IsOptional()
  type?: 'issue' | 'document' | 'bug';

  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}

export class GlobalSearchQueryDto {
  @IsString()
  @IsNotEmpty()
  q: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
