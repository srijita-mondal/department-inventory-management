// ============================================================
// Auth Context – DEMO / Prototype version
// ============================================================
// In production, replace this with Supabase Auth:
//   import { createClient } from '@supabase/supabase-js'
//   const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
//
// SECURITY NOTE: Role is assigned from the server-side user
// record (profiles table with RLS), not from localStorage.
// This demo simulates that by matching credentials against
// DEMO_USERS which would come from a trusted backend.
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEMO_USERS } from '../data/mockData';

const AuthContext = createContext(null);

const SESSION_KEY = 'nfsu_ih_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Re-validate against source of truth (in production, verify JWT with server)
        const found = DEMO_USERS.find(u => u.id === parsed.id);
        if (found) setUser(sanitize(found));
      }
    } catch (_) { /* ignore corrupt session */ }
    setLoading(false);
  }, []);

  // Remove password before storing in state
  const sanitize = (u) => ({
    id: u.id,
    email: u.email,
    role: u.role,   // ← in production this comes from profiles table via RLS
    name: u.name,
    display: u.display || u.name,
    studentId: u.studentId || null,
  });

  const signIn = useCallback((email, password) => {
    const found = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { error: 'Invalid credentials. Check the demo accounts below.' };

    const session = sanitize(found);
    setUser(session);
    // Use sessionStorage (cleared on tab close) for demo security
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { user: session };
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  // Permission helpers (server-enforced in production via RLS)
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
