"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function MinimalHero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const tryPlay = () => {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      }
    };

    tryPlay();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tryPlay();
      }
    };

    const onFirstInteraction = () => {
      tryPlay();
      window.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("click", onFirstInteraction);
    };

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("touchstart", onFirstInteraction, { passive: true });
    window.addEventListener("click", onFirstInteraction, { passive: true });

    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("click", onFirstInteraction);
    };
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden bg-[#0b1a2a] bg-cover bg-center"
      style={{ backgroundImage: "url(/videos/hero-poster.jpg)" }}
      aria-label="Halisi Gifts featured collection"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden pointer-events-none"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/videos/hero-poster.jpg"
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
        <source src="/videos/hero.webm" type="video/webm" />
      </video>

      <div
        className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/55"
        aria-hidden="true"
      />

      <div className="relative max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop min-h-[340px] sm:min-h-[440px] md:min-h-[520px] flex items-center justify-center text-center py-12 sm:py-16">
        <Link
          href="#shop"
          className="inline-flex items-center gap-2 rounded-full bg-white text-black text-xs uppercase tracking-[0.15em] font-semibold px-7 py-3.5 hover:bg-gold hover:text-white active:scale-[0.98] transition-all"
        >
          Shop the collection
          <span className="material-symbols-outlined text-base" aria-hidden>
            arrow_downward
          </span>
        </Link>
      </div>
    </section>
  );
}
