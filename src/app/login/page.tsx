'use client'

import { useState, useTransition } from "react"
import { motion } from "motion/react"
import { Eye, EyeOff, Facebook, Chrome, ArrowRight } from "lucide-react"
import Link from "next/link"
import { login } from "../auth/actions"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-client"

// Simple Apple icon component since Lucide might not have it or it's named differently
const AppleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.65-1.02 1.35.03 2.09.43 2.62 1.25-2.09 1.14-1.85 4.3.43 5.48-.35 1.77-1.12 3.52-1.78 4.52zm-2.48-12.98c-1.14 0-2.46-.86-2.39-2.5 1.34-1.04 3.19-.89 3.06 2.5z" />
  </svg>
)

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center px-6 pt-20 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-[#990000]/10 p-8 md:p-12 shadow-2xl shadow-[#990000]/5 relative overflow-hidden">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFB800]/20 -mr-8 -mt-8 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-serif text-[#990000] mb-3">Welcome Back</h1>
            <p className="text-sm text-[#333333]/60 font-light">Sign in to continue your journey.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-[#990000]/80">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  className="w-full h-12 border-b border-[#990000]/20 bg-[#F2F0E6]/30 px-0 focus:px-4 focus:bg-[#FFFDF5] focus:border-[#990000] outline-none transition-all duration-300 text-[#333333] placeholder:text-[#333333]/30"
                />
              </div>

              <div className="space-y-1 relative">
                <label className="text-xs font-bold uppercase tracking-widest text-[#990000]/80">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    required
                    className="w-full h-12 border-b border-[#990000]/20 bg-[#F2F0E6]/30 px-0 focus:px-4 focus:bg-[#FFFDF5] focus:border-[#990000] outline-none transition-all duration-300 text-[#333333] placeholder:text-[#333333]/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#990000]/40 hover:text-[#990000] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-[#990000]/70 hover:text-[#990000] hover:underline transition-all">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 bg-[#FFB800] text-[#990000] text-xs font-bold uppercase tracking-widest hover:bg-[#990000] hover:text-[#FFB800] transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Signing In...' : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#990000]/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#990000]/40 tracking-widest">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    },
                  })
                }}
                className="h-10 border border-[#990000]/20 flex items-center justify-center gap-2 hover:bg-[#FFFDF5] hover:border-[#990000] transition-colors group"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-xs font-medium text-[#333333] group-hover:text-[#990000]">Google</span>
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-[#333333]/60">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-bold text-[#990000] hover:underline uppercase tracking-wide ml-1"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
