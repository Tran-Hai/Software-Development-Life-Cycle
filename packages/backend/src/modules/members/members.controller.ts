import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { AddMemberDto, UpdateMemberDto } from './dto/member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Post()
  async addMember(
    @Param('projectId') projectId: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.membersService.addMember(projectId, dto, user.id);
  }

  @Get()
  async findAll(@Param('projectId') projectId: string) {
    return this.membersService.findAll(projectId);
  }

  @Patch(':memberId')
  async updateMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.membersService.updateMember(projectId, memberId, dto, user.id);
  }

  @Delete(':memberId')
  async removeMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.membersService.removeMember(projectId, memberId, user.id);
  }
}
