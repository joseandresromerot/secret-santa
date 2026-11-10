import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [Google],
  pages: { signIn: "/" },
  callbacks: {
    async jwt({ token, user, account }) {
      // On first sign in, upsert the user and keep our DB id in the token
      if (account && user?.email) {
        const [row] = await db
          .insert(users)
          .values({ email: user.email, name: user.name, image: user.image })
          .onConflictDoUpdate({
            target: users.email,
            set: { name: user.name, image: user.image, updatedAt: new Date() },
          })
          .returning({ id: users.id });
        token.id = row.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
