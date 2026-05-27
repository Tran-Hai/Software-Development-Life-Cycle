'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
  isConfirming?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  isConfirming,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-background rounded-lg shadow-xl border animate-scale-in p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            'flex-shrink-0 rounded-full p-2',
            variant === 'destructive' ? 'bg-red-100' : 'bg-blue-100'
          )}>
            <AlertTriangle className={cn(
              'h-5 w-5',
              variant === 'destructive' ? 'text-red-600' : 'text-blue-600'
            )} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            isLoading={isConfirming}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'destructive' | 'default';
    onConfirm?: () => void;
  }>({ open: false, title: '', description: '' });

  const confirm = (options: {
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'destructive' | 'default';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        ...options,
        open: true,
        onConfirm: () => {
          setState((prev) => ({ ...prev, open: false }));
          resolve(true);
        },
      });

      const handleClose = () => {
        setState((prev) => ({ ...prev, open: false }));
        resolve(false);
      };

      setState((prev) => ({ ...prev, onClose: handleClose }));
    });
  };

  const Dialog = () => (
    <ConfirmDialog
      open={state.open}
      onClose={() => setState((prev) => ({ ...prev, open: false }))}
      onConfirm={state.onConfirm || (() => setState((prev) => ({ ...prev, open: false })))}
      title={state.title}
      description={state.description}
      confirmText={state.confirmText}
      variant={state.variant}
    />
  );

  return { confirm, Dialog };
}
