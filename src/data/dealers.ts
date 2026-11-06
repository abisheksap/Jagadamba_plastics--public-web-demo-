/**
 * Dealer directory used by the "Find a dealer" block on the Contact page.
 * Add real dealers here (or later move this list into the admin/Convex data).
 * While a province has no entries the page shows the Bharatpur head-office contact instead.
 */
export const PROVINCES = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"] as const;
export type Province = (typeof PROVINCES)[number];

export interface Dealer {
  name: string;
  province: Province;
  district: string;
  phone: string;
  address?: string;
}

export const DEALERS: Dealer[] = [
  // { name: "Example Traders", province: "Gandaki", district: "Kaski", phone: "+977-61-000000", address: "Pokhara" },
];
