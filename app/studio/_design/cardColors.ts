// Card gradients — the same palette as the landing page hero cards. The color is
// derived from the card's ID, so a given card looks identical on the dashboard,
// in popups, and on its detail page (and never changes if other cards come/go).
export const CARD_GRADIENTS = [
  "linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)", // orange
  "linear-gradient(135deg, #FFB3C7 0%, #FF6C9A 45%, #F0457E 100%)", // pink
  "linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #5B21B6 100%)", // purple
];

export function cardGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return CARD_GRADIENTS[h % CARD_GRADIENTS.length];
}
