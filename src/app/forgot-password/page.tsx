'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<'email' | 'code'>('email')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function handleSendCode(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        // Using resetPasswordForEmail. By default sends a link. 
        // If the project is configured to send a code, the user can input it.
        const { error } = await supabase.auth.resetPasswordForEmail(email)

        setLoading(false)
        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Recovery email sent! Please check your inbox for the code.')
            setStep('code')
        }
    }

    async function handleVerifyAndReset(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        // Verify OTP first
        const { error: verifyError, data } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: 'recovery',
        })

        if (verifyError) {
            toast.error(verifyError.message)
            setLoading(false)
            return
        }

        // If verification successful, we receive a session. Now update password.
        if (data.session) {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            })

            if (updateError) {
                toast.error(updateError.message)
            } else {
                toast.success('Password updated successfully!')
                router.push('/login')
            }
        } else {
            toast.error('Session not found. Please try again.')
        }

        setLoading(false)
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

                    {step === 'email' ? (
                        <>
                            <Link href="/login" className="inline-flex items-center text-xs text-[#990000]/60 hover:text-[#990000] mb-6 transition-colors">
                                <ArrowLeft className="w-3 h-3 mr-1" /> Back to Login
                            </Link>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl md:text-3xl font-serif text-[#990000] mb-3">Reset Password</h1>
                                <p className="text-sm text-[#333333]/60 font-light">Enter your email to receive a recovery code.</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleSendCode}>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#990000]/80">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        required
                                        className="w-full h-12 border-b border-[#990000]/20 bg-[#F2F0E6]/30 px-0 focus:px-4 focus:bg-[#FFFDF5] focus:border-[#990000] outline-none transition-all duration-300 text-[#333333] placeholder:text-[#333333]/30"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-[#FFB800] text-[#990000] text-xs font-bold uppercase tracking-widest hover:bg-[#990000] hover:text-[#FFB800] transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending...' : 'Send Recovery Code'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setStep('email')} className="inline-flex items-center text-xs text-[#990000]/60 hover:text-[#990000] mb-6 transition-colors">
                                <ArrowLeft className="w-3 h-3 mr-1" /> Back to Email
                            </button>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl md:text-3xl font-serif text-[#990000] mb-3">New Password</h1>
                                <p className="text-sm text-[#333333]/60 font-light">Enter the code and your new password.</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleVerifyAndReset}>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#990000]/80">Recovery Code</label>
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder="123456"
                                            required
                                            className="w-full h-12 border-b border-[#990000]/20 bg-[#F2F0E6]/30 px-0 focus:px-4 focus:bg-[#FFFDF5] focus:border-[#990000] outline-none transition-all duration-300 text-[#333333] placeholder:text-[#333333]/30"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#990000]/80">New Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="w-full h-12 border-b border-[#990000]/20 bg-[#F2F0E6]/30 px-0 focus:px-4 focus:bg-[#FFFDF5] focus:border-[#990000] outline-none transition-all duration-300 text-[#333333] placeholder:text-[#333333]/30"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-[#FFB800] text-[#990000] text-xs font-bold uppercase tracking-widest hover:bg-[#990000] hover:text-[#FFB800] transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Reseting...' : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}

                </div>
            </motion.div>
        </div>
    )
}
