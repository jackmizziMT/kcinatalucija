"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
  securityQuestion?: string;
  securityAnswer?: string;
}

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  users: Omit<User, 'password'>[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (username: string, password: string, role: 'admin' | 'editor' | 'viewer', securityQuestion?: string, securityAnswer?: string) => Promise<boolean>;
  updateUser: (id: string, updates: Partial<Pick<User, 'username' | 'role'>>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  changePassword: (id: string, newPassword: string) => Promise<boolean>;
  resetAdminPassword: (newPassword: string) => Promise<boolean>;
  verifyAdminSecurityQuestion: (answer: string) => Promise<boolean>;
  updateAdminSecurityQuestion: (question: string, answer: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default admin user - cannot be deleted
const DEFAULT_ADMIN: User = {
  id: 'admin-default',
  username: 'admin',
  password: 'admin123',
  role: 'admin',
  createdAt: new Date().toISOString(),
  securityQuestion: "What is the name of your first pet?",
  securityAnswer: "admin"
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load users from localStorage
    const savedUsers = localStorage.getItem('auth_users');
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        setUsers(parsedUsers);
      } catch (error) {
        // Initialize with default admin if no users exist
        const defaultUsers = [DEFAULT_ADMIN];
        setUsers(defaultUsers.map(({ password, ...user }) => user));
        localStorage.setItem('auth_users', JSON.stringify(defaultUsers));
      }
    } else {
      // Initialize with default admin
      const defaultUsers = [DEFAULT_ADMIN];
      setUsers(defaultUsers.map(({ password, ...user }) => user));
      localStorage.setItem('auth_users', JSON.stringify(defaultUsers));
    }

    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get all users from localStorage
    const savedUsers = localStorage.getItem('auth_users');
    if (!savedUsers) {
      setIsLoading(false);
      return false;
    }
    
    const allUsers: User[] = JSON.parse(savedUsers);
    const validUser = allUsers.find(
      u => u.username === username && u.password === password
    );
    
    if (validUser) {
      const userData = { id: validUser.id, username: validUser.username, role: validUser.role, createdAt: validUser.createdAt };
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const createUser = async (username: string, password: string, role: 'admin' | 'editor' | 'viewer', securityQuestion?: string, securityAnswer?: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const savedUsers = localStorage.getItem('auth_users');
    const allUsers: User[] = savedUsers ? JSON.parse(savedUsers) : [];
    
    // Check if username already exists
    if (allUsers.some(u => u.username === username)) {
      setIsLoading(false);
      return false;
    }
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      password,
      role,
      createdAt: new Date().toISOString(),
      ...(securityQuestion && { securityQuestion }),
      ...(securityAnswer && { securityAnswer })
    };
    
    const updatedUsers = [...allUsers, newUser];
    localStorage.setItem('auth_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers.map(({ password, ...user }) => user));
    
    setIsLoading(false);
    return true;
  };

  const updateUser = async (id: string, updates: Partial<Pick<User, 'username' | 'role'>>): Promise<boolean> => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const savedUsers = localStorage.getItem('auth_users');
    if (!savedUsers) {
      setIsLoading(false);
      return false;
    }
    
    const allUsers: User[] = JSON.parse(savedUsers);
    const userIndex = allUsers.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      setIsLoading(false);
      return false;
    }
    
    // Check if username already exists (excluding current user)
    if (updates.username && allUsers.some(u => u.username === updates.username && u.id !== id)) {
      setIsLoading(false);
      return false;
    }
    
    allUsers[userIndex] = { ...allUsers[userIndex], ...updates };
    localStorage.setItem('auth_users', JSON.stringify(allUsers));
    setUsers(allUsers.map(({ password, ...user }) => user));
    
    setIsLoading(false);
    return true;
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Prevent deletion of default admin
    if (id === 'admin-default') {
      setIsLoading(false);
      return false;
    }
    
    const savedUsers = localStorage.getItem('auth_users');
    if (!savedUsers) {
      setIsLoading(false);
      return false;
    }
    
    const allUsers: User[] = JSON.parse(savedUsers);
    const updatedUsers = allUsers.filter(u => u.id !== id);
    
    localStorage.setItem('auth_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers.map(({ password, ...user }) => user));
    
    setIsLoading(false);
    return true;
  };

  const changePassword = async (id: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const savedUsers = localStorage.getItem('auth_users');
    if (!savedUsers) {
      setIsLoading(false);
      return false;
    }
    
    const allUsers: User[] = JSON.parse(savedUsers);
    const userIndex = allUsers.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      setIsLoading(false);
      return false;
    }
    
    allUsers[userIndex].password = newPassword;
    localStorage.setItem('auth_users', JSON.stringify(allUsers));
    
    setIsLoading(false);
    return true;
  };

  const resetAdminPassword = async (newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const savedUsers = localStorage.getItem('auth_users');
    if (!savedUsers) {
      setIsLoading(false);
      return false;
    }
    
    const allUsers: User[] = JSON.parse(savedUsers);
    const adminIndex = allUsers.findIndex(u => u.id === 'admin-default');
    
    if (adminIndex === -1) {
      setIsLoading(false);
      return false;
    }
    
    // Reset admin password
    allUsers[adminIndex].password = newPassword;
    localStorage.setItem('auth_users', JSON.stringify(allUsers));
    
    setIsLoading(false);
    return true;
  };

  const verifyAdminSecurityQuestion = async (answer: string): Promise<boolean> => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const savedUsers = localStorage.getItem('auth_users');
    if (!savedUsers) {
      setIsLoading(false);
      return false;
    }
    
    const allUsers: User[] = JSON.parse(savedUsers);
    const adminUser = allUsers.find(u => u.id === 'admin-default');
    
    if (!adminUser || !adminUser.securityAnswer) {
      setIsLoading(false);
      return false;
    }
    
    const isAnswerCorrect = adminUser.securityAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
    
    setIsLoading(false);
    return isAnswerCorrect;
  };

  const updateAdminSecurityQuestion = async (question: string, answer: string): Promise<boolean> => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const savedUsers = localStorage.getItem('auth_users');
    if (!savedUsers) {
      setIsLoading(false);
      return false;
    }
    
    const allUsers: User[] = JSON.parse(savedUsers);
    const adminIndex = allUsers.findIndex(u => u.id === 'admin-default');
    
    if (adminIndex === -1) {
      setIsLoading(false);
      return false;
    }
    
    // Update admin security question and answer
    allUsers[adminIndex].securityQuestion = question;
    allUsers[adminIndex].securityAnswer = answer;
    localStorage.setItem('auth_users', JSON.stringify(allUsers));
    
    setIsLoading(false);
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users, 
      login, 
      logout, 
      createUser, 
      updateUser, 
      deleteUser, 
      changePassword, 
      resetAdminPassword,
      verifyAdminSecurityQuestion,
      updateAdminSecurityQuestion,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
