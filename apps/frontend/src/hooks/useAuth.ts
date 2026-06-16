"use client";

import { useEffect, useState, useCallback } from "react";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from "next-auth/react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, signUp, signOut as supabaseSignOut } from "@/lib/auth";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const { status: nextAuthStatus } = useSession();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Keep Supabase client in sync for any direct Supabase usage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

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
    async (email: string, password: string, callbackUrl = "/dashboard") => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error("Invalid email or password");
      }

      // Let NextAuth set the session cookie and perform the redirect
      const result = await nextAuthSignIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: true,
      });

      // redirect:true navigates away on success; only errors return here
      if (result?.error) {
        throw new Error("Invalid email or password");
      }
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string, callbackUrl = "/dashboard") => {
      await signUp(email, password);

      const result = await nextAuthSignIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: true,
      });

      if (result?.error) {
        throw new Error(
          "Account created. Please check your email to confirm, then sign in."
        );
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await supabaseSignOut();
    await nextAuthSignOut({ redirect: false });
    window.location.href = "/";
  }, []);

  return {
    user: state.user,
    session: state.session,
    loading: state.loading || nextAuthStatus === "loading",
    isAuthenticated: nextAuthStatus === "authenticated",
    login,
    register,
    logout,
  };
}
