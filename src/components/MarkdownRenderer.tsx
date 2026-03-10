import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const premiumComponents: Components = {
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-hidden rounded-xl border border-border/60 shadow-sm">
      <table className="w-full border-collapse text-sm tabular-nums" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead
      className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent text-left text-xs font-semibold uppercase tracking-wider text-foreground/80"
      {...props}
    >
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-2.5 font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-t border-border/40 px-4 py-2 text-foreground/90" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }) => (
    <tr className="even:bg-muted/30 transition-colors hover:bg-muted/50" {...props}>
      {children}
    </tr>
  ),
  h1: ({ children, ...props }) => (
    <h1
      className="mt-6 mb-3 text-xl font-bold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <div className="my-4 flex items-center gap-3 rounded-lg border-l-4 border-primary bg-primary/5 px-4 py-2.5">
      <h2 className="text-base font-bold tracking-tight text-foreground" {...props}>
        {children}
      </h2>
    </div>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="mt-4 mb-2 text-sm font-semibold tracking-wide text-primary/90 uppercase"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="my-1.5 leading-relaxed text-foreground/85" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-2 space-y-1.5 pl-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-2 space-y-1.5 pl-5 list-decimal marker:text-primary/60" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => {
    const text = typeof children === "string" ? children : "";
    const isPositive = text.startsWith("✅") || text.startsWith("🟢");
    const isWarning = text.startsWith("⚠️") || text.startsWith("🟡") || text.startsWith("🔴");
    const isTarget = text.startsWith("🎯");

    let dotColor = "bg-primary/50";
    if (isPositive) dotColor = "bg-emerald-500";
    if (isWarning) dotColor = "bg-amber-500";
    if (isTarget) dotColor = "bg-blue-500";

    return (
      <li className="flex items-start gap-2.5 text-foreground/85" {...props}>
        <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", dotColor)} />
        <span className="leading-relaxed">{children}</span>
      </li>
    );
  },
  blockquote: ({ children }) => (
    <div className="my-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-amber-400/5 to-transparent px-5 py-4 shadow-sm backdrop-blur-sm">
      <div className="text-foreground/90 [&>p]:my-0.5">{children}</div>
    </div>
  ),
  hr: () => (
    <div className="my-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
  ),
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("max-w-none", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={premiumComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
