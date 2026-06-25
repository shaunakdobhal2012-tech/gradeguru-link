// Heuristic auto-estimate engine for assignment time.
// Returns minutes, snapped to 15-min increments.
export function estimateMinutes(title: string, description: string, _subject?: string): number {
  const t = `${title} ${description}`.toLowerCase();
  let base = 60; // default

  // Type heuristics — order matters (longer phrases first).
  if (/lab\s*report/.test(t)) base = 120;
  else if (/essay/.test(t)) base = 150;
  else if (/quiz\s*prep|quiz/.test(t)) base = 90;
  else if (/problem\s*set/.test(t)) base = 75;
  else if (/project/.test(t)) base = 180;
  else if (/worksheet/.test(t)) base = 60;
  else if (/reading|chapter/.test(t)) base = 60;

  // Scale up on size signals in the description.
  const words = description.match(/(\d{2,5})\s*words?/i);
  if (words) base = Math.max(base, Math.round((Number(words[1]) / 250) * 30));

  const pages = description.match(/(\d{1,3})\s*pages?/i);
  if (pages) base = Math.max(base, Number(pages[1]) * 30);

  const chRange = description.match(/chapters?\s*(\d+)\s*[-–to]+\s*(\d+)/i);
  if (chRange) {
    const n = Math.abs(Number(chRange[2]) - Number(chRange[1])) + 1;
    base = Math.max(base, n * 30);
  } else {
    const chN = description.match(/(\d{1,2})\s*chapters?/i);
    if (chN) base = Math.max(base, Number(chN[1]) * 30);
  }

  // Snap to nearest 15.
  return Math.max(15, Math.min(600, Math.round(base / 15) * 15));
}
