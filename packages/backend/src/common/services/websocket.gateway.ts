import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');
  private connectedUsers = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('join-project')
  handleJoinProject(
    @MessageBody() data: { projectId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`project:${data.projectId}`);
    this.connectedUsers.set(data.userId, client.id);
    this.logger.log(`User ${data.userId} joined project ${data.projectId}`);
    return { event: 'joined', data: { projectId: data.projectId } };
  }

  @SubscribeMessage('leave-project')
  handleLeaveProject(
    @MessageBody() data: { projectId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`project:${data.projectId}`);
    return { event: 'left', data: { projectId: data.projectId } };
  }

  @SubscribeMessage('presence:update')
  handlePresenceUpdate(
    @MessageBody() data: { userId: string; status: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.emit('presence:updated', {
      userId: data.userId,
      status: data.status,
    });
    return { event: 'presence:updated', data };
  }

  emitToProject(projectId: string, event: string, data: any) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }
}
