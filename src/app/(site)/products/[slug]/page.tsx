import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ProductDifferentiators,
  ProductFaq,
  ProductFeatureStories,
  ProductFinalCta,
  ProductHero,
  ProductHowItWorks,
  ProductIncluded,
  ProductPricing,
  ProductProblemSolution,
  ProductValueProps,
  ProductWhoItsFor,
} from "@/components/product-landing";
import { getProductLandingConfig, productLandingSlugs } from "@/config/products";
import { siteConfig } from "@/config/site";

/**
 * The reusable public Product Landing Page route - `/products/[slug]`.
 * Deliberately separate from `/planners` (the still-empty, generic
 * `planner_definitions` discovery catalog - see its own comments) since a
 * hand-built product like Wedding Planner is explicitly not a row in that
 * catalog. Fully public and static: no auth check, no DB call - the config
 * in `@/config/products/` is the entire content source, exactly like the
 * rest of the public marketing site.
 */
export async function generateStaticParams() {
  return productLandingSlugs.map((slug) => ({ slug }));
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getProductLandingConfig(slug);

  if (!config) return {};

  return {
    title: config.seo.title,
    description: config.seo.description,
    alternates: { canonical: `${siteConfig.url}/products/${config.slug}` },
    openGraph: {
      title: config.seo.title,
      description: config.seo.description,
      type: "website",
    },
  };
}

export default async function ProductLandingPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const config = getProductLandingConfig(slug);

  if (!config) {
    notFound();
  }

  return (
    <>
      <ProductHero config={config} />
      <ProductValueProps config={config} />
      <ProductProblemSolution config={config} />
      <ProductFeatureStories config={config} />
      <ProductHowItWorks config={config} />
      <ProductWhoItsFor config={config} />
      <ProductDifferentiators config={config} />
      <ProductIncluded config={config} />
      <ProductPricing config={config} />
      <ProductFaq config={config} />
      <ProductFinalCta config={config} />
    </>
  );
}
