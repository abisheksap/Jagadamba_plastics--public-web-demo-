// Logic test of the store layer using Bun's native TS support.
const storage = new Map();
globalThis.localStorage = {
  getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
  setItem: (k: string, v: string) => storage.set(k, String(v)),
  removeItem: (k: string) => storage.delete(k),
};

const store = await import("../src/data/store.ts");
const { buildSeedData } = await import("../src/data/seed.ts");

let d = store.getSiteData();
console.log(
  "seed products:",
  d.products.length,
  "variants:",
  d.products.reduce((n, p) => n + (p.variants?.length ?? 0), 0),
);

// enquiry flow
store.submitEnquiry({ name: "Test User", phone: "9800000000", interest: "HDPE Pipe", message: "Need 500m PN10" });
d = store.getSiteData();
const e = d.enquiries[0];
console.log("enquiry stored:", e.name === "Test User" && e.status === "new" && e.interest === "HDPE Pipe" ? "OK" : "FAIL", e.id);

// review flow + moderation gate
store.submitReview({ name: "Reviewer", business: "", rating: 4, quote: "Good pipes" });
d = store.getSiteData();
const r = d.reviews.find((x) => x.name === "Reviewer")!;
console.log("review pending:", r.status === "pending" ? "OK" : "FAIL");
store.setReviewStatus(r.id, "approved");
console.log("review approved:", store.getSiteData().reviews.find((x) => x.id === r.id)?.status === "approved" ? "OK" : "FAIL");

// variant ops
store.setProductVariants("hdpe-pipe", [{ id: "vX", size: "63mm · PN10", price: 123.4 }]);
const after = store.getSiteData().products.find((x) => x.id === "hdpe-pipe")!;
console.log("variant update:", after.variants.length === 1 && after.variants[0].price === 123.4 ? "OK" : "FAIL");

// admin add-product flow with variants
store.upsertProduct({
  id: "p-test",
  name: "Test Product",
  category: "PVC Pipe",
  tagline: "",
  description: "",
  image: "/x.jpg",
  specs: [],
  variants: [{ id: "v1", size: "1in", price: 50 }],
  featured: false,
  sortOrder: 99,
});
console.log("product add:", store.getSiteData().products.some((x) => x.id === "p-test") ? "OK" : "FAIL");

// settings defaults survive round-trip
console.log(
  "showPrices default:",
  store.getSiteData().settings.showPrices === true ? "OK" : "FAIL",
);

// fresh-seed parity
const old = buildSeedData();
console.log("seed catalog:", old.products.length === 61 ? "OK" : `FAIL (${old.products.length})`);
