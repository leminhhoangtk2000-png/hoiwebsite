'use client'

import { motion } from "motion/react";

const RESTORATION_IMG = "https://images.unsplash.com/photo-1718613643239-f3e9a1cf9569?q=80&w=1200&auto=format&fit=crop";
const FOUNDER_IMG = "https://images.unsplash.com/photo-1688327590070-86f614f60efa?q=80&w=1200&auto=format&fit=crop";

export default function AboutPage() {
    return (
        <div className="bg-[#FFFDF5] min-h-screen pt-20">
            <StatementHeader />
            <BrandStorySection />
            <ProcessSection />
            <FounderSection />
            <VisitUsSection />
        </div>
    );
}

function StatementHeader() {
    return (
        <section className="h-[80vh] flex flex-col items-center justify-center px-6">
            <motion.h1
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-[8vw] md:text-[5vw] leading-[1.1] font-bold tracking-tighter text-center uppercase max-w-5xl text-[#990000]"
            >
                Curated with Conviction. <br className="hidden md:block" />
                <span className="text-[#990000]/60">Timeless by Design.</span>
            </motion.h1>

            <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.8, duration: 1, ease: "circOut" }}
                className="w-[1px] h-24 bg-[#990000] mt-12 origin-top"
            />
        </section>
    );
}

function BrandStorySection() {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-0 min-h-screen">
            <div className="relative h-[60vh] md:h-auto overflow-hidden">
                <motion.img
                    initial={{ scale: 1.1 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5 }}
                    src={RESTORATION_IMG}
                    alt="Vintage restoration detail"
                    className="absolute inset-0 w-full h-full object-cover grayscale contrast-125"
                />
            </div>

            <div className="flex flex-col justify-center px-8 py-20 md:px-24 md:py-0 bg-[#FFFDF5]">
                <span className="text-xs font-bold tracking-[0.2em] uppercase mb-8 block text-[#990000]/70">Our Philosophy</span>
                <h2 className="text-3xl md:text-4xl font-serif mb-8 leading-tight text-[#990000]">
                    We believe that true luxury is not created; it is preserved.
                </h2>
                <div className="space-y-6 text-sm md:text-base font-light leading-loose text-stone-600">
                    <p>
                        Hội Vintage was born from a rebellion against the ephemeral. In a world obsessed with the new,
                        we look back. We see the ghost of a story in a frayed hem, the dignity in a faded print.
                    </p>
                    <p>
                        Our curation is not just selection—it is rescue. Each piece is hand-sourced from archives
                        across Asia and Europe, chosen not for its brand, but for its character. We strip away the
                        noise to reveal the essential form.
                    </p>
                    <p>
                        Sustainable by definition, stylish by instinct. This is fashion that breathes.
                    </p>
                </div>
            </div>
        </section>
    );
}

function ProcessSection() {
    const steps = [
        {
            id: "01",
            title: "The Hunt",
            desc: "Scouring private estates, forgotten warehouses, and rural markets for textiles that carry a soul."
        },
        {
            id: "02",
            title: "The Restore",
            desc: "Mending, cleaning, and reviving. We use traditional techniques to honor the original craftsmanship."
        },
        {
            id: "03",
            title: "The Curate",
            desc: "Presenting a cohesive narrative. Every drop is a chapter, every garment a character."
        }
    ];

    return (
        <section className="py-24 md:py-40 px-6 md:px-12 bg-[#FFFDF5]">
            <div className="max-w-7xl mx-auto">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase mb-20 md:mb-32 text-center md:text-left text-[#990000]/70">The Process</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 border-t border-[#990000]">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2, duration: 0.6 }}
                            className="pt-8 relative group"
                        >
                            <span className="text-6xl md:text-8xl font-bold text-[#990000]/10 absolute -top-10 left-0 -z-10 group-hover:text-[#990000]/20 transition-colors duration-500">
                                {step.id}
                            </span>
                            <h4 className="text-xl font-bold uppercase tracking-wide mb-4 text-[#990000]">{step.title}</h4>
                            <p className="text-sm text-stone-500 leading-relaxed max-w-xs">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FounderSection() {
    return (
        <section className="py-24 md:py-40 px-6 md:px-12 bg-[#FFB800] text-[#990000]">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
                <div className="order-2 md:order-1">
                    <blockquote className="text-2xl md:text-3xl font-serif italic leading-relaxed mb-12">
                        "I wanted to build a space where time stands still. Where you can feel the weight of the fabric and the history it holds."
                    </blockquote>

                    <div className="space-y-2">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase">Linh Nguyen</p>
                        <p className="text-xs text-[#990000]/70 uppercase tracking-widest">Founder & Curator</p>
                    </div>

                    <div className="mt-12 opacity-80">
                        <svg width="200" height="80" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 50C30 40 50 60 70 50C90 40 80 20 100 30C120 40 140 30 160 40C180 50 190 30 195 45" stroke="#990000" strokeWidth="2" strokeLinecap="round" />
                            <path d="M40 60C60 60 50 40 70 45" stroke="#990000" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                <div className="order-1 md:order-2 relative aspect-[4/5] md:aspect-square bg-stone-800">
                    <img src={FOUNDER_IMG} alt="Founder working" className="w-full h-full object-cover opacity-80" />
                </div>
            </div>
        </section>
    );
}

function VisitUsSection() {
    return (
        <section className="py-24 px-6 md:px-12 border-t border-[#990000]/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h3 className="text-[10vw] md:text-[6vw] leading-[0.8] font-bold tracking-tighter uppercase mb-12 text-[#990000]">
                        Visit Us
                    </h3>
                    <div className="space-y-8 max-w-sm">
                        <div>
                            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2 text-[#990000]">Address</p>
                            <p className="text-sm text-stone-600 leading-relaxed">
                                24 Ly Quoc Su, Hang Trong<br />
                                Hoan Kiem, Hanoi<br />
                                Vietnam
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2 text-[#990000]">Hours</p>
                            <p className="text-sm text-stone-600 leading-relaxed">
                                Mon - Sun<br />
                                10:00 AM — 8:00 PM
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2 text-[#990000]">Contact</p>
                            <a href="mailto:hello@hoivintage.com" className="text-sm text-stone-600 hover:text-[#990000] underline decoration-[#990000]/30">
                                hello@hoivintage.com
                            </a>
                        </div>
                    </div>
                </div>

                <div className="relative h-[400px] bg-[#FFFDF5] border border-[#990000]/20 p-8 flex items-center justify-center">
                    {/* Abstract Line Map */}
                    <svg className="w-full h-full text-[#990000] stroke-current" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 50 L350 50 L350 250 L50 250 Z" strokeWidth="2" />
                        <path d="M100 50 V250" strokeWidth="1" strokeDasharray="4 4" className="opacity-20" />
                        <path d="M200 50 V250" strokeWidth="1" strokeDasharray="4 4" className="opacity-20" />
                        <path d="M300 50 V250" strokeWidth="1" strokeDasharray="4 4" className="opacity-20" />
                        <path d="M50 100 H350" strokeWidth="1" strokeDasharray="4 4" className="opacity-20" />
                        <path d="M50 200 H350" strokeWidth="1" strokeDasharray="4 4" className="opacity-20" />

                        {/* Location Pin */}
                        <circle cx="200" cy="150" r="4" fill="#990000" />
                        <circle cx="200" cy="150" r="20" stroke="#990000" strokeWidth="1" className="animate-pulse opacity-50" />
                        <text x="210" y="154" className="text-[10px] font-bold uppercase tracking-widest fill-[#990000]">Hội Vintage</text>
                    </svg>
                </div>
            </div>
        </section>
    );
}
