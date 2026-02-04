'use client'

import { useState, useEffect } from 'react';
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const images = [
    {
        src: "https://images.unsplash.com/photo-1759357251907-cb8302565818?q=80&w=1200",
        title: "Le Matin",
        desc: "Morning hues"
    },
    {
        src: "https://images.unsplash.com/photo-1762446093300-44cdc84337eb?q=80&w=1200",
        title: "L'Ombre",
        desc: "Silhouette study"
    },
    {
        src: "https://images.unsplash.com/photo-1720275817070-dc71237498aa?q=80&w=1200",
        title: "La Fleur",
        desc: "Organic details"
    }
];

export default function CollectionGrid() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <section className="px-6 md:px-12 py-24 bg-[#FFFDF5] min-h-[50vh]" />;

    return (
        <section className="px-6 md:px-12 py-24 bg-[#FFFDF5]">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                <h3 className="text-4xl md:text-5xl font-light tracking-tight max-w-xs leading-none text-[#990000]">
                    Curated <br /> <span className="font-bold">Selections</span>
                </h3>
                <a href="#" className="hidden md:flex items-center gap-2 text-xs font-bold tracking-widest uppercase hover:underline hover:text-[#990000] mt-8 md:mt-0">
                    View Full Editorial <ArrowRight className="w-4 h-4" />
                </a>
            </div>

            <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
                <Masonry gutter="40px">
                    {images.map((img, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2, duration: 0.8 }}
                            className={`group relative cursor-pointer ${i === 1 ? 'md:mt-24' : ''}`}
                        >
                            <div className="overflow-hidden mb-4">
                                <img
                                    src={img.src}
                                    alt={img.title}
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0"
                                />
                            </div>
                            <div className="flex justify-between items-baseline opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <h4 className="text-lg font-medium">{img.title}</h4>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">{img.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </Masonry>
            </ResponsiveMasonry>

            <div className="mt-12 md:hidden flex justify-center">
                <a href="#" className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase border-b border-[#990000] text-[#990000] pb-1">
                    View Full Editorial
                </a>
            </div>
        </section>
    );
}
