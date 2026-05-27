import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class AddMemberDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;
}

export class UpdateMemberDto {
  @IsString()
  @IsNotEmpty()
  roleId: string;
}
