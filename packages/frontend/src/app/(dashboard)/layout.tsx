'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { setGlobalErrorHandler } from '@/lib/api-client';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';

function GlobalErrorHandler() {
  const { error: showError } = useToast();

  useEffect(() => {
    setGlobalErrorHandler((message) => showError(message));
    return () => setGlobalErrorHandler(null);
  }, [showError]);

  return null;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-foreground">Loading</p>
          <p className="text-xs text-muted-foreground">Please wait...</p>
        </div>
      </div>
    </div>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalErrorHandler />
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardContent>{children}</DashboardContent>
    </ToastProvider>
  );
}
