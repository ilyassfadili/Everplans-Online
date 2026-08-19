"use client";

import { useEffect, useRef, useState } from "react";
import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
  /** Stagger, in ms - pass `index * 60` (or similar) for items in a list. */
  delay?: number;
  className?: string;
}

/**
 * A one-shot, below-the-fold "fade + rise into place" for content the user
 * scrolls to - the section entrances, staggered card reveals, etc. the
 * motion brief asks for. Deliberately not used for anything already in the
 * initial viewport (hero content uses the plain CSS `.animate-hero-in`
 * keyframe instead, in globals.css) - IntersectionObserver's first
 * callback firing "already in view" on mount would otherwise show a
 * flash of hidden content before revealing it right back.
 *
 * Server-rendered/no-JS markup is fully visible by default (`ready` starts
 * false) - only once this mounts and can actually observe the viewport
 * does it opt into the hidden-until-scrolled-to state. Unobserves itself
 * after the first reveal: this scrolls content into place once, it isn't
 * a repeating scroll-jack effect.
 */
export function Reveal({ as: Tag = "div", children, delay = 0, className, style, ...props }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    setReady(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-standard motion-reduce:transition-none",
        ready && !visible ? "opacity-0 translate-y-3.5" : "opacity-100 translate-y-0",
        className,
      )}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
      {...props}
    >
      {children}
    </Tag>
  );
}
