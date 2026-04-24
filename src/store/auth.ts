import { create } from 'zustand';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { useSyncEngine } from '@/sync/engine';
import type { DirtyKey } from '@/sync/types';

interface AuthState {
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  magicLinkSent: boolean;
  initialize: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  signOutGuarded: () => Promise<
    | { ok: true }
    | { ok: false; reason: 'dirty'; dirtyKeys: DirtyKey[] }
  >;
  signOutForce: () => Promise<void>;
  clearError: () => void;
}

let unsubscribeAuthListener: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  supabaseUser: null,
  isAuthenticated: false,
  isLoading: false,
  authError: null,
  magicLinkSent: false,

  initialize: async () => {
    const client = getSupabaseClient();

    if (unsubscribeAuthListener) {
      unsubscribeAuthListener();
      unsubscribeAuthListener = null;
    }

    if (!client) {
      set({
        supabaseUser: null,
        isAuthenticated: false,
        isLoading: false,
        authError: null,
      });
      return;
    }

    set({ isLoading: true, authError: null });

    const { data, error } = await client.auth.getSession();
    if (error) {
      set({
        supabaseUser: null,
        isAuthenticated: false,
        isLoading: false,
        authError: error.message,
      });
      return;
    }

    set({
      supabaseUser: data.session?.user ?? null,
      isAuthenticated: Boolean(data.session?.user),
      isLoading: false,
      authError: null,
    });

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      set({
        supabaseUser: session?.user ?? null,
        isAuthenticated: Boolean(session?.user),
        isLoading: false,
      });
    });

    unsubscribeAuthListener = () => authListener.subscription.unsubscribe();
  },

  signInWithMagicLink: async (email: string) => {
    const client = getSupabaseClient();
    if (!client) {
      set({
        authError: 'Supabase 未配置',
        magicLinkSent: false,
        isLoading: false,
      });
      return;
    }

    set({
      authError: null,
      magicLinkSent: false,
      isLoading: true,
    });

    const { error } = await client.auth.signInWithOtp({ email });
    if (error) {
      set({
        authError: error.message,
        magicLinkSent: false,
        isLoading: false,
      });
      return;
    }

    set({
      authError: null,
      magicLinkSent: true,
      isLoading: false,
    });
  },

  signOut: async () => {
    await get().signOutGuarded();
  },

  signOutGuarded: async () => {
    const dirtyKeys = useSyncEngine.getState().syncState.dirtyKeys;
    if (dirtyKeys.length > 0) {
      return { ok: false, reason: 'dirty', dirtyKeys: [...dirtyKeys] };
    }

    await get().signOutForce();
    return { ok: true };
  },

  signOutForce: async () => {
    const client = getSupabaseClient();
    set({ isLoading: true, authError: null });

    if (client) {
      await client.auth.signOut();
    }

    set({
      supabaseUser: null,
      isAuthenticated: false,
      isLoading: false,
      authError: null,
      magicLinkSent: false,
    });
  },

  clearError: () => set({ authError: null }),
}));
