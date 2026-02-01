'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductCard from '@/components/product/ProductCard'

interface Product {
    id: string
    name: string
    price_usd: number
    price_vnd: number
    discount_type?: 'percentage' | 'fixed' | null
    discount_value?: number | null
    product_images: { image_url: string }[]
}

export default function ProductCarousel({ products }: { products: Product[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;

        // Calculate width of one item + gap. estimate 300px + 24px (gap-6)
        const itemWidth = 300 + 24;
        const containerWidth = scrollRef.current.clientWidth;

        // Scroll one "page" or roughly 3 items
        const scrollAmount = direction === 'left' ? -itemWidth * 3 : itemWidth * 3;

        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    return (
        <div className="relative group">
            {/* Arrows */}
            {/* Left Arrow */}
            <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full hover:bg-gray-100 hidden lg:flex opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={() => scroll('left')}
                disabled={products.length === 0}
            >
                <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Right Arrow */}
            <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white shadow-lg rounded-full hover:bg-gray-100 hidden lg:flex opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={() => scroll('right')}
                disabled={products.length === 0}
            >
                <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto pb-6 pt-2 px-1 snap-x snap-mandatory scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {products.map(product => (
                    <div key={product.id} className="w-[260px] sm:w-[300px] flex-shrink-0 snap-start h-full">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
            {/* Custom Style for hiding scrollbar in Webkit */}
            <style jsx>{`
                .scrollbar-none::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    )
}
