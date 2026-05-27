'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams } from 'next/navigation';
import { Plus, Calendar, TrendingUp, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { daysRemaining, formatDate } from '@/lib/utils';

const statusConfig = {
  planning: { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Planning' },
  active: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Active' },
  completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
  cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Cancelled' },
};

export default function ProjectSprintsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const { success } = useToast();

  const { data: sprints, isLoading } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/sprints`),
    staleTime: 30000,
  });

  const createSprint = useMutation({
    mutationFn: (data: { name: string; goal?: string; startDate?: string; endDate?: string }) =>
      apiClient.post(`/projects/${projectId}/sprints`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });
      setShowCreateModal(false);
      success('Sprint created', 'Your new sprint is ready');
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/projects/${projectId}/sprints/${id}/status`, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });
      success(`Sprint ${status}`, `Sprint has been ${status}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sprints</h1>
          <p className="mt-1 text-sm text-muted-foreground">Plan and track your agile sprints</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          New Sprint
        </Button>
      </div>

      {/* Sprints Grid */}
      {sprints?.data?.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sprints?.data?.map((sprint: any) => {
            const config = statusConfig[sprint.status as keyof typeof statusConfig] || statusConfig.planning;
            const StatusIcon = config.icon;
            const daysLeft = daysRemaining(sprint.endDate);

            return (
              <Card key={sprint.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                        <StatusIcon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                        <Badge variant="status" value={sprint.status} />
                      </div>
                    </div>
                  </div>

                  {sprint.goal && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{sprint.goal}</p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {sprint.startDate ? formatDate(sprint.startDate, 'short') : '—'}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-muted-foreground">
                        {sprint.endDate ? formatDate(sprint.endDate, 'short') : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{sprint._count?.issues || 0} issues</span>
                      {sprint.status === 'active' && daysLeft !== null && (
                        <span className={daysLeft > 0 ? 'text-orange-600 font-medium' : 'text-red-600 font-medium'}>
                          {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    {sprint.status === 'planning' && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => updateStatus.mutate({ id: sprint.id, status: 'active' })}
                        isLoading={updateStatus.isPending}
                      >
                        <TrendingUp className="h-4 w-4" />
                        Start Sprint
                      </Button>
                    )}
                    {sprint.status === 'active' && (
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => updateStatus.mutate({ id: sprint.id, status: 'completed' })}
                        isLoading={updateStatus.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Complete
                      </Button>
                    )}
                    {sprint.status === 'planning' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ id: sprint.id, status: 'cancelled' })}
                        isLoading={updateStatus.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No sprints yet"
          description="Create your first sprint to start planning work"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Create Sprint
            </Button>
          }
        />
      )}

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Sprint"
        description="Set up a new sprint for your team"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const goal = formData.get('goal') as string;
            const startDate = formData.get('startDate') as string;
            const endDate = formData.get('endDate') as string;
            if (name) {
              createSprint.mutate({
                name,
                goal: goal || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
              });
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sprint Name</label>
            <input type="text" name="name" className="input" placeholder="Sprint 1" required autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Goal</label>
            <textarea name="goal" className="input resize-none" placeholder="Sprint goal..." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <input type="date" name="startDate" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
              <input type="date" name="endDate" className="input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSprint.isPending}>
              Create Sprint
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
