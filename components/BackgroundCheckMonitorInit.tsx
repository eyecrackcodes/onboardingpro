"use client";

import { useEffect } from "react";
import { startBackgroundCheckMonitoring } from "@/lib/background-check-monitor";

export function BackgroundCheckMonitorInit() {
  useEffect(() => {
    // Start the background check monitoring service
    console.log(
      "[BackgroundCheckMonitorInit] Starting background check monitoring..."
    );
    startBackgroundCheckMonitoring();

    // Cleanup on unmount
    return () => {
      // Note: We're not stopping monitoring on unmount because we want it to continue
      // throughout the app lifecycle. If you want to stop it, uncomment:
      // stopBackgroundCheckMonitoring();
    };
  }, []); // Empty dependency array - run once on mount

  // This component doesn't render anything
  return null;
}
