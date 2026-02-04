'use client'

import { motion } from "motion/react";
import { Plus } from "lucide-react";
import Link from 'next/link';

interface Product {
    id: string
    name: string
    price_usd: number
    price_vnd: number
    product_images: { image_url: string }[]
}

interface SectionProductFeedProps {
    title: string
    products: Product[]
}

export default function SectionProductFeed({ title, products }: SectionProductFeedProps) {
    if (!products || products.length === 0) return null;

    return (
        <section className="px-6 md:px-12 py-24 bg-[#FFFDF5]">
            <div className="mb-16 border-b border-[#990000]/10 pb-4 flex justify-between items-end">
                <h3 className="text-xl font-medium tracking-tight text-[#990000]">{title}</h3>
                <span className="text-xs text-gray-400">Total: {products.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                {products.map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`} className="group cursor-pointer">
                        <div className="relative aspect-[3/4] overflow-hidden bg-stone-50 mb-4">
                            <img
                                src={product.product_images[0]?.image_url || '/placeholder.jpg'}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <button className="bg-[#FFB800] text-[#990000] w-10 h-10 flex items-center justify-center rounded-full shadow-lg hover:bg-[#990000] hover:text-[#FFB800] transition-colors">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wide mb-1 text-[#333333]">{product.name}</h4>
                                <p className="text-xs text-gray-500">Unique Piece</p>
                            </div>
                            <span className="text-sm font-medium text-[#990000]">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price_vnd)}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
