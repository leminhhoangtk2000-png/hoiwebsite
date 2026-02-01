'use client'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'

// Define the structure of a slide based on the database table
interface Slide {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string; // We will construct the full URL
  cta_link: string | null;
  cta_text: string | null;
}

export default function HeroCarousel() {
  const supabase = createClient()
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoading(true);
        // Fetch slides from the database, ordered by display_order
        const { data: slideData, error: dbError } = await supabase
          .from('hero_carousel_slides')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (dbError) {
          throw new Error(`Supabase error: ${dbError.message}`);
        }

        if (!slideData) {
          setSlides([]);
          return;
        }

        // Create public URLs for images and map to the Slide interface
        const slidesWithImageUrls = slideData.map(slide => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('hero-banners')
            .getPublicUrl(slide.image_path);

          return {
            id: slide.id,
            title: slide.title,
            subtitle: slide.subtitle,
            image_url: publicUrl,
            cta_link: slide.cta_link,
            cta_text: slide.cta_text,
          };
        });

        setSlides(slidesWithImageUrls);
      } catch (err: any) {
        console.error("Error fetching hero slides:", err);
        setError('Failed to load banner content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  const resetAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (slides.length > 1) {
      intervalRef.current = setInterval(nextSlide, 5000);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  }

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-gray-200 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || slides.length === 0) {
    return (
      <div className="w-full h-[600px] bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-[#333333] mb-6">
            {error ? 'An Error Occurred' : 'Welcome'}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {error || 'Discover the latest trends and styles available in our store.'}
          </p>
          <Link href="/products">
            <Button size="lg" className="bg-[#333333] text-white hover:bg-[#555555] px-8 py-6 text-lg">SHOP NOW</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <section className="relative w-full h-[600px] overflow-hidden group">
      {/* Slides container */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="relative h-full w-full flex-shrink-0">
            <Image
              src={slide.image_url}
              alt={slide.title}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ))}
      </div>

      {/* Centered Text Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-10 p-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-down">{currentSlide.title}</h1>
        {currentSlide.subtitle && <p className="text-xl mb-8 max-w-2xl mx-auto animate-fade-in-up">{currentSlide.subtitle}</p>}
        {currentSlide.cta_link && currentSlide.cta_text && (
          <Link href={currentSlide.cta_link}>
            <Button size="lg" className="bg-white text-[#333333] hover:bg-gray-100 px-8 py-6 text-lg">
              {currentSlide.cta_text}
            </Button>
          </Link>
        )}
      </div>

      {/* Navigation Buttons */}
      {slides.length > 1 && (
        <>
          <Button
            onClick={() => { prevSlide(); resetAutoplay(); }}
            size="icon"
            variant="ghost"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/20 hover:bg-black/40 hover:text-white"
          >
            <ChevronLeft />
          </Button>
          <Button
            onClick={() => { nextSlide(); resetAutoplay(); }}
            size="icon"
            variant="ghost"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/20 hover:bg-black/40 hover:text-white"
          >
            <ChevronRight />
          </Button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { goToSlide(i); resetAutoplay(); }}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${currentIndex === i ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}