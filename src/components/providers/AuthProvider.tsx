"use client";

import { createContext, useContext } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * Compatibility shim. The app was originally written against Firebase Auth and
 * many components read `user.uid` / `user.displayName`. This provider now wraps
 * Clerk's `useUser()` and exposes the same minimal shape so those components
 * keep working without changes.
 */
export type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthCtx>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  const value: AuthCtx = {
    loading: !isLoaded,
    user: user
      ? {
          uid: user.id,
          displayName: user.fullName ?? user.username ?? null,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          photoURL: user.imageUrl ?? null,
        }
      : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
