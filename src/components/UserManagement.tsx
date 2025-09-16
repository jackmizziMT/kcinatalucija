"use client";

import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";

interface AppUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  securityQuestion?: string;
  securityAnswer?: string;
}

export function UserManagement() {
  const { user, createUser, deleteUser, getAllUsers } = useSupabaseAuth();
  const { theme } = useTheme();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [newEmail, setNewEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isDark = theme === "dark";

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, [getAllUsers]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const userList = await getAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

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

      // Reload users list
      loadUsers();

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


  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      setMessage(`✅ User "${username}" deleted successfully`);

      // Reload users list
      loadUsers();

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
        <CardHeader title="User List" />
        <CardBody>
          {loadingUsers ? (
            <div className="text-center py-4">
              <div className={`inline-block animate-spin rounded-full h-6 w-6 border-b-2 ${
                isDark ? "border-white" : "border-gray-900"
              }`}></div>
              <p className={`mt-2 text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>
                Loading users...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.length === 0 ? (
                <div className={`text-center py-4 ${isDark ? "text-white/60" : "text-gray-500"}`}>
                  No users found
                </div>
              ) : (
                users.map((userItem) => (
                  <div key={userItem.id} className={`p-3 rounded-lg border ${
                    isDark 
                      ? "bg-white/5 border-white/10" 
                      : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                            {userItem.username}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            userItem.role === 'admin' 
                              ? isDark 
                                ? "bg-red-500/20 text-red-300 border border-red-500/30" 
                                : "bg-red-100 text-red-700 border border-red-200"
                              : userItem.role === 'editor'
                              ? isDark 
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                              : isDark 
                                ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                                : "bg-green-100 text-green-700 border border-green-200"
                          }`}>
                            {userItem.role}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${isDark ? "text-white/60" : "text-gray-500"}`}>
                          {userItem.email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setMessage("Edit functionality requires admin privileges. This feature will be available in a future update.");
                            setTimeout(() => setMessage(""), 5000);
                          }}
                          disabled={userItem.id === user?.id}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                          disabled={userItem.id === user?.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardBody>
      </Card>

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
