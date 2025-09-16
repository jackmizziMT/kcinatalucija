"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireEditor?: boolean;
  allowViewer?: boolean;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireAdmin = false, 
  requireEditor = false, 
  allowViewer = false 
}: AuthGuardProps) {
  const { user, isLoading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to load

    if (requireAuth && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Admin access
      if (requireAdmin && user.role !== 'admin') {
        router.push('/');
        return;
      }

      // Editor access (admin or editor)
      if (requireEditor && !['admin', 'editor'].includes(user.role)) {
        router.push('/');
        return;
      }

      // Viewer access (admin, editor, or viewer)
      if (!allowViewer && user.role === 'viewer') {
        router.push('/');
        return;
      }
    }
  }, [user, isLoading, requireAuth, requireAdmin, requireEditor, allowViewer, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if auth requirements aren't met
  if (requireAuth && !user) {
    return null;
  }

  if (user) {
    if (requireAdmin && user.role !== 'admin') {
      return null;
    }

    if (requireEditor && !['admin', 'editor'].includes(user.role)) {
      return null;
    }

    if (!allowViewer && user.role === 'viewer') {
      return null;
    }
  }

  return <>{children}</>;
}
