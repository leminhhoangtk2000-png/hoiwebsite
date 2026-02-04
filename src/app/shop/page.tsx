import { createServerSupabaseClient } from '@/lib/supabase-server';
import ShopClient from './ShopClient';
import { ShopProduct } from '@/components/shop/ProductCard';

export const dynamic = 'force-dynamic';

// Helper to translate Vietnamese colors to English
function translateColor(vnColor: string): string {
    const lower = vnColor.toLowerCase().trim();
    const map: Record<string, string> = {
        'trắng': 'White', 'đen': 'Black', 'đỏ': 'Red', 'xanh dương': 'Blue', 'xanh': 'Blue',
        'xanh lá': 'Green', 'vàng': 'Yellow', 'cam': 'Orange', 'tím': 'Purple', 'hồng': 'Pink',
        'nâu': 'Brown', 'xám': 'Gray', 'ghi': 'Gray', 'be': 'Beige', 'kem': 'Cream',
        'bạc': 'Silver', 'đồng': 'Bronze', 'xanh rêu': 'Olive', 'xanh ngọc': 'Teal',
        'đỏ đô': 'Maroon', 'cam đất': 'Terracotta', 'hồng phấn': 'Baby Pink', 'xanh than': 'Navy',
        'than': 'Charcoal', 'nude': 'Nude', 'kẻ': 'Striped', 'họa tiết': 'Patterned'
    };

    // Check direct map
    if (map[lower]) return map[lower];

    // Check partials if strict map fails
    if (lower.includes('trắng')) return 'White';
    if (lower.includes('đen')) return 'Black';
    if (lower.includes('đỏ')) return 'Red';
    if (lower.includes('xanh dương')) return 'Blue';
    if (lower.includes('xanh lá')) return 'Green';
    if (lower.includes('vàng')) return 'Yellow';
    if (lower.includes('hồng')) return 'Pink';
    if (lower.includes('nâu')) return 'Brown';
    if (lower.includes('xám')) return 'Gray';

    // Capitalize first letter if no match found
    return vnColor.charAt(0).toUpperCase() + vnColor.slice(1);
}

// Helper to shorten product name to [Style] + [Material] + [Category]
function shortenProductName(name: string): string {
    const lower = name.toLowerCase();

    // --- Dictionaries ---
    const categories = [
        { key: 'chân váy', label: 'Skirt' },
        { key: 'váy', label: 'Dress' }, // Váy can be Skirt or Dress, context usually implies Dress if not "Chân váy"
        { key: 'đầm', label: 'Dress' },
        { key: 'dress', label: 'Dress' },
        { key: 'skirt', label: 'Skirt' },
        { key: 'sơ mi', label: 'Shirt' },
        { key: 'shirt', label: 'Shirt' },
        { key: 'áo phông', label: 'T-Shirt' },
        { key: 'áo thun', label: 'T-Shirt' },
        { key: 't-shirt', label: 'T-Shirt' },
        { key: 'blouse', label: 'Blouse' },
        { key: 'áo kiểu', label: 'Blouse' },
        { key: 'áo', label: 'Top' },
        { key: 'top', label: 'Top' },
        { key: 'blazer', label: 'Blazer' },
        { key: 'vest', label: 'Vest' },
        { key: 'coat', label: 'Coat' },
        { key: 'jacket', label: 'Jacket' },
        { key: 'khoác', label: 'Coat' },
        { key: 'quần tây', label: 'Trousers' },
        { key: 'trousers', label: 'Trousers' },
        { key: 'pants', label: 'Pants' },
        { key: 'quần', label: 'Pants' },
        { key: 'jeans', label: 'Jeans' },
        { key: 'bò', label: 'Jeans' },
        { key: 'denim', label: 'Jeans' },
        { key: 'short', label: 'Shorts' },
        { key: 'đùi', label: 'Shorts' },
        { key: 'gile', label: 'Gile' },
        { key: 'yếm', label: 'Overalls' },
        { key: 'jumpsuit', label: 'Jumpsuit' },
        { key: 'set', label: 'Set' },
        { key: 'bộ', label: 'Set' }
    ];

    const materials = [
        { key: 'linen', label: 'Linen' },
        { key: 'lanh', label: 'Linen' },
        { key: 'silk', label: 'Silk' },
        { key: 'lụa', label: 'Silk' },
        { key: 'tơ', label: 'Silk' },
        { key: 'cotton', label: 'Cotton' },
        { key: 'thô', label: 'Cotton' },
        { key: 'velvet', label: 'Velvet' },
        { key: 'nhung', label: 'Velvet' },
        { key: 'wool', label: 'Wool' },
        { key: 'len', label: 'Wool' },
        { key: 'kaki', label: 'Khaki' },
        { key: 'khaki', label: 'Khaki' },
        { key: 'kate', label: 'Kate' },
        { key: 'cate', label: 'Kate' },
        { key: 'lace', label: 'Lace' },
        { key: 'ren', label: 'Lace' },
        { key: 'voan', label: 'Chiffon' },
        { key: 'chiffon', label: 'Chiffon' },
        { key: 'tweed', label: 'Tweed' },
        { key: 'dạ', label: 'Tweed' },
        { key: 'gấm', label: 'Brocade' },
        { key: 'tafta', label: 'Taffeta' },
        { key: 'da', label: 'Leather' },
        { key: 'satin', label: 'Satin' },
        { key: 'thun', label: 'Jersey' }
    ];

    const styles = [
        { key: 'vintage', label: 'Vintage' },
        { key: 'boho', label: 'Boho' },
        { key: 'retro', label: 'Retro' },
        { key: 'thêu', label: 'Embroidered' },
        { key: 'embroidered', label: 'Embroidered' },
        { key: 'in', label: 'Printed' },
        { key: 'printed', label: 'Printed' },
        { key: 'x xếp ly', label: 'Pleated' },
        { key: 'pleated', label: 'Pleated' },
        { key: 'bèo', label: 'Ruffled' },
        { key: 'ruffle', label: 'Ruffled' },
        { key: 'tay dài', label: 'Long Sleeve' },
        { key: 'tay ngắn', label: 'Short Sleeve' },
        { key: 'sát nách', label: 'Sleeveless' },
        { key: 'crop', label: 'Crop' },
        { key: 'lửng', label: 'Crop' },
        { key: 'oversize', label: 'Oversized' },
        { key: 'rộng', label: 'Oversized' },
        { key: 'ôm', label: 'Slim' },
        { key: 'body', label: 'Bodycon' },
        { key: 'suông', label: 'Straight' },
        { key: 'xòe', label: 'Flared' },
        { key: 'chữ a', label: 'A-Line' },
        { key: 'maxi', label: 'Maxi' },
        { key: 'midi', label: 'Midi' },
        { key: 'mini', label: 'Mini' },
        { key: 'ulzzang', label: 'Ulzzang' },
        { key: 'korean', label: 'Korean' },
        { key: 'basic', label: 'Basic' },
        { key: 'casual', label: 'Casual' },
        { key: 'classic', label: 'Classic' },
        { key: 'modern', label: 'Modern' },
        { key: 'chic', label: 'Chic' },
        { key: 'công sở', label: 'Office' },
        { key: 'party', label: 'Party' },
        { key: 'tiệc', label: 'Party' },
        { key: 'thiết kế', label: 'Designer' },
        { key: 'handmade', label: 'Handmade' }
    ];

    // --- Detection ---
    const foundCategory = categories.find(c => lower.includes(c.key));
    const foundMaterial = materials.find(m => lower.includes(m.key));
    const foundStyle = styles.find(s => lower.includes(s.key));

    // --- Construction: [Style] + [Material] + [Category] ---
    if (foundCategory) {
        const parts = [];
        if (foundStyle) parts.push(foundStyle.label);
        if (foundMaterial) parts.push(foundMaterial.label);
        parts.push(foundCategory.label);

        return parts.join(' ');
    }

    // Fallback: Truncate to 4 words if no category found
    const words = name.split(/\s+/);
    return words.slice(0, 4).join(' ');
}

