'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import {
  ListTodo,
  CalendarDays,
  Users,
  TrendingUp,
  Bug,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonPage } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { getStatusConfig, getPriorityConfig, daysRemaining, cn } from '@/lib/utils';

const statusColors = [
  { status: 'backlog', dot: 'bg-gray-500' },
  { status: 'todo', dot: 'bg-blue-500' },
  { status: 'in_progress', dot: 'bg-yellow-500' },
  { status: 'in_review', dot: 'bg-purple-500' },
  { status: 'testing', dot: 'bg-orange-500' },
  { status: 'done', dot: 'bg-green-500' },
];

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}`),
    staleTime: 60000,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/stats`),
    staleTime: 30000,
  });

  const { data: sprints, isLoading: sprintsLoading } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/sprints`),
    staleTime: 30000,
  });

  const { data: epics, isLoading: epicsLoading } = useQuery({
    queryKey: ['epics', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/epics`),
    staleTime: 30000,
  });

  const isLoading = projectLoading || statsLoading || sprintsLoading || epicsLoading;

  const projectData = project?.data;
  const projectStats = statsData?.data;
  const sprintsData = sprints?.data || [];
  const activeSprint = sprintsData.find((s: any) => s.status === 'active');
  const activeEpics = epics?.data?.filter((e: any) => e.status === 'in_progress') || [];
  const totalIssues = projectStats?.totalIssues || 0;

  const sprintProgress = activeSprint
    ? Math.round(
        ((activeSprint.issuesByStatus?.done || 0) / Math.max(activeSprint._count?.issues || 1, 1)) * 100
      )
    : 0;

  const daysLeft = daysRemaining(activeSprint?.endDate);

  if (isLoading) {
    return <SkeletonPage />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Project Banner */}
      {projectData && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-200 text-sm font-mono">{projectData.key}</span>
                <span className="text-blue-200">•</span>
                <span className="text-blue-200 text-sm">{projectData.organization?.name}</span>
              </div>
              <h2 className="text-2xl font-bold">{projectData.name}</h2>
              {projectData.description && (
                <p className="text-blue-100 mt-2 text-sm line-clamp-2 max-w-2xl">{projectData.description}</p>
              )}
            </div>
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => router.push(`/projects/${projectId}/settings`)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'Total Issues', value: totalIssues, icon: ListTodo, color: 'text-blue-600', bg: 'bg-blue-50' },
          { name: 'Story Points', value: projectStats?.totalStoryPoints || 0, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
          { name: 'Team Members', value: projectStats?.totalMembers || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { name: 'Open Bugs', value: projectStats?.openBugs || 0, icon: Bug, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat) => (
          <Card key={stat.name} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn('flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center', stat.bg)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Issue Status</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectId}/issues`)}>
                View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {statusColors.map(({ status, dot }) => {
              const config = getStatusConfig(status);
              const count = projectStats?.issuesByStatus?.[status] || 0;
              const percentage = totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0;
              return (
                <div key={status} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className={cn('h-2.5 w-2.5 rounded-full', dot)} />
                    <span className="text-sm text-gray-700 flex-1">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                      <div className={cn('h-1.5 rounded-full transition-all duration-300', dot)} style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-sm font-medium w-6 text-right tabular-nums">{count}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Active Sprint */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Active Sprint</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectId}/sprints`)}>
                View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeSprint ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">{activeSprint.name}</h4>
                  </div>
                  {activeSprint.goal && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{activeSprint.goal}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {activeSprint.startDate && new Date(activeSprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-1">Start date</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {activeSprint.endDate && new Date(activeSprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-1">End date</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <ListTodo className="h-4 w-4" />
                    {activeSprint._count?.issues || 0} issues
                  </span>
                  {daysLeft !== null && (
                    <span className={cn(
                      'font-medium flex items-center gap-1',
                      daysLeft > 0 ? 'text-orange-600' : 'text-red-600'
                    )}>
                      <Clock className="h-3.5 w-3.5" />
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold tabular-nums">{sprintProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${sprintProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No active sprint"
                description="Start a sprint to track your team's progress"
                action={
                  <Button size="sm" onClick={() => router.push(`/projects/${projectId}/sprints`)}>
                    <PlayCircle className="h-4 w-4" />
                    Start Sprint
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Active Epics */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Active Epics</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectId}/epics`)}>
                View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeEpics.length > 0 ? (
              <div className="space-y-4">
                {activeEpics.slice(0, 5).map((epic: any) => (
                  <div key={epic.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-900 truncate flex-1">{epic.title}</span>
                      <span className="text-xs text-muted-foreground ml-2 tabular-nums">{epic.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${epic.progress}%`, backgroundColor: epic.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No active epics"
                description="Create an epic to organize your work"
                action={
                  <Button size="sm" onClick={() => router.push(`/projects/${projectId}/epics`)}>
                    Create Epic
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Issues & Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Issues */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Issues</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectId}/issues`)}>
                View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {projectStats?.recentIssues?.length > 0 ? (
              <div className="space-y-1">
                {projectStats.recentIssues.map((issue: any) => {
                  const statusConf = getStatusConfig(issue.status);
                  const priorityConf = getPriorityConfig(issue.priority);
                  return (
                    <button
                      key={issue.id}
                      onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: issue.issueType?.color || '#6b7280' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          <span className="text-muted-foreground font-mono text-xs">{issue.issueNumber}</span> - {issue.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="status" value={issue.status} />
                          <Badge variant="priority" value={issue.priority} />
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(issue.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={ListTodo}
                title="No issues yet"
                description="Create your first issue to get started"
                action={
                  <Button size="sm" onClick={() => router.push(`/projects/${projectId}/issues`)}>
                    Create Issue
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(getPriorityConfig).map(([key, config]) => {
                const count = projectStats?.issuesByPriority?.[key] || 0;
                const percentage = totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="priority" value={key} />
                      <span className="text-sm font-medium tabular-nums">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={cn('h-1.5 rounded-full transition-all duration-300', `bg-${config.color}-500`)}
                        style={{ width: `${percentage}%`, backgroundColor: config.color === 'gray' ? '#6b7280' : undefined }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums">{projectStats?.completedThisWeek || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">This week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-orange-600">{projectStats?.overdueIssues || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Overdue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-red-600">{projectStats?.blockerIssues || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Blockers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
