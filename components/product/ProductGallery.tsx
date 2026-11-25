"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [selectedImage, setSelectedImage] = useState(images[0] || "");

  const displayImages = images.length > 0 ? images : ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"];

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full aspect-square bg-black/5 rounded-xl overflow-hidden relative border border-black/10">
        <Image
          src={selectedImage || displayImages[0]}
          alt={title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {displayImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(img)}
              className={`relative w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                selectedImage === img ? "border-gold scale-105" : "border-black/10 opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`${title} thumb ${idx}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
