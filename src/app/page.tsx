'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  price: number
  main_image_url: string | null
  category: string
}

interface SiteSettings {
  hero_banner_url: string | null
  home_banner_text: string | null
  home_section_title: string | null
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true })

        if (categoriesError) throw categoriesError

        // Fetch all products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, main_image_url, category')
          .order('created_at', { ascending: false })

        if (productsError) throw productsError

        // Fetch site settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('site_settings')
          .select('hero_banner_url, home_banner_text, home_section_title')
          .maybeSingle()

        if (settingsError) throw settingsError

        setCategories(categoriesData || [])
        setProducts(productsData || [])
        setSiteSettings(settingsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  function toggleCategory(categorySlug: string) {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categorySlug)) {
        newSet.delete(categorySlug)
      } else {
        newSet.add(categorySlug)
      }
      return newSet
    })
  }

  function getProductsByCategory(categoryName: string) {
    return products.filter((p) => p.category === categoryName)
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  const bannerText = siteSettings?.home_banner_text || 'LifeWear Collection'
  const sectionTitle = siteSettings?.home_section_title || 'New Arrivals'

  return (
    <div className="w-full">
      {/* Hero Banner */}
      <section className="relative w-full h-[600px] bg-gray-100 flex items-center justify-center overflow-hidden">
        {siteSettings?.hero_banner_url ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={siteSettings.hero_banner_url}
              alt="Hero Banner"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center z-10 px-4">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  {bannerText}
                </h1>
                <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
                  Discover the latest trends and styles
                </p>
                {categories.length > 0 && (
                  <a href={`#${categories[0].slug}`}>
                    <Button size="lg" className="bg-white text-[#333333] hover:bg-gray-100 px-8 py-6 text-lg">
                      SHOP NOW
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="text-center z-10 px-4">
                <h1 className="text-5xl md:text-6xl font-bold text-[#333333] mb-6">
                  {bannerText}
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Discover the latest trends and styles
                </p>
                {categories.length > 0 && (
                  <a href={`#${categories[0].slug}`}>
                    <Button size="lg" className="bg-[#333333] text-white hover:bg-[#555555] px-8 py-6 text-lg">
                      SHOP NOW
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Category Sections */}
      {categories.length > 0 ? (
        categories.map((category) => {
          const categoryProducts = getProductsByCategory(category.name)
          const isExpanded = expandedCategories.has(category.slug)
          const displayProducts = isExpanded ? categoryProducts : categoryProducts.slice(0, 4)
          const hasMore = categoryProducts.length > 4

          return (
            <section
              key={category.id}
              id={category.slug}
              className="container mx-auto px-4 py-16 scroll-mt-16"
            >
              <h2 className="text-3xl font-bold text-[#333333] mb-8 text-center">
                {category.name}
              </h2>
              {displayProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {displayProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="text-center mt-8">
                      <Button
                        onClick={() => toggleCategory(category.slug)}
                        variant="outline"
                        className="border-2 border-[#333333] text-[#333333] hover:bg-[#333333] hover:text-white px-8 py-2"
                      >
                        {isExpanded ? 'Show Less' : 'Show All'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No products in this category yet.</p>
                </div>
              )}
            </section>
          )
        })
      ) : (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-[#333333] mb-8 text-center">
            {sectionTitle}
          </h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No products available at the moment.</p>
              <p className="text-sm text-gray-500 mt-2">
                Please run the SQL script in setup_db.sql to add sample products.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
