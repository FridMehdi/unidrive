'use client';

import '../app/globals.css';
import type { AppProps } from 'next/app';
import { Sidebar } from '@/components/layout/sidebar';
import { useRouter } from 'next/router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { loading } = useAuth();

  // Pages where sidebar should be hidden
  const pagesWithoutSidebar = ['/login', '/signup', '/forgot-password'];
  const hideSidebar = pagesWithoutSidebar.includes(router.pathname);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen dark:bg-background bg-neutral-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (hideSidebar) {
    return (
      <div className="flex flex-col h-screen dark:bg-background bg-neutral-100">
        <Component {...pageProps} />
      </div>
    );
  }

  return (
    <div className="flex flex-row h-screen">
      {/* Left Sidebar */}
      <Sidebar defaultCollapsed={false} />

      {/* Main Content Area */}
      <div className="relative flex-1 min-w-0 h-screen">
        <div className={`transition-all flex flex-col dark:bg-background bg-neutral-100 overflow-auto relative h-full duration-300`}>
            <Component
              {...pageProps}
            />
        </div>

      </div>
    </div>
  );
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  );
}

