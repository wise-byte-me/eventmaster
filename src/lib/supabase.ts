import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';

// Using 'any' for Database generic to avoid complex type inference issues
// All data shapes are defined in types/database.ts for documentation purposes
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
