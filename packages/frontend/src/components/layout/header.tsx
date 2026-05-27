'use client';

import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { LogOut, User, Bell, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import GlobalSearch from '../global-search';
import { Avatar } from '../ui/avatar';
import { cn, formatRelativeDate } from '@/lib/utils';
import ThemeToggle from './theme-toggle';

export default function Header() {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const queryClient = useQueryClient();
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/notifications?limit=5'),
    enabled: !!user,
    staleTime: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notificationsData?.data?.unread || 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 dark:border-gray-800 dark:bg-gray-950/80">
      {/* Global Search */}
      <div className="w-72">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-x-4 lg:gap-x-5">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 min-w-[1rem] rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center px-1 ring-2 ring-white dark:ring-gray-950">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-scale-in origin-top-right dark:bg-gray-900 dark:border-gray-700">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-xs text-blue-600 hover:text-blue-500 font-medium dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notificationsData?.data?.notifications?.length ? (
                  notificationsData.data.notifications.map((notif: any) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-3 border-b border-gray-50 last:border-b-0 transition-colors dark:border-gray-800',
                        !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-950/30' : '',
                      )}>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notif.title}</p>
                      {notif.body && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 dark:text-gray-400">{notif.body}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                        {formatRelativeDate(notif.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-x-2 rounded-full border border-gray-200 bg-white p-1 pr-3 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:border-gray-600"
          >
            <Avatar name={user?.fullName} src={user?.avatarUrl} size="md" />
            <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-24 truncate dark:text-gray-300">
              {user?.fullName?.split(' ')[0]}
            </span>
            <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-scale-in origin-top-right dark:bg-gray-900 dark:border-gray-700">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate dark:text-gray-400">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/profile');
                  }}
                  className="flex items-center gap-x-2 w-full rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="flex items-center gap-x-2 w-full rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
