'use client'

import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useState } from "react";

// Images
const HERO_IMG = "https://images.unsplash.com/photo-1762110109445-382cbb83c627?q=80&w=2000&auto=format&fit=crop";
const INTRO_IMG = "https://images.unsplash.com/photo-1734298497319-bd264ccf0c22?q=80&w=1200&auto=format&fit=crop";
const DETAIL_IMG_1 = "https://images.unsplash.com/photo-1636545767112-27892db3d13f?q=80&w=800&auto=format&fit=crop";
const FULL_WIDTH_IMG = "https://images.unsplash.com/photo-1610211039149-37fb055d32b9?q=80&w=2000&auto=format&fit=crop";
const PORTRAIT_1 = "https://images.unsplash.com/photo-1740552439213-ba57952ca7a6?q=80&w=1000&auto=format&fit=crop";
const PORTRAIT_2 = "https://images.unsplash.com/photo-1640511132634-9ee464276452?q=80&w=1000&auto=format&fit=crop";

export default function CollectionsPage() {
    return (
        <div className="bg-[#FFFDF5] min-h-screen pb-20">
            <HeroSection />
            <IntroSection />
            <LookbookGrid />
            <CollectionNav />
        </div>
    );
}

function HeroSection() {
    return (
        <div className="relative h-screen w-full overflow-hidden">
            <motion.div
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute inset-0"
            >
                <img src={HERO_IMG} alt="Collection Hero" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/10" />
            </motion.div>

            <div className="absolute inset-0 flex items-center justify-center">
                <motion.h1
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-[15vw] leading-none font-serif text-white mix-blend-difference"
                >
                    Xuân Sắc
                </motion.h1>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-12 left-12 text-white/80 text-xs font-bold tracking-[0.2em] uppercase"
            >
                Spring/Summer 2026
            </motion.div>
        </div>
    );
}

function IntroSection() {
    return (
        <section className="py-32 px-6 flex justify-center">
            <div className="max-w-md text-center space-y-8">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#990000]/70">The Concept</span>
                <p className="text-2xl md:text-3xl font-serif leading-relaxed text-[#990000]">
                    "Radiance is not just light, but the memory of warmth."
                </p>
                <p className="text-sm text-stone-600 leading-loose">
                    Inspired by the fleeting moments of early spring in Northern Vietnam.
                    The collection explores the duality of fragility and endurance through raw silk,
                    unstructured linens, and hand-dyed organic cottons. A brutalist approach to
                    traditional softness.
                </p>
            </div>
        </section>
    );
}

function LookbookGrid() {
    return (
        <section className="px-4 md:px-12 space-y-24 md:space-y-48 pb-24">
            {/* Row 1: Left Large, Right Small */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                <div className="md:col-span-8 relative group">
                    <img src={INTRO_IMG} alt="Campaign Look 1" className="w-full aspect-[4/5] object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out" />
                    <ShopHotspot x="60%" y="40%" label="The Silk Tunic" price="4,200,000 ₫" />
                </div>
                <div className="md:col-span-4 md:mb-12 relative group">
                    <img src={DETAIL_IMG_1} alt="Detail Shot" className="w-full aspect-[3/4] object-cover" />
                    <p className="mt-4 text-[10px] tracking-widest uppercase text-stone-500">Fig. 01 — Fabric Detail</p>
                </div>
            </div>

            {/* Row 2: Full Width Break */}
            <div className="w-full relative group">
                <div className="overflow-hidden">
                    <motion.img
                        whileInView={{ scale: 1.05 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        src={FULL_WIDTH_IMG}
                        alt="Panoramic View"
                        className="w-full h-[60vh] md:h-[80vh] object-cover"
                    />
                </div>
                <div className="absolute bottom-8 right-8 md:bottom-16 md:right-16 text-white text-right">
                    <p className="text-4xl md:text-6xl font-serif mb-2">Wildflower</p>
                    <p className="text-sm tracking-widest uppercase opacity-80">Campaign Edit</p>
                </div>
            </div>

            {/* Row 3: Two Portraits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-32 px-0 md:px-24">
                <div className="relative pt-24 group">
                    <img src={PORTRAIT_1} alt="Portrait Look 1" className="w-full aspect-[3/4] object-cover" />
                    <ShopHotspot x="30%" y="50%" label="Pleated Trousers" price="5,500,000 ₫" />
                    <div className="absolute -left-8 top-32 -rotate-90 origin-bottom-right">
                        <span className="text-[10px] tracking-[0.3em] uppercase">Look 04</span>
                    </div>
                </div>
                <div className="relative group">
                    <img src={PORTRAIT_2} alt="Portrait Look 2" className="w-full aspect-[3/4] object-cover" />
                    <ShopHotspot x="70%" y="30%" label="Sculpted Blazer" price="8,900,000 ₫" />
                    <p className="absolute -bottom-8 right-0 text-xs italic text-stone-500">
                        "Stillness in motion."
                    </p>
                </div>
            </div>
        </section>
    );
}

function ShopHotspot({ x, y, label, price }: { x: string, y: string, label: string, price: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute" style={{ left: x, top: y }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 z-10 relative"
            >
                <Plus className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
            </button>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute top-10 left-0 bg-white p-4 shadow-xl w-48 z-20"
                >
                    <p className="text-xs font-bold uppercase mb-1">{label}</p>
                    <p className="text-xs text-stone-500 mb-3">{price}</p>
                    <button className="text-[10px] font-bold tracking-widest uppercase border-b border-[#990000] hover:text-[#990000] transition-colors">
                        View Product
                    </button>
                </motion.div>
            )}
        </div>
    );
}

function CollectionNav() {
    return (
        <div className="border-t border-[#990000]/10 py-12 px-6 md:px-12 flex justify-between items-center text-xs font-bold tracking-widest uppercase">
            <a href="#" className="flex items-center gap-4 hover:text-[#990000] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Previous Collection
            </a>
            <a href="#" className="flex items-center gap-4 hover:text-[#990000] transition-colors">
                Next Collection <ArrowRight className="w-4 h-4" />
            </a>
        </div>
    );
}
