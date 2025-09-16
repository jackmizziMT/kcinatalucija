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
  createUser: (userData: { username: string; email: string; password: string; role: 'admin' | 'editor' | 'viewer' }) => Promise<void>;
  updateUser: (userId: string, updates: { username?: string; email?: string; role?: 'admin' | 'editor' | 'viewer' }) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<void>;
  getAllUsers: () => Promise<AppUser[]>;
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
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      // Manually clear the user state
      setUser(null);
      setSupabaseUser(null);
      
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear the local state
      setUser(null);
      setSupabaseUser(null);
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

  // User management functions
  const createUser = async (userData: { username: string; email: string; password: string; role: 'admin' | 'editor' | 'viewer' }) => {
    try {
      // Use regular signup flow instead of admin functions
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      // Create user in app_users table
      const { error: appUserError } = await supabase
        .from('app_users')
        .insert({
          id: authData.user.id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
        });

      if (appUserError) throw appUserError;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: { username?: string; email?: string; role?: 'admin' | 'editor' | 'viewer' }) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // For now, only delete from app_users table
      // Full user deletion requires admin privileges
      const { error: appUserError } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId);

      if (appUserError) throw appUserError;

      // Note: Full deletion from Supabase Auth requires admin privileges
      // This will disable the user in our app but not remove them from Supabase Auth
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const resetUserPassword = async (userId: string, newPassword: string) => {
    try {
      // For now, we can't reset passwords without admin privileges
      // This would require the user to use the password reset flow
      throw new Error('Password reset requires admin privileges. Users should use the "Forgot Password" flow instead.');
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const getAllUsers = async (): Promise<AppUser[]> => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((user: {
        id: string;
        username: string;
        email: string;
        role: string;
        security_question?: string;
        security_answer?: string;
      }) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as 'admin' | 'editor' | 'viewer',
        securityQuestion: user.security_question,
        securityAnswer: user.security_answer,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
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
      createUser,
      updateUser,
      deleteUser,
      resetUserPassword,
      getAllUsers,
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
