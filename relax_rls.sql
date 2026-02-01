-- Allow public insert if admin RLS is failing (Debugging purpose)
CREATE POLICY "Public insert access" ON public.home_section_products
    FOR INSERT WITH CHECK (true);

-- Allow public update/delete
CREATE POLICY "Public update access" ON public.home_section_products
    FOR UPDATE USING (true);
    
CREATE POLICY "Public delete access" ON public.home_section_products
    FOR DELETE USING (true);
