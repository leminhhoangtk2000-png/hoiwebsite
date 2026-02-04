export const dynamic = 'force-dynamic';

// Using server components for data fetching
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Hero from '@/components/home/Hero'
import CollectionGrid from '@/components/home/CollectionGrid'
import StoryBlock from '@/components/home/StoryBlock'
import SectionProductFeed from '@/components/home/SectionProductFeed'
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
  const supabase = await createServerSupabaseClient();

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

  // For each section, fetch the 50 latest products matching its category slug
  const sectionsWithProducts: HomeSectionWithProducts[] = await Promise.all(
    homeSections.map(async (section) => {
      // 1. Try to fetch manually pinned products for this section
      const { data: pinnedProducts, error: pinnedError } = await supabase
        .from('home_section_products')
        .select(`
          display_order,
          products (
            id, 
            name, 
            price_usd, 
            price_vnd, 
            discount_type,
            discount_value,
            product_images (image_url, display_order)
          )
        `)
        .eq('section_id', section.id)
        .order('display_order', { ascending: true });

      if (!pinnedError && pinnedProducts && pinnedProducts.length > 0) {
        // If we have pinned products, use them
        const products = pinnedProducts
          .map((item: any) => item.products)
          .filter((p: any) => p !== null) // Filter out any nulls if join failed
          .map((p: any) => ({
            ...p,
            product_images: (p.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order)
          }));

        return { ...section, products };
      }

      // 2. Fallback: Fetch by Category Slug (Original Logic)
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
        .limit(50);

      // Filter by category unless slug is 'all'
      if (section.category_slug !== 'all') {
        const { data: category, error: catError } = await supabase.from('categories').select('id').eq('slug', section.category_slug).single();

        if (catError || !category) {
          console.warn(`Category with slug "${section.category_slug}" not found.`);
          return { ...section, products: [] };
        }

        // Fetch subcategories
        const { data: subCats } = await supabase.from('categories').select('id').eq('parent_id', category.id);
        const categoryIds = [category.id, ...(subCats?.map(c => c.id) || [])];

        // Use 'in' filter for category_id
        query = query.in('category_id', categoryIds);
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) {
        console.error(`Failed to fetch products for section "${section.title}":`, productsError.message);
        return { ...section, products: [] };
      }

      // Sort images client-side
      const products = productsData.map(p => ({
        ...p,
        // Safe access in case product_images is null
        product_images: (p.product_images || []).sort((a, b) => a.display_order - b.display_order)
      }))

      return { ...section, products };
    })
  );

  return {
    heroBanners: heroBanners,
    sections: sectionsWithProducts,
  };
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

  const { heroBanners, sections } = data;

  return (
    <main className="w-full bg-[#FFFDF5] min-h-screen">
      <Hero banners={heroBanners} />

      <CollectionGrid />

      <StoryBlock />

      <div id="sections">
        {sections.length > 0 ? (
          sections.map((section) => (
            <SectionProductFeed
              key={section.id}
              title={section.title}
              products={section.products}
            />
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
