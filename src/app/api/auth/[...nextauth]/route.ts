/**
 * NextAuth API Route Handler
 * 
 * Handles GET (sign-in page) and POST (credentials submit)
 * for all /api/auth/* routes.
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
