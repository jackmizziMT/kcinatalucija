"use client";

import { useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";

export function UserManagement() {
  const { user, createUser, updateUser, deleteUser, resetUserPassword } = useSupabaseAuth();
  const { theme } = useTheme();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [newEmail, setNewEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [editEmail, setEditEmail] = useState("");

  const isDark = theme === "dark";

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword || !newEmail) {
      setMessage("Please fill in all fields");
      return;
    }

    setIsCreating(true);
    setMessage("");

    try {
      await createUser({
        username: newUsername,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });

      setMessage(`✅ User "${newUsername}" created successfully! They can now log in with their email and password.`);
      setNewUsername("");
      setNewPassword("");
      setNewEmail("");
      setNewRole("editor");

      // Clear success message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // Provide user-friendly error messages
        if (errorMessage.includes('User already registered')) {
          errorMessage = 'A user with this email already exists. Please use a different email address.';
        } else if (errorMessage.includes('Password')) {
          errorMessage = 'Password requirements not met. Please use a stronger password.';
        } else if (errorMessage.includes('email')) {
          errorMessage = 'Invalid email address. Please check the format.';
        }
      }
      
      setMessage(`❌ Error: ${errorMessage}`);
      
      // Clear error message after 7 seconds
      setTimeout(() => setMessage(""), 7000);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      await updateUser(userId, {
        username: editUsername,
        role: editRole,
        email: editEmail,
      });

      setMessage(`✅ User "${editUsername}" updated successfully`);
      setEditingUser(null);
      setEditUsername("");
      setEditEmail("");
      setEditRole("editor");

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      setMessage(`❌ Error: ${errorMessage}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      setMessage(`✅ User "${username}" deleted successfully`);

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      setMessage(`❌ Error: ${errorMessage}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleResetPassword = async (userId: string, username: string) => {
    const newPassword = prompt(`Enter new password for user "${username}":`);
    if (!newPassword) return;

    try {
      await resetUserPassword(userId, newPassword);
      setMessage(`✅ Password reset successfully for user "${username}"`);

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      setMessage(`❌ Error: ${errorMessage}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <Card>
        <CardHeader title="Create New User" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Username</span>
              <Input 
                placeholder="Username" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)} 
              />
            </Label>
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Email</span>
              <Input 
                placeholder="Email" 
                type="email"
                value={newEmail} 
                onChange={(e) => setNewEmail(e.target.value)} 
              />
            </Label>
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Password</span>
              <Input 
                placeholder="Password" 
                type="password"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
            </Label>
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Role</span>
              <Select value={newRole} onChange={(e) => setNewRole(e.target.value as any)}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </Select>
            </Label>
          </div>
          
          <Button
            variant="primary"
            disabled={isCreating}
            onClick={handleCreateUser}
            className="w-full md:w-auto"
          >
            {isCreating ? "Creating..." : "Create User"}
          </Button>
        </CardBody>
      </Card>

      {message && (
        <div className={`p-3 rounded-lg border ${
          message.includes("✅")
            ? isDark 
              ? "bg-green-500/20 border-green-500/30 text-green-300" 
              : "bg-green-100 border-green-200 text-green-700"
            : isDark 
              ? "bg-red-500/20 border-red-500/30 text-red-300" 
              : "bg-red-100 border-red-200 text-red-700"
        }`}>
          {message}
        </div>
      )}

      <Card>
        <CardHeader title="User Management" />
        <CardBody>
          <div className={`p-4 rounded-lg border ${
            isDark 
              ? "bg-blue-500/10 border-blue-500/30 text-blue-300" 
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">ℹ️</span>
              <span className="font-medium">User Management Status</span>
            </div>
            <p className="text-sm">
              ✅ <strong>Available:</strong> Create new users (username, email, password, role)<br/>
              ⚠️ <strong>Limited:</strong> Edit/delete users require admin privileges<br/>
              ℹ️ <strong>Note:</strong> New users can log in immediately after creation
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
