"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogle(locale: string) {
  await signIn("google", { redirectTo: `/${locale}/draws` });
}

export async function signOutAction(locale: string) {
  await signOut({ redirectTo: `/${locale}` });
}
