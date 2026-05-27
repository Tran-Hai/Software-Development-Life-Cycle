'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import { Save, Trash2, Users, Key, Calendar, Hash, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

const statusColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  archived: 'secondary',
};

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}`),
  });

  const project = projectData?.data;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
    }
  }, [project]);

  const updateProject = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      apiClient.patch(`/projects/${projectId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      success('Settings saved', 'Project settings have been updated');
    },
    onError: () => {
      toastError('Save failed', 'Could not update project settings');
    },
  });

  const deleteProject = useMutation({
    mutationFn: () => apiClient.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/projects');
    },
    onError: (err: Error) => {
      toastError('Delete failed', err.message || 'Could not delete project');
    },
  });

  const handleSave = () => {
    updateProject.mutate({ name, description });
  };

  const hasChanges = project && (name !== project.name || description !== (project.description || ''));

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Project Settings</h1>
            <Badge variant={statusColors[project?.status] || 'outline'}>{project?.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your project configuration and preferences
          </p>
        </div>
      </div>

      {/* General Section */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic information about your project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="My Project"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input resize-none"
              placeholder="What is this project about?"
              rows={3}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button
              onClick={handleSave}
              isLoading={updateProject.isPending}
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Project Info</CardTitle>
          <CardDescription>Read-only details about this project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                Project Key
              </label>
              <p className="text-sm font-mono font-medium text-gray-900">{project?.key}</p>
            </div>
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                Issue Count
              </label>
              <p className="text-sm font-medium text-gray-900">{project?._count?.issues || 0}</p>
            </div>
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Members
              </label>
              <p className="text-sm font-medium text-gray-900">{project?._count?.members || 0}</p>
            </div>
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Created
              </label>
              <p className="text-sm font-medium text-gray-900">
                {project?.createdAt ? new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions affecting this project</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">Delete this project</p>
                <p className="text-sm text-red-600 mt-0.5">
                  Permanently remove this project and all of its data. This action cannot be undone.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-shrink-0 ml-4"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteProject.mutate()}
        title="Delete Project"
        description="Are you sure? This permanently removes all issues, epics, sprints, documents, and test data."
        confirmText="Delete Project"
        isConfirming={deleteProject.isPending}
      />
    </div>
  );
}
