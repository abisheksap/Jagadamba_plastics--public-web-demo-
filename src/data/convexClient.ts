import { ConvexReactClient } from "convex/react";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;

export const convexUrl = url ?? "";
export const convexEnabled = Boolean(url && url.length > 6);

let client: ConvexReactClient | null = null;

export function getConvexClient(): ConvexReactClient | null {
  if (!convexEnabled) return null;
  if (!client) client = new ConvexReactClient(convexUrl);
  return client;
}
