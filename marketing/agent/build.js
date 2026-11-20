// Builds page.html from page.src.html by injecting the product image library read from index.html.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const s = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const a = s.indexOf('var products = [');
const products = eval(s.slice(a + 15, s.indexOf('];', a) + 1));
const b = s.indexOf('var PRODUCT_IMAGES = ');
const images = eval('(' + s.slice(b + 21, s.indexOf('};', b) + 1) + ')');
const lib = {};
for (const p of products) {
  const f = images[p.id];
  if (f && !lib[f]) lib[f] = p.name.replace(/\s*\d+\s*(غرام|غ|حبة|مل|كبسولة|كيس)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}
// Professional product photos: marketing/photos/photos.json lists [image name, scene key, Arabic label]; only files that exist are shown.
const photoDir = path.join(root, 'marketing', 'photos');
const photos = JSON.parse(fs.readFileSync(path.join(photoDir, 'photos.json'), 'utf8'))
  .filter(p => fs.existsSync(path.join(photoDir, p[0] + '.jpg')));
const src = fs.readFileSync(path.join(__dirname, 'page.src.html'), 'utf8')
  .replace('__LIB__', JSON.stringify(Object.entries(lib)))
  .replace('__PHOTOS__', JSON.stringify(photos));
fs.writeFileSync(path.join(__dirname, 'page.html'), src);
console.log('built', Object.keys(lib).length, 'images,', photos.length, 'photos');
