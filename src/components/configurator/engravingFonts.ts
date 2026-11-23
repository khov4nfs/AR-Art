import { Cormorant_Garamond, Great_Vibes, Playfair_Display } from "next/font/google";
import type { EngravingFontId } from "@/lib/engraving";

// All three ship a Vietnamese subset so diacritics (ằ, ữ, ộ…) render correctly.
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  style: ["italic"],
  weight: ["400"],
  display: "swap",
  variable: "--font-engrave-serif",
});
const greatVibes = Great_Vibes({
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  display: "swap",
  variable: "--font-engrave-script",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["600"],
  display: "swap",
  variable: "--font-engrave-classic",
});

export const ENGRAVING_FONTS: {
  id: EngravingFontId;
  label: string;
  family: string;
  className: string;
}[] = [
  { id: "serif", label: "Playfair", family: playfair.style.fontFamily, className: playfair.className },
  { id: "script", label: "Great Vibes", family: greatVibes.style.fontFamily, className: greatVibes.className },
  { id: "classic", label: "CORMORANT", family: cormorant.style.fontFamily, className: cormorant.className },
];

export const engravingFontVariables = [playfair.variable, greatVibes.variable, cormorant.variable].join(" ");

export function engravingFontById(id?: string) {
  return ENGRAVING_FONTS.find((f) => f.id === id) ?? ENGRAVING_FONTS[0];
}
