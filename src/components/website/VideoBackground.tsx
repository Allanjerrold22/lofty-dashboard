"use client";

import { useEffect, useRef } from "react";

/**
 * VideoBackground
 * ----------------
 * Looping background video with a custom JS-driven (no CSS transition)
 * fade system, exactly matching the spec:
 *
 *  - 250 ms requestAnimationFrame fade-in on load / loop start
 *  - 250 ms fade-out when 0.55 s remain before video end
 *  - `fadingOutRef` boolean prevents re-triggering on repeated timeupdates
 *  - On `ended`: opacity → 0, 100 ms delay, currentTime = 0, play(), fade in
 *  - Each new fade cancels in-flight RAFs so animations never compete
 *  - Fades resume from the current opacity (no snap)
 */

const FADE_MS = 250;
const FADE_OUT_TRIGGER = 0.55; // seconds before end
const RESET_DELAY_MS = 100;

interface Props {
  src: string;
  poster?: string;
  className?: string;
}

export default function VideoBackground({ src, poster, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.style.opacity = "0";
    video.muted = true;
    video.playsInline = true;

    const cancelRaf = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const animateOpacity = (target: number, onDone?: () => void) => {
      cancelRaf();
      const start = performance.now();
      const from = parseFloat(video.style.opacity || "0");
      const delta = target - from;

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / FADE_MS);
        const next = from + delta * t;
        video.style.opacity = String(next);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          video.style.opacity = String(target);
          onDone?.();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const fadeIn = () => {
      fadingOutRef.current = false;
      animateOpacity(1);
    };

    const fadeOut = (onDone?: () => void) => {
      if (fadingOutRef.current) return;
      fadingOutRef.current = true;
      animateOpacity(0, onDone);
    };

    const handleLoaded = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch(() => {
          // Autoplay can be blocked; opacity stays 0 until user interaction.
        });
      }
      fadeIn();
    };

    const handleTimeUpdate = () => {
      if (!isFinite(video.duration)) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= FADE_OUT_TRIGGER && !fadingOutRef.current) {
        fadeOut();
      }
    };

    const handleEnded = () => {
      cancelRaf();
      video.style.opacity = "0";
      window.setTimeout(() => {
        try {
          video.currentTime = 0;
          const p = video.play();
          if (p && typeof p.then === "function") {
            p.then(fadeIn).catch(fadeIn);
          } else {
            fadeIn();
          }
        } catch {
          fadeIn();
        }
      }, RESET_DELAY_MS);
    };

    const handlePlay = () => {
      // Re-arm fade-in when playback (re)starts — covers loop edge cases.
      if (parseFloat(video.style.opacity || "0") < 1 && !fadingOutRef.current) {
        fadeIn();
      }
    };

    video.addEventListener("loadeddata", handleLoaded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);

    return () => {
      cancelRaf();
      video.removeEventListener("loadeddata", handleLoaded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
    };
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        playsInline
        preload="auto"
        className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top"
        style={{
          width: "115%",
          height: "115%",
          opacity: 0,
        }}
      />
    </div>
  );
}
