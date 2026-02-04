'use client'

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ShopProduct {
    id: string;
    name: string;
    price_usd: number;
    price_vnd: number;
    category_name: string;
    images: string[];
    stock: number;
    promotion_percent: number | null;
    sale_price_usd: number | null;
    sale_price_vnd: number | null;
    // Variants
    colors?: { name: string; image?: string | null }[];
    sizes?: string[];
}

interface ProductCardProps {
    product: ShopProduct;
    onOpenQuickView: (product: ShopProduct) => void;
}

const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const formatVND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function ProductCard({ product, onOpenQuickView }: ProductCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const hasDiscount = (product.promotion_percent || 0) > 0;
    const hasMultipleImages = product.images.length > 1;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    };

    return (
        <div
            className="group cursor-pointer flex flex-col gap-3"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setCurrentImageIndex(0); // Optional: Reset to first image on leave? User didn't specify, but nice UX. Let's keep it or remove if annoying. I'll remove it to keep state persistent during session or reset? Resetting is safer for "Quick glance".
            }}
            onClick={() => onOpenQuickView(product)}
        >
            <div className="relative aspect-[3/4] overflow-hidden bg-[#F2F0E6] w-full">
                {/* Image Display */}
                {product.images.length > 0 ? (
                    <motion.img
                        key={currentImageIndex} // Key change triggers animation if desired, or just src update
                        src={product.images[currentImageIndex]}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No Image</div>
                )}

                {/* Navigation Arrows */}
                {hasMultipleImages && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#990000] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#990000] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Dots Indicator (Optional but helpful) */}
                        <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {product.images.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-[#990000]' : 'bg-white/50'}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Badges */}
                {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-[#990000] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider z-10">
                        -{product.promotion_percent}%
                    </div>
                )}

                {/* Add to Cart Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center pb-8 z-20">
                    <button
                        className="bg-[#FFB800] text-[#990000] px-6 py-3 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-[#990000] hover:text-[#FFB800] transition-colors shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Add to cart logic here
                        }}
                    >
                        Quick Add
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-start px-1">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-[#333333] line-clamp-1" title={product.name}>{product.name}</h3>
                    <span className="text-[10px] text-[#990000]/70">
                        {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
                    </span>
                </div>

                <div className="flex flex-col items-end text-xs font-medium tabular-nums text-[#990000]">
                    {hasDiscount ? (
                        <>
                            <span className="text-[#990000] font-bold">
                                {formatVND.format(product.sale_price_vnd || 0)}
                            </span>
                            <span className="text-gray-400 line-through text-[10px]">
                                {formatVND.format(product.price_vnd)}
                            </span>
                            <div className="text-[10px] text-gray-500 mt-0.5 text-right">
                                <span className="text-[#990000]">{formatUSD.format(product.sale_price_usd || 0)}</span>
                                <span className="ml-1 text-gray-400 line-through">{formatUSD.format(product.price_usd)}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <span>{formatVND.format(product.price_vnd)}</span>
                            <span className="text-[10px] text-gray-500">{formatUSD.format(product.price_usd)}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Variants Display */}
            <div className="px-1 mt-2 space-y-2">
                {/* Colors */}
                {product.colors && product.colors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {product.colors.map((color, idx) => (
                            <div
                                key={idx}
                                className="w-4 h-4 rounded-full border border-gray-300 shadow-sm cursor-pointer hover:scale-110 transition-transform relative group/color"
                                style={{ backgroundColor: getColorValue(color.name) }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (color.image) {
                                        // If image exists, try to find text index or just use src
                                        // For carousel logic to work best, we should find index. 
                                        // But simple src override is enough for "preview".
                                        // We'll set a temporary override state in the component?
                                        // Actually `currentImageIndex` is for the list. 
                                        // Let's force proper state if we can find it in the list.
                                        const imgIndex = product.images.findIndex(img => img === color.image);
                                        if (imgIndex !== -1) {
                                            setCurrentImageIndex(imgIndex);
                                        }
                                        // If not in list (rare/buggy data), we might ignore or force it? 
                                        // Better to assume it's in the list or just ignore for safety.
                                    }
                                }}
                                title={color.name}
                            >
                                <span className="sr-only">{color.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Sizes */}
                {product.sizes && product.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 uppercase tracking-wide">
                        {product.sizes.map((size, idx) => (
                            <span key={idx} className="bg-gray-100 px-1.5 py-0.5 rounded-sm">
                                {size}
                            </span>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}

// Helper to generate color value from name if CSS doesn't support it directly
// Simple fallback or pass-through
function getColorValue(name: string): string {
    // Basic mapping for common non-standard names or Vietnamese
    const lower = name.toLowerCase();
    const map: Record<string, string> = {
        // Vietnamese
        'be': '#F5F5DC', 'kem': '#FFFDD0', 'trắng': '#FFFFFF', 'đen': '#000000',
        'đỏ': '#990000', 'xanh': '#0000FF', 'xanh dương': '#0047AB', 'xanh lá': '#228B22',
        'nâu': '#8B4513', 'vàng': '#FFD700', 'tím': '#800080', 'hồng': '#FFC0CB',
        'xám': '#808080', 'ghi': '#808080', 'cam': '#FFA500', 'bạc': '#C0C0C0',
        'đồng': '#CD7F32', 'xanh rêu': '#556B2F', 'xanh ngọc': '#40E0D0',
        'hồng phấn': '#FFB6C1', 'đỏ đô': '#800000', 'nude': '#E3BC9A',
        'than': '#36454F', 'kẻ': '#F0F0F0', 'họa tiết': '#E0E0E0',
        // English
        'beige': '#F5F5DC', 'cream': '#FFFDD0', 'white': '#FFFFFF', 'black': '#000000',
        'red': '#990000', 'blue': '#0000FF', 'navy': '#000080', 'green': '#228B22',
        'brown': '#8B4513', 'yellow': '#FFD700', 'purple': '#800080', 'pink': '#FFC0CB',
        'gray': '#808080', 'grey': '#808080', 'orange': '#FFA500', 'silver': '#C0C0C0',
        'gold': '#FFD700', 'olive': '#808000', 'teal': '#008080', 'maroon': '#800000',
        'charcoal': '#36454F', 'ivory': '#FFFFF0', 'khaki': '#F0E68C',
        'moss green': '#8A9A5B', 'moss': '#8A9A5B',
        'striped': '#E0E0E0', 'patterned': '#D3D3D3',
        // New Additions
        'strawberry': '#FC5A8D', 'red wine': '#722F37', 'wine': '#722F37',
        'primrose yellow': '#EDFF21', 'mint green': '#98FF98', 'mint': '#98FF98',
        'cow brown': '#8B4513', 'brown': '#8B4513',
        'dark brown': '#654321', 'light brown': '#C4A484'
    };
    return map[lower] || lower; // Fallback to name if it happens to be valid CSS (e.g. "red")
}
