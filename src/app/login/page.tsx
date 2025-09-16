"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button, Input, Label } from '@/components/ui/Controls';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useSupabaseAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn(username, password);
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Invalid username or password');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            <span className="text-[var(--primary)]">Kċina</span>{" "}
            <span className={isDark ? "text-white" : "text-gray-900"}>ta' Luċija</span>
          </h1>
          <p className={`text-lg mt-2 ${isDark ? "text-white/80" : "text-gray-600"}`}>
            Inventory Management System
          </p>
        </div>

        <Card>
          <CardHeader title="Sign In" subtitle="Enter your credentials to access the system" />
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Label>
                <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Username</span>
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Label>

              <Label>
                <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Password</span>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Label>

              {error && (
                <div className={`p-3 rounded-lg border ${
                  isDark 
                    ? "bg-red-500/20 border-red-500/30 text-red-300" 
                    : "bg-red-100 border-red-200 text-red-700"
                }`}>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/20">
              <div className="text-center">
                <Link 
                  href="/recovery" 
                  className={`text-sm ${isDark ? "text-white/60 hover:text-white" : "text-gray-500 hover:text-gray-700"} transition-colors`}
                >
                  Admin Password Recovery
                </Link>
              </div>
            </div>

            <div className={`mt-6 p-4 rounded-lg border ${
              isDark 
                ? "bg-white/5 border-white/20" 
                : "bg-gray-50 border-gray-200"
            }`}>
              <h3 className={`text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                Demo Credentials:
              </h3>
              <div className={`text-xs space-y-1 ${isDark ? "text-white/80" : "text-gray-600"}`}>
                <div><strong>Admin:</strong> admin / admin123 (Full access)</div>
                <div><strong>Editor:</strong> Create users with editor role</div>
                <div><strong>Viewer:</strong> Create users with viewer role (read-only)</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
