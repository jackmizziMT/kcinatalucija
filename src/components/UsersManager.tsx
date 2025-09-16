"use client";

import { useState } from "react";
import { useInventoryStore } from "@/store/inventoryStore";

export function UsersManager() {
  const { users, currentUserId, addUser, removeUser, setCurrentUser } = useInventoryStore();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"owner" | "editor" | "viewer">("editor");

  const list = Object.values(users);

  return (
    <div className="rounded-xl border p-4 md:p-5 space-y-3 md:space-y-4 bg-white/60 dark:bg-black/30">
      <h2 className="text-base md:text-lg font-medium">Users</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="border rounded-lg p-3 md:p-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="border rounded-lg p-3 md:p-2" value={role} onChange={(e) => setRole(e.target.value as any)}>
          <option value="owner">owner</option>
          <option value="editor">editor</option>
          <option value="viewer">viewer</option>
        </select>
        <button
          className="border rounded-lg p-3 md:p-2"
          onClick={() => {
            if (!name) return;
            addUser({ name, role });
            setName("");
            setRole("editor");
          }}
        >
          Add User
        </button>
      </div>
      <ul className="space-y-2">
        {list.map((u) => (
          <li key={u.id} className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded border ${u.id === currentUserId ? 'bg-black text-white' : ''}`}>{u.name} ({u.role})</span>
            <button className="border rounded-lg px-3 py-2 md:px-2 md:py-1" onClick={() => setCurrentUser(u.id)}>
              Set current
            </button>
            <button className="border rounded-lg px-3 py-2 md:px-2 md:py-1 text-red-600" onClick={() => removeUser(u.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}