export default async function ShopPage() {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch Products
    const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
      id,
      name,
      price_usd,
      price_vnd,
      stock,
      promotion_percent,
      sale_price_usd,
      sale_price_vnd,
      categories ( name ),
      product_images ( image_url, display_order ),
      product_variants ( name, product_variant_options ( value, image_url ) )
    `)
        .order('created_at', { ascending: false });

    if (productsError) {
        console.error("Error fetching products:", productsError);
        // Handle error gracefully or throw
    }

    // 2. Fetch Categories (only those that have products? or all? Let's fetch all for filter)
    const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('name')
        .order('name');

    if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
    }

    // 3. Transform Data
    const products: ShopProduct[] = (productsData || []).map((p: any) => {
        // Extract Variants
        const colorsMap = new Map<string, string | null>(); // English Name -> Image
        const sizes: Set<string> = new Set();

        if (p.product_variants) {
            p.product_variants.forEach((v: any) => {
                const vName = v.name.toLowerCase();

                // Broaden Color Detection
                const isColor =
                    vName.includes('color') ||
                    vName.includes('màu') ||
                    vName.includes('colour') ||
                    vName.includes('mau') ||
                    vName.includes('sắc') ||
                    vName.includes('shade') ||
                    vName.includes('kiểu') ||
                    vName.includes('loại');

                // Broaden Size Detection
                const isSize =
                    vName.includes('size') ||
                    vName.includes('kích') ||
                    vName.includes('cỡ') ||
                    vName.includes('dimension') ||
                    vName.includes('số');

                if (isColor && !isSize) {
                    v.product_variant_options?.forEach((opt: any) => {
                        const originalName = opt.value.trim();
                        const translatedName = translateColor(originalName); // Translate to English

                        // Store Map Key as English Name
                        if (!colorsMap.has(translatedName)) {
                            colorsMap.set(translatedName, opt.image_url || null);
                        } else if (opt.image_url && !colorsMap.get(translatedName)) {
                            colorsMap.set(translatedName, opt.image_url);
                        }
                    });
                }

                if (isSize) {
                    v.product_variant_options?.forEach((opt: any) => sizes.add(opt.value.trim()));
                }
            });
        }

        const colors = Array.from(colorsMap.entries()).map(([name, image]) => ({ name, image }));

        const productImages = (p.product_images || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((img: any) => img.image_url);

        // Ensure variant images are included in the images list so ProductCard can find them by index
        colors.forEach(c => {
            if (c.image && !productImages.includes(c.image)) {
                productImages.push(c.image);
            }
        });

        return {
            id: p.id,
            name: p.name,
            price_usd: p.price_usd,
            price_vnd: p.price_vnd,
            category_name: p.categories?.name || 'Uncategorized',
            stock: p.stock || 0,
            promotion_percent: p.promotion_percent,
            sale_price_usd: p.sale_price_usd,
            sale_price_vnd: p.sale_price_vnd,
            images: productImages,
            colors: colors,
            sizes: Array.from(sizes)
        };
    });

    const categories = (categoriesData || []).map((c: any) => c.name);

    return (
        <ShopClient
            initialProducts={products}
            categories={categories}
        />
    );
}
