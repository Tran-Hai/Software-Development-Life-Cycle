import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  projectId?: string;
  userId?: string;
  onIssueUpdate?: (data: any) => void;
  onIssueCreated?: (data: any) => void;
  onIssueDeleted?: (data: any) => void;
  onNotification?: (data: any) => void;
  onSprintStatus?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/ws`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');

      if (options.projectId && options.userId) {
        socket.emit('join-project', {
          projectId: options.projectId,
          userId: options.userId,
        });
      }
    });

    if (options.onIssueCreated) {
      socket.on('issue:created', options.onIssueCreated);
    }
    if (options.onIssueUpdate) {
      socket.on('issue:updated', options.onIssueUpdate);
    }
    if (options.onIssueDeleted) {
      socket.on('issue:deleted', options.onIssueDeleted);
    }
    if (options.onNotification) {
      socket.on('notification:new', options.onNotification);
    }
    if (options.onSprintStatus) {
      socket.on('sprint:status', options.onSprintStatus);
    }

    return () => {
      socket.off('issue:created');
      socket.off('issue:updated');
      socket.off('issue:deleted');
      socket.off('notification:new');
      socket.off('sprint:status');
      socket.disconnect();
    };
  }, [
    options.projectId,
    options.userId,
    options.onIssueCreated,
    options.onIssueUpdate,
    options.onIssueDeleted,
    options.onNotification,
    options.onSprintStatus,
  ]);

  const emitPresence = useCallback((status: 'online' | 'away' | 'busy') => {
    if (socketRef.current && options.userId) {
      socketRef.current.emit('presence:update', {
        userId: options.userId,
        status,
      });
    }
  }, [options.userId]);

  return { socket: socketRef.current, emitPresence };
}
