'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Plus } from 'lucide-react';

interface Issue {
  id: string;
  issueNumber: string;
  title: string;
  status: string;
  priority: string;
  issueType: {
    name: string;
    color: string;
  };
  assignee: {
    fullName: string;
    avatarUrl: string | null;
  } | null;
  position: number;
}

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-500' },
  { id: 'todo', title: 'Todo', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-500' },
  { id: 'in_review', title: 'In Review', color: 'bg-purple-500' },
  { id: 'testing', title: 'Testing', color: 'bg-orange-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

const priorityColors: Record<string, string> = {
  lowest: 'border-gray-300',
  low: 'border-blue-400',
  medium: 'border-yellow-400',
  high: 'border-orange-400',
  highest: 'border-red-400',
  critical: 'border-red-600',
};

export default function KanbanPage() {
  const [draggedIssue, setDraggedIssue] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: issues, isLoading } = useQuery({
    queryKey: ['issues'],
    queryFn: () => apiClient.get('/projects/demo-project-id/issues'),
  });

  const updateIssue = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/issues/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });

  const handleDragStart = useCallback((issueId: string) => {
    setDraggedIssue(issueId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (status: string) => {
      if (draggedIssue) {
        updateIssue.mutate({ id: draggedIssue, status });
        setDraggedIssue(null);
      }
    },
    [draggedIssue, updateIssue],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const issuesData: Issue[] = issues?.data || [];

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="mt-1 text-sm text-gray-500">
            Drag and drop issues to update their status
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnIssues = issuesData.filter((issue) => issue.status === column.id);

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 bg-gray-100 rounded-lg p-3"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-3 w-3 rounded-full ${column.color}`}></div>
                <h3 className="font-semibold text-gray-700">{column.title}</h3>
                <span className="ml-auto text-sm text-gray-500">{columnIssues.length}</span>
              </div>

              <div className="space-y-2 min-h-[100px]">
                {columnIssues.map((issue) => (
                  <div
                    key={issue.id}
                    draggable
                    onDragStart={() => handleDragStart(issue.id)}
                    className={`bg-white p-3 rounded-md shadow-sm border-l-4 ${
                      priorityColors[issue.priority] || 'border-gray-300'
                    } cursor-move hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: issue.issueType.color }}
                      ></div>
                      <span className="text-xs text-gray-500">{issue.issueNumber}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">{issue.title}</p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          issue.priority === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : issue.priority === 'high' || issue.priority === 'highest'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {issue.priority}
                      </span>
                      {issue.assignee && (
                        <div
                          className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600"
                          title={issue.assignee.fullName}
                        >
                          {issue.assignee.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {columnIssues.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Drop issues here
                  </div>
                )}
              </div>

              <button className="w-full mt-2 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors">
                <Plus className="h-4 w-4" />
                Add Issue
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
