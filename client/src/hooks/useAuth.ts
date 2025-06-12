// client/src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const [initialAuthCheckCompleted, setInitialAuthCheckCompleted] = useState(false);

  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!user, // Only run if there's a supabase user
    retry: 1, // Retry once on failure
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    select: (response: any) => response.data,
  });

  useEffect(() => {
    const getSession = async () => {
      await supabase.auth.getSession();
      setInitialAuthCheckCompleted(true);
    };

    // The onAuthStateChange listener is the single source of truth for the user state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!initialAuthCheckCompleted) {
          setInitialAuthCheckCompleted(true);
        }
        if (_event === 'SIGNED_OUT') {
          queryClient.clear();
        }
      }
    );

    // Initial check is now handled by the listener firing with INITIAL_SESSION,
    // but we can call getSession to be safe.
    getSession();

    return () => subscription.unsubscribe();
  }, [queryClient, initialAuthCheckCompleted]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    return data;
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // --- REFINED LOADING LOGIC ---
  // The app is loading if the initial auth check hasn't completed,
  // OR if we have a user object but the profile fetch is still running.
  const isLoading = !initialAuthCheckCompleted || (!!user && isProfileLoading);

  return {
    user,
    userProfile,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
}