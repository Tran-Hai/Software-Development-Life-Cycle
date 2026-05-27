'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Filter, Bug, Link } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatRelativeDate } from '@/lib/utils';

export default function BugsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const queryClient = useQueryClient();
  const { success } = useToast();

  const { data: bugs, isLoading } = useQuery({
    queryKey: ['bugs', projectId, statusFilter, severityFilter],
    queryFn: () => {
      const qp = new URLSearchParams();
      if (statusFilter) qp.set('status', statusFilter);
      if (severityFilter) qp.set('severity', severityFilter);
      return apiClient.get(`/projects/${projectId}/bugs?${qp}`);
    },
    staleTime: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['bug-stats', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/bugs/stats`),
    staleTime: 30000,
  });

  const createBug = useMutation({
    mutationFn: (data: any) => apiClient.post(`/projects/${projectId}/bugs`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['bug-stats', projectId] });
      setShowCreateModal(false);
      success('Bug reported', 'The bug has been reported successfully');
    },
  });

  const updateBug = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.patch(`/projects/${projectId}/bugs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['bug-stats', projectId] });
    },
  });

  if (isLoading) {
    return <SkeletonTable rows={8} />;
  }

  const statsData = stats?.data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bugs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {bugs?.data?.length || 0} bug{bugs?.data?.length !== 1 ? 's' : ''} reported
          </p>
        </div>
        <Button variant="destructive" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Report Bug
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open', count: statsData.byStatus?.open || 0, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'In Progress', count: statsData.byStatus?.in_progress || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Fixed', count: statsData.byStatus?.fixed || 0, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Critical/Blocker', count: (statsData.bySeverity?.critical || 0) + (statsData.bySeverity?.blocker || 0), color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className={`p-4 ${stat.bg}`}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select text-sm"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="fixed">Fixed</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="select text-sm"
            >
              <option value="">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="blocker">Blocker</option>
            </select>
            {(statusFilter || severityFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setSeverityFilter('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bugs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Linked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reported</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {bugs?.data?.map((bug: any) => (
                <tr key={bug.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Bug className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{bug.title}</p>
                        <p className="text-xs text-muted-foreground">
                          by {bug.reporter?.fullName} &bull; {formatRelativeDate(bug.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="status" value={bug.severity} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={bug.status}
                      onChange={(e) => updateBug.mutate({ id: bug.id, data: { status: e.target.value } })}
                      className="select text-xs py-1 px-2 h-7"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="fixed">Fixed</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bug.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={bug.assignee.fullName} src={bug.assignee.avatarUrl} size="sm" />
                        <span className="text-sm text-gray-700">{bug.assignee.fullName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bug.issue ? (
                      <span className="inline-flex items-center gap-1 text-sm text-blue-600 font-mono">
                        <Link className="h-3 w-3" />
                        {bug.issue.issueNumber}
                      </span>
                    ) : bug.testResult ? (
                      <span className="text-sm text-muted-foreground">Test Run</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">&mdash;</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatRelativeDate(bug.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bugs?.data?.length === 0 && (
          <EmptyState
            icon={Bug}
            title="No bugs found"
            description={statusFilter || severityFilter ? 'Try adjusting your filters' : 'Great job! No bugs to display'}
          />
        )}
      </Card>

      {/* Create Bug Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Report Bug"
        description="Provide details about the bug you found"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            createBug.mutate({
              title: formData.get('title'),
              description: formData.get('description') || undefined,
              stepsToReproduce: formData.get('steps') || undefined,
              severity: formData.get('severity'),
              environment: formData.get('environment') || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input name="title" type="text" className="input" placeholder="Bug title" required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Severity</label>
              <select name="severity" className="select" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
                <option value="blocker">Blocker</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Environment</label>
              <input name="environment" type="text" className="input" placeholder="e.g. Chrome, iOS" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" className="input resize-none" placeholder="Describe the bug..." rows={3} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Steps to Reproduce</label>
            <textarea name="steps" className="input resize-none" placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..." rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" isLoading={createBug.isPending}>
              Report Bug
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
