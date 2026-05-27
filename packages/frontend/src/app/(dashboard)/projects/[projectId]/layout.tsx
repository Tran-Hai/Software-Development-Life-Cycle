'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  ListTodo,
  Columns,
  CalendarDays,
  BookOpen,
  Settings,
  TestTube,
  Bug,
  Users,
  ChevronLeft,
  FolderKanban,
  Target,
  LayoutDashboard,
} from 'lucide-react';

const projectTabs = [
  { name: 'Overview', href: '', icon: LayoutDashboard },
  { name: 'Issues', href: '/issues', icon: ListTodo },
  { name: 'Epics', href: '/epics', icon: Target },
  { name: 'Kanban', href: '/kanban', icon: Columns },
  { name: 'Sprints', href: '/sprints', icon: CalendarDays },
  { name: 'Wiki', href: '/wiki', icon: BookOpen },
  { name: 'Test Cases', href: '/test-cases', icon: TestTube },
  { name: 'Test Runs', href: '/test-runs', icon: TestTube },
  { name: 'Bugs', href: '/bugs', icon: Bug },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}`),
    enabled: !!projectId,
  });

  const projectData = project?.data;

  return (
    <div>
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/projects')}
                className="p-1 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FolderKanban className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {projectData?.name || 'Loading...'}
                  </h1>
                  {projectData?.key && (
                    <p className="text-xs text-gray-500">{projectData.key}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-navigation */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {projectTabs.map((tab) => {
              const tabPath = `/projects/${projectId}${tab.href}`;
              const isActive = pathname === tabPath;

              return (
                <Link
                  key={tab.name}
                  href={`/projects/${projectId}${tab.href}`}
                  className={cn(
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'inline-flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
