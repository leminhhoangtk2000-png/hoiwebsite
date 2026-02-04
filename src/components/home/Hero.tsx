'use client'

import { motion } from "motion/react";

export default function Hero({ banners = [] }: { banners?: string[] }) {
    // Use first banner if available, else default
    const bannerImage = banners.length > 0 ? banners[0] : "https://images.unsplash.com/photo-1713264158196-3556d9d445bb?q=80&w=2500&auto=format&fit=crop";

    return (
        <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-stone-100">
            <div className="absolute inset-0 z-0">
                <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    src={bannerImage}
                    alt="Xuân Sắc Campaign"
                    className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/10" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-end pb-12 px-6 md:px-12">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="max-w-4xl"
                >
                    <span className="block text-white text-xs md:text-sm tracking-[0.2em] mb-4 uppercase">
                        New Campaign
                    </span>
                    <h2 className="text-white text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.85] mb-8">
                        Xuân Sắc
                    </h2>
                    <div className="flex items-center gap-4">
                        <button className="bg-[#FFB800] text-[#990000] px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-[#990000] hover:text-[#FFB800] transition-colors duration-300">
                            Discover
                        </button>
                        <span className="text-white text-xs italic opacity-80">
                            Spring Radiance '26
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
