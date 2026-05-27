import { useEffect, useRef, useCallback } from 'react';

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
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const baseUrl = '/api/v1';
    const url = `${baseUrl}/events?projectId=${options.projectId || ''}&userId=${options.userId || ''}`;

    const es = new EventSource(url);

    es.onopen = () => {
      console.log('SSE connected');
    };

    es.addEventListener('issue:created', (event) => {
      options.onIssueCreated?.(JSON.parse(event.data));
    });
    es.addEventListener('issue:updated', (event) => {
      options.onIssueUpdate?.(JSON.parse(event.data));
    });
    es.addEventListener('issue:deleted', (event) => {
      options.onIssueDeleted?.(JSON.parse(event.data));
    });
    es.addEventListener('notification:new', (event) => {
      options.onNotification?.(JSON.parse(event.data));
    });
    es.addEventListener('sprint:status', (event) => {
      options.onSprintStatus?.(JSON.parse(event.data));
    });

    es.onerror = () => {
      console.warn('SSE connection error (server-sent events not yet implemented for real-time)');
    };

    eventSourceRef.current = es;

    return () => {
      es.close();
      eventSourceRef.current = null;
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

  const emitPresence = useCallback((_status: 'online' | 'away' | 'busy') => {
    // SSE is one-way; presence will be sent via REST API
  }, []);

  return { eventSource: eventSourceRef.current, emitPresence };
}
