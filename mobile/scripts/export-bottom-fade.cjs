// Uses existing development tooling, with no new application dependency.
const sharp = require(process.argv[2]);
const path = require('node:path');
const height = 1024;
async function main() {
  for (const layer of ['top', 'bottom']) {
    const pixels = Buffer.alloc(height * 4, 255);
    for (let y = 0; y < height; y++) {
      const t = y / (height - 1);
      // Mirror the header's linear fade: transparent at the inner edge,
      // fully opaque at the screen edge.
      const alpha = t;
      // Source-over: bottomAlpha + topAlpha * (1 - bottomAlpha) = alpha.
      const bottomAlpha = alpha * t;
      const topAlpha = bottomAlpha === 1 ? 1 : alpha * (1 - t) / (1 - bottomAlpha);
      pixels[y * 4 + 3] = Math.round(255 * (layer === 'top' ? topAlpha : bottomAlpha));
    }
    await sharp(pixels, { raw: { width: 1, height, channels: 4 } }).png()
      .toFile(path.join(__dirname, '../assets/design', `bottom-fade-${layer}-mask.png`));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
