import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import InstagramChatBubble from "@/components/InstagramChatBubble";
import { Toaster } from "@/components/ui/sonner";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// Cache for 60 seconds
export const revalidate = 60;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getSiteSettings() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('site_settings').select('key, value');
  if (error) {
    console.error("Error fetching site settings:", error);
    return {};
  }
  return data.reduce((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, any>);
}

async function getCategories() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .order('name', { ascending: true });
  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data;
}

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createServerSupabaseClient();
  const settings = await getSiteSettings();
  const siteTitle = settings.site_title || "UNIQLO CLONE - Minimalist Fashion";

  let logoUrl = "/file.svg";
  if (settings.logo_path) {
    if (settings.logo_path.startsWith('http')) {
      logoUrl = settings.logo_path;
    } else {
      const { data } = supabase.storage.from('logos').getPublicUrl(settings.logo_path);
      logoUrl = data.publicUrl;
    }
  }

  return {
    title: siteTitle,
    description: "A minimalist e-commerce experience inspired by Uniqlo",
    icons: {
      icon: logoUrl,
      apple: logoUrl,
    },
    openGraph: {
      title: siteTitle,
      description: "A minimalist e-commerce experience inspired by Uniqlo",
      images: [logoUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: "A minimalist e-commerce experience inspired by Uniqlo",
      images: [logoUrl],
    }
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();
  const settings = await getSiteSettings();
  const categories = await getCategories();

  let logoUrl = "/file.svg";
  if (settings.logo_path) {
    if (settings.logo_path.startsWith('http')) {
      logoUrl = settings.logo_path;
    } else {
      const { data } = supabase.storage.from('logos').getPublicUrl(settings.logo_path);
      logoUrl = data.publicUrl;
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning={true}
      >
        <Header logoUrl={logoUrl} categories={categories} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster />
        <InstagramChatBubble instagramUsername="hoi.vintage" />
      </body>
    </html>
  );
}
