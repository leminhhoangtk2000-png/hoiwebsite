// src/components/layout/Header.tsx
'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store'
import CategoryDropdown from './CategoryDropdown'

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  children?: Category[]
}

export default function Header({ logoUrl, categories = [] }: { logoUrl: string | null, categories: Category[] }) {
  const cartItems = useCartStore((state) => state.items)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const pathname = usePathname()
  const router = useRouter()

  // Build Tree
  const categoryTree = categories
    .filter(c => !c.parent_id)
    .map(parent => ({
      ...parent,
      children: categories.filter(c => c.parent_id === parent.id)
    }));

  function handleCategoryClick(e: React.MouseEvent<HTMLAnchorElement>, slug: string) {
    e.preventDefault()

    if (pathname === '/') {
      const element = document.getElementById(slug)
      if (element) {
        const headerOffset = 80
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    } else {
      router.push(`/#${slug}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo" width={120} height={40} className="h-10 w-auto object-contain" />
            ) : (
              <span className="text-xl font-bold text-[#333333]">UNIQLO CLONE</span>
            )}
          </Link>

          {/* Navigation - Center */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium text-[#333333] hover:opacity-70 transition-opacity py-4">
                SHOP
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Dropdown Container */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block z-50">
                <CategoryDropdown categories={categories} onCategoryClick={handleCategoryClick} />
              </div>
            </div>
          </nav>

          {/* Cart */}
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <ShoppingBag className="h-5 w-5 text-[#333333]" />
            </Button>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#333333] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
