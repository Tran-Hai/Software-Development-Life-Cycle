import * as React from 'react';
import { cn, getStatusConfig, getPriorityConfig } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'status' | 'priority';
  value?: string;
  dot?: boolean;
}

function Badge({ className, variant = 'default', value, dot, children, ...props }: BadgeProps) {
  const variantClasses = {
    default: 'bg-primary/10 text-primary hover:bg-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
    outline: 'border border-input text-foreground',
    status: '',
    priority: '',
  };

  let content = children;
  let classes = variantClasses[variant];

  if (variant === 'status' && value) {
    const config = getStatusConfig(value);
    classes = cn(config.bg, config.text);
    content = (
      <>
        {dot && <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />}
        {config.label}
      </>
    );
  }

  if (variant === 'priority' && value) {
    const config = getPriorityConfig(value);
    classes = cn(config.bg, config.text);
    content = config.label;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        classes,
        className
      )}
      {...props}
    >
      {content}
    </span>
  );
}

export { Badge };
