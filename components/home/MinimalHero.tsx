"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const HERO_VIDEO_HTML = `
  <video
    class="absolute inset-0 h-full w-full object-cover pointer-events-none"
    autoplay
    muted
    loop
    playsinline
    webkit-playsinline
    preload="auto"
    poster="/videos/hero-poster.jpg"
    disablepictureinpicture
    disableremoteplayback
    aria-hidden="true"
    tabindex="-1"
  >
    <source src="/videos/hero.mp4" type="video/mp4" />
    <source src="/videos/hero.webm" type="video/webm" />
  </video>
`;

export default function MinimalHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = containerRef.current?.querySelector("video");
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

    const onPageShow = () => {
      tryPlay();
    };

    const onFirstInteraction = () => {
      tryPlay();
      window.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("click", onFirstInteraction);
    };

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("touchstart", onFirstInteraction, { passive: true });
    window.addEventListener("pointerdown", onFirstInteraction, { passive: true });
    window.addEventListener("click", onFirstInteraction, { passive: true });

    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("click", onFirstInteraction);
    };
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden bg-[#0b1a2a] bg-cover bg-center"
      style={{ backgroundImage: "url(/videos/hero-poster.jpg)" }}
      aria-label="Halisi Gifts featured collection"
    >
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: HERO_VIDEO_HTML }}
      />

      <div
        className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/55"
        aria-hidden="true"
      />

      <div className="relative max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop min-h-[340px] sm:min-h-[440px] md:min-h-[520px] flex items-end justify-center text-center pt-12 pb-6 sm:pb-8 md:pb-10">
        <Link
          href="#shop"
          className="inline-flex items-center gap-2 rounded-full bg-white text-black text-xs uppercase tracking-[0.15em] font-semibold px-7 py-3.5 hover:bg-gold hover:text-white active:scale-[0.98] transition-all shadow-lg"
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
