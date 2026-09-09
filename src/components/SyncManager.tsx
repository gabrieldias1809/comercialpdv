"use client";

import { useEffect } from "react";
import { db } from "@/lib/db";

export function SyncManager() {
  useEffect(() => {
    const syncData = async () => {
      if (!navigator.onLine) return;

      try {
        const storeId = localStorage.getItem("storeId");
        if (!storeId) return;

        const unsyncedTxs = await db.transactions
          .where("synced")
          .equals("false") // Dexie stores boolean index queries using 0/1 or true/false depending on how it was stored. Actually, we stored it as boolean `false`. So we filter natively.
          .toArray();
          
        // Let's get all where synced is false.
        const pending = await db.transactions.filter(tx => tx.synced === false).toArray();

        if (pending.length === 0) return;

        console.log(`Syncing ${pending.length} transactions...`);

        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, transactions: pending })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            // Mark them as synced in Dexie
            await db.transaction('rw', db.transactions, async () => {
              for (const tx of pending) {
                await db.transactions.update(tx.id, { synced: true });
              }
            });
            console.log("Sync successful!");
          }
        }
      } catch (e) {
        console.error("Sync failed:", e);
      }
    };

    // Attempt sync on component mount
    syncData();

    // Listen for connection restoration
    window.addEventListener("online", syncData);
    
    // Also try periodically every 5 minutes just in case
    const interval = setInterval(syncData, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("online", syncData);
      clearInterval(interval);
    };
  }, []);

  return null; // This component doesn't render anything visually
}
