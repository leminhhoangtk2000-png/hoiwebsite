'use client'

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FilterBar } from "@/components/shop/FilterBar";
import { ProductCard, ShopProduct } from "@/components/shop/ProductCard";
import { ProductDrawer } from "@/components/shop/ProductDrawer";
import { motion } from "motion/react";

interface ShopClientProps {
    initialProducts: ShopProduct[];
    categories: string[];
}

export default function ShopClient({ initialProducts, categories }: ShopClientProps) {
    const searchParams = useSearchParams();
    const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Sync URL param 'category' to state
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            // Decode potential URL encoding
            const decoded = decodeURIComponent(categoryParam);
            // Verify it exists in our categories or is valid? 
            // Just set it.
            setSelectedCategory(decoded);
        } else {
            setSelectedCategory('All');
        }
    }, [searchParams]);

    // Filter Logic
    const filteredProducts = useMemo(() => {
        if (selectedCategory === 'All') return initialProducts;
        return initialProducts.filter(p => p.category_name === selectedCategory);
    }, [initialProducts, selectedCategory]);

    return (
        <div className="min-h-screen bg-[#FFFDF5] pt-20">

            <div className="px-6 md:px-12 py-12 md:py-20">
                <h1 className="text-[10vw] md:text-[6vw] leading-[0.8] font-bold tracking-tighter uppercase mb-6 text-[#990000]">
                    All Collections
                </h1>
                <p className="max-w-xl text-sm md:text-base text-gray-500 font-light leading-relaxed">
                    Explore our complete archive of vintage treasures. Each piece is hand-selected for its unique character, craftsmanship, and potential to be reimagined.
                </p>
            </div>

            <FilterBar
                categories={categories}
                onCategoryChange={setSelectedCategory}
                selectedCategory={selectedCategory}
            />

            <section className="px-6 md:px-12 py-12">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-20">
                        {filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6 }}
                            >
                                <ProductCard
                                    product={product}
                                    onOpenQuickView={setSelectedProduct}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center text-gray-500">
                        No products found in this category.
                    </div>
                )}

                {/* 
          Pagination or Load More could go here if we were doing server-side pagination.
          For client-side filtering of all products, we just indicate end of list or handle simple pagination if needed.
        */}
                {filteredProducts.length > 0 && (
                    <div className="flex justify-center mt-24 mb-12">
                        <button className="text-xs font-bold tracking-[0.2em] uppercase border-b border-[#990000] text-[#333333] hover:text-[#990000] pb-1 hover:opacity-100 transition-colors">
                            End of List
                        </button>
                    </div>
                )}
            </section>

            <ProductDrawer
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
            />
        </div>
    );
}
