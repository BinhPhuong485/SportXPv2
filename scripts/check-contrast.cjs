// WCAG 2.1 Contrast Checker
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const lightTokens = {
  bg: '#F2F7F3',
  surface: '#FFFFFF',
  text: '#14251D',
  muted: '#61736A',
  primary: '#176344',
  accent: '#299A63',
  loss: '#BE123C',
  streak: '#946200',
  mint: '#DDF2E3',
};

const darkTokens = {
  bg: '#07080A',
  surface: '#111317',
  text: '#FFFFFF',
  muted: '#7E8695',
  primary: '#00D665',
  accent: '#00E872',
  loss: '#E03131',
  streak: '#F5A623',
  mint: '#0D2E1C',
};

console.log('=== LIGHT THEME CONTRAST RATIOS ===');
for (const [name, hex] of Object.entries(lightTokens)) {
  if (name === 'bg' || name === 'surface' || name === 'mint') continue;
  const onBg = contrastRatio(hex, lightTokens.bg).toFixed(2);
  const onSurface = contrastRatio(hex, lightTokens.surface).toFixed(2);
  console.log(`${name} (${hex}): on bg ${onBg}:1, on surface ${onSurface}:1`);
}

console.log('\n=== DARK THEME CONTRAST RATIOS ===');
for (const [name, hex] of Object.entries(darkTokens)) {
  if (name === 'bg' || name === 'surface' || name === 'mint') continue;
  const onBg = contrastRatio(hex, darkTokens.bg).toFixed(2);
  const onSurface = contrastRatio(hex, darkTokens.surface).toFixed(2);
  console.log(`${name} (${hex}): on bg ${onBg}:1, on surface ${onSurface}:1`);
}

