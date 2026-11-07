import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default project credentials configured for Questões Brasil
export const DEFAULT_SUPABASE_URL = 'https://nynpwbynpcgxgvnxdwpm.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_sm74K4DdRqJfIBIxIUNq2A_nD1pvYHi';

// Helper to normalize any Supabase URL
export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

// Retrieve active credentials with cascading fallback:
// 1. localStorage custom override (set via Admin UI)
// 2. Vite environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
// 3. Project defaults (ensuring Vercel and production deployments connect automatically)
export function getActiveSupabaseConfig(): {
  url: string;
  anonKey: string;
  source: 'custom_storage' | 'env_variable' | 'default_project';
} {
  let customUrl = '';
  let customKey = '';
  if (typeof window !== 'undefined') {
    try {
      customUrl = localStorage.getItem('qb_custom_supabase_url') || '';
      customKey = localStorage.getItem('qb_custom_supabase_anon_key') || '';
    } catch {
      // Ignore storage access errors
    }
  }

  if (customUrl && customKey) {
    return {
      url: normalizeSupabaseUrl(customUrl),
      anonKey: customKey.trim(),
      source: 'custom_storage',
    };
  }

  const envUrl = normalizeSupabaseUrl((import.meta.env.VITE_SUPABASE_URL as string) || '');
  const envKey = ((import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '').trim();

  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      source: 'env_variable',
    };
  }

  return {
    url: normalizeSupabaseUrl(DEFAULT_SUPABASE_URL),
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    source: 'default_project',
  };
}

const activeConfig = getActiveSupabaseConfig();
export const supabaseUrl = activeConfig.url;
export const supabaseAnonKey = activeConfig.anonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export function buildSupabaseClient(url: string, key: string): SupabaseClient | null {
  if (!url || !key || !url.startsWith('https://')) return null;
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

// Active singleton instance
export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? buildSupabaseClient(supabaseUrl, supabaseAnonKey)
  : null;

// Allow updating credentials dynamically at runtime without page refresh
export function updateRuntimeSupabaseConfig(newUrl: string, newKey: string): boolean {
  const cleanUrl = normalizeSupabaseUrl(newUrl);
  const cleanKey = newKey.trim();

  if (!cleanUrl || !cleanKey || !cleanUrl.startsWith('https://')) {
    return false;
  }

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('qb_custom_supabase_url', cleanUrl);
      localStorage.setItem('qb_custom_supabase_anon_key', cleanKey);
    }
    supabase = buildSupabaseClient(cleanUrl, cleanKey);
    return true;
  } catch (err) {
    console.error('Erro ao atualizar credenciais do Supabase:', err);
    return false;
  }
}

// Clear runtime overrides and restore default
export function resetRuntimeSupabaseConfig(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qb_custom_supabase_url');
      localStorage.removeItem('qb_custom_supabase_anon_key');
    }
    const restored = getActiveSupabaseConfig();
    supabase = buildSupabaseClient(restored.url, restored.anonKey);
  } catch (err) {
    console.error('Erro ao resetar credenciais do Supabase:', err);
  }
}
