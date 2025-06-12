// client/src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";

// This will be the stable status we return.
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useAuth() {
  const queryClient = useQueryClient();
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // This query fetches our application-specific user profile
  const { data: userProfile, isFetching: isProfileFetching } = useQuery({
    queryKey: ["/api/auth/user", supabaseUser?.id],
    // IMPORTANT: Only run this query when we have a supabaseUser
    enabled: !!supabaseUser,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    select: (response: any) => response.data,
  });

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (_event === 'SIGNED_OUT') {
          queryClient.clear();
        }
        setSupabaseUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // This is the core of the fix. This effect determines the final, stable auth status.
  useEffect(() => {
    // If we have a Supabase user but we don't have their profile from our DB yet, we are still loading.
    if (supabaseUser && userProfile === undefined) {
      setStatus('loading');
    } 
    // If we have a user and their profile, they are fully authenticated.
    else if (supabaseUser && userProfile) {
      setStatus('authenticated');
    } 
    // If we have no Supabase user, they are unauthenticated.
    else {
      setStatus('unauthenticated');
    }
  }, [supabaseUser, userProfile]);

  return {
    user: supabaseUser,
    userProfile,
    // The main loading flag is now simply derived from our stable status
    isLoading: status === 'loading',
    // The isAuthenticated flag is also derived from our stable status
    isAuthenticated: status === 'authenticated',
    signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email: string, password: string) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
  };
}