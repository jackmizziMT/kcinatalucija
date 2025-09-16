"use client";

import { ItemsManager } from "@/components/ItemsManager";

export default function ItemsPage() {
  return (
    <main className="space-y-6 md:space-y-8">
      <h1 className="text-xl md:text-2xl font-semibold">Items</h1>
      <ItemsManager />
    </main>
  );
}


