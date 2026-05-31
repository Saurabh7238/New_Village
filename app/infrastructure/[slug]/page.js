import { notFound } from "next/navigation";
import InfrastructureCategoryPage from "@/components/InfrastructureCategoryPage";
import {
  getInfraCategoryBySlug,
  INFRA_CATEGORIES,
} from "@/lib/infrastructureDisplay";

export function generateStaticParams() {
  return INFRA_CATEGORIES.map((category) => ({ slug: category.slug }));
}

export default async function InfrastructureSlugPage({ params }) {
  const { slug } = await params;
  const category = getInfraCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <InfrastructureCategoryPage
      type={category.type}
      title={category.title}
      description={category.description}
    />
  );
}
