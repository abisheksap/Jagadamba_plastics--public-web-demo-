import { describe, expect, it } from "vitest";
import { defaultChipSize, resolveShowcaseItems } from "../src/components/showcaseLayout";
import type { HeroChipLayout, Product } from "../src/data/types";

const products: Product[] = [
  { id: "tank", name: "Jagadamba Water Tank", category: "Water Tank", image: "/images/tank.png", description: "", variants: [], featured: true, sortOrder: 1 },
  { id: "pipe", name: "PVC Pipe (Commercial)", category: "PVC Pipe", image: "/images/pipe.png", description: "", variants: [], featured: true, sortOrder: 2 },
  { id: "fitting", name: "CPVC Elbow 90", category: "CPVC Fittings", image: "/images/elbow.png", description: "", variants: [], featured: true, sortOrder: 3 },
];

describe("home product arranger layout", () => {
  it("uses the same default sizes for tanks, pipes, and fittings", () => {
    expect(defaultChipSize(products[0])).toEqual({ w: 122, h: 158 });
    expect(defaultChipSize(products[1])).toEqual({ w: 56, h: 150 });
    expect(defaultChipSize(products[2])).toEqual({ w: 76, h: 76 });
  });

  it("resolves every saved product into the public homepage group", () => {
    const layout: HeroChipLayout = {
      version: 1,
      chips: products.map((product, index) => ({
        productId: product.id,
        bx: index * 20 - 20,
        by: index * 10 - 10,
        z: index + 1,
        w: 80 + index,
        h: 90 + index,
      })),
    };

    const items = resolveShowcaseItems(products, layout);
    expect(items.map((item) => item.productId)).toEqual(products.map((product) => product.id));
    expect(items[0]).toMatchObject({ bx: -20, by: -10, w: 80, h: 90 });
    expect(items.every((item) => !item.productId.includes("missing"))).toBe(true);
  });

  it("ignores saved chips whose product has been removed", () => {
    const layout: HeroChipLayout = {
      version: 1,
      chips: [
        { productId: "tank", bx: 0, by: 0, z: 1 },
        { productId: "missing", bx: 10, by: 10, z: 1 },
      ],
    };

    expect(resolveShowcaseItems(products, layout).map((item) => item.productId)).toEqual(["tank"]);
  });
});
