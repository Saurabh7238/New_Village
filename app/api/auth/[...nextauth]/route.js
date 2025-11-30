import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// --- Database Connection Function ---
const connect = async () => {
  // Check if Mongoose is already connected (prevents warnings/errors in Next.js)
  if (mongoose.connections[0].readyState) return; 
  
  try {
    // Attempt to connect using the URI from environment variables
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    // Throw a specific error to catch during authorize
    throw new Error("Connection Failed!");
  }
};

// --- Mongoose User Schema and Model (Must be defined only once) ---
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "user",
    },
  },
  { timestamps: true }
);

// Use existing model or create new one
const User = mongoose.models.User || mongoose.model("User", UserSchema);


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
        // CRITICAL: Ensure database connection is ready
        try {
          await connect();
        } catch (error) {
          // If connection fails, prevent login attempt (this handles your 'bad auth' if it returns)
          console.error("🚨 Authorize Failed: DB connection error. Check URI/IP Whitelist!");
          return null; 
        }

        const userFound = await User.findOne({ email: credentials.email });

        // 1. User Not Found Check
        if (!userFound) {
          console.log(`⚠️ Login Failed: User not found for email: ${credentials.email}`);
          return null;
        }
        
        // 2. Password Check
        const isMatch = await bcrypt.compare(
          credentials.password,
          userFound.password
        );

        if (isMatch) {
          console.log(`✅ Login Success for user: ${userFound.email}`);
          return {
            id: userFound._id.toString(), // Ensure ID is a string
            email: userFound.email,
            role: userFound.role, // This is key for admin access
          };
        }
        
        // 3. Password Mismatch
        console.log(`❌ Login Failed: Incorrect password for user: ${userFound.email}`);
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    error: '/signin', // Redirect to signin on error
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Ensure session.user exists before assigning properties
      if (session.user) {
        session.user.email = token.email;
        session.user.role = token.role;
      }
      return session;
    },
  },
  // Ensure we use the NEXTAUTH_SECRET from environment
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };