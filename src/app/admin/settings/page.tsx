'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface SiteSettings {
  id: string
  logo_url: string | null
  hero_banner_url: string | null
  payment_qr_url: string | null
  bank_info: string | null
  home_banner_text: string | null
  home_section_title: string | null
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [formData, setFormData] = useState({
    logo_url: '',
    hero_banner_url: '',
    payment_qr_url: '',
    bank_info: '',
    home_banner_text: '',
    home_section_title: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle()

      if (error) throw error

      if (data) {
        setSettings(data)
        setFormData({
          logo_url: data.logo_url || '',
          hero_banner_url: data.hero_banner_url || '',
          payment_qr_url: data.payment_qr_url || '',
          bank_info: data.bank_info || '',
          home_banner_text: data.home_banner_text || '',
          home_section_title: data.home_section_title || ''
        })
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: createError } = await supabase
          .from('site_settings')
          .insert({
            logo_url: null,
            hero_banner_url: null,
            payment_qr_url: null,
            bank_info: 'Bank: ABC Bank\nAccount Number: 1234567890\nAccount Name: UNIQLO CLONE',
            home_banner_text: 'LifeWear Collection',
            home_section_title: 'New Arrivals'
          })
          .select()
          .single()

        if (createError) throw createError
        if (newSettings) {
          setSettings(newSettings)
          setFormData({
            logo_url: newSettings.logo_url || '',
            hero_banner_url: newSettings.hero_banner_url || '',
            payment_qr_url: newSettings.payment_qr_url || '',
            bank_info: newSettings.bank_info || '',
            home_banner_text: newSettings.home_banner_text || '',
            home_section_title: newSettings.home_section_title || ''
          })
        }
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error)
      toast.error(error.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!settings) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          logo_url: formData.logo_url || null,
          hero_banner_url: formData.hero_banner_url || null,
          payment_qr_url: formData.payment_qr_url || null,
          bank_info: formData.bank_info || null,
          home_banner_text: formData.home_banner_text || null,
          home_section_title: formData.home_section_title || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)

      if (error) throw error

      toast.success('Settings saved successfully!')
      fetchSettings() // Refresh to get updated data
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#333333] mb-8">Site Settings</h1>

      <Card className="p-6 max-w-3xl">
        <div className="space-y-6">
          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-gray-500 mt-1">URL to your site logo image</p>
          </div>

          <div>
            <Label htmlFor="hero_banner_url">Hero Banner URL</Label>
            <Input
              id="hero_banner_url"
              type="url"
              value={formData.hero_banner_url}
              onChange={(e) => setFormData({ ...formData, hero_banner_url: e.target.value })}
              placeholder="https://example.com/banner.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">URL to your homepage hero banner image</p>
          </div>

          <div>
            <Label htmlFor="payment_qr_url">Payment QR Code URL</Label>
            <Input
              id="payment_qr_url"
              type="url"
              value={formData.payment_qr_url}
              onChange={(e) => setFormData({ ...formData, payment_qr_url: e.target.value })}
              placeholder="https://example.com/qr-code.png"
            />
            <p className="text-xs text-gray-500 mt-1">URL to payment QR code image shown during checkout</p>
          </div>

          <div>
            <Label htmlFor="bank_info">Bank Information</Label>
            <Textarea
              id="bank_info"
              value={formData.bank_info}
              onChange={(e) => setFormData({ ...formData, bank_info: e.target.value })}
              rows={5}
              placeholder="Bank: ABC Bank&#10;Account Number: 1234567890&#10;Account Name: UNIQLO CLONE"
            />
            <p className="text-xs text-gray-500 mt-1">Bank transfer details shown during checkout</p>
          </div>

          <div>
            <Label htmlFor="home_banner_text">Home Banner Text</Label>
            <Input
              id="home_banner_text"
              value={formData.home_banner_text}
              onChange={(e) => setFormData({ ...formData, home_banner_text: e.target.value })}
              placeholder="LifeWear Collection"
            />
            <p className="text-xs text-gray-500 mt-1">Text displayed on the homepage hero banner</p>
          </div>

          <div>
            <Label htmlFor="home_section_title">Home Section Title</Label>
            <Input
              id="home_section_title"
              value={formData.home_section_title}
              onChange={(e) => setFormData({ ...formData, home_section_title: e.target.value })}
              placeholder="New Arrivals"
            />
            <p className="text-xs text-gray-500 mt-1">Title for the product sections on homepage</p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#333333] text-white hover:bg-[#555555]"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

