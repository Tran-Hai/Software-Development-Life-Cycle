'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Plus, FolderKanban, ExternalLink, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { cn, generateAvatarColor } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  visibility: string;
  status: string;
  organization: {
    name: string;
    slug: string;
  };
  _count: {
    issues: number;
    members: number;
    sprints: number;
  };
}

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.get('/projects'),
    staleTime: 60000,
  });

  const createProject = useMutation({
    mutationFn: (data: { name: string; key: string }) =>
      apiClient.post('/projects', {
        name: data.name,
        key: data.key,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreateModal(false);
      success('Project created', 'Your new project is ready to use');
    },
    onError: () => {
      showError('Failed to create project', 'Please try again');
    },
  });

  const filteredProjects = projects?.data?.filter((p: Project) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.key.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your software development projects
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      {projects?.data?.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="input pl-10"
          />
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project: Project) => (
            <Card key={project.id} className="card-hover group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ring-1 ring-black/15"
                      style={{ backgroundColor: generateAvatarColor(project.name) }}
                    >
                      {project.key?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors dark:text-gray-100 dark:group-hover:text-blue-400">
                        {project.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">{project.key}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded-full font-medium',
                    project.visibility === 'private'
                      ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                  )}>
                    {project.visibility}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                  {project.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                  <span>{project._count.issues} issues</span>
                  <span>{project._count.members} members</span>
                  <span>{project._count.sprints} sprints</span>
                </div>

                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium group/link dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View Project
                  <ExternalLink className="h-3.5 w-3.5 ml-1 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={searchQuery ? 'No projects found' : 'No projects yet'}
          description={
            searchQuery
              ? `No projects match "${searchQuery}"`
              : 'Create your first project to start managing issues and sprints'
          }
          action={!searchQuery && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          )}
        />
      )}

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        description="Set up a new project to manage your work"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const key = formData.get('key') as string;
            if (name && key) {
              createProject.mutate({ name, key: key.toUpperCase() });
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
              Project Name
            </label>
            <input
              type="text"
              name="name"
              className="input"
              placeholder="My Awesome Project"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
              Project Key
            </label>
            <input
              type="text"
              name="key"
              className="input"
              placeholder="MAP"
              maxLength={5}
              required
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Short identifier for your project (e.g., JIRA, DEV)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createProject.isPending}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
