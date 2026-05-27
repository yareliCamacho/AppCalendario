const QUOTES = [
  'Contigo cada día es mi fecha favorita.',
  'El amor no se mira, se siente.',
  'Eres la razón de mi mejor versión.',
  'En tus ojos encontré mi universo.',
  'Cada recuerdo contigo vale oro.',
];

export function randomCalendarQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
