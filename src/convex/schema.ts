import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const variant = v.object({
  id: v.string(),
  size: v.string(),
  spec: v.optional(v.string()),
  price: v.optional(v.number()),
  packing: v.optional(v.string()),
});

export default defineSchema({
  products: defineTable({
    name: v.string(),
    category: v.string(),
    tagline: v.string(),
    description: v.string(),
    // storageId of an uploaded image OR a plain URL/path string
    image: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    specs: v.array(v.string()),
    variants: v.array(variant),
    priceNote: v.optional(v.string()),
    featured: v.boolean(),
    sortOrder: v.number(),
  }),
  gallery: defineTable({
    title: v.string(),
    kind: v.union(v.literal("photo"), v.literal("video")),
    image: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
  }),
  reviews: defineTable({
    name: v.string(),
    business: v.optional(v.string()),
    rating: v.number(),
    quote: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    createdAt: v.number(),
  }).index("by_status", ["status"]),
  enquiries: defineTable({
    name: v.string(),
    phone: v.string(),
    interest: v.string(),
    message: v.string(),
    status: v.union(v.literal("new"), v.literal("read"), v.literal("archived")),
    createdAt: v.number(),
  }).index("by_status", ["status"]),
  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }),
  admin: defineTable({
    key: v.string(),
    passcodeHash: v.string(),
  }),
});
