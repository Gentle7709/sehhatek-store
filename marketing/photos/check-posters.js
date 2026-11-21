// Checks posters.json against the catalog in index.html: every price and size on a poster
// must be a real catalog row, and products without a price must not show one anywhere.
// Run: node marketing/photos/check-posters.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const s = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const a = s.indexOf('var products = [');
const products = eval(s.slice(a + 15, s.indexOf('];', a) + 1));
const b = s.indexOf('var PRODUCT_IMAGES = ');
const images = eval('(' + s.slice(b + 21, s.indexOf('};', b) + 1) + ')');
const posters = JSON.parse(fs.readFileSync(path.join(__dirname, 'posters.json'), 'utf8'));
const banned = ['متجر', 'يعالج', 'يشفي', 'علاج', 'دواء', 'يقي ', 'يخفض', 'ينحف', 'عضوي'];
const bad = [];
for (const o of posters) {
  const rows = o.cat.map(id => products.find(p => p.id === id));
  const say = m => bad.push(o.img + ': ' + m);
  if (rows.some(r => !r)) { say('unknown catalog id'); continue; }
  if (rows.some(r => images[r.id] !== o.img)) say('catalog row belongs to another photo');
  const prices = [...new Set(rows.map(r => r.price))];
  const text = [o.h, o.s, o.cap, o.tags, o.name, o.size].join(' ');
  if (prices.every(p => !p)) {
    if (o.price) say('catalog has no price but the poster shows ' + o.price);
    if (/\d+\s*ريال/.test(text)) say('a price is mentioned for a product without a catalog price');
  } else {
    if (o.price !== Math.min(...prices)) say('price ' + o.price + ' is not the catalog price ' + prices.join('/'));
    if (!!o.from !== prices.length > 1) say('"من" must be used exactly when the size has two catalog prices');
    const want = (o.from ? 'من ' : 'بـ') + o.price + ' ريال';
    if (!o.cap.includes(want)) say('caption does not say "' + want + '"');
    const num = (o.size.match(/\d+/g) || []);
    if (num.some(n => !rows.some(r => r.name.includes(n)) && !['120', '285'].includes(n))) say('size "' + o.size + '" is not in the catalog name');
  }
  if (o.size && !o.cap.includes(o.size.replace('ظرف 12', 'الظرف 12')) && !o.cap.includes(o.size)) say('caption does not repeat the size "' + o.size + '"');
  for (const w of banned) if (text.includes(w)) say('banned word: ' + w.trim());
  if (o.h.length > 22) say('headline longer than 22 characters');
  if (o.s.length > 40) say('second line longer than 40 characters');
}
const heads = posters.map(o => o.h), seconds = posters.map(o => o.s);
heads.forEach((h, i) => { if (heads.indexOf(h) !== i) bad.push('duplicate headline: ' + h); });
seconds.forEach((h, i) => { if (seconds.indexOf(h) !== i) bad.push('duplicate second line: ' + h); });
console.log(posters.length + ' posters, ' + posters.filter(o => o.price).length + ' priced, ' + posters.filter(o => o.from).length + ' with "من"');
console.log(bad.length ? 'PROBLEMS:\n- ' + bad.join('\n- ') : 'all prices, sizes and wording checks passed');
process.exit(bad.length ? 1 : 0);
