import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { slugify } from "@/lib/utils";

const blogDirectory = path.join(process.cwd(), "content", "blog");

export type BlogFrontmatter = {
  title: string;
  excerpt: string;
  publishedAt: string;
  cover: string;
};

export function getAllPostSlugs() {
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  return fs
    .readdirSync(blogDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export function getAllPostsMeta() {
  return getAllPostSlugs()
    .map((slug) => {
      const source = fs.readFileSync(path.join(blogDirectory, `${slug}.mdx`), "utf8");
      const { data, content } = matter(source);

      return {
        slug,
        title: data.title as string,
        excerpt: data.excerpt as string,
        publishedAt: data.publishedAt as string,
        cover: data.cover as string,
        readingTime: readingTime(content).text
      };
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export async function getPostBySlug(slug: string) {
  const source = fs.readFileSync(path.join(blogDirectory, `${slug}.mdx`), "utf8");
  const { content } = matter(source);

  const compiled = await compileMDX<BlogFrontmatter>({
    source,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm]
      }
    },
    components: {
      h2: (props) => (
        <h2 className="mt-10 text-2xl font-semibold tracking-tight text-ink" {...props} />
      ),
      h3: (props) => (
        <h3 className="mt-8 text-xl font-semibold tracking-tight text-ink" {...props} />
      ),
      p: (props) => <p className="mt-4 leading-8 text-slate-700" {...props} />,
      ul: (props) => <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700" {...props} />,
      li: (props) => <li {...props} />,
      strong: (props) => <strong className="font-semibold text-ink" {...props} />
    }
  });

  return {
    slug,
    content: compiled.content,
    frontmatter: compiled.frontmatter,
    readingTime: readingTime(content).text,
    citySlug: slugify(slug)
  };
}
