import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // No tiramos: si faltara el .env el throw rompería la cadena de imports y el
  // router arrancaría sin guard, dejando pasar rutas protegidas sin autenticación.
  console.error(
    '[AssetCentral] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env\n' +
    'Copiá front/.env.example a front/.env y completá los valores.'
  );
}

// createClient funciona con strings vacíos; getSession() devolverá null → el guard
// redirigirá a /login correctamente aunque las keys sean inválidas/vacías.
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
