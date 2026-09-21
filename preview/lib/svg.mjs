// Generated placeholder artwork so the preview looks finished without real photography.
// Product shots: white background, soft shadow, one product. Hero: soft morning-light scene.

const COVERS = {
  grey: ['#eef0ef', '#d6dbd8', '#b8bfbb'],
  green: ['#e4f0e9', '#bcd9c8', '#8fbba4'],
  sand: ['#f8edd3', '#ecd9a8', '#d9c07f'],
};

const shadow = (cx, cy, rx, ry) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#16211c" opacity=".10" filter="url(#soft)"/>`;

const defs = (c) => `
  <defs>
    <filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c[0]}"/><stop offset=".65" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/>
    </linearGradient>
    <radialGradient id="shine" cx=".35" cy=".25" r=".7">
      <stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

const shapes = {
  // Butterfly / cervical contour pillow, front view
  contour: (c) => `${shadow(500, 800, 340, 34)}
    <path id="p" d="M110 610C110 470 215 415 335 435C425 450 445 520 500 520C555 520 575 450 665 435C785 415 890 470 890 610C890 725 805 785 500 785C195 785 110 725 110 610Z" fill="url(#body)"/>
    <path d="M110 610C110 470 215 415 335 435C425 450 445 520 500 520C555 520 575 450 665 435C785 415 890 470 890 610C890 725 805 785 500 785C195 785 110 725 110 610Z" fill="url(#shine)"/>
    <path d="M190 620C260 690 740 690 810 620" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>`,
  // Slimmer flat pillow
  slim: (c) => `${shadow(500, 770, 350, 28)}
    <rect x="110" y="480" width="780" height="270" rx="120" fill="url(#body)"/>
    <rect x="110" y="480" width="780" height="270" rx="120" fill="url(#shine)"/>
    <path d="M200 615H800" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>`,
  // Wedge
  wedge: (c) => `${shadow(500, 780, 360, 30)}
    <path d="M110 730V650Q110 625 140 618L810 440Q880 424 890 490V730Q890 760 855 760H145Q110 760 110 730Z" fill="url(#body)"/>
    <path d="M110 730V650Q110 625 140 618L810 440Q880 424 890 490V730Q890 760 855 760H145Q110 760 110 730Z" fill="url(#shine)"/>`,
  // U-shaped travel / car neck pillow
  neck: (c) => `${shadow(500, 800, 300, 30)}
    <path d="M250 390A255 255 0 1 0 750 390" fill="none" stroke="url(#body)" stroke-width="190" stroke-linecap="round"/>
    <path d="M250 390A255 255 0 1 0 750 390" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="40" stroke-linecap="round" transform="translate(0 -30)"/>`,
  // Lumbar spine rest
  lumbar: (c) => `${shadow(500, 770, 330, 30)}
    <rect x="170" y="300" width="660" height="440" rx="170" fill="url(#body)"/>
    <rect x="170" y="300" width="660" height="440" rx="170" fill="url(#shine)"/>
    <path d="M210 470Q500 580 790 470M210 580Q500 690 790 580" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
    <rect x="120" y="500" width="60" height="100" rx="30" fill="#16211c" opacity=".7"/>
    <rect x="820" y="500" width="60" height="100" rx="30" fill="#16211c" opacity=".7"/>`,
  // Combo: pillow + lumbar cushion
  combo: (c) => `${shadow(500, 800, 380, 30)}
    <g transform="translate(-40 40) scale(.85)">${shapes.lumbar(c).replace(shadow(500, 770, 330, 30), '')}</g>
    <g transform="translate(260 150) scale(.7)"><path d="M110 610C110 470 215 415 335 435C425 450 445 520 500 520C555 520 575 450 665 435C785 415 890 470 890 610C890 725 805 785 500 785C195 785 110 725 110 610Z" fill="${COVERS.green[1]}"/></g>`,
};

const DIMS = { contour: ['60 cm', '12 cm'], slim: ['60 cm', '8 cm'], wedge: ['60 cm', '20 cm'], neck: ['28 cm', '9 cm'], lumbar: ['40 cm', '30 cm'], combo: ['—', '—'] };
const label = (x, y, text, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Montserrat, Arial, sans-serif" font-size="34" font-weight="600" fill="#16211c">${text}</text>`;

