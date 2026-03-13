import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const post = await getPostBySlug(params.slug);
    return {
      title: post.frontmatter.title,
      description: post.frontmatter.excerpt
    };
  } catch {
    return {
      title: "Artículo no encontrado"
    };
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  try {
    const post = await getPostBySlug(params.slug);

    return (
      <>
        <Navbar />
        <main className="container-app py-12">
          <article className="mx-auto max-w-3xl">
            <p className="text-xs uppercase tracking-[0.22em] text-primary">
              {post.frontmatter.publishedAt} · {post.readingTime}
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-heading)] text-5xl font-semibold tracking-tight text-ink">
              {post.frontmatter.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{post.frontmatter.excerpt}</p>
            <div className="mdx-content mt-10">{post.content}</div>
          </article>
        </main>
      </>
    );
  } catch {
    notFound();
  }
}
