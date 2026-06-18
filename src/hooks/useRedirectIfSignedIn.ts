"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

/** Sends already-authenticated users away from login/signup. */
export function useRedirectIfSignedIn(destination: string) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      window.location.replace(destination);
    }
  }, [loading, user, destination]);
}
