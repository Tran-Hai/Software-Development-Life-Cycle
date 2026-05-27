'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Target, CheckCircle, Clock, TrendingUp, XCircle, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { getStatusConfig } from '@/lib/utils';

const statusConfig = {
  backlog: { icon: Clock, label: 'Backlog' },
  in_progress: { icon: TrendingUp, label: 'In Progress' },
  completed: { icon: CheckCircle, label: 'Completed' },
  cancelled: { icon: XCircle, label: 'Cancelled' },
};

const epicColors = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#22c55e', label: 'Green' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#6b7280', label: 'Gray' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#ec4899', label: 'Pink' },
];

export default function EpicsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();
  const { success } = useToast();

  const { data: epics, isLoading } = useQuery({
    queryKey: ['epics', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/epics`),
    staleTime: 30000,
  });

  const createEpic = useMutation({
    mutationFn: (data: { title: string; description?: string; color?: string }) =>
      apiClient.post(`/projects/${projectId}/epics`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });
      setShowCreateModal(false);
      success('Epic created', 'Your new epic has been created');
    },
  });

  const updateEpic = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.patch(`/projects/${projectId}/epics/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
      queryClient.invalidateQueries({ queryKey: ['epic', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });
    },
  });

  const deleteEpic = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/projects/${projectId}/epics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });
      setSelectedEpic(null);
      setShowDeleteConfirm(false);
      success('Epic deleted', 'The epic has been removed');
    },
  });

  const viewEpic = useQuery({
    queryKey: ['epic', selectedEpic?.id],
    queryFn: () => apiClient.get(`/projects/${projectId}/epics/${selectedEpic?.id}`),
    enabled: !!selectedEpic?.id,
    staleTime: 0,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Epics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Group and track large bodies of work</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          New Epic
        </Button>
      </div>

      {/* Epics Grid */}
      {epics?.data?.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {epics?.data?.map((epic: any) => {
            const config = statusConfig[epic.status as keyof typeof statusConfig] || statusConfig.backlog;
            const StatusIcon = config.icon;

            return (
              <Card
                key={epic.id}
                className="card-hover cursor-pointer group"
                onClick={() => setSelectedEpic(epic)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${epic.color}20` }}
                      >
                        <Target className="h-5 w-5" style={{ color: epic.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {epic.title}
                        </h3>
                        <Badge variant="status" value={epic.status} />
                      </div>
                    </div>
                  </div>

                  {epic.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{epic.description}</p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold tabular-nums">{epic.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ width: `${epic.progress}%`, backgroundColor: epic.color }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{epic.totalIssues} issues</span>
                      <span>{epic.doneIssues} done</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{epic.totalPoints} points</span>
                      <span>{epic.donePoints} completed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No epics yet"
          description="Create an epic to group related issues together"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Create Epic
            </Button>
          }
        />
      )}

      {/* Epic Detail Modal */}
      <Modal
        open={!!selectedEpic}
        onClose={() => { setSelectedEpic(null); setShowDeleteConfirm(false); }}
        title={selectedEpic?.title}
        description={`${viewEpic.data?.data?.totalIssues || 0} issues • ${viewEpic.data?.data?.progress || 0}% complete`}
        size="xl"
      >
        {viewEpic.data && (
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={viewEpic.data.data.status}
                  onChange={(e) => updateEpic.mutate({ id: selectedEpic.id, data: { status: e.target.value } })}
                  className="select-sm"
                >
                  <option value="backlog">Backlog</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>

            {/* Description */}
            {viewEpic.data.data.description && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewEpic.data.data.description}</p>
              </div>
            )}

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{viewEpic.data.data.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${viewEpic.data.data.progress}%`, backgroundColor: viewEpic.data.data.color }}
                />
              </div>
            </div>

            {/* Issues */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Issues ({viewEpic.data.data.issues?.length || 0})
              </h3>
              <div className="space-y-2">
                {viewEpic.data.data.issues?.map((issue: any) => {
                  const statusConf = getStatusConfig(issue.status);
                  return (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: issue.issueType?.color }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            <span className="text-muted-foreground font-mono text-xs">{issue.issueNumber}</span> - {issue.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <Badge variant="status" value={issue.status} />
                        {issue.assignee && (
                          <Avatar name={issue.assignee.fullName} src={issue.assignee.avatarUrl} size="sm" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {viewEpic.data.data.issues?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No issues in this epic yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteEpic.mutate(selectedEpic?.id)}
        title="Delete Epic"
        description={`Are you sure you want to delete "${selectedEpic?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isConfirming={deleteEpic.isPending}
      />

      {/* Create Epic Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Epic"
        description="Group related issues under a large body of work"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createEpic.mutate({
              title: formData.get('title') as string,
              description: (formData.get('description') as string) || undefined,
              color: formData.get('color') as string,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input name="title" type="text" className="input" placeholder="Epic title" required autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" className="input resize-none" placeholder="Epic description..." rows={2} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Color</label>
            <div className="grid grid-cols-4 gap-2">
              {epicColors.map((color) => (
                <label key={color.value} className="flex flex-col items-center gap-1 cursor-pointer">
                  <input type="radio" name="color" value={color.value} className="sr-only peer" defaultChecked={color.value === '#3b82f6'} />
                  <div className="h-8 w-8 rounded-full peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-blue-500 transition-all hover:scale-110" style={{ backgroundColor: color.value }} />
                  <span className="text-xs text-muted-foreground">{color.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createEpic.isPending}>
              Create Epic
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
