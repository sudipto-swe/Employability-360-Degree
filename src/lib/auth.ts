/**
 * NextAuth v5 Configuration
 * 
 * Uses JWT strategy so the middleware doesn't need DB access.
 * PrismaAdapter is used only for persisting accounts/sessions
 * on the server side (not in Edge middleware).
 */

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    /** Inject user role + id into the JWT token */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      // Allow role updates via `update()` session call
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }
      return token;
    },
    /** Expose role + id in the session object */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  ...authConfig,
});
