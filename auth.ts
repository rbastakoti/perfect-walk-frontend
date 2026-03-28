import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        if (
          credentials?.email === "test@example.com" &&
          credentials?.password === "password"
        ) {
          return {
            id: "test-user-1",
            name: "Test User",
            email: "test@example.com",
            image: null,
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});
