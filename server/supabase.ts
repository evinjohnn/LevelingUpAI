// server/supabase.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are in your .env file.");
  throw new Error('Missing Supabase environment variables for server client');
}

// THIS IS THE CRITICAL LINE: The `export` keyword was missing.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);