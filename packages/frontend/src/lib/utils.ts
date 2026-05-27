import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const options: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
  };

  return d.toLocaleDateString('en-US', options[format]);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d, 'short');
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function daysRemaining(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string; dot: string }> = {
  backlog: { label: 'Backlog', color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  todo: { label: 'Todo', color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  in_review: { label: 'In Review', color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  testing: { label: 'Testing', color: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  done: { label: 'Done', color: 'green', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  open: { label: 'Open', color: 'red', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  fixed: { label: 'Fixed', color: 'green', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  verified: { label: 'Verified', color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  rejected: { label: 'Rejected', color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  closed: { label: 'Closed', color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  planning: { label: 'Planning', color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  active: { label: 'Active', color: 'green', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  completed: { label: 'Completed', color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  cancelled: { label: 'Cancelled', color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  draft: { label: 'Draft', color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  published: { label: 'Published', color: 'green', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  archived: { label: 'Archived', color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
};

export const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; text: string; icon: string }> = {
  critical: { label: 'Critical', color: 'red', bg: 'bg-red-100', text: 'text-red-700', icon: '🔴' },
  blocker: { label: 'Blocker', color: 'red', bg: 'bg-red-100', text: 'text-red-700', icon: '🔴' },
  highest: { label: 'Highest', color: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', icon: '🟠' },
  high: { label: 'High', color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🟡' },
  medium: { label: 'Medium', color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔵' },
  low: { label: 'Low', color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', icon: '⚪' },
  lowest: { label: 'Lowest', color: 'gray', bg: 'bg-gray-50', text: 'text-gray-500', icon: '⚪' },
};

export const SEVERITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  critical: { label: 'Critical', bg: 'bg-red-100', text: 'text-red-700' },
  high: { label: 'High', bg: 'bg-orange-100', text: 'text-orange-700' },
  medium: { label: 'Medium', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  low: { label: 'Low', bg: 'bg-gray-100', text: 'text-gray-700' },
};

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { label: status, color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
}

export function getPriorityConfig(priority: string) {
  return PRIORITY_CONFIG[priority] || { label: priority, color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', icon: '⚪' };
}

export function getSeverityConfig(severity: string) {
  return SEVERITY_CONFIG[severity] || { label: severity, bg: 'bg-gray-100', text: 'text-gray-700' };
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function generateAvatarColor(name: string): string {
  const colors = [
    '#e53935',
    '#d81b60',
    '#8e24aa',
    '#5e35b1',
    '#3949ab',
    '#1e88e5',
    '#039be5',
    '#00acc1',
    '#00897b',
    '#43a047',
    '#7cb342',
    '#c0ca33',
    '#ffb300',
    '#fb8c00',
    '#f4511e',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
