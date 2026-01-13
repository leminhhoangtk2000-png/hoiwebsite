'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Trash2, Plus, Edit, Link as LinkIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface SocialChannel {
  id: string
  name: string
  icon_code: string | null // Now optional
  icon_url: string | null  // New field
  link: string
  is_active: boolean
  created_at: string
}

const BUCKET_NAME = 'social-icons';

export default function AdminSocialPage() {
  const [channels, setChannels] = useState<SocialChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<SocialChannel | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    is_active: true
  })
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels()
  }, [])

  async function fetchChannels() {
    setLoading(true);
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  function openDialog(channel?: SocialChannel) {
    if (channel) {
      setEditingChannel(channel)
      setFormData({
        name: channel.name,
        link: channel.link,
        is_active: channel.is_active
      })
      setPreviewUrl(channel.icon_url);
    } else {
      setEditingChannel(null)
      setFormData({
        name: '',
        link: '',
        is_active: true
      })
      setPreviewUrl(null);
    }
    setIconFile(null);
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.link.trim()) {
      toast.error('Please fill in Name and Link URL fields')
      return
    }

    try {
      let icon_url = editingChannel?.icon_url || null;

      // Handle file upload
      if (iconFile) {
        // Remove old file if updating
        if (editingChannel?.icon_url) {
          const oldFileName = editingChannel.icon_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
          }
        }
        
        const fileName = `${Date.now()}-${iconFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, iconFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);
        
        icon_url = publicUrlData.publicUrl;
      }

      const channelData = {
        name: formData.name.trim(),
        link: formData.link.trim(),
        is_active: formData.is_active,
        icon_url: icon_url,
        icon_code: null // Deprecate icon_code
      };

      if (editingChannel) {
        // Update existing
        const { error } = await supabase
          .from('social_channels')
          .update(channelData)
          .eq('id', editingChannel.id)

        if (error) throw error
        toast.success('Social channel updated successfully!')
      } else {
        // Create new
        const { error } = await supabase
          .from('social_channels')
          .insert(channelData)

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
      toast.error(error.message || 'Failed to update social channel')
    }
  }

  async function handleDelete(channel: SocialChannel) {
    if (!confirm('Are you sure you want to delete this social channel? This will also delete its icon.')) {
      return
    }

    try {
      // Delete icon from storage first
      if (channel.icon_url) {
        const fileName = channel.icon_url.split('/').pop();
        if (fileName) {
          const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);
          if (storageError) {
             console.error('Could not delete icon from storage:', storageError.message);
             toast.error('Failed to delete icon from storage, but proceeding to delete channel data.');
          }
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('social_channels')
        .delete()
        .eq('id', channel.id)

      if (error) throw error

      toast.success('Social channel deleted successfully!')
      fetchChannels()
    } catch (error: any) {
      console.error('Error deleting social channel:', error)
      toast.error(error.message || 'Failed to delete social channel')
    }
  }

  // Fallback for old data that might still use lucide icons
  function getIconComponent(iconCode: string | null) {
    if (!iconCode) return LinkIcon;
    try {
      const IconComponent = (LucideIcons as any)[iconCode]
      return IconComponent && typeof IconComponent === 'function' ? IconComponent : LinkIcon;
    } catch (error) {
      return LinkIcon;
    }
  }

  if (loading) return <div className="container mx-auto p-8 text-center">Loading social channels...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#333333]">Social Media Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                <Label htmlFor="icon">Icon Image</Label>
                <Input
                  id="icon"
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  onChange={handleFileChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {previewUrl && (
                  <div className="mt-4">
                     <Image src={previewUrl} alt="Icon preview" width={40} height={40} className="rounded-md object-cover" />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Upload a PNG, JPG, or SVG. Replaces existing icon.</p>
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

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No social channels found.
                </TableCell>
              </TableRow>
            ) : channels.map((channel) => {
              const IconComponent = getIconComponent(channel.icon_code);
              return (
                <TableRow key={channel.id}>
                  <TableCell>
                    {channel.icon_url ? (
                      <Image src={channel.icon_url} alt={channel.name} width={24} height={24} className="rounded-sm"/>
                    ) : (
                      <IconComponent className="h-6 w-6" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    <a href={channel.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
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
                      <Button variant="ghost" size="icon" onClick={() => openDialog(channel)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(channel)} className="text-red-600 hover:text-red-700">
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
      <div className="text-sm text-gray-500 mt-4">
        <strong>Note:</strong> You might need to create a new Supabase Storage bucket named "social-icons" with public access for the icons to work correctly.
      </div>
    </div>
  )
}

