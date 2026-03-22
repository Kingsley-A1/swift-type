"use client";

import { useState, useEffect } from "react";

/**
 * Tracks browser online/offline state.
 * Returns `true` when the browser believes it has network connectivity.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return isOnline;
}
