"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label } from "@/components/ui/Controls";

export function SecurityQuestionManager() {
  const { updateAdminSecurityQuestion, isLoading } = useAuth();
  const { theme } = useTheme();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isDark = theme === "dark";

  // Load current security question (we'll get it from localStorage)
  useEffect(() => {
    const savedUsers = localStorage.getItem('auth_users');
    if (savedUsers) {
      const allUsers = JSON.parse(savedUsers);
      const adminUser = allUsers.find((u: any) => u.id === 'admin-default');
      if (adminUser) {
        setQuestion(adminUser.securityQuestion || "");
        setAnswer(adminUser.securityAnswer || "");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!question || !answer) {
      setError("Both question and answer are required");
      return;
    }

    const success = await updateAdminSecurityQuestion(question, answer);
    if (success) {
      setSuccess("Security question updated successfully");
    } else {
      setError("Failed to update security question");
    }
  };

  return (
    <Card>
      <CardHeader 
        title="Admin Security Question" 
        subtitle="Set the security question and answer for admin password recovery"
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className={`p-3 rounded-lg border ${
              isDark 
                ? "bg-red-500/20 border-red-500/30 text-red-300" 
                : "bg-red-100 border-red-200 text-red-700"
            }`}>
              {error}
            </div>
          )}

          {success && (
            <div className={`p-3 rounded-lg border ${
              isDark 
                ? "bg-green-500/20 border-green-500/30 text-green-300" 
                : "bg-green-100 border-green-200 text-green-700"
            }`}>
              {success}
            </div>
          )}

          <div className={`p-4 rounded-lg border ${
            isDark 
              ? "bg-yellow-500/10 border-yellow-500/30" 
              : "bg-yellow-50 border-yellow-200"
          }`}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className={`text-sm font-semibold ${isDark ? "text-yellow-300" : "text-yellow-800"}`}>
                  Security Notice
                </h3>
                <p className={`text-xs mt-1 ${isDark ? "text-yellow-200" : "text-yellow-700"}`}>
                  This question will be used for admin password recovery. Choose a question that only you know the answer to.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Security Question</span>
              <Input
                type="text"
                placeholder="e.g., What is the name of your first pet?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                disabled={isLoading}
              />
            </Label>

            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Answer</span>
              <Input
                type="text"
                placeholder="Enter the correct answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
                disabled={isLoading}
              />
            </Label>
          </div>

          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Security Question'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
