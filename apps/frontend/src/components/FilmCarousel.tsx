"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const images = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1440407876336-54f4b23dfb01?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501426026826-31c667bdf23d?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop",
];

// Duplicate for seamless infinite loop
const loopImages = [...images, ...images];

export function FilmCarousel() {
  return (
    <div className="relative w-full overflow-hidden bg-black py-4 border-y border-white/20">

      {/* Top Film Sprocket Holes */}
      <div className="absolute top-1 left-0 w-full flex justify-between px-1 gap-2">
        {[...Array(60)].map((_, i) => (
          <div key={`top-${i}`} className="w-2 h-1.5 bg-white rounded-sm opacity-80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
        ))}
      </div>

      {/* Scrolling Film Strip */}
      <div className="relative mt-4 mb-4 flex items-center">
        <motion.div
          className="flex gap-2 px-2"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            ease: "linear",
            duration: 35,
            repeat: Infinity,
          }}
        >
          {loopImages.map((src, idx) => (
            <div
              key={idx}
              className="relative w-40 h-24 shrink-0 overflow-hidden rounded-sm border border-white/10"
            >
              <Image
                src={src}
                alt={`Film frame ${idx % images.length + 1}`}
                fill
                sizes="160px"
                className="object-cover grayscale contrast-125 brightness-90"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Film Sprocket Holes */}
      <div className="absolute bottom-2 left-0 w-full flex justify-between px-2 gap-4">
        {[...Array(40)].map((_, i) => (
          <div key={`bot-${i}`} className="w-4 h-3 bg-white rounded-sm opacity-80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
        ))}
      </div>

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" />
    </div>
  );
}
