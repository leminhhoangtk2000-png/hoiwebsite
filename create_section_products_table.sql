-- Create table for linking products to home sections
CREATE TABLE IF NOT EXISTS public.home_section_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID NOT NULL REFERENCES public.home_sections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(section_id, product_id)
);

-- Enable RLS
ALTER TABLE public.home_section_products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access" ON public.home_section_products
    FOR SELECT USING (true);

CREATE POLICY "Admin full access" ON public.home_section_products
    FOR ALL USING (auth.role() = 'authenticated'); -- Assuming authenticated users are admins for now, or refine if needed.

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_home_section_products_section_id ON public.home_section_products(section_id);
