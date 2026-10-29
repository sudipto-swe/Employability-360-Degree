/**
 * Auth Provider Configuration
 * 
 * Separated from main auth.ts so middleware can import
 * without pulling in Prisma (which doesn't run on Edge).
 */

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validators";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate input shape only — actual DB lookup happens in auth.ts
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        // Dynamic import to avoid bundling Prisma in Edge
        const bcrypt = await import("bcryptjs");
        const { prisma } = await import("@/lib/prisma");

        const { email, password } = validated.data;
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
