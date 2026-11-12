import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { normalizePhone } from '@/lib/phoneValidation';
import { consumeAuthEmailOtp, verifyAuthEmailOtp } from '@/lib/authEmailOtp';

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Mobile or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'Email verification code', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const identifier = String(credentials.email || '').trim();
          const normalizedIdentifier = identifier.includes('@')
            ? identifier.toLowerCase()
            : normalizePhone(identifier);
          await dbConnect();

          const userFound = await User.findOne({
            $or: [{ email: normalizedIdentifier }, { phone: normalizedIdentifier }],
          }).select('+password');

          if (!userFound) {
            throw new Error('InvalidEmailOrPassword');
          }

          if (!userFound.password) {
            throw new Error('InvalidEmailOrPassword');
          }
          if (userFound.status && userFound.status !== 'active') {
            throw new Error('AccountInactive');
          }

          const isMatch = await bcrypt.compare(credentials.password, userFound.password);
          if (!isMatch) {
            throw new Error('InvalidEmailOrPassword');
          }

          if (!userFound.isVerified) {
            throw new Error('EmailNotVerified');
          }
          if (!userFound.email) {
            throw new Error('EmailRequiredForOtp');
          }

          const otp = typeof credentials.otp === 'string' ? credentials.otp.trim() : '';
          const verification = await verifyAuthEmailOtp({
            userId: userFound._id,
            purpose: 'login',
            code: otp,
          });
          if (!verification.valid || !await consumeAuthEmailOtp(verification.challenge)) {
            throw new Error('InvalidEmailOtp');
          }

          return {
            id: userFound._id.toString(),
            email: userFound.email,
            name: userFound.name,
            role: userFound.role,
            uniqueId: userFound.uniqueId,
          };
        } catch (error) {
          if (!['InvalidEmailOrPassword', 'AccountInactive', 'EmailNotVerified', 'EmailRequiredForOtp', 'InvalidEmailOtp'].includes(error.message)) {
            console.error('[Auth] Authorize error:', error);
          }
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/signin',
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

export default authOptions;
