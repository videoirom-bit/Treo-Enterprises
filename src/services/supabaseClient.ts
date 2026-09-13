import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Project Credentials for ABC Paper & Stationery:
// Project ID: swgsurkqupfnmcmcxpdx
// Publishable key: sb_publishable_WRZc_ISZuU-yvCkiwS034w_kPeVrdKX
const DEFAULT_PROJECT_ID = 'swgsurkqupfnmcmcxpdx';
const DEFAULT_PROJECT_URL = `https://${DEFAULT_PROJECT_ID}.supabase.co`;
const DEFAULT_PROJECT_KEY = 'sb_publishable_WRZc_ISZuU-yvCkiwS034w_kPeVrdKX';

/**
 * Normalizes input URL or project ID into a valid HTTP/HTTPS URL
 */
function resolveSupabaseUrl(input?: string): string {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return DEFAULT_PROJECT_URL;
  }
  const trimmed = input.trim();
  // If already a valid http/https URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // If given a raw project ID like "swgsurkqupfnmcmcxpdx" or "wxbzmrfuwejjhcpkddoi"
  const cleanId = trimmed.replace(/\.supabase\.co.*$/i, '');
  return `https://${cleanId}.supabase.co`;
}

// User-provided credentials take priority over old template defaults
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_URL =
  envUrl && envUrl !== 'wxbzmrfuwejjhcpkddoi'
    ? resolveSupabaseUrl(envUrl)
    : DEFAULT_PROJECT_URL;

export const SUPABASE_ANON_KEY =
  envKey && envKey !== 'sb_publishable_lh0n3mk8butDQ3c0e6lkkQ_46KUWdrn'
    ? envKey
    : DEFAULT_PROJECT_KEY;

// Create the Supabase client safely
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getSupabaseProjectId = (): string => {
  try {
    const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/i);
    if (match && match[1]) return match[1];
  } catch {}
  return DEFAULT_PROJECT_ID;
};

export default supabase;
