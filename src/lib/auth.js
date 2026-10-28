import { supabase } from './supabase';

// Cada rol es un usuario de Supabase Auth. El rol real (el que valida la base con RLS)
// está en app_metadata.role del usuario; ver supabase/setup.sql.
const ROLE_EMAILS = {
    owner: import.meta.env.VITE_OWNER_EMAIL,
    kitchen: import.meta.env.VITE_KITCHEN_EMAIL,
};

if (!ROLE_EMAILS.owner || !ROLE_EMAILS.kitchen) {
    throw new Error("Faltan las variables de entorno VITE_OWNER_EMAIL o VITE_KITCHEN_EMAIL.");
}

export const MIN_PASSWORD_LENGTH = 6; // Mínimo por defecto de Supabase Auth

export function getRole(session) {
    const role = session?.user?.app_metadata?.role;
    return Object.hasOwn(ROLE_EMAILS, role) ? role : null;
}

export async function signIn(role, password) {
    const { error } = await supabase.auth.signInWithPassword({ email: ROLE_EMAILS[role], password });
    return error;
}

export async function signOut() {
    await supabase.auth.signOut();
}

export async function changePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error;
}
