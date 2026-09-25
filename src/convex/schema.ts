import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const variant = v.object({
  id: v.string(),
  size: v.string(),
  spec: v.optional(v.string()),
  price: v.optional(v.number()),
  packing: v.optional(v.string()),
});

const leader = v.object({
  id: v.string(),
  role: v.string(),
  name: v.string(),
  nepaliRole: v.string(),
  message: v.string(),
  initials: v.string(),
  image: v.optional(v.string()),
  imageStorageId: v.optional(v.id("_storage")),
});

const siteContent = v.object({
  heroEyebrow: v.string(),
  heroTitleLine1: v.string(),
  heroTitleLine2: v.string(),
  heroSub: v.string(),
  aboutStory1: v.string(),
  aboutStory2: v.string(),
  aboutTitle: v.string(),
  aboutSub: v.string(),
  leaders: v.array(leader),
});

const heroChip = v.object({
  productId: v.string(),
  bx: v.number(),
  by: v.number(),
  z: v.number(),
  w: v.optional(v.number()),
  h: v.optional(v.number()),
});

const heroChipLayout = v.object({
  version: v.number(),
  chips: v.array(heroChip),
  updatedAt: v.optional(v.number()),
  updatedBy: v.optional(v.string()),
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
    sortOrder: v.optional(v.number()),
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
  siteContent: defineTable({
    key: v.literal("main"),
    content: siteContent,
  }),
  heroLayout: defineTable({
    key: v.literal("main"),
    layout: heroChipLayout,
  }),
  activity: defineTable({
    kind: v.string(),
    summary: v.string(),
    detail: v.optional(v.string()),
    byAdmin: v.boolean(),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),
});
