import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('[supabase] Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
}

// Cliente único para toda la app. La seguridad la da RLS + las funciones RPC.
export const supabase = createClient(url || '', key || '', {
  auth: { persistSession: false },
});
