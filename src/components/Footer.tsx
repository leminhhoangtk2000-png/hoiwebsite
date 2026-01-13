export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import Image from 'next/image'; // Import Next.js Image component

interface SocialChannel {
  id: string;
  name: string;
  icon_url: string; // Expecting a URL for the icon
  link: string;
  is_active: boolean;
}

export default async function Footer() {
  let socialChannels: SocialChannel[] = [];
  try {
    const { data, error } = await supabase
      .from('social_channels')
      .select('*') // Selects all columns, including icon_url
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    socialChannels = data || [];
  } catch (error) {
    console.error('Error fetching social channels for Footer:', error);
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
                // For debugging as requested
                console.log("DEBUG social channel item:", channel);

                // Ensure icon_url exists and is a valid string before rendering
                if (!channel.icon_url || typeof channel.icon_url !== 'string') {
                  // Optionally render a fallback or nothing
                  return null;
                }

                return (
                  <a
                    key={channel.id}
                    href={channel.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#333333] hover:opacity-70 transition-opacity"
                    aria-label={channel.name}
                  >
                    <Image
                      src={channel.icon_url}
                      alt={`${channel.name} icon`}
                      width={24}
                      height={24}
                      className="h-6 w-6" // Maintain consistent size
                      unoptimized // Add if icons are SVGs or from external non-standard domains
                    />
                  </a>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No social channels available</p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            © {new Date().getFullYear()} Your Company Name. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}