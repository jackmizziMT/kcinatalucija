"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label } from "@/components/ui/Controls";

export default function RecoveryPage() {
  const [step, setStep] = useState<'questions' | 'password'>('questions');
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { resetAdminPassword, verifyAdminSecurityQuestion, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";

  const handleQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!answer) {
      setError("Please answer the security question.");
      return;
    }

    const isValid = await verifyAdminSecurityQuestion(answer);
    if (isValid) {
      setStep('password');
    } else {
      setError("Incorrect answer to security question. Please try again.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const success = await resetAdminPassword(newPassword);
    if (success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setError("Failed to reset password. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader title="Password Reset Successful" />
            <CardBody>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Admin Password Reset
                </h2>
                <p className={`${isDark ? "text-white/80" : "text-gray-600"}`}>
                  The admin password has been successfully reset. You will be redirected to the login page.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader 
            title="Admin Password Recovery" 
            subtitle={step === 'questions' ? "Answer security questions to verify admin identity" : "Set new admin password"}
          />
          <CardBody>
            {step === 'questions' ? (
              <form onSubmit={handleQuestionsSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className={`p-4 rounded-lg border ${
                  isDark 
                    ? "bg-blue-500/10 border-blue-500/30" 
                    : "bg-blue-50 border-blue-200"
                }`}>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className={`text-sm font-semibold ${isDark ? "text-blue-300" : "text-blue-800"}`}>
                        Security Verification
                      </h3>
                      <p className={`text-xs mt-1 ${isDark ? "text-blue-200" : "text-blue-700"}`}>
                        Answer the security questions to verify your admin identity.
                      </p>
                    </div>
                  </div>
                </div>

                <Label>
                  <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    What is the name of your first pet?
                  </span>
                  <Input
                    type="text"
                    placeholder="Enter your answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    required
                  />
                </Label>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="muted"
                    onClick={() => router.push("/login")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify Identity'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className={`p-4 rounded-lg border ${
                  isDark 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-green-50 border-green-200"
                }`}>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className={`text-sm font-semibold ${isDark ? "text-green-300" : "text-green-800"}`}>
                        Identity Verified
                      </h3>
                      <p className={`text-xs mt-1 ${isDark ? "text-green-200" : "text-green-700"}`}>
                        You can now set a new password for the admin account.
                      </p>
                    </div>
                  </div>
                </div>

                <Label>
                  <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>New Password</span>
                  <Input
                    type="password"
                    placeholder="Enter new admin password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </Label>

                <Label>
                  <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Confirm Password</span>
                  <Input
                    type="password"
                    placeholder="Confirm new admin password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Label>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="muted"
                    onClick={() => setStep('questions')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
