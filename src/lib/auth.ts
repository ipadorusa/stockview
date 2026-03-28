import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(parsed.data.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        // 구글 로그인 시 닉네임 자동 생성 (없으면)
        if (account?.provider === "google" && user.id) {
          const existing = await prisma.user.findUnique({
            where: { id: user.id },
            select: { nickname: true },
          })
          if (existing && !existing.nickname) {
            const baseName = (user.name || user.email?.split("@")[0] || "user").replace(/\s/g, "").slice(0, 15)
            let nickname = baseName
            let suffix = 1
            while (await prisma.user.findUnique({ where: { nickname } })) {
              nickname = `${baseName}${suffix++}`
            }
            await prisma.user.update({
              where: { id: user.id },
              data: { nickname },
            })
          }
        }
        return true
      } catch (error) {
        console.error("[auth] signIn callback error:", error)
        return false
      }
    },
    jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      if (account) {
        token.provider = account.provider
      }
      return token
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
      }
      session.user.role = token.role ?? "USER"
      return session
    },
  },
})
