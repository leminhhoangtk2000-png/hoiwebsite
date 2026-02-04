'use client'

import { motion } from "motion/react";

export default function StoryBlock() {
    return (
        <section className="flex flex-col md:flex-row min-h-[80vh]">
            <div className="w-full md:w-1/2 h-[50vh] md:h-auto relative overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1701887875566-dec20a2ad137?q=80&w=1500&auto=format&fit=crop"
                    alt="Fabric Texture"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
            </div>

            <div className="w-full md:w-1/2 bg-[#FFFDF5] flex items-center justify-center p-12 md:p-24">
                <div className="max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h5 className="text-xs font-bold tracking-[0.2em] uppercase text-[#990000]/60 mb-6">
                            Our Philosophy
                        </h5>
                        <h2 className="text-3xl md:text-5xl font-light leading-tight mb-8 text-[#990000]">
                            Selected with <br /><span className="italic font-medium">Conviction</span>
                        </h2>
                        <p className="text-sm md:text-base leading-relaxed text-stone-600 mb-8 font-light">
                            Every garment in our collection tells a story of a bygone era. We meticulously source pieces that transcend trends, focusing on impeccable tailoring, enduring natural fabrics, and the unique patina that only time can bestow.
                        </p>
                        <p className="text-sm md:text-base leading-relaxed text-stone-600 mb-12 font-light">
                            Hội Vintage is not just a store; it is an archive of forgotten elegance, recontextualized for the modern muse who values authenticity above all else.
                        </p>

                        <a href="/about" className="inline-block border-b border-[#990000] pb-1 text-xs font-bold uppercase tracking-widest text-[#990000] hover:text-[#990000]/60 hover:border-[#990000]/60 transition-colors">
                            Read Our Story
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
