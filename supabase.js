import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://komsplwinybifzsmjecu.supabase.co';
const supabaseAnonKey = 'sb_publishable_RjquiQjx5rJ1Xj-fp4ou1g_aKmy9Iia';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
