import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
        empresaId: { label: 'Empresa', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;
        try {
          const res = await fetch(`${process.env.API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });
          if (!res.ok) return null;
          return res.json();
        } catch { return null; }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) Object.assign(token, user);
      return token;
    },
    session({ session, token }) {
      Object.assign(session.user, {
        userId: token.userId,
        role: token.role,
        empresaId: token.empresaId,
        empresaNome: token.empresaNome,
      });
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
});
