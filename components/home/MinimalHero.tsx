"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const HERO_VIDEO_HTML = `
  <video
    src="/videos/hero.mp4"
    class="absolute inset-0 h-full w-full object-cover pointer-events-none"
    autoplay
    muted
    loop
    playsinline
    webkit-playsinline="true"
    x-webkit-airplay="deny"
    preload="auto"
    poster="/videos/hero-poster.jpg"
    disablepictureinpicture
    disableremoteplayback
    aria-hidden="true"
    tabindex="-1"
  ></video>
`;

export default function MinimalHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = containerRef.current?.querySelector("video");
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "true");

    let unlocked = false;

    const removeGestureListeners = () => {
      if (unlocked) return;
      unlocked = true;
      window.removeEventListener("touchstart", onUserGesture);
      window.removeEventListener("touchend", onUserGesture);
      window.removeEventListener("pointerdown", onUserGesture);
      window.removeEventListener("click", onUserGesture);
    };

    const tryPlay = () => {
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;

      if (video.readyState === 0) {
        try {
          video.load();
        } catch {
          // Ignore load errors
        }
      }

      if (video.paused) {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise
            .then(() => {
              if (!video.paused) {
                removeGestureListeners();
              }
            })
            .catch(() => {});
        }
      } else {
        removeGestureListeners();
      }
    };

    const onUserGesture = () => {
      tryPlay();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tryPlay();
      }
    };

    const onPageShow = () => {
      tryPlay();
    };

    const onSuspend = () => {
      if (video.paused) {
        tryPlay();
      }
    };

    tryPlay();

    const retryTimer = window.setTimeout(tryPlay, 350);

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    video.addEventListener("canplaythrough", tryPlay);
    video.addEventListener("suspend", onSuspend);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("touchstart", onUserGesture, { passive: true });
    window.addEventListener("touchend", onUserGesture, { passive: true });
    window.addEventListener("pointerdown", onUserGesture, { passive: true });
    window.addEventListener("click", onUserGesture, { passive: true });

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            tryPlay();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(video);
    }

    return () => {
      window.clearTimeout(retryTimer);
      observer?.disconnect();
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      video.removeEventListener("canplaythrough", tryPlay);
      video.removeEventListener("suspend", onSuspend);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
      removeGestureListeners();
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
