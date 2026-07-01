// One-off generator for the JUnited App Store icon set (no design tool / image
// library available in this environment, so this hand-rolls both the raster
// and the PNG encoder using only Node's built-in zlib+fs). Draws a simple,
// high-contrast six-pointed star (Magen David) in white on the app's brand
// blue (#2563EB, matches src/index.css / the primary button color), 4x
// supersampled per pixel for anti-aliased edges. Re-rasterizes at each target
// size directly (rather than downsampling one bitmap) so edges stay crisp
// even at 20x20.
//
// Run: node scripts/generate-app-icons.cjs
// Output: internal/app-store/ios-native-prep/app-icons/*.png

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'internal', 'app-store', 'ios-native-prep', 'app-icons');

// iOS icon sizes this app needs (App Store marketing icon + Home Screen /
// Settings / Spotlight / notification icons across @1x-@3x scales).
const SIZES = [1024, 180, 167, 152, 120, 87, 80, 60, 58, 40, 29, 20];

const BG = [37, 98, 235];   // #2563EB — brand blue, matches the app's primary buttons
const FG = [255, 255, 255]; // white star

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Encodes an RGB (no alpha) 8-bit PNG from a flat [r,g,b, r,g,b, ...] buffer.
function encodePNG(width, height, rgb) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type 2 = truecolor (RGB), no alpha channel
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace
  const ihdr = chunk('IHDR', ihdrData);

  // Each scanline prefixed with filter-type byte 0 (None) — simplest correct encoding.
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter: None
    rgb.copy(raw, rowStart + 1, y * stride, y * stride + stride);
  }
  const idatData = zlib.deflateSync(raw, { level: 9 });
  const idat = chunk('IDAT', idatData);

  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Signed area test (cross product) — consistent sign for all 3 edges = inside.
function triSign(px, py, ax, ay, bx, by) {
  return (px - bx) * (ay - by) - (ax - bx) * (py - by);
}
function pointInTriangle(px, py, verts) {
  const [a, b, c] = verts;
  const d1 = triSign(px, py, a[0], a[1], b[0], b[1]);
  const d2 = triSign(px, py, b[0], b[1], c[0], c[1]);
  const d3 = triSign(px, py, c[0], c[1], a[0], a[1]);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function starTriangles(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const pt = (deg) => {
    const rad = (deg - 90) * Math.PI / 180; // -90 so 0deg points straight up
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const up = [pt(0), pt(120), pt(240)];
  const down = [pt(60), pt(180), pt(300)];
  return [up, down];
}

function renderIcon(size) {
  const triangles = starTriangles(size);
  const rgb = Buffer.alloc(size * size * 3);
  const SS = 4; // supersample grid per pixel for anti-aliasing
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let coverage = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if (pointInTriangle(px, py, triangles[0]) || pointInTriangle(px, py, triangles[1])) {
            coverage++;
          }
        }
      }
      coverage /= (SS * SS);
      const idx = (y * size + x) * 3;
      for (let c = 0; c < 3; c++) {
        rgb[idx + c] = Math.round(BG[c] + (FG[c] - BG[c]) * coverage);
      }
    }
  }
  return rgb;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const rgb = renderIcon(size);
  const png = encodePNG(size, size, rgb);
  const outPath = path.join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Wrote ${outPath} (${png.length} bytes)`);
}
