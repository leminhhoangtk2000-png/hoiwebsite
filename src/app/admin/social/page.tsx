'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Trash2, Plus, Edit } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface SocialChannel {
  id: string
  name: string
  icon_code: string
  link: string
  is_active: boolean
  created_at: string
}

const availableIcons = [
  'Facebook',
  'Instagram',
  'Twitter',
  'Linkedin',
  'Youtube',
  'TikTok',
  'Pinterest',
  'Snapchat',
  'Github',
  'Mail',
  'Phone'
]

export default function AdminSocialPage() {
  const [channels, setChannels] = useState<SocialChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<SocialChannel | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon_code: 'Facebook',
    link: '',
    is_active: true
  })

  useEffect(() => {
    fetchChannels()
  }, [])

  async function fetchChannels() {
    try {
      const { data, error } = await supabase
        .from('social_channels')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setChannels(data || [])
    } catch (error: any) {
      console.error('Error fetching social channels:', error)
      toast.error(error.message || 'Failed to load social channels')
    } finally {
      setLoading(false)
    }
  }

  function openDialog(channel?: SocialChannel) {
    if (channel) {
      setEditingChannel(channel)
      setFormData({
        name: channel.name,
        icon_code: channel.icon_code,
        link: channel.link,
        is_active: channel.is_active
      })
    } else {
      setEditingChannel(null)
      setFormData({
        name: '',
        icon_code: 'Facebook',
        link: '',
        is_active: true
      })
    }
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.link.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingChannel) {
        // Update existing
        const { error } = await supabase
          .from('social_channels')
          .update({
            name: formData.name.trim(),
            icon_code: formData.icon_code,
            link: formData.link.trim(),
            is_active: formData.is_active
          })
          .eq('id', editingChannel.id)

        if (error) throw error
        toast.success('Social channel updated successfully!')
      } else {
        // Create new
        const { error } = await supabase
          .from('social_channels')
          .insert({
            name: formData.name.trim(),
            icon_code: formData.icon_code,
            link: formData.link.trim(),
            is_active: formData.is_active
          })

        if (error) throw error
        toast.success('Social channel added successfully!')
      }

      setDialogOpen(false)
      fetchChannels()
    } catch (error: any) {
      console.error('Error saving social channel:', error)
      toast.error(error.message || 'Failed to save social channel')
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('social_channels')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      toast.success(`Social channel ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchChannels()
    } catch (error: any) {
      console.error('Error updating social channel:', error)
      toast.error(error.message || 'Failed to update social channel')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this social channel?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('social_channels')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Social channel deleted successfully!')
      fetchChannels()
    } catch (error: any) {
      console.error('Error deleting social channel:', error)
      toast.error(error.message || 'Failed to delete social channel')
    }
  }

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#333333]">Social Media Management</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingChannel(null)
            setFormData({
              name: '',
              icon_code: 'Facebook',
              link: '',
              is_active: true
            })
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[#333333] text-white hover:bg-[#555555]"
              onClick={() => openDialog()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Social Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingChannel ? 'Edit Social Channel' : 'Add New Social Channel'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Facebook"
                  required
                />
              </div>
              <div>
                <Label htmlFor="icon_code">Icon *</Label>
                <Select
                  value={formData.icon_code}
                  onValueChange={(value) => setFormData({ ...formData, icon_code: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map((icon) => {
                      const IconComponent = getIconComponent(icon)
                      return (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{icon}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Select the Lucide icon to display</p>
              </div>
              <div>
                <Label htmlFor="link">Link URL *</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://facebook.com/yourpage"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#333333] text-white hover:bg-[#555555]">
                  {editingChannel ? 'Update' : 'Add'} Channel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {channels.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No social channels found.</p>
          <p className="text-sm text-gray-500 mt-2">Click "Add Social Channel" to get started.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel) => {
                const IconComponent = getIconComponent(channel.icon_code)
                return (
                  <TableRow key={channel.id}>
                    <TableCell className="font-medium">{channel.name}</TableCell>
                    <TableCell>
                      <IconComponent className="h-5 w-5" />
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <a 
                        href={channel.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {channel.link}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={channel.is_active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleActive(channel.id, channel.is_active)}
                        className={channel.is_active ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {channel.is_active ? 'Active' : 'Inactive'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(channel)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(channel.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

