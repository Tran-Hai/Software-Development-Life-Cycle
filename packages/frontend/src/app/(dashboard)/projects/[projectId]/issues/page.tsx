'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Filter, Search, MessageSquare, ListChecks, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { getStatusConfig, getPriorityConfig } from '@/lib/utils';

const issueTypeIcons: Record<string, string> = {
  task: '📋',
  bug: '🐛',
  story: '📖',
  epic: '🚀',
  subtask: '📎',
};

export default function ProjectIssuesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { success } = useToast();

  const { data: issues, isLoading } = useQuery({
    queryKey: ['issues', projectId, statusFilter, priorityFilter],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.set('status', statusFilter);
      if (priorityFilter) queryParams.set('priority', priorityFilter);
      return apiClient.get(`/projects/${projectId}/issues?${queryParams}`);
    },
    staleTime: 30000,
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}`),
    staleTime: 60000,
  });

  const { data: epics } = useQuery({
    queryKey: ['epics', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/epics`),
    staleTime: 30000,
  });

  const { data: sprints } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/sprints`),
    staleTime: 30000,
  });

  const createIssue = useMutation({
    mutationFn: (data: { title: string; issueTypeId: string; priority: string; epicId?: string; sprintId?: string }) =>
      apiClient.post(`/projects/${projectId}/issues`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      setShowCreateModal(false);
      success('Issue created', 'Your new issue has been created successfully');
    },
  });

  const filteredIssues = issues?.data?.filter((issue: any) =>
    !searchQuery ||
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.issueNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return <SkeletonTable rows={8} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Issues</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''} in {project?.data?.key}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          New Issue
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues..."
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select text-sm"
              >
                <option value="">All Status</option>
                <option value="backlog">Backlog</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="testing">Testing</option>
                <option value="done">Done</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="select text-sm"
              >
                <option value="">All Priority</option>
                <option value="lowest">Lowest</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="highest">Highest</option>
                <option value="critical">Critical</option>
              </select>
              {(statusFilter || priorityFilter || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('');
                    setPriorityFilter('');
                    setSearchQuery('');
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Issue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <ListChecks className="h-4 w-4 inline mr-1" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredIssues.map((issue: any) => {
                const statusConf = getStatusConfig(issue.status);
                const priorityConf = getPriorityConfig(issue.priority);
                return (
                  <tr
                    key={issue.id}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: issue.issueType?.color || '#6b7280' }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                            <span className="text-muted-foreground font-mono text-xs">{issue.issueNumber}</span> - {issue.title}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">{issue.issueType?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="status" value={issue.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="priority" value={issue.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {issue.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={issue.assignee.fullName} src={issue.assignee.avatarUrl} size="sm" />
                          <span className="text-sm text-gray-700">{issue.assignee.fullName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-muted-foreground">
                      {issue._count?.comments || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-muted-foreground">
                      {issue._count?.subtasks || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredIssues.length === 0 && (
          <EmptyState
            title={searchQuery || statusFilter || priorityFilter ? 'No issues match filters' : 'No issues yet'}
            description={
              searchQuery || statusFilter || priorityFilter
                ? 'Try adjusting your filters'
                : 'Create your first issue to get started'
            }
            action={!(searchQuery || statusFilter || priorityFilter) && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4" />
                Create Issue
              </Button>
            )}
          />
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Issue"
        description="Add a new issue to track work"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = formData.get('title') as string;
            const priority = formData.get('priority') as string;
            const issueTypes = project?.data?.issueTypes || [];
            const taskType = issueTypes.find((t: any) => t.name === 'task');
            const epicId = formData.get('epicId') as string;
            const sprintId = formData.get('sprintId') as string;
            if (title) {
              createIssue.mutate({
                title,
                issueTypeId: taskType?.id || issueTypes[0]?.id,
                priority,
                epicId: epicId || undefined,
                sprintId: sprintId || undefined,
              });
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              name="title"
              className="input"
              placeholder="Issue title"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
            <select name="priority" className="select" defaultValue="medium">
              <option value="lowest">Lowest</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="highest">Highest</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Epic</label>
            <select name="epicId" className="select">
              <option value="">No epic</option>
              {epics?.data?.map((epic: any) => (
                <option key={epic.id} value={epic.id}>{epic.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sprint</label>
            <select name="sprintId" className="select">
              <option value="">No sprint</option>
              {sprints?.data?.map((sprint: any) => (
                <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createIssue.isPending}>
              Create Issue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
