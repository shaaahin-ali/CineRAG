"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ImageProps } from "next/image";
import { ArrowLeft, ArrowRight, Quote, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Types and Interfaces =====
export interface iTestimonial {
  name: string;
  designation: string;
  description: string;
  profileImage: string;
}

interface iCarouselProps {
  items: React.ReactElement<{
    testimonial: iTestimonial;
    index: number;
    layout?: boolean;
    onCardClose: () => void;
  }>[];
  initialScroll?: number;
}

// ===== Custom Hooks =====
const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement | null>,
  onOutsideClick: () => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      onOutsideClick();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [ref, onOutsideClick]);
};

// ===== Carousel Component =====
const Carousel = ({ items, initialScroll = 0 }: iCarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = typeof window !== "undefined" && window.innerWidth < 768 ? 230 : 384;
      const gap = typeof window !== "undefined" && window.innerWidth < 768 ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  return (
    <div className="relative w-full mt-10">
      <div
        className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth [scrollbar-width:none] py-5"
        ref={carouselRef}
        onScroll={checkScrollability}
      >
        <div className={cn("flex flex-row justify-start gap-4 pl-3", "max-w-5xl mx-auto")}>
          {items.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 * index, ease: "easeOut" } }}
              key={`card-${index}`}
              className="last:pr-[5%] md:last:pr-[33%] rounded-3xl"
            >
              {React.cloneElement(item, {
                onCardClose: () => handleCardClose(index),
              })}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4 pr-4">
        <button
          className="relative z-40 h-10 w-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-zinc-700 transition-colors duration-200"
          onClick={handleScrollLeft}
          disabled={!canScrollLeft}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <button
          className="relative z-40 h-10 w-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-zinc-700 transition-colors duration-200"
          onClick={handleScrollRight}
          disabled={!canScrollRight}
        >
          <ArrowRight className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
};

// ===== TestimonialCard Component =====
const TestimonialCard = ({
  testimonial,
  index,
  layout = false,
  onCardClose = () => {},
  backgroundImage = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
}: {
  testimonial: iTestimonial;
  index: number;
  layout?: boolean;
  onCardClose?: () => void;
  backgroundImage?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExpand = () => setIsExpanded(true);
  const handleCollapse = () => {
    setIsExpanded(false);
    onCardClose();
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleCollapse();
    };
    if (isExpanded) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo({ top: scrollY, behavior: "instant" });
    }
    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [isExpanded]);

  useOutsideClick(containerRef, handleCollapse);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 h-screen overflow-hidden z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-black/70 backdrop-blur-lg h-full w-full fixed inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              ref={containerRef}
              layoutId={layout ? `card-${testimonial.name}` : undefined}
              className="max-w-2xl mx-auto bg-zinc-900 border border-white/10 h-auto z-[60] p-8 md:p-12 rounded-3xl relative mt-20"
            >
              <button
                className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center bg-zinc-800 border border-white/10 hover:bg-zinc-700 transition-colors"
                onClick={handleCollapse}
              >
                <X className="h-4 w-4 text-white" />
              </button>
              <p className="text-amber-400 text-sm uppercase tracking-widest mb-2">
                {testimonial.designation}
              </p>
              <p className="text-2xl font-bold text-white mb-6">{testimonial.name}</p>
              <div className="text-zinc-300 text-lg leading-relaxed">
                <Quote className="h-5 w-5 text-amber-400 mb-3" />
                {testimonial.description}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        layoutId={layout ? `card-${testimonial.name}` : undefined}
        onClick={handleExpand}
        whileHover={{ rotate: 1.5, scale: 1.02, transition: { duration: 0.3, ease: "easeOut" } }}
        className="text-left"
      >
        <div className="rounded-3xl bg-zinc-900 border border-white/8 h-[500px] md:h-[550px] w-72 md:w-80 overflow-hidden flex flex-col items-center justify-center relative shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          {/* Subtle background image */}
          <div className="absolute inset-0 opacity-10">
            <Image
              src={backgroundImage}
              alt=""
              fill
              className="object-cover grayscale"
            />
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/20 via-zinc-900/60 to-zinc-900" />

          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            <ProfileImage src={testimonial.profileImage} alt={testimonial.name} />
            <p className="text-white/90 text-base md:text-lg font-light mt-5 leading-relaxed">
              {testimonial.description.length > 120
                ? `"${testimonial.description.slice(0, 120)}..."`
                : `"${testimonial.description}"`}
            </p>
            <p className="text-amber-400 text-sm font-semibold mt-5">{testimonial.name}</p>
            <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">
              {testimonial.designation.length > 28
                ? `${testimonial.designation.slice(0, 28)}...`
                : testimonial.designation}
            </p>
          </div>
        </div>
      </motion.button>
    </>
  );
};

// ===== ProfileImage Component =====
const ProfileImage = ({ src, alt, ...rest }: ImageProps) => {
  const [isLoading, setLoading] = useState(true);
  return (
    <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] overflow-hidden rounded-full border-2 border-amber-400/40 ring-2 ring-white/5 relative flex-shrink-0">
      <Image
        className={cn(
          "transition duration-300 object-cover",
          isLoading ? "blur-sm scale-105" : "blur-0 scale-100",
        )}
        onLoad={() => setLoading(false)}
        src={src}
        fill
        loading="lazy"
        alt={alt || "Profile image"}
        {...rest}
      />
    </div>
  );
};

export { Carousel, TestimonialCard, ProfileImage };
