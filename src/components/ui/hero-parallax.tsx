"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export interface ParallaxProduct {
  title: string;
  link: string;
  thumbnail: string;
}

const SPRING = { stiffness: 300, damping: 30 };

/**
 * Adapted from Aceternity's Hero Parallax for the catalogue. It is a feature band, not a second hero: two rows, a
 * modest height, real catalogue artwork only. Below `md` and under reduced motion the 3D scroll effect is replaced by
 * a plain static grid, so phones and low-motion users get no transforms at all.
 */
export function HeroParallax({ products, heading, description, children }: { products: ParallaxProduct[]; heading: string; description?: string; children?: React.ReactNode }) {
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 768px)");
  const header = (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 md:py-16">
      <h2 className="text-balance text-2xl font-bold text-ws-text md:text-5xl">{heading}</h2>
      {description && <p className="mt-3 max-w-2xl text-base text-ws-text-2 md:text-lg">{description}</p>}
      {children && <div className="mt-5 flex flex-wrap gap-3">{children}</div>}
    </div>
  );
  if (products.length === 0) return null;
  if (reduced || !wide) {
    return (
      <section aria-label={heading} className="relative overflow-hidden">
        {header}
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 pb-10 sm:px-8 md:grid-cols-4">
          {products.slice(0, 8).map((p) => <li key={p.link}><Tile product={p} className="aspect-video w-full" /></li>)}
        </ul>
      </section>
    );
  }
  return <ParallaxBand products={products} header={header} label={heading} />;
}

function ParallaxBand({ products, header, label }: { products: ParallaxProduct[]; header: React.ReactNode; label: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [-160, 160]), SPRING);
  const xReverse = useSpring(useTransform(scrollYProgress, [0, 1], [160, -160]), SPRING);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.35], [12, 0]), SPRING);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.25], [0.3, 1]), SPRING);
  const half = Math.ceil(Math.min(products.length, 12) / 2);
  const rows = [products.slice(0, half), products.slice(half, half * 2)];
  return (
    <section ref={ref} aria-label={label} className="relative overflow-hidden [perspective:1000px]">
      {header}
      <motion.div style={{ rotateX, opacity }} className="space-y-6 pb-16">
        {rows.map((row, i) => (
          <motion.ul key={i} style={{ x: i === 0 ? x : xReverse }} className={cn("flex w-max gap-6", i === 1 && "ml-24")}>
            {row.map((p) => <li key={p.link}><Tile product={p} className="aspect-video w-[22rem] lg:w-[26rem]" lift /></li>)}
          </motion.ul>
        ))}
      </motion.div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ws-bg to-transparent" />
    </section>
  );
}

function Tile({ product, className, lift }: { product: ParallaxProduct; className?: string; lift?: boolean }) {
  return (
    <Link href={product.link} className={cn("group/tile relative block overflow-hidden rounded-xl border border-white/10 bg-ws-card outline-none transition-[transform,box-shadow] duration-300 hover:border-ws-purple focus-visible:ring-2 focus-visible:ring-ws-blue motion-reduce:transition-none", lift && "hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(124,58,237,0.3)]", className)}>
      <Image src={product.thumbnail} alt="" fill sizes="(min-width: 1024px) 416px, (min-width: 768px) 352px, 50vw" className="object-cover" />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ws-bg/90 via-transparent to-transparent" />
      <span className="absolute inset-x-3 bottom-2 line-clamp-1 text-sm font-semibold text-ws-text">{product.title}</span>
    </Link>
  );
}

