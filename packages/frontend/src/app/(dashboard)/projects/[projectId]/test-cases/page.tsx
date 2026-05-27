'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Plus, FolderOpen, Play, Trash2, FileText, TestTube, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { formatRelativeDate } from '@/lib/utils';

export default function TestSuitesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const suiteId = searchParams.get('suiteId');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  const [suiteToDelete, setSuiteToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { success } = useToast();

  const { data: suites, isLoading: suitesLoading } = useQuery({
    queryKey: ['test-suites', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/test-suites`),
    staleTime: 30000,
  });

  const { data: suiteDetail } = useQuery({
    queryKey: ['test-suite', suiteId],
    queryFn: () => apiClient.get(`/projects/${projectId}/test-suites/${suiteId}`),
    enabled: !!suiteId,
    staleTime: 10000,
  });

  const createSuite = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiClient.post(`/projects/${projectId}/test-suites`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites', projectId] });
      setShowCreateModal(false);
      success('Test suite created', 'Your new suite is ready');
    },
  });

  const deleteSuite = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/projects/${projectId}/test-suites/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites', projectId] });
      setSuiteToDelete(null);
      success('Test suite deleted', 'The suite has been removed');
    },
  });

  const createTestCase = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      preconditions?: string;
      steps?: string;
      expectedResult?: string;
      priority?: string;
      status?: string;
    }) => apiClient.post(`/projects/${projectId}/test-cases?suiteId=${suiteId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suite', suiteId] });
      queryClient.invalidateQueries({ queryKey: ['test-suites', projectId] });
      setShowCreateCaseModal(false);
      success('Test case created', 'The test case has been added to the suite');
    },
  });

  // Test Cases View
  if (suiteId) {
    if (!suiteDetail?.data) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Loading test cases...</p>
          </div>
        </div>
      );
    }

    const suite = suiteDetail.data;
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => router.push(`/projects/${projectId}/test-cases`)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{suite.name}</h1>
              <Badge variant="status" value={suite.status} />
            </div>
            <p className="text-sm text-muted-foreground ml-10">
              {suite.testCases?.length || 0} test cases
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreateCaseModal(true)}>
            <Plus className="h-4 w-4" />
            New Case
          </Button>
        </div>

        {suite.testCases?.length > 0 ? (
          <div className="space-y-2">
            {suite.testCases.map((tc: any) => (
              <div key={tc.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{tc.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <Badge variant="priority" value={tc.priority} />
                    {tc.status && <Badge variant="status" value={tc.status} />}
                    {tc.author && <span>By {tc.author.fullName}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No test cases yet"
            description="This suite doesn't have any test cases yet"
            action={
              <Button size="sm" onClick={() => setShowCreateCaseModal(true)}>
                <Plus className="h-4 w-4" />
                Create Case
              </Button>
            }
          />
        )}

        {/* Create Test Case Modal */}
        <Modal
          open={showCreateCaseModal}
          onClose={() => setShowCreateCaseModal(false)}
          title="Create Test Case"
          description="Add a new test case to this suite"
          size="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createTestCase.mutate({
                title: formData.get('title') as string,
                description: (formData.get('description') as string) || undefined,
                preconditions: (formData.get('preconditions') as string) || undefined,
                steps: (formData.get('steps') as string) || undefined,
                expectedResult: (formData.get('expectedResult') as string) || undefined,
                priority: (formData.get('priority') as string) || undefined,
                status: (formData.get('status') as string) || undefined,
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
              <input name="title" type="text" className="input" placeholder="Login form validation" required autoFocus />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea name="description" className="input resize-none" placeholder="Test case description..." rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select name="priority" className="input">
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select name="status" className="input">
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preconditions</label>
              <textarea name="preconditions" className="input resize-none" placeholder="User is logged in..." rows={2} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Steps</label>
              <textarea name="steps" className="input resize-none" placeholder="1. Navigate to login page&#10;2. Enter invalid email&#10;3. Click Submit" rows={3} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Result</label>
              <textarea name="expectedResult" className="input resize-none" placeholder="Error message should appear" rows={2} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setShowCreateCaseModal(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createTestCase.isPending}>
                Create Case
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // Suites List View
  if (suitesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-600 flex items-center justify-center">
            <TestTube className="h-5 w-5 text-white animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading test suites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Suites</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize and manage your test cases</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          New Suite
        </Button>
      </div>

      {suites?.data?.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suites?.data?.map((suite: any) => (
            <Card key={suite.id} className="hover:shadow-md transition-all duration-200 group">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <FolderOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{suite.name}</h3>
                      <Badge variant="status" value={suite.status} />
                    </div>
                  </div>
                </div>

                {suite.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{suite.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    {suite._count?.testCases || 0} cases
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Play className="h-4 w-4" />
                    {suite._count?.testRuns || 0} runs
                  </span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => router.push(`/projects/${projectId}/test-cases?suiteId=${suite.id}`)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-center text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    View Cases
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setSuiteToDelete(suite.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={TestTube}
          title="No test suites yet"
          description="Create your first test suite to organize test cases"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Create Suite
            </Button>
          }
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!suiteToDelete}
        onClose={() => setSuiteToDelete(null)}
        onConfirm={() => suiteToDelete && deleteSuite.mutate(suiteToDelete)}
        title="Delete Test Suite"
        description="Are you sure you want to delete this test suite? This will also remove all associated test cases and runs."
        confirmText="Delete"
        isConfirming={deleteSuite.isPending}
      />

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Test Suite"
        description="Add a new test suite to organize your test cases"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createSuite.mutate({
              name: formData.get('name') as string,
              description: (formData.get('description') as string) || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input name="name" type="text" className="input" placeholder="Regression Tests" required autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" className="input resize-none" placeholder="Suite description..." rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSuite.isPending}>
              Create Suite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
