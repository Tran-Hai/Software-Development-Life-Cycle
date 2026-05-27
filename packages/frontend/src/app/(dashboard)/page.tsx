'use client';

import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import Link from 'next/link';
import {
  FolderKanban,
  ListTodo,
  CalendarDays,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonPage } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { cn, formatRelativeDate, generateAvatarColor } from '@/lib/utils';

const statsConfig = [
  { name: 'Total Projects', icon: FolderKanban, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { name: 'Total Issues', icon: ListTodo, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  { name: 'Active Sprints', icon: CalendarDays, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.get('/projects'),
    staleTime: 60000,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/notifications?limit=5'),
    staleTime: 30000,
  });

  if (projectsLoading) {
    return <SkeletonPage />;
  }

  const projects = projectsData?.data || [];
  const notifications = notificationsData?.data?.notifications || [];
  const unreadCount = notificationsData?.data?.unread || 0;

  const totalIssues = projects.reduce((sum: number, p: any) => sum + (p._count?.issues || 0), 0);
  const activeSprints = projects.flatMap((p: any) => p.sprints || []).filter((s: any) => s.status === 'active');

  const stats = [
    { name: 'Total Projects', value: projects.length, icon: FolderKanban, change: projects.length > 0 ? `${projects.length} active` : 'None yet', color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Total Issues', value: totalIssues, icon: ListTodo, change: `Across ${projects.length} project${projects.length !== 1 ? 's' : ''}`, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Active Sprints', value: activeSprints.length, icon: CalendarDays, change: activeSprints.length > 0 ? 'In progress' : 'None active', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn('flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center', stat.bg)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Your Projects</CardTitle>
              <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1 font-medium dark:text-blue-400 dark:hover:text-blue-300">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="space-y-1">
                {projects.slice(0, 5).map((project: any) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group dark:hover:bg-gray-800/50"
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ring-1 ring-black/15"
                      style={{ backgroundColor: generateAvatarColor(project.name) }}
                    >
                      {project.key?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate dark:text-gray-100 dark:group-hover:text-blue-400">
                        {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{project.key}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                      <span className="flex items-center gap-1.5">
                        <ListTodo className="h-3.5 w-3.5" />
                        {project._count?.issues || 0} issues
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No projects yet"
                description="Create your first project to get started"
                action={
                  <Link href="/projects" className="btn-primary btn-md">
                    <FolderKanban className="h-4 w-4" />
                    Create Project
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full font-medium dark:bg-red-900/50 dark:text-red-400">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'p-3 rounded-lg transition-colors',
                      !notif.isRead ? 'bg-blue-50/50 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50' : 'bg-gray-50 dark:bg-gray-800/50'
                    )}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notif.title}</p>
                    {notif.body && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.body}</p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-1.5">
                      {formatRelativeDate(notif.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No notifications"
                description="You're all caught up!"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sprints */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Active Sprints
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSprints.length > 0 ? (
              <div className="space-y-4">
                {activeSprints.map((sprint: any) => (
                  <div key={sprint.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{sprint.name}</h4>
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-1 dark:bg-green-900/50 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    </div>
                    {sprint.goal && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{sprint.goal}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{sprint._count?.issues || 0} issues</span>
                      {sprint.endDate && (
                        <span>
                          Ends {new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No active sprints"
                description="Start a sprint to track your team's progress"
              />
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {projects.slice(0, 4).map((project: any) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group border border-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 dark:border-gray-700"
                  >
                    <p className="text-xs font-medium text-muted-foreground truncate">{project.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1 dark:text-gray-100">{project._count?.issues || 0}</p>
                    <p className="text-xs text-muted-foreground">issues</p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No data available"
                description="Stats will appear once you create projects"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
