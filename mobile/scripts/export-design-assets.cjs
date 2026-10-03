// One-time export of the supplied vector artwork. Pass an existing sharp module
// path as argv[2]; sharp is tooling only, not an application dependency.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.argv[2]);
const root = path.resolve(__dirname, '../..');
const refs = path.join(root, 'HealthWatch UI/References');
const output = path.join(root, 'mobile/assets/design');
fs.mkdirSync(output, { recursive: true });
const read = name => fs.readFileSync(path.join(refs, name), 'utf8');
const svg = (viewBox, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;
async function exportPng(name, source, width) {
  await sharp(Buffer.from(source)).resize({ width }).png().toFile(path.join(output, name + '.png'));
}
async function main() {
  const login = read('Login - HealthWatch.svg');
  const home = read('Dependent Home - HealthWatch.svg');
  const logo = login.match(/<g filter="[^"]+">([\s\S]*?)<\/g>/)[1];
  await exportPng('brand', svg('105 115 870 1090', logo), 870);
  for (const [name, source] of [['auth-background', login], ['background', home]]) {
    const gradient = source.match(/<linearGradient[\s\S]*?<\/linearGradient>/)[0];
    const id = gradient.match(/id="([^"]+)"/)[1];
    await exportPng(name, svg('0 0 1080 2360', `<defs>${gradient}</defs><rect width="1080" height="2360" fill="url(#${id})"/>`), 540);
  }
  const avatar = home.match(/<path d="M200 279\.5[^\n]+/)[0];
  // App wallpaper: fully opaque colors matching the header and bottom controls.
  await exportPng('background', svg('0 0 1080 2360', '<defs><linearGradient id="wallpaper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9CD9EE"/><stop offset="1" stop-color="#79BDA5"/></linearGradient></defs><rect width="1080" height="2360" fill="url(#wallpaper)"/>'), 540);
  await exportPng('dependent', svg('99 278 202 202', avatar), 240);
  for (const [name, file] of Object.entries({ home: 'Home.svg', overview: 'History.svg', scan: 'Scan.svg', intake: 'inbox.svg', alerts: 'Alert circle.svg', safe: 'Check circle.svg', warning: 'Alert circle2.svg', danger: 'Alert triangle.svg' })) {
    await exportPng(name, read(file), 120);
  }
  // Prefer the newly supplied component icons. Navigation and logo were not
  // included in UI, so their original reference exports above remain in use.
  const components = path.join(root, 'UI/Components');
  for (const [name, file] of Object.entries({
    dependent: 'Dependent/Icons/Vector.svg',
    camera: 'ScannerLoader/Icons/Camera.svg',
    back: 'ScannerLoader/Icons/arrow_back.svg',
    safe: 'OverViewLoader/icons/Check circle.svg',
    warning: 'OverViewLoader/icons/Alert circle.svg',
    danger: 'OverViewLoader/icons/Alert triangle.svg',
    minus: 'OverViewLoader/icons/Minus.svg',
  })) {
    await exportPng(name, fs.readFileSync(path.join(components, file), 'utf8'), name === 'dependent' ? 240 : 120);
  }
  await exportPng('header-background', svg('0 0 1080 220', '<defs><linearGradient id="header" x2="0" y2="1"><stop stop-color="#9CD9EE"/><stop offset="1" stop-color="#9CD9EE" stop-opacity="0"/></linearGradient></defs><rect width="1080" height="220" fill="url(#header)"/>'), 540);
  await exportPng('bottom-fade', svg('0 0 1080 320', '<defs><linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#79BDA5" stop-opacity="0"/><stop offset="0.2" stop-color="#79BDA5" stop-opacity="0.85"/><stop offset="0.4" stop-color="#79BDA5" stop-opacity="1"/><stop offset="1" stop-color="#79BDA5" stop-opacity="1"/></linearGradient></defs><rect width="1080" height="320" fill="url(#bottom)"/>'), 540);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
