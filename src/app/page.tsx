export const dynamic = 'force-dynamic';

// Using server components for data fetching
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import HeroCarousel from '@/components/HeroCarousel'
import { unstable_noStore as noStore } from 'next/cache';

// #region --- Data Types ---
interface Product {
  id: string
  name: string
  price_usd: number
  price_vnd: number
  discount_type?: 'percentage' | 'fixed' | null
  discount_value?: number | null
  product_images: { image_url: string }[]
}

interface HomeSection {
  id: string
  title: string
  category_slug: string
}

interface HomeSectionWithProducts extends HomeSection {
  products: Product[]
}
// #endregion

// #region --- Data Fetching ---
async function getPageData() {
  noStore(); // Ensure data is fetched on each request
  
  // Fetch site settings and home sections in parallel
  const [settingsRes, sectionsRes] = await Promise.all([
    supabase.from('site_settings').select('key, value'),
    supabase.from('home_sections').select('*').eq('is_active', true).order('display_order')
  ]);

  if (settingsRes.error) throw new Error(`Failed to fetch site settings: ${settingsRes.error.message}`);
  if (sectionsRes.error) throw new Error(`Failed to fetch home sections: ${sectionsRes.error.message}`);

  const settingsData = settingsRes.data || [];
  const homeSections = sectionsRes.data || [];

  const settings = settingsData.reduce((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, any>);

  console.log("DEBUG SETTINGS:", settings);

  let heroBanners: string[] = [];
  const bannersSource = settings.hero_banners;

  if (bannersSource) {
    try {
      // The value could be a JSON string '["url1", "url2"]' or already a proper array
      if (typeof bannersSource === 'string' && bannersSource.startsWith('[')) {
        const parsed = JSON.parse(bannersSource);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          heroBanners = parsed;
        }
      } else if (Array.isArray(bannersSource) && bannersSource.every(item => typeof item === 'string')) {
        heroBanners = bannersSource;
      }
    } catch (error) {
      console.error("Failed to parse 'hero_banners' from settings:", error);
      heroBanners = []; // Fallback to empty array on parsing error
    }
  }
  
  // For each section, fetch the 4 latest products matching its category slug
  const sectionsWithProducts: HomeSectionWithProducts[] = await Promise.all(
    homeSections.map(async (section) => {
      let query = supabase
        .from('products')
        .select(`
          id, 
          name, 
          price_usd, 
          price_vnd, 
          discount_type,
          discount_value,
          product_images (image_url, display_order)
        `)
        .order('created_at', { ascending: false })
        .limit(4);
      
      // Filter by category unless slug is 'all'
      if (section.category_slug !== 'all') {
        const { data: category, error: catError } = await supabase.from('categories').select('id').eq('slug', section.category_slug).single();
        if (catError || !category) {
            console.warn(`Category with slug "${section.category_slug}" not found.`);
            return { ...section, products: [] };
        }
        query = query.eq('category_id', category.id);
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) {
        console.error(`Failed to fetch products for section "${section.title}":`, productsError.message);
        return { ...section, products: [] };
      }

      // Sort images client-side
      const products = productsData.map(p => ({
        ...p,
        product_images: p.product_images.sort((a,b) => a.display_order - b.display_order)
      }))

      return { ...section, products };
    })
  );

  return {
    bannerText: settings.home_banner_text || 'LifeWear Collection',
    heroBanners: heroBanners,
    sections: sectionsWithProducts,
  };
}
// #endregion

// #region --- Child Components ---

// Product Section (Server Component)
function HomepageSection({ section }: { section: HomeSectionWithProducts }) {
  if (section.products.length === 0) {
    return null; // Don't render empty sections
  }

  return (
    <section id={section.category_slug} className="container mx-auto px-4 py-16 scroll-mt-16">
      <h2 className="text-3xl font-bold text-[#333333] mb-8 text-center">{section.title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {section.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
// #endregion

// #region --- Main Page Component ---
export default async function Home() {
  let data;
  try {
    data = await getPageData();
  } catch (error: any) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-lg">
            <h2 className="text-2xl font-bold text-red-700">Failed to load page data</h2>
            <p className="text-red-600 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const { bannerText, heroBanners, sections } = data;

  return (
    <main className="w-full">
      <HeroCarousel banners={heroBanners} bannerText={bannerText} />

      <div id="sections">
        {sections.length > 0 ? (
          sections.map((section) => (
            <HomepageSection key={section.id} section={section} />
          ))
        ) : (
          <div className="container mx-auto px-4 py-24 text-center">
            <p className="text-gray-600">No product sections have been configured yet.</p>
            <p className="text-sm text-gray-500 mt-2">Admins can add sections in the Site Management page.</p>
          </div>
        )}
      </div>
    </main>
  );
}
// #endregion