const wrap = (c, inner, bg = '#fff') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${defs(c)}<rect width="1000" height="1000" fill="${bg}"/>${inner}</svg>`;

export function productSvg(kind = 'contour', tone = 'grey', view = 'front') {
  const c = COVERS[tone] || COVERS.grey;
  const draw = shapes[kind] || shapes.contour;

  switch (view) {
    // In use / lifestyle: tinted room, larger product
    case 'alt':
      return wrap(c, `<rect width="1000" height="1000" fill="#f3f6f4"/>
        <circle cx="800" cy="200" r="260" fill="#f8edd3" opacity=".7" filter="url(#soft)"/>
        <rect y="760" width="1000" height="240" fill="#e4f0e9"/>
        <g transform="translate(-60 -40) scale(1.12)">${draw(c)}</g>`, '#f3f6f4');

    // Macro of the cover fabric and quilting
    case 'detail':
      return wrap(c, `<defs>
          <pattern id="q" width="70" height="70" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 35H70M35 0V70" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-dasharray="7 9" stroke-linecap="round"/>
          </pattern>
          <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#16211c" stop-opacity=".28"/></radialGradient>
        </defs>
        <rect width="1000" height="1000" fill="url(#body)"/>
        <rect width="1000" height="1000" fill="url(#q)"/>
        <path d="M-40 620C220 520 420 720 700 600S960 560 1040 640V1040H-40Z" fill="#000" opacity=".06"/>
        <path d="M-40 300C200 220 380 340 640 260S900 200 1040 280" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="6"/>
        <rect width="1000" height="1000" fill="url(#vig)"/>`);

    // Side profile
    case 'side':
      return wrap(c, `${shadow(500, 790, 360, 30)}
        <path d="M110 730V650C150 560 260 540 340 590C400 628 450 660 520 640C640 606 700 500 820 500C885 500 895 570 890 650V730Q890 770 850 770H150Q110 770 110 730Z" fill="url(#body)"/>
        <path d="M110 730V650C150 560 260 540 340 590C400 628 450 660 520 640C640 606 700 500 820 500C885 500 895 570 890 650V730Q890 770 850 770H150Q110 770 110 730Z" fill="url(#shine)"/>`);

    // Dimensions: product plus measured lines
    case 'dims': {
      const [w, t] = DIMS[kind] || DIMS.contour;
      return wrap(c, `<g opacity=".92">${draw(c)}</g>
        <g stroke="#16211c" stroke-width="3" fill="none" stroke-linecap="round">
          <path d="M110 860H890"/><path d="M110 845V875M890 845V875"/>
          <path d="M935 430V790"/><path d="M920 430H950M920 790H950"/>
        </g>
        ${label(500, 915, w)}
        <g transform="translate(985 620) rotate(90)">${label(0, 0, t)}</g>`);
    }

    // What is in the box
    case 'box':
      return wrap(c, `${shadow(400, 800, 300, 26)}
        <g transform="translate(-120 40) scale(.8)">${draw(c).replace(shadow(500, 800, 340, 34), '')}</g>
        <rect x="640" y="520" width="240" height="300" rx="24" fill="#16211c" opacity=".92"/>
        <rect x="670" y="560" width="180" height="14" rx="7" fill="#fff" opacity=".7"/>
        <rect x="670" y="590" width="120" height="14" rx="7" fill="#fff" opacity=".45"/>
        <rect x="610" y="700" width="260" height="140" rx="20" fill="#f8edd3"/>
        <path d="M640 740H840M640 775H800" stroke="#8a6414" stroke-width="6" stroke-linecap="round" opacity=".6"/>`);

    // Shown beside a phone for scale
    case 'hand':
      return wrap(c, `${shadow(430, 800, 320, 28)}
        <g transform="translate(-70 30) scale(.86)">${draw(c).replace(shadow(500, 800, 340, 34), '')}</g>
        <rect x="720" y="470" width="150" height="320" rx="26" fill="#16211c"/>
        <rect x="732" y="486" width="126" height="288" rx="16" fill="#e4f0e9"/>
        <text x="795" y="850" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="26" font-weight="600" fill="#5e6a64">Phone for scale</text>`);

    default:
      return wrap(c, draw(c));
  }
}

// Hero: a calm night-to-dawn bedroom in brand greens with a warm gold glow. Placeholder art only,
// chosen so white headline text has natural contrast. Real photography replaces it in the theme editor.
export function heroSvg(orientation = 'wide') {
  const wide = orientation === 'wide';
  const [w, h] = wide ? [1600, 900] : [900, 1125];
  const px = wide ? 1380 : 520;
  const py = wide ? 560 : 430;
  const s = wide ? 0.85 : 0.95;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0c3a27"/><stop offset=".6" stop-color="#14523a"/><stop offset="1" stop-color="#1d6a4a"/></linearGradient>
      <radialGradient id="glow" cx=".78" cy=".2" r=".65"><stop offset="0" stop-color="#f4cf7a" stop-opacity=".85"/><stop offset=".45" stop-color="#d49e29" stop-opacity=".28"/><stop offset="1" stop-color="#d49e29" stop-opacity="0"/></radialGradient>
      <linearGradient id="bed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a7a58"/><stop offset="1" stop-color="#0f4630"/></linearGradient>
      <linearGradient id="pil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfb"/><stop offset="1" stop-color="#c9d6cf"/></linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="26"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#wall)"/>
    <rect width="${w}" height="${h}" fill="url(#glow)"/>
    <circle cx="${w * 0.8}" cy="${h * 0.2}" r="${wide ? 70 : 58}" fill="#fff1c9" opacity=".9"/>
    <rect y="${h * 0.62}" width="${w}" height="${h * 0.38}" fill="url(#bed)"/>
    <ellipse cx="${px}" cy="${py + 150 * s}" rx="${380 * s}" ry="${34 * s}" fill="#000" opacity=".3" filter="url(#blur)"/>
    <g transform="translate(${px - 500 * 0.62 * s} ${py - 560 * 0.62 * s}) scale(${0.62 * s})">
      <path d="M110 610C110 470 215 415 335 435C425 450 445 520 500 520C555 520 575 450 665 435C785 415 890 470 890 610C890 725 805 785 500 785C195 785 110 725 110 610Z" fill="url(#pil)"/>
      <path d="M190 620C260 690 740 690 810 620" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
    </g>
  </svg>`;
}
