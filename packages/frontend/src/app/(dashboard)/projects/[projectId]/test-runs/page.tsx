'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams, useSearchParams } from 'next/navigation';
import { Plus, Play, CheckCircle, XCircle, MinusCircle, SkipForward, TestTubes, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatRelativeDate } from '@/lib/utils';

const statusIcons: Record<string, any> = {
  pass: CheckCircle,
  fail: XCircle,
  blocked: MinusCircle,
  skipped: SkipForward,
};

const statusColors: Record<string, string> = {
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
  blocked: 'bg-orange-100 text-orange-700',
  skipped: 'bg-gray-100 text-gray-600',
};

const runStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'status'> = {
  passed: 'status',
  failed: 'destructive',
  blocked: 'secondary',
  in_progress: 'default',
  pending: 'outline',
};

export default function TestRunsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const suiteId = searchParams.get('suiteId') || undefined;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const queryClient = useQueryClient();
  const { success } = useToast();

  const { data: runs, isLoading } = useQuery({
    queryKey: ['test-runs', projectId, suiteId],
    queryFn: () => apiClient.get(`/projects/${projectId}/test-runs${suiteId ? `?suiteId=${suiteId}` : ''}`),
    staleTime: 30000,
  });

  const { data: suites } = useQuery({
    queryKey: ['test-suites', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/test-suites`),
    staleTime: 60000,
  });

  const createRun = useMutation({
    mutationFn: (data: { name: string; suiteId: string }) =>
      apiClient.post(`/test-suites/${data.suiteId}/test-runs`, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-runs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['test-suites', projectId] });
      setShowCreateModal(false);
      success('Test run created', 'Ready to execute test cases');
    },
  });

  const updateRunStatus = useMutation({
    mutationFn: ({ id, suiteId, status }: { id: string; suiteId: string; status: string }) =>
      apiClient.patch(`/test-suites/${suiteId}/test-runs/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-runs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['test-run', selectedRun?.id] });
    },
  });

  const viewRun = useQuery({
    queryKey: ['test-run', selectedRun?.id],
    queryFn: () => apiClient.get(`/test-suites/${selectedRun?.testSuite?.id}/test-runs/${selectedRun?.id}`),
    enabled: !!selectedRun?.id && !!selectedRun?.testSuite?.id,
    staleTime: 10000,
  });

  const addResult = useMutation({
    mutationFn: ({ runId, data }: { runId: string; data: any }) =>
      apiClient.post(`/test-runs/${runId}/results`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-run', selectedRun?.id] });
      queryClient.invalidateQueries({ queryKey: ['test-runs', projectId] });
      success('Result recorded', 'Test case status updated');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <TestTubes className="h-5 w-5 text-white animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading test runs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Runs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Execute test cases and track results</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          New Run
        </Button>
      </div>

      {runs?.data?.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {runs?.data?.map((run: any) => (
            <Card
              key={run.id}
              className="hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => setSelectedRun(run)}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {run.name}
                  </h3>
                  <Badge variant={runStatusVariant[run.status] || 'default'}>
                    {run.status}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground mb-4 space-y-1">
                  <p>Suite: <span className="text-gray-700 font-medium">{run.testSuite?.name || 'N/A'}</span></p>
                  {run.sprint && <p>Sprint: <span className="text-gray-700 font-medium">{run.sprint.name}</span></p>}
                  <p className="text-xs">{formatRelativeDate(run.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t border-gray-100">
                  <Play className="h-4 w-4" />
                  <span>{run._count?.results || 0} results</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={TestTubes}
          title="No test runs yet"
          description="Create a test run to start executing test cases"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Create Run
            </Button>
          }
        />
      )}

      {/* Run Detail Modal */}
      <Modal
        open={!!selectedRun}
        onClose={() => setSelectedRun(null)}
        title={viewRun.data?.data?.name || 'Test Run Details'}
        description={viewRun.data?.data?.testSuite?.name}
        size="xl"
      >
        {viewRun.data && (
          <div className="space-y-4">
            {/* Run Status Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <Badge variant={runStatusVariant[viewRun.data.data.status] || 'default'}>
                  {viewRun.data.data.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {(['in_progress', 'passed', 'failed', 'blocked'] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={viewRun.data.data.status === status ? 'primary' : 'outline'}
                    onClick={() => updateRunStatus.mutate({
                      id: selectedRun.id,
                      suiteId: selectedRun?.testSuite?.id,
                      status,
                    })}
                    isLoading={updateRunStatus.isPending}
                  >
                    {status === 'in_progress' ? 'Running' :
                     status === 'passed' ? 'Pass' :
                     status === 'failed' ? 'Fail' :
                     'Blocked'}
                  </Button>
                ))}
              </div>
            </div>

            {viewRun.data.data.testSuite?.testCases?.map((tc: any) => {
              const result = tc.results?.[0];
              const StatusIcon = result ? statusIcons[result.status] : null;

              return (
                <div key={tc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{tc.title}</p>
                    <p className="text-sm text-muted-foreground">Priority: {tc.priority}</p>
                  </div>

                  {result ? (
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${
                        result.status === 'pass' ? 'text-green-600' :
                        result.status === 'fail' ? 'text-red-600' :
                        result.status === 'blocked' ? 'text-orange-600' :
                        'text-gray-400'
                      }`} />
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${statusColors[result.status]}`}>
                        {result.status}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      {(['pass', 'fail', 'blocked', 'skipped'] as const).map((status) => {
                        const Icon = statusIcons[status];
                        return (
                          <button
                            key={status}
                            onClick={() => addResult.mutate({
                              runId: selectedRun.id,
                              data: { testCaseId: tc.id, status },
                            })}
                            className={`p-1.5 rounded-md hover:bg-gray-200 transition-colors ${
                              status === 'pass' ? 'text-green-600' :
                              status === 'fail' ? 'text-red-600' :
                              status === 'blocked' ? 'text-orange-600' :
                              'text-gray-400'
                            }`}
                            title={`Mark as ${status}`}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Create Run Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Test Run"
        description="Set up a new test run from an existing suite"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createRun.mutate({
              name: formData.get('name') as string,
              suiteId: formData.get('suiteId') as string,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input name="name" type="text" className="input" placeholder="Sprint 1 Regression" required autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Suite</label>
            <select name="suiteId" className="select" required>
              <option value="">Select a suite</option>
              {suites?.data?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createRun.isPending}>
              Create Run
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
