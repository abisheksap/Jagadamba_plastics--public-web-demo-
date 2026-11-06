import { useEffect } from "react";

const SITE = "Jagadamba Plastic";

/** Sets the document title and meta description for the current page (restores them on leave). */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.content;
    document.title = `${title} | ${SITE}`;
    if (meta && description) meta.content = description.length > 158 ? `${description.slice(0, 155)}…` : description;
    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== undefined) meta.content = previousDescription;
    };
  }, [title, description]);
}
