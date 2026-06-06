import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthResult {
  session: Session | null;
  user: User | null;
  error: string | null;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return {
    session: data.session,
    user: data.user,
    error: error?.message ?? null,
  };
}

export async function signUp(
  email: string,
  password: string,
  nombre: string,
  apellido: string,
  dni: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, apellido, dni, full_name: `${nombre} ${apellido}` },
    },
  });
  // Supabase devuelve éxito falso con identities=[] cuando el email ya existe
  // pero no fue confirmado aún (prevención de enumeración de emails)
  if (!error && data.user?.identities?.length === 0) {
    return { session: null, user: null, error: 'EMAIL_ALREADY_PENDING' };
  }
  return {
    session: data.session,
    user: data.user,
    error: error?.message ?? null,
  };
}

export async function signInWithGoogle(): Promise<string | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  return error?.message ?? null;
}

export async function saveUserProfile(
  nombre: string,
  apellido: string,
  dni: string,
): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({
    data: { nombre, apellido, dni, full_name: `${nombre} ${apellido}` },
  });
  return error?.message ?? null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function profileIsComplete(user: User | null): boolean {
  if (!user) return false;
  const meta = user.user_metadata ?? {};
  return !!(meta.nombre && meta.apellido && meta.dni);
}
