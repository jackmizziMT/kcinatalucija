"use client";

import { useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui/Controls";

export function UserManagement() {
  const { users, createUser, updateUser, deleteUser, changePassword, isLoading } = useAuth();
  const { theme } = useTheme();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [newSecurityQuestion, setNewSecurityQuestion] = useState("");
  const [newSecurityAnswer, setNewSecurityAnswer] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [newPasswordField, setNewPasswordField] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isDark = theme === "dark";

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newUsername || !newPassword) {
      setError("Username and password are required");
      return;
    }

    // Validate security question for admin users
    if (newRole === "admin") {
      if (!newSecurityQuestion || !newSecurityAnswer) {
        setError("Admin users must provide a security question and answer");
        return;
      }
    }

    const success = await createUser(newUsername, newPassword, newRole, newSecurityQuestion, newSecurityAnswer);
    if (success) {
      setSuccess("User created successfully");
      setNewUsername("");
      setNewPassword("");
      setNewRole("editor");
      setNewSecurityQuestion("");
      setNewSecurityAnswer("");
    } else {
      setError("Username already exists");
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user.id);
    setEditUsername(user.username);
    setEditRole(user.role);
    setNewPasswordField("");
  };

  const handleUpdateUser = async (userId: string) => {
    setError("");
    setSuccess("");

    const success = await updateUser(userId, {
      username: editUsername,
      role: editRole,
    });

    if (success) {
      setSuccess("User updated successfully");
      setEditingUser(null);
    } else {
      setError("Username already exists or update failed");
    }
  };

  const handleChangePassword = async (userId: string) => {
    if (!newPasswordField) {
      setError("New password is required");
      return;
    }

    setError("");
    setSuccess("");

    const success = await changePassword(userId, newPasswordField);
    if (success) {
      setSuccess("Password changed successfully");
      setNewPasswordField("");
    } else {
      setError("Failed to change password");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === 'admin-default') {
      setError("Cannot delete default admin user");
      return;
    }

    setError("");
    setSuccess("");

    const success = await deleteUser(userId);
    if (success) {
      setSuccess("User deleted successfully");
    } else {
      setError("Failed to delete user");
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditUsername("");
    setEditRole("editor");
    setNewPasswordField("");
    setError("");
    setSuccess("");
  };

  return (
    <Card>
      <CardHeader title="User Management" subtitle="Create and manage system users" />
      <CardBody>
        <div className="space-y-6">
          {/* Create New User */}
          <form onSubmit={handleCreateUser} className="space-y-4">
            <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
              Create New User
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Label>
                <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Username</span>
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Label>
              <Label>
                <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Password</span>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Label>
              <Label>
                <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Role</span>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  disabled={isLoading}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </Label>
            </div>

            {/* Security Question for Admin Users */}
            {newRole === "admin" && (
              <div className="mt-4 p-4 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10">
                <h3 className={`text-sm font-semibold mb-3 ${isDark ? "text-blue-300" : "text-blue-800"}`}>
                  Security Question (Required for Admin)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Label>
                    <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Security Question</span>
                    <Input
                      type="text"
                      placeholder="e.g., What is the name of your first pet?"
                      value={newSecurityQuestion}
                      onChange={(e) => setNewSecurityQuestion(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </Label>
                  <Label>
                    <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Answer</span>
                    <Input
                      type="text"
                      placeholder="Enter your answer"
                      value={newSecurityAnswer}
                      onChange={(e) => setNewSecurityAnswer(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </Label>
                </div>
              </div>
            )}
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </form>

          {/* Messages */}
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

          {/* Users List */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              Existing Users
            </h3>
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg border ${
                    isDark 
                      ? "bg-white/5 border-white/20" 
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  {editingUser === user.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Label>
                          <span className={`text-sm font-medium ${isDark ? "text-white/80" : "text-gray-600"}`}>Username</span>
                          <Input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            disabled={isLoading}
                          />
                        </Label>
                        <Label>
                          <span className={`text-sm font-medium ${isDark ? "text-white/80" : "text-gray-600"}`}>Role</span>
                          <Select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            disabled={isLoading}
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </Select>
                        </Label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Label>
                          <span className={`text-sm font-medium ${isDark ? "text-white/80" : "text-gray-600"}`}>New Password (optional)</span>
                          <Input
                            type="password"
                            placeholder="Leave blank to keep current"
                            value={newPasswordField}
                            onChange={(e) => setNewPasswordField(e.target.value)}
                            disabled={isLoading}
                          />
                        </Label>
                        <div className="flex items-end gap-2">
                          <Button
                            onClick={() => handleUpdateUser(user.id)}
                            variant="primary"
                            disabled={isLoading}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={cancelEdit}
                            variant="muted"
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                          {user.username}
                        </div>
                        <div className={`text-sm ${isDark ? "text-white/80" : "text-gray-600"}`}>
                          Role: <span className="capitalize">{user.role}</span> • 
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEditUser(user)}
                          variant="muted"
                          disabled={isLoading}
                        >
                          Edit
                        </Button>
                        {user.id !== 'admin-default' && (
                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            variant="danger"
                            disabled={isLoading}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
