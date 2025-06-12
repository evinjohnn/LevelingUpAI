// client/src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch the entire API response object
  const { data: userProfileResponse, isLoading: isProfileLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return null;
        
        const res = await fetch('/api/auth/user', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch user profile');
        return res.json();
    },
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  // --- THIS IS THE FIX ---
  // We derive the actual userProfile from the nested 'data' property of the response.
  // This ensures the rest of the app gets the object shape it expects.
  const userProfile = userProfileResponse?.data;

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setInitialLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (_event === 'SIGNED_OUT') {
          queryClient.clear();
        }
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

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
  
  // Adjusted isLoading logic to be more precise
  const isLoading = initialLoading || (!!user && isProfileLoading);

  return {
    user,
    userProfile, // Now this is the correct user object or undefined
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
}