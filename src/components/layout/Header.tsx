// src/components/layout/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, ChevronDown, Menu, Search } from 'lucide-react'
import { motion } from "motion/react"
import { useCartStore } from '@/lib/store'
import CategoryDropdown from './CategoryDropdown'

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  children?: Category[]
}

import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-client'

export default function Header({ logoUrl, categories = [], user }: { logoUrl: string | null, categories: Category[], user: User | null }) {
  const cartItems = useCartStore((state) => state.items)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  const currentPage = pathname === '/' ? 'home' : pathname.replace('/', '')

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-3 md:px-12 md:py-3.5 flex justify-between items-center transition-colors duration-300 ${isScrolled || pathname !== '/' ? 'bg-[#FFB800] text-[#990000] border-b border-[#990000]/20 py-2 md:py-2 shadow-sm' : 'bg-transparent text-[#990000]'}`}
    >
      {/* Left: Navigation */}
      <div className="flex flex-col gap-1 w-1/3">
        <nav className="hidden md:flex gap-8 text-xs font-medium tracking-widest uppercase items-center">

          <div className="relative group">
            <Link href="/shop" className={`hover:text-white transition-colors flex items-center gap-1 ${pathname.startsWith('/shop') ? 'line-through' : ''}`}>
              Shop
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Link>
            {/* Dropdown Integration */}
            <div className="absolute left-0 top-full pt-0 hidden group-hover:block w-max">
              {/* Container styles moved inside CategoryDropdown for better encapsulation */}
              <CategoryDropdown categories={categories} onCategoryClick={(e, categoryName) => {
                e.preventDefault()
                router.push(`/shop?category=${encodeURIComponent(categoryName)}`)
              }} />
            </div>
          </div>

          <Link href="/collections" className={`hover:text-white transition-colors ${pathname === '/collections' ? 'line-through' : ''}`}>
            Collections
          </Link>
          <Link href="/about" className={`hover:text-white transition-colors ${pathname === '/about' ? 'line-through' : ''}`}>
            About
          </Link>
        </nav>
        <button className="md:hidden hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Brand */}
      <div className="w-1/3 flex justify-center">
        <Link href="/" className="text-xl md:text-2xl font-bold tracking-tighter uppercase text-[#990000] hover:text-white transition-colors whitespace-nowrap">
          {logoUrl ? (
            <Image src={logoUrl} alt="Hội Vintage" width={120} height={40} className="h-8 md:h-10 w-auto object-contain" />
          ) : (
            "Hội Vintage"
          )}
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="w-1/3 flex justify-end gap-6 items-center">
        <button className="hover:text-white transition-colors">
          <Search className="w-4 h-4" />
        </button>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <div className="w-5 h-5 rounded-full bg-[#990000]/10 flex items-center justify-center border border-[#990000]/20">
                {/* Simplistic user icon or avatar if we had one */}
                <span className="text-[10px] font-bold">{user.email?.charAt(0).toUpperCase()}</span>
              </div>
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#990000]/10 shadow-xl z-20 py-2">
                  <div className="px-4 py-2 border-b border-[#990000]/5 mb-2">
                    <p className="text-xs text-[#990000]/60 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#333333] hover:bg-[#FFFDF5] hover:text-[#990000] transition-colors"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsUserMenuOpen(false)
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-[#333333] hover:bg-[#FFFDF5] hover:text-[#990000] transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link href="/login" className="text-xs font-medium uppercase tracking-widest hover:text-white transition-colors">
            Sign In
          </Link>
        )}

        <Link href="/cart" className="hover:text-white transition-colors relative group">
          <ShoppingBag className="w-4 h-4" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-[#990000] text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </motion.header>
  )
}
