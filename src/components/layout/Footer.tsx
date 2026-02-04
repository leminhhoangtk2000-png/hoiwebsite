export const dynamic = 'force-dynamic';

import { createServerSupabaseClient } from '@/lib/supabase-server';

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
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('social_channels')
      .select('*') // Selects all columns, including icon_url
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    socialChannels = data || [];
  } catch (error) {
    console.error('Error fetching social channels for Footer:', error);
  }

  return (
    <footer className="bg-[#FFB800] text-[#990000] px-6 md:px-12 pt-24 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-12">
        <div className="w-full md:w-1/2">
          <h2 className="text-[8.5vw] leading-[0.8] font-bold tracking-tighter uppercase whitespace-nowrap">
            Hội Vintage
          </h2>
        </div>

        <div className="flex flex-col gap-8 md:w-1/2 md:items-end text-left md:text-right">
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold tracking-widest uppercase text-[#990000]/70 mb-2">Follow us</h4>
            {socialChannels.length > 0 ? (
              socialChannels.map((channel) => (
                <a
                  key={channel.id}
                  href={channel.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl md:text-2xl hover:text-white transition-colors"
                >
                  {channel.name}
                </a>
              ))
            ) : (
              // Fallback if no DB data
              <>
                <a href="#" className="text-xl md:text-2xl hover:text-white transition-colors">Instagram</a>
                <a href="#" className="text-xl md:text-2xl hover:text-white transition-colors">TikTok</a>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end border-t border-[#990000]/20 pt-8">
        <p className="text-[10px] uppercase tracking-widest text-[#990000]/60">
          © {new Date().getFullYear()} Hội Vintage. All Rights Reserved.
        </p>
        <p className="text-[10px] uppercase tracking-widest text-[#990000]/60 mt-4 md:mt-0">
          Designed with Purpose
        </p>
      </div>
    </footer>
  );
}