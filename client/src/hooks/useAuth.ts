// client/src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const [initialAuthCheckCompleted, setInitialAuthCheckCompleted] = useState(false);

  // This query fetches the user's profile from our own backend
  const { data: userProfile, isLoading: isProfileLoading, isSuccess: isProfileSuccess } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!user, // Only run this query if there's a supabase user
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache profile for 5 mins
    placeholderData: keepPreviousData,
    // The select function ensures we get the nested data
    select: (response: any) => response.data,
  });

  useEffect(() => {
    // 1. Check for an active session on initial load
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setInitialAuthCheckCompleted(true); // Mark the initial check as done
    };

    getSession();

    // 2. Listen for auth state changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (_event === 'SIGNED_OUT') {
          queryClient.clear(); // Clear all cached data on logout
        }
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Invalidate the user profile query to force a refetch after login
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
  // Loading is true if:
  // 1. We haven't finished the initial Supabase session check.
  // 2. We have a Supabase user but are still waiting for our backend profile to load successfully.
  const isLoading = !initialAuthCheckCompleted || (!!user && !isProfileSuccess);

  return {
    user,
    userProfile,
    isLoading,
    isAuthenticated: !!user, // This is stable and correct
    signIn,
    signUp,
    signOut,
  };
}