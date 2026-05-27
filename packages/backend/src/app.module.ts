import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { MembersModule } from './modules/members/members.module';
import { IssuesModule } from './modules/issues/issues.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TestManagementModule } from './modules/test-management/test-management.module';
import { BugsModule } from './modules/bugs/bugs.module';
import { EpicsModule } from './modules/epics/epics.module';
import { SearchModule } from './modules/search/search.module';
import { FileUploadModule } from './common/services/file-upload.module';
import { EventsModule } from './common/services/events.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { PrismaModule } from './database/prisma/prisma.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig, storageConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
    MembersModule,
    IssuesModule,
    SprintsModule,
    DocumentsModule,
    NotificationsModule,
    TestManagementModule,
    BugsModule,
    EpicsModule,
    SearchModule,
    FileUploadModule,
    EventsModule,
    RbacModule,
  ],
})
export class AppModule {}
