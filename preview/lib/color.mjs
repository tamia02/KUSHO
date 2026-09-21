// Minimal Shopify "color" object + the colour filters Dawn's theme.liquid uses.

export class Color {
  constructor(hex) {
    const h = String(hex || '#000000').replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
    this.red = parseInt(full.slice(0, 2), 16);
    this.green = parseInt(full.slice(2, 4), 16);
    this.blue = parseInt(full.slice(4, 6), 16);
  }

  get rgb() {
    return `${this.red}, ${this.green}, ${this.blue}`;
  }

  toString() {
    const x = (n) => Math.round(n).toString(16).padStart(2, '0');
    return `#${x(this.red)}${x(this.green)}${x(this.blue)}`;
  }
}

const toHsl = ({ red, green, blue }) => {
  const r = red / 255, g = green / 255, b = blue / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
};

const fromHsl = (h, s, l) => {
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) r = g = b = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  const c = new Color('#000');
  c.red = Math.round(r * 255);
  c.green = Math.round(g * 255);
  c.blue = Math.round(b * 255);
  return c;
};

export const colorFilters = {
  color_brightness: (c) => (299 * c.red + 587 * c.green + 114 * c.blue) / 1000,
  color_lighten: (c, pct) => {
    const [h, s, l] = toHsl(c);
    return fromHsl(h, s, Math.min(1, l + pct / 100));
  },
  color_darken: (c, pct) => {
    const [h, s, l] = toHsl(c);
    return fromHsl(h, s, Math.max(0, l - pct / 100));
  },
};
