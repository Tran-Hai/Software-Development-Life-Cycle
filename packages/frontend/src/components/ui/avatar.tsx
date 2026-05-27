import { cn, generateInitials } from '@/lib/utils';
import { User } from 'lucide-react';

const avatarColors = [
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#ea580c',
  '#db2777',
  '#0d9488',
  '#4338ca',
  '#0284c7',
  '#e11d48',
  '#6d28d9',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover ring-1 ring-black/15', sizeClasses[size], className)}
      />
    );
  }

  if (name) {
    const initials = generateInitials(name);
    const bgColor = getAvatarColor(name);
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold text-white ring-1 ring-black/15',
          sizeClasses[size],
          className
        )}
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center bg-gray-400 text-white ring-1 ring-black/15',
        sizeClasses[size],
        className
      )}
    >
      <User className="h-4 w-4" />
    </div>
  );
}
