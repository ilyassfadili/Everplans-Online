import { cn } from "@/lib/cn";

interface ProseProps {
  /** Sanitized HTML - the article content itself, not a template string built at render time. */
  html: string;
  className?: string;
}

/**
 * Renders sanitized HTML with the `.prose` long-form reading styles
 * (see globals.css). This is the one place in the app that reaches for
 * `dangerouslySetInnerHTML` - it exists specifically for content that
 * arrives as a finished HTML string from a content source, not for
 * rendering arbitrary/untrusted input. Sanitize at the content source
 * before it ever reaches this component.
 */
export function Prose({ html, className }: ProseProps) {
  return (
    <div className={cn("prose", className)} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
