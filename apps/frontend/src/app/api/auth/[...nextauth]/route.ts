import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/auth";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Supabase",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) return null;

        return {
          id: data.user.id,
          email: data.user.email!,
          // Attach Supabase token for backend API calls
          token: data.session?.access_token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.token = (user as { token?: string }).token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as Record<string, unknown>).id = token.sub;
        (session.user as Record<string, unknown>).token = token.token;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export { handler as GET, handler as POST };
