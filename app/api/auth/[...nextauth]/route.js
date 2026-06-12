import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

// --- NextAuth Configuration ---
const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log(`[Auth] Attempting login for email: ${credentials.email}`);
          
          // Ensure database connection is ready
          try {
            await dbConnect();
            console.log("[Auth] Database connected");
          } catch (error) {
            console.error("[Auth] DB connection error:", error.message);
            return null; 
          }

          // Find user by email
          const userFound = await User.findOne({ email: credentials.email });

          if (!userFound) {
            console.log(`[Auth] User not found for email: ${credentials.email}`);
            return null;
          }

          console.log(`[Auth] User found: ${userFound.email}, checking password...`);
          
          // Check if password exists
          if (!userFound.password) {
            console.log(`[Auth] User has no password set: ${credentials.email}`);
            return null;
          }

          // Compare passwords
          const isMatch = await bcrypt.compare(
            credentials.password,
            userFound.password
          );

          if (isMatch) {
            console.log(`[Auth] ✅ Password match! Login success for: ${userFound.email}`);
            return {
              id: userFound._id.toString(),
              email: userFound.email,
              name: userFound.name,
              role: userFound.role,
              uniqueId: userFound.uniqueId,
            };
          }

          console.log(`[Auth] ❌ Password mismatch for: ${userFound.email}`);
          return null;
        } catch (error) {
          console.error("[Auth] Authorize error:", error.message);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    error: '/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.uniqueId = user.uniqueId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.uniqueId = token.uniqueId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };