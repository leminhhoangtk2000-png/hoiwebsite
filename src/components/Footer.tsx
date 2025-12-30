'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import * as LucideIcons from 'lucide-react'

interface SocialChannel {
  id: string
  name: string
  icon_code: string
  link: string
  is_active: boolean
}

export default function Footer() {
  const [socialChannels, setSocialChannels] = useState<SocialChannel[]>([])

  useEffect(() => {
    async function fetchSocialChannels() {
      try {
        const { data, error } = await supabase
          .from('social_channels')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true })

        if (error) throw error
        setSocialChannels(data || [])
      } catch (error) {
        console.error('Error fetching social channels:', error)
      }
    }
    fetchSocialChannels()
  }, [])

  function getIconComponent(iconCode: string) {
    try {
      const IconComponent = (LucideIcons as any)[iconCode]
      if (IconComponent && typeof IconComponent === 'function') {
        return IconComponent
      }
    } catch (error) {
      console.warn(`Icon "${iconCode}" not found, using Link icon`)
    }
    return LucideIcons.Link
  }

  return (
    <footer className="bg-white border-t py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-6">
          <h3 className="text-sm font-semibold text-[#333333] uppercase tracking-wide">
            Follow Us
          </h3>
          <div className="flex items-center gap-6">
            {socialChannels.length > 0 ? (
              socialChannels.map((channel) => {
                const IconComponent = getIconComponent(channel.icon_code)
                return (
                  <a
                    key={channel.id}
                    href={channel.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#333333] hover:opacity-70 transition-opacity"
                    aria-label={channel.name}
                  >
                    <IconComponent className="h-6 w-6" />
                  </a>
                )
              })
            ) : (
              <p className="text-sm text-gray-500">No social channels available</p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            © {new Date().getFullYear()} UNIQLO CLONE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
