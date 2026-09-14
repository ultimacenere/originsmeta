import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

export function Markdown({ source, className = "" }: { source: string; className?: string }) {
  const html = marked.parse(source, { async: false }) as string;
  return <div className={`prose-ivory ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
