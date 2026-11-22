"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { everieHeroSlides as heroSlides } from "@/data/everieData";

export default function HeroSlider() {
  const [slides, setSlides] = useState(heroSlides);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetch("/api/hero-slides")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setSlides(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section
      className="relative w-full overflow-hidden bg-neutral-100 aspect-[712/1060] sm:aspect-[16/10] md:aspect-[1440/949] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="EVERIE Hero Banner"
    >
      {/* Slides Container */}
      {slides.map((slide, index) => {
        const isActive = index === current;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* The whole banner is an interactive link, exactly as on hanoia.com */}
            <Link
              href={slide.link}
              className="block w-full h-full relative cursor-pointer group focus:outline-hidden"
              aria-label={`Khám phá ${slide.title}`}
            >
              {/* Desktop Banner Image */}
              <div className="hidden md:block absolute inset-0 w-full h-full">
                <Image
                  src={slide.desktopImage}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="object-cover object-center w-full h-full transition-transform duration-7000 ease-out group-hover:scale-[1.01]"
                  sizes="(min-width: 768px) 100vw, 1px"
                />
              </div>

              {/* Mobile Banner Image */}
              <div className="block md:hidden absolute inset-0 w-full h-full">
                <Image
                  src={slide.mobileImage}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="object-cover object-center w-full h-full"
                  sizes="(max-width: 767px) 100vw, 1px"
                />
              </div>
              <div className="absolute inset-0 bg-black/25" />
              <div className="absolute bottom-16 md:bottom-24 left-6 md:left-16 right-6 z-10 max-w-xl text-white">
                <p className="font-serif text-2xl md:text-5xl tracking-wide uppercase leading-tight">
                  {slide.title}
                </p>
                {slide.subtitle && (
                  <p className="mt-3 text-sm md:text-base font-light tracking-wide text-white/90">
                    {slide.subtitle}
                  </p>
                )}
              </div>
            </Link>
          </div>
        );
      })}

      {/* Navigation Arrow Controls (With stopPropagation so clicks don't navigate the banner link) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          prevSlide();
        }}
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/70 hover:bg-white text-black shadow-md flex items-center justify-center transition-all opacity-70 hover:opacity-100 focus:outline-hidden cursor-pointer"
        aria-label="Banner trước"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/70 hover:bg-white text-black shadow-md flex items-center justify-center transition-all opacity-70 hover:opacity-100 focus:outline-hidden cursor-pointer"
        aria-label="Banner kế tiếp"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-4 md:bottom-6 left-0 right-0 z-20 flex justify-center items-center space-x-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrent(i);
            }}
            className={`transition-all duration-300 rounded-full focus:outline-hidden cursor-pointer ${
              i === current
                ? "w-8 h-2 bg-white shadow-md"
                : "w-2 h-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Chuyển đến banner ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
