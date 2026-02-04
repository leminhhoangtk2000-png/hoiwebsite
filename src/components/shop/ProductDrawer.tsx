'use client'

import React, { useState, useEffect } from "react";
import { X, ArrowRight, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ShopProduct } from "./ProductCard";

interface ProductDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    product: ShopProduct | null;
}

const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const formatVND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

// Helper for Color Codes
function getColorValue(name: string): string {
    const lower = name.toLowerCase();
    const map: Record<string, string> = {
        'be': '#F5F5DC', 'kem': '#FFFDD0', 'trắng': '#FFFFFF', 'đen': '#000000',
        'đỏ': '#990000', 'xanh': '#0000FF', 'xanh dương': '#0047AB', 'xanh lá': '#228B22',
        'nâu': '#8B4513', 'vàng': '#FFD700', 'tím': '#800080', 'hồng': '#FFC0CB',
        'xám': '#808080', 'ghi': '#808080', 'cam': '#FFA500', 'bạc': '#C0C0C0',
        'đồng': '#CD7F32', 'xanh rêu': '#556B2F', 'xanh ngọc': '#40E0D0',
        'hồng phấn': '#FFB6C1', 'đỏ đô': '#800000', 'nude': '#E3BC9A',
        'than': '#36454F', 'kẻ': '#F0F0F0', 'họa tiết': '#E0E0E0',
        'beige': '#F5F5DC', 'cream': '#FFFDD0', 'white': '#FFFFFF', 'black': '#000000',
        'red': '#990000', 'blue': '#0000FF', 'navy': '#000080', 'green': '#228B22',
        'brown': '#8B4513', 'yellow': '#FFD700', 'purple': '#800080', 'pink': '#FFC0CB',
        'gray': '#808080', 'grey': '#808080', 'orange': '#FFA500', 'silver': '#C0C0C0',
        'gold': '#FFD700', 'olive': '#808000', 'teal': '#008080', 'maroon': '#800000',
        'charcoal': '#36454F', 'ivory': '#FFFFF0', 'khaki': '#F0E68C',
        'moss green': '#8A9A5B', 'moss': '#8A9A5B',
        'striped': '#E0E0E0', 'patterned': '#D3D3D3',
        'strawberry': '#FC5A8D', 'red wine': '#722F37', 'wine': '#722F37',
        'primrose yellow': '#EDFF21', 'mint green': '#98FF98', 'mint': '#98FF98',
        'cow brown': '#8B4513',
        'dark brown': '#654321', 'light brown': '#C4A484'
    };
    return map[lower] || lower;
}

export function ProductDrawer({
    isOpen,
    onClose,
    product,
}: ProductDrawerProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    // Reset state when product changes or drawer opens
    useEffect(() => {
        if (isOpen && product) {
            setCurrentImageIndex(0);
            setQuantity(1);
            // Default select first options? Or keep null? 
            // Better UX typically doesn't auto-select unless only 1 option.
            setSelectedColor(null);
            setSelectedSize(null);
        }
    }, [isOpen, product]);

    if (!product) return null;

    const hasDiscount = (product.promotion_percent || 0) > 0;
    const hasMultipleImages = product.images.length > 1;

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    };

    const handleColorSelect = (colorName: string, imageUrl?: string | null) => {
        setSelectedColor(colorName);
        if (imageUrl) {
            const index = product.images.indexOf(imageUrl);
            if (index !== -1) {
                setCurrentImageIndex(index);
            }
        }
    };

    const handleQuantityChange = (delta: number) => {
        setQuantity(Math.max(1, quantity + delta));
    };

    return (
        <Dialog.Root
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-[#FFFDF5] z-50 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-500 ease-[0.16,1,0.3,1] flex flex-col">
                    <div className="flex justify-between items-center p-6 border-b border-[#990000]/10">
                        <Dialog.Title className="text-xs font-bold tracking-widest uppercase text-[#990000]">
                            Quick View
                        </Dialog.Title>
                        <Dialog.Close className="hover:opacity-50 transition-opacity">
                            <X className="w-5 h-5 text-[#990000]" />
                        </Dialog.Close>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* Image Carousel */}
                        <div className="h-[50vh] md:h-[60vh] w-full relative bg-[#F2F0E6] group">
                            {product.images.length > 0 ? (
                                <img
                                    src={product.images[currentImageIndex]}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                            )}

                            {/* Carousel Arrows */}
                            {hasMultipleImages && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#990000] hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-md"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#990000] hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-md"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    {/* Indicators */}
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                        {product.images.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-[#990000]' : 'bg-white/60'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-6 md:p-10 space-y-8">
                            {/* Product Info */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs text-[#990000]/60 uppercase tracking-widest mb-2 block">
                                        {product.category_name}
                                    </span>
                                    <h3 className="text-2xl md:text-3xl font-serif mb-2 text-[#990000]">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    {hasDiscount ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-xl font-bold text-[#990000]">
                                                {formatVND.format(product.sale_price_vnd || 0)}
                                            </span>
                                            <span className="text-sm text-gray-400 line-through">
                                                {formatVND.format(product.price_vnd)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xl font-bold text-[#990000]">
                                            {formatVND.format(product.price_vnd)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Variants Selection */}
                            <div className="space-y-6 border-t border-[#990000]/10 pt-6">
                                {/* Color Selector */}
                                {product.colors && product.colors.length > 0 && (
                                    <div className="space-y-3">
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#990000]">Color</span>
                                        <div className="flex flex-wrap gap-3">
                                            {product.colors.map((color, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleColorSelect(color.name, color.image)}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all relative ${selectedColor === color.name ? 'border-[#990000] scale-110' : 'border-transparent hover:scale-105'}`}
                                                    title={color.name}
                                                >
                                                    <div
                                                        className="w-full h-full rounded-full border border-gray-200"
                                                        style={{ backgroundColor: getColorValue(color.name) }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {selectedColor && <p className="text-xs text-gray-500">Selected: {selectedColor}</p>}
                                    </div>
                                )}

                                {/* Size Selector */}
                                {product.sizes && product.sizes.length > 0 && (
                                    <div className="space-y-3">
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#990000]">Size</span>
                                        <div className="flex flex-wrap gap-2">
                                            {product.sizes.map((size, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`min-w-[40px] px-3 py-2 text-xs border transition-colors uppercase ${selectedSize === size ? 'bg-[#990000] text-white border-[#990000]' : 'border-gray-200 text-gray-600 hover:border-[#990000] hover:text-[#990000]'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Selector */}
                                <div className="space-y-3">
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#990000]">Quantity</span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center border border-gray-200 rounded-lg">
                                            <button
                                                onClick={() => handleQuantityChange(-1)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-[#990000] transition-colors"
                                                disabled={quantity <= 1}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange(1)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-[#990000] transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-4 pt-4 border-t border-[#990000]/10">
                                <p className="text-sm leading-relaxed text-gray-600 font-light">
                                    {/* Placeholder description or utilize fetched one if updated */}
                                    Timeless design meets exceptional craftsmanship.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-[#990000]/10 bg-[#FFFDF5]">
                        <button className="w-full bg-[#FFB800] text-[#990000] h-14 flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase hover:bg-[#990000] hover:text-[#FFB800] transition-colors shadow-lg">
                            Add to Bag — {hasDiscount ? formatVND.format((product.sale_price_vnd || 0) * quantity) : formatVND.format((product.price_vnd || 0) * quantity)} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
