'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, generateAvatarColor } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
  LayoutDashboard,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
} from 'lucide-react';
import { useState } from 'react';

const mainNav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
];

const projectTabs = [
  { name: 'Overview', href: '' },
  { name: 'Issues', href: '/issues' },
  { name: 'Epics', href: '/epics' },
  { name: 'Kanban', href: '/kanban' },
  { name: 'Sprints', href: '/sprints' },
  { name: 'Wiki', href: '/wiki' },
  { name: 'Bugs', href: '/bugs' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.get('/projects'),
    staleTime: 60000,
  });

  const toggleProject = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
              <span className="text-white font-bold text-sm">SD</span>
            </div>
            <span className="text-base font-semibold text-sidebar-foreground tracking-tight">
              SDLC Platform
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col px-3 py-4">
          <ul role="list" className="flex flex-1 flex-col gap-y-6">
            {/* Main Nav */}
            <li>
              <ul role="list" className="space-y-1">
                {mainNav.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0 transition-colors',
                            isActive
                              ? 'text-sidebar-primary'
                              : 'text-sidebar-foreground/40 group-hover:text-sidebar-primary'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* Projects Section */}
            <li>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  Projects
                </span>
                <Link
                  href="/projects"
                  className="rounded p-1 text-sidebar-foreground/40 hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors"
                  title="New Project"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Link>
              </div>
              <ul role="list" className="space-y-0.5">
                {projects?.data?.map((project: any) => {
                  const isExpanded = expandedProject === project.id;
                  const isProjectActive = pathname.startsWith(`/projects/${project.id}`);
                  const avatarColor = generateAvatarColor(project.name);

                  return (
                    <li key={project.id}>
                      <button
                        onClick={() => toggleProject(project.id)}
                        className={cn(
                          'group flex w-full items-center gap-x-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                          isProjectActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <div
                          className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold ring-1 ring-black/15"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {project.key?.charAt(0)}
                        </div>
                        <span className="truncate flex-1 text-left">{project.name}</span>
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 shrink-0 text-sidebar-foreground/30 transition-transform duration-200',
                            isExpanded && 'rotate-90'
                          )}
                        />
                      </button>

                      {/* Sub-navigation with animation */}
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-200 ease-out',
                          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        )}
                      >
                        <ul className="ml-6 mt-1 space-y-0.5 border-l border-sidebar-border/50 pl-3">
                          {projectTabs.map((tab) => {
                            const tabPath = `/projects/${project.id}${tab.href}`;
                            const isActive = pathname === tabPath ||
                              (tab.href === '' && pathname === `/projects/${project.id}`);

                            return (
                              <li key={tab.name}>
                                <Link
                                  href={tabPath}
                                  className={cn(
                                    'block rounded-md px-3 py-1.5 text-sm transition-colors',
                                    isActive
                                      ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium'
                                      : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                                  )}
                                >
                                  {tab.name}
                                </Link>
                              </li>
                            );
                          })}
                          <li>
                            <Link
                              href={`/projects/${project.id}/settings`}
                              className="flex items-center gap-x-2 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
                            >
                              <Settings className="h-3.5 w-3.5" />
                              Settings
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </li>
                  );
                })}

                {projects?.data?.length === 0 && (
                  <li>
                    <Link
                      href="/projects"
                      className="flex items-center gap-x-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/40 hover:text-sidebar-primary hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Create your first project
                    </Link>
                  </li>
                )}
              </ul>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-md bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground/50">
              Need help? Check out the
              <Link href="/settings" className="text-sidebar-primary hover:underline ml-1">
                documentation
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
