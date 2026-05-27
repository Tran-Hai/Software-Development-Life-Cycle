import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EventsGateway } from '../../common/services/websocket.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(userId: string, page = 1, limit = 20) {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      unread: await this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async notify(data: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    entityType?: string;
    entityId?: string;
  }) {
    const notification = await this.prisma.notification.create({ data });
    this.eventsGateway.emitToUser(data.userId, 'notification:new', notification);
    return notification;
  }

  async notifyProject(projectId: string, data: {
    type: string;
    title: string;
    body?: string;
    entityType?: string;
    entityId?: string;
  }) {
    const members = await this.prisma.member.findMany({
      where: { projectId },
      select: { userId: true },
    });
    for (const member of members) {
      await this.notify({ userId: member.userId, ...data });
    }
  }

  async delete(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }
}
