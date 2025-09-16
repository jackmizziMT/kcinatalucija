"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AppUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  securityQuestion?: string;
  securityAnswer?: string;
}

interface SupabaseAuthContextType {
  user: AppUser | null;
  supabaseUser: User | null;
  signUp: (email: string, password: string, username: string, role: 'admin' | 'editor' | 'viewer', securityQuestion?: string, securityAnswer?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUserRole: (userId: string, role: 'admin' | 'editor' | 'viewer') => Promise<boolean>;
  updateSecurityQuestion: (question: string, answer: string) => Promise<boolean>;
  verifySecurityQuestion: (answer: string) => Promise<boolean>;
  resetAdminPassword: (newPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadAppUser(session.user.email!);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        await loadAppUser(session.user.email!);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAppUser = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error loading app user:', error);
        setUser(null);
        return;
      }

      setUser({
        id: data.id,
        username: data.username,
        role: data.role,
        email: data.email,
        securityQuestion: data.security_question,
        securityAnswer: data.security_answer,
      });
    } catch (error) {
      console.error('Error loading app user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    username: string, 
    role: 'admin' | 'editor' | 'viewer',
    securityQuestion?: string,
    securityAnswer?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Create app user record
      const { error: userError } = await supabase
        .from('app_users')
        .insert({
          id: authData.user.id,
          username,
          role,
          security_question: securityQuestion,
          security_answer: securityAnswer,
        });

      if (userError) {
        // Clean up auth user if app user creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: userError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signIn = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // First, find the user by username in app_users table
      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .single();

      if (appUserError || !appUser) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Now authenticate with Supabase Auth using the email
      const { error } = await supabase.auth.signInWithPassword({
        email: appUser.email,
        password,
      });

      if (error) {
        return { success: false, error: 'Invalid username or password' };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'editor' | 'viewer'): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ role })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return false;
      }

      // Update local state if it's the current user
      if (user && user.id === userId) {
        setUser({ ...user, role });
      }

      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  };

  const updateSecurityQuestion = async (question: string, answer: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('app_users')
        .update({ 
          security_question: question,
          security_answer: answer,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating security question:', error);
        return false;
      }

      // Update local state
      setUser({ ...user, securityQuestion: question, securityAnswer: answer });
      return true;
    } catch (error) {
      console.error('Error updating security question:', error);
      return false;
    }
  };

  const verifySecurityQuestion = async (answer: string): Promise<boolean> => {
    if (!user || !user.securityAnswer) return false;

    return user.securityAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
  };

  const resetAdminPassword = async (newPassword: string): Promise<boolean> => {
    if (!supabaseUser) return false;

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{
      user,
      supabaseUser,
      signUp,
      signIn,
      signOut,
      updateUserRole,
      updateSecurityQuestion,
      verifySecurityQuestion,
      resetAdminPassword,
      isLoading,
    }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
