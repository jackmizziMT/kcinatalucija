"use client";

import { useState } from "react";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";

export function LocationsManager() {
  const { locations, addLocation, updateLocation, removeLocation } = useSupabaseInventoryStore();
  const [newName, setNewName] = useState("");

  const list = Object.values(locations);

  return (
    <div className="rounded-xl border p-4 md:p-5 space-y-3 md:space-y-4 bg-white/60 dark:bg-black/30">
      <h2 className="text-base md:text-lg font-medium">Locations</h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <input className="border rounded-lg p-3 md:p-2" placeholder="New location name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className="border rounded-lg p-3 md:p-2" onClick={() => newName && (addLocation({ name: newName }), setNewName(""))}>Add</button>
      </div>
      <ul className="space-y-2">
        {list.map((loc) => (
          <li key={loc.id} className="flex items-center gap-2">
            <input
              className="border rounded-lg p-2 md:p-1"
              value={loc.name}
              onChange={(e) => updateLocation(loc.id, { name: e.target.value })}
            />
            <button className="border rounded-lg px-3 py-2 md:px-2 md:py-1 text-red-600" onClick={() => removeLocation(loc.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}


