'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import { Plus, MoreHorizontal, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusConfig, getPriorityConfig } from '@/lib/utils';

const columns = [
  { id: 'backlog', title: 'Backlog', dot: 'bg-gray-500' },
  { id: 'todo', title: 'Todo', dot: 'bg-blue-500' },
  { id: 'in_progress', title: 'In Progress', dot: 'bg-yellow-500' },
  { id: 'in_review', title: 'In Review', dot: 'bg-purple-500' },
  { id: 'testing', title: 'Testing', dot: 'bg-orange-500' },
  { id: 'done', title: 'Done', dot: 'bg-green-500' },
];

export default function ProjectKanbanPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [draggedIssue, setDraggedIssue] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: issues, isLoading } = useQuery({
    queryKey: ['issues', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/issues`),
    staleTime: 30000,
  });

  const updateIssue = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/projects/${projectId}/issues/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
    },
  });

  const handleDragStart = useCallback((e: React.DragEvent, issueId: string) => {
    e.dataTransfer.setData('text/plain', issueId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIssue(issueId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIssue(null);
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, status: string) => {
      e.preventDefault();
      if (draggedIssue) {
        updateIssue.mutate({ id: draggedIssue, status });
        setDraggedIssue(null);
        setDragOverColumn(null);
      }
    },
    [draggedIssue, updateIssue],
  );

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.id} className="flex-shrink-0 w-72 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-5 w-20" />
            </div>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const issuesData = issues?.data || [];

  return (
    <div className="animate-fade-in">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {columns.map((column) => {
          const columnIssues = issuesData.filter((issue: any) => issue.status === column.id);
          const isDragOver = dragOverColumn === column.id;

          if (columnIssues.length === 0 && !draggedIssue) return null;

          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-72 rounded-xl transition-colors ${
                isDragOver ? 'bg-blue-50/80 ring-2 ring-blue-200' : 'bg-gray-50/80'
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="sticky top-0 z-10 p-3 pb-2 bg-inherit rounded-t-xl">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                    <h3 className="font-semibold text-sm text-gray-700">{column.title}</h3>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-gray-200/60 px-2 py-0.5 rounded-full">
                    {columnIssues.length}
                  </span>
                </div>
              </div>

              {/* Issues */}
              <div className="px-3 pb-3 space-y-2 min-h-[120px]">
                {columnIssues.map((issue: any) => (
                  <Card
                    key={issue.id}
                    className="card-hover cursor-grab active:cursor-grabbing group"
                    draggable
                    onDragStart={(e) => handleDragStart(e, issue.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: issue.issueType?.color || '#6b7280' }}
                        />
                        <span className="text-xs font-mono text-muted-foreground">{issue.issueNumber}</span>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      <p className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">{issue.title}</p>

                      <div className="flex items-center justify-between">
                        <Badge variant="priority" value={issue.priority} />

                        <div className="flex items-center gap-2">
                          {issue._count?.comments > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              {issue._count.comments}
                            </span>
                          )}
                          {issue.assignee && (
                            <Avatar
                              name={issue.assignee.fullName}
                              src={issue.assignee.avatarUrl}
                              size="sm"
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {columnIssues.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                      <Plus className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs text-muted-foreground">Drop issues here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
