import NextAuth, { type NextAuthResult } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { Role } from '@/lib/nav-items';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

const nextAuth = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
        empresaId: { label: 'Empresa', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha || !credentials?.empresaId) {
          return null;
        }

        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              senha: credentials.senha,
              empresaId: credentials.empresaId,
            }),
          });

          if (!res.ok) return null;

          return res.json();
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = (user as any).id;
        token.role = (user as any).role;
        token.empresaId = (user as any).empresaId;
        token.empresaNome = (user as any).empresaNome;
        token.nome = (user as any).nome;
        token.email = (user as any).email;
      }

      if (trigger === 'update' && token.email) {
        const empresaId = (session as any)?.empresaId as string | undefined;

        if (empresaId) {
          try {
            const res = await fetch(
              `${API_URL}/api/auth/empresas?email=${encodeURIComponent(String(token.email))}`
            );
            if (res.ok) {
              const data = (await res.json()) as {
                empresas?: { id: string; nome: string; role: Role }[];
              };
              const empresa = data.empresas?.find((item) => item.id === empresaId);

              if (empresa) {
                token.empresaId = empresa.id;
                token.empresaNome = empresa.nome;
                token.role = empresa.role;
              }
            }
          } catch {
            return token;
          }
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).userId = token.userId;
        (session.user as any).role = token.role;
        (session.user as any).empresaId = token.empresaId;
        (session.user as any).empresaNome = token.empresaNome;
        (session.user as any).nome = token.nome;
        (session.user as any).email = token.email;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
});

export const handlers: NextAuthResult['handlers'] = nextAuth.handlers;
export const auth: NextAuthResult['auth'] = nextAuth.auth;
export const signIn: NextAuthResult['signIn'] = nextAuth.signIn;
export const signOut: NextAuthResult['signOut'] = nextAuth.signOut;
