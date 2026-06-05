"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, signIn, signUp, signOut } from "@/lib/auth";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await signIn(email, password);
      router.push("/dashboard");
      return data;
    },
    [router]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const data = await signUp(email, password);
      router.push("/dashboard");
      return data;
    },
    [router]
  );

  const logout = useCallback(async () => {
    await signOut();
    router.push("/");
  }, [router]);

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    isAuthenticated: !!state.user,
    login,
    register,
    logout,
  };
}
