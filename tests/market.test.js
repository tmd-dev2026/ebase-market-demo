'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const products = require('../assets/js/products-data.js').products;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let checks = 0;
function check(name, fn) { fn(); checks += 1; console.log('✓ ' + name); }
// The supplied specification quotes forbidden examples. Repository/tool metadata is not site content.
const excluded = new Set(['BRIEF.md', 'BRIEF3.md', 'BRIEF4.md', '.git', '.agents', '.codex', '.claude', 'agents']);
function files(dir = '') {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    if (excluded.has(entry.name) || entry.isSymbolicLink()) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
const siteFiles = files();
const retiredWording = [['真', '贋'], ['出品', 'できません'], ['出せ', 'ません'], ['保証書・購入証明', 'がなく']].map(parts => parts.join(''));
const htmlFiles = ['index.html'].concat(products.map(p => 'items/' + p.slug + '.html'));
check('6 products, 4 distinct valid self-contained illustrations each', () => {
  assert.strictEqual(products.length, 6);
  assert.strictEqual(new Set(products.map(p => p.slug)).size, 6);
  const allImages = [];
  for (const product of products) {
    assert.strictEqual(product.images.length, 4);
    const artwork = [];
    for (const image of product.images) {
      allImages.push(image.file);
      const svg = read('assets/img/' + image.file).trim();
      artwork.push(svg);
      assert(svg.startsWith('<svg ') && svg.endsWith('</svg>'));
      assert(svg.includes('viewBox="0 0 800 800"'));
      assert(svg.includes('width="800" height="800"'));
      assert(svg.includes('role="img"') && /<title\b[^>]*>[^<]+<\/title>/.test(svg));
      assert(svg.includes(image.caption));
      assert(Buffer.byteLength(svg, 'utf8') < 200 * 1024);
      assert(!/<(?:text|script|image|foreignObject)\b/i.test(svg));
      assert(/<linearGradient\b/.test(svg) && /<feGaussianBlur\b/.test(svg));
      assert(!svg.includes('仮の画像'));
      const withoutNamespace = svg.replace(/xmlns="[^"]+"/, '');
      assert(!/(?:https?:)?\/\//i.test(withoutNamespace));
      const ids = new Set(Array.from(svg.matchAll(/\bid="([^"]+)"/g), match => match[1]));
      for (const match of svg.matchAll(/url\(#([^)]+)\)/g)) assert(ids.has(match[1]), 'Missing SVG paint/filter ' + match[1]);
      // Check XML element balance, quotes, root structure and local paint references without a dependency.
      const stack = [];
      for (const match of svg.matchAll(/<([^>]+)>/g)) {
        const tag = match[1];
        if (tag[0] === '/' ) assert.strictEqual(stack.pop(), tag.slice(1).trim());
        else if (!tag.endsWith('/')) stack.push(tag.split(/\s/)[0]);
        assert.strictEqual((tag.match(/"/g) || []).length % 2, 0);
      }
      assert.deepStrictEqual(stack, []);
    }
    assert.strictEqual(new Set(artwork).size, 4);
  }
  assert.strictEqual(new Set(allImages).size, 24);
  assert.strictEqual(fs.readdirSync(path.join(root, 'assets/img')).filter(f => f.endsWith('.svg')).length, 24);
});
check('Committed-ready HTML exactly matches current data; rebuild is deterministic', () => {
  const before = htmlFiles.map(read);
  const builder = require('../scripts/build.js');
  builder.build();
  assert.deepStrictEqual(htmlFiles.map(read), before, 'Generated pages were stale');
  assert.strictEqual(read('index.html'), builder.index());
  products.forEach((product, i) => assert.strictEqual(read('items/' + product.slug + '.html'), builder.item(product, i)));
  assert.strictEqual(builder.escape('<a title="x">&\''), '&lt;a title=&quot;x&quot;&gt;&amp;&#39;');
});
check('All HTML has demo, robots, viewport, accessibility and existing relative resources', () => {
  assert.strictEqual(siteFiles.filter(f => f.endsWith('.html')).length, 7);
  for (const file of htmlFiles) {
    const html = read(file);
    assert(/<html lang="ja">/.test(html));
    assert(/<meta name="robots" content="noindex,nofollow">/.test(html));
    assert(/<meta name="viewport" content="width=device-width, initial-scale=1">/.test(html));
    assert(html.includes('デモ用の架空ページです。購入・取引はできません'));
    assert(html.includes('体験版: 表示される数字・料金はすべて例です。'));
    assert(/data-app-link target="_blank" rel="noopener noreferrer"/.test(html));
    for (const block of html.matchAll(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/g)) assert.strictEqual(block[2].trim(), '');
    const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), m => m[1]);
    assert.strictEqual(ids.length, new Set(ids).size, 'Duplicate IDs: ' + file);
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const url = match[1];
      if (url.startsWith('#')) { assert(ids.includes(url.slice(1))); continue; }
      assert(!/^(?:[a-z]+:|\/)/i.test(url), 'Nonrelative resource in ' + file);
      const target = path.resolve(root, path.dirname(file), url);
      assert(target.startsWith(root + path.sep));
      assert(fs.existsSync(target), 'Missing resource: ' + target);
    }
    for (const match of html.matchAll(/<img\b[^>]*>/g)) assert(/\balt="[^"]*"/.test(match[0]));
  }
  assert(read('_headers').includes('/*\n  X-Robots-Tag: noindex, nofollow'));
  assert.strictEqual(read('robots.txt').trim(), 'User-agent: *\nDisallow: /');
});
check('Product content, exact image captions, URL controls and adjacent links', () => {
  const builder = require('../scripts/build.js');
  products.forEach((product, i) => {
    const html = read('items/' + product.slug + '.html');
    [product.name, product.condition, product.conditionNote, product.seller.name, product.seller.rating, product.shipFrom, product.shipMethod, product.posted].forEach(value => assert(html.includes(builder.escape(value))));
    product.description.forEach(value => assert(html.includes('<p>' + builder.escape(value) + '</p>')));
    product.specs.flat().forEach(value => assert(html.includes(builder.escape(value))));
    product.images.forEach(img => assert(html.includes('data-caption-text="' + builder.escape(img.caption) + '"')));
    assert.strictEqual((html.match(/data-image=/g) || []).length, 4);
    assert(html.includes('aria-live="polite"'));
    assert(/<input[^>]*data-page-url[^>]*readonly/.test(html));
    assert(/aria-disabled="true" data-purchase/.test(html));
    if (i > 0) assert(html.includes('href="' + products[i - 1].slug + '.html"'));
    if (i < products.length - 1) assert(html.includes('href="' + products[i + 1].slug + '.html"'));
  });
  const index = read('index.html');
  let position = -1;
  products.forEach(product => {
    const next = index.indexOf('href="items/' + product.slug + '.html"');
    assert(next > position);
    position = next;
  });
  assert.strictEqual((index.match(/data-filter=/g) || []).length, 7);
});
check('No retired notices in any page or source; listing eligibility does not affect rendering', () => {
  const builder = require('../scripts/build.js');
  for (const file of siteFiles) {
    const content = read(file);
    retiredWording.forEach(word => assert(!content.includes(word), 'Retired wording in ' + file));
  }
  products.forEach((product, i) => {
    assert.strictEqual(builder.item({ ...product, listable: false }, i), builder.item({ ...product, listable: true }, i));
    if (product.slug === 'shoulder-bag') {
      product.images.forEach(image => assert(!read('assets/img/' + image.file).includes('ロゴ')));
      assert(!read('items/' + product.slug + '.html').includes('ロゴ'));
    }
  });
});
check('Static source audit: no network APIs, external resources, real brands or income claims', () => {
  const APIs = ['fet' + 'ch', 'XML' + 'HttpRequest', 'Web' + 'Socket', 'send' + 'Beacon'];
  const forbidden = [
    ['メル', 'カリ'], ['Mer', 'cari'], ['ヤフ', 'オク'], ['ラク', 'マ'], ['Pay', 'Pay'], ['Ni', 'kon'], ['Ca', 'non'], ['Sei', 'ko'], ['Poke', 'mon'], ['ポケ', 'モン'], ['So', 'ny'], ['Nin', 'tendo'], ['Gu', 'cci'], ['Lou', 'is'], ['Cha', 'nel'], ['稼', 'げ'], ['必ず', '売れる']
  ].map(parts => parts.join(''));
  const remote = new RegExp('https?' + '://', 'ig');
  for (const file of siteFiles) {
    let content = read(file);
    APIs.forEach((api, i) => assert(!(new RegExp('\\b' + api + (i ? '\\b' : '\\s*\\('))).test(content), 'Network API in ' + file));
    forbidden.forEach(word => assert(!content.toLowerCase().includes(word.toLowerCase()), 'Forbidden wording in ' + file));
    if (file.endsWith('.svg')) content = content.replace(/xmlns="[^"]+"/g, '');
    if (file === 'assets/js/config.js') content = content.replace(/appUrl:\s*'[^']+'/g, '');
    assert(!remote.test(content), 'Unexpected external address in ' + file);
    remote.lastIndex = 0;
    if (file.endsWith('.css')) assert(!/@import|url\(\s*['"]?(?:\/\/|[a-z]+:)/i.test(content));
  }
});
check('Font sizes never fall below 12px, including responsive rules', () => {
  const css = read('assets/css/market.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const sizes = Array.from(css.matchAll(/font-size\s*:\s*([^;}]+)/g), match => match[1].trim());
  assert(sizes.length > 0);
  for (const size of sizes) {
    // All current sizes use pixels, or clamp with a pixel minimum and maximum.
    assert(/^(?:[\d.]+px|clamp\([\d.]+px,\s*[\d.]+vw,\s*[\d.]+px\))$/.test(size), 'Review font-size units: ' + size);
    for (const match of size.matchAll(/([\d.]+)px/g)) assert(Number(match[1]) >= 12, 'Small font-size: ' + size);
  }
});
check('Every product keeps one copy panel between its price and condition', () => {
  for (const file of htmlFiles.slice(1)) {
    const html = read(file);
    assert.strictEqual((html.match(/data-copy>/g) || []).length, 1);
    const price = html.indexOf('class="item-price"');
    const copy = html.indexOf('class="copy-panel"');
    const condition = html.indexOf('class="condition-block"');
    assert(price < copy && copy < condition, file);
    assert(/class="item-summary">[\s\S]*?class="item-price"[\s\S]*?class="copy-panel"/.test(html));
  }
});
check('Both dark selectors have identical tokens; text contrast is at least 4.5:1', () => {
  const css = read('assets/css/market.css');
  const blocks = Array.from(css.matchAll(/:root[^{}]*\{([^}]+)\}/g), match => match[1]);
  assert.strictEqual(blocks.length, 3);
  const tokens = block => Object.fromEntries(Array.from(block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/g), m => [m[1], m[2]]));
  assert.deepStrictEqual(tokens(blocks[1]), tokens(blocks[2]));
  function luminance(hex) {
    const values = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => x <= .04045 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4));
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  }
  for (const block of [blocks[0], blocks[2]]) {
    const t = tokens(block);
    const pairs = ['bg', 'surface', 'soft', 'hero'].flatMap(bg => ['text', 'muted', 'accent'].map(fg => [fg, bg]));
    pairs.push(['on-accent', 'accent'], ['on-accent', 'accent-hover'], ['banner-text', 'banner']);
    for (const [foreground, background] of pairs) {
      const a = luminance(t[foreground]); const b = luminance(t[background]);
      const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      assert(ratio >= 4.5, foreground + '/' + background + ': ' + ratio.toFixed(2));
    }
  }
  assert(css.includes('prefers-reduced-motion'));
  assert(css.includes(':focus-visible'));
  assert(/body\s*\{[^}]*background: var\(--bg\)/.test(css));
});
class Element {
  constructor(attrs = {}) { this.attrs = attrs; this.events = {}; this.textContent = ''; this.value = ''; this.hidden = false; this.focused = false; this.classes = new Set(); this.classList = { add: name => this.classes.add(name), remove: name => this.classes.delete(name) }; }
  getAttribute(name) { return this.attrs[name] || null; }
  setAttribute(name, value) { this.attrs[name] = value; }
  addEventListener(name, fn) { this.events[name] = fn; }
  fire(name, event = {}) { return this.events[name](event); }
  focus() { this.focused = true; }
  select() { this.selected = true; }
  setSelectionRange(start, end) { this.selection = [start, end]; }
}
function browser(options = {}) {
  const rootElement = new Element();
  const theme = new Element(); const link = new Element(); const toast = new Element();
  const url = new Element(); const copy = new Element(); const help = new Element(); const purchase = new Element();
  const main = new Element(); const caption = new Element(); const count = new Element();
  const thumbs = products[0].images.map(image => new Element({ 'data-image': '../assets/img/' + image.file, 'data-caption-text': image.caption }));
  const chips = ['all', 'camera', 'bag'].map(filter => new Element({ 'data-filter': filter }));
  const cards = products.map(p => new Element({ 'data-category': p.category }));
  const gallery = { querySelector: selector => selector === '[data-main-image]' ? main : caption, querySelectorAll: () => thumbs };
  const single = { '[data-theme-toggle]': theme, '[data-toast]': toast, '[data-page-url]': url, '[data-copy]': copy, '[data-copy-help]': help, '[data-gallery]': gallery, '[data-result-count]': count };
  const multiple = { '[data-app-link]': [link], '[data-filter]': chips, '[data-category]': cards, '[data-purchase]': [purchase] };
  const document = { documentElement: rootElement, querySelector: s => single[s] || null, querySelectorAll: s => multiple[s] || [] };
  let saved = options.saved || null;
  let copied;
  let change;
  const media = { matches: !!options.dark, addEventListener: (event, fn) => { change = fn; } };
  const window = {
    location: { href: 'file:///demo/items/holo-card.html?demo=1#photo' },
    MarketConfig: { appUrl: 'app-target' },
    localStorage: { getItem: () => { if (options.storageThrows) throw Error('unavailable'); return saved; }, setItem: (key, value) => { if (options.storageThrows) throw Error('unavailable'); saved = value; } },
    matchMedia: () => media, setTimeout: () => 1, clearTimeout: () => {}
  };
  const navigator = options.noClipboard ? {} : { clipboard: { writeText: async value => { if (options.clipboardRejects) throw Error('denied'); copied = value; } } };
  vm.runInNewContext(read('assets/js/market.js'), { window, document, navigator });
  return { root: rootElement, theme, link, toast, url, copy, help, purchase, main, caption, thumbs, chips, cards, count, media, change: () => change(), copied: () => copied, saved: () => saved };
}
check('Category filtering and reset preserve data order and report counts', () => {
  const b = browser();
  b.chips[1].fire('click');
  assert.deepStrictEqual(b.cards.map(card => !card.hidden), products.map(p => p.category === 'camera'));
  assert.strictEqual(b.count.textContent, '1 件の商品');
  assert.strictEqual(b.chips[1].getAttribute('aria-pressed'), 'true');
  b.chips[2].fire('click');
  assert.deepStrictEqual(b.cards.map(card => !card.hidden), products.map(p => p.category === 'bag'));
  b.chips[0].fire('click');
  assert(b.cards.every(card => !card.hidden));
  assert.strictEqual(b.count.textContent, '6 件の商品');
});
check('Gallery click, arrow wrapping, Home/End, focus and live captions', () => {
  const b = browser();
  b.thumbs[2].fire('click');
  assert.strictEqual(b.main.src, '../assets/img/holo-card-3.svg');
  assert.strictEqual(b.main.alt, products[0].images[2].caption);
  assert.strictEqual(b.caption.textContent, '3 / 4 ' + products[0].images[2].caption);
  assert.strictEqual(b.thumbs[2].getAttribute('aria-pressed'), 'true');
  let prevented = false;
  b.thumbs[0].fire('keydown', { key: 'ArrowLeft', preventDefault: () => { prevented = true; } });
  assert(prevented && b.thumbs[3].focused);
  assert.strictEqual(b.main.src, '../assets/img/holo-card-4.svg');
  b.thumbs[3].fire('keydown', { key: 'ArrowRight', preventDefault() {} });
  assert.strictEqual(b.main.src, '../assets/img/holo-card-1.svg');
  b.thumbs[0].fire('keydown', { key: 'End', preventDefault() {} });
  assert.strictEqual(b.main.src, '../assets/img/holo-card-4.svg');
  b.thumbs[3].fire('keydown', { key: 'Home', preventDefault() {} });
  assert.strictEqual(b.main.src, '../assets/img/holo-card-1.svg');
});
check('System theme, stored overrides, storage denial and demo purchase notice', () => {
  const b = browser({ dark: true, storageThrows: true });
  assert.strictEqual(b.theme.textContent, 'ライトに切替');
  assert.strictEqual(b.root.getAttribute('data-theme'), null);
  b.media.matches = false; b.change();
  assert.strictEqual(b.theme.textContent, 'ダークに切替');
  b.theme.fire('click');
  assert.strictEqual(b.root.getAttribute('data-theme'), 'dark');
  const stored = browser({ dark: true, saved: 'light' });
  assert.strictEqual(stored.root.getAttribute('data-theme'), 'light');
  stored.theme.fire('click');
  assert.strictEqual(stored.saved(), 'dark');
  b.purchase.fire('click');
  assert.strictEqual(b.toast.textContent, 'デモのため購入できません');
  assert.strictEqual(b.link.href, 'app-target');
});
async function asyncChecks() {
  const success = browser();
  assert.strictEqual(success.url.value, 'file:///demo/items/holo-card.html');
  await success.copy.fire('click');
  assert.strictEqual(success.copied(), success.url.value);
  assert.strictEqual(success.help.textContent, 'コピーしました。体験版の AI出品に貼り付けてください');
  assert.strictEqual(success.toast.textContent, success.help.textContent);
  assert(success.toast.classes.has('visible'));
  for (const options of [{ clipboardRejects: true }, { noClipboard: true }]) {
    const fallback = browser(options);
    await fallback.copy.fire('click');
    assert(fallback.url.focused && fallback.url.selected);
    assert.deepStrictEqual(fallback.url.selection, [0, fallback.url.value.length]);
    assert(fallback.help.textContent.includes('長押しでコピーしてください'));
  }
  checks += 1;
  console.log('✓ URL cleaning, clipboard success, denial and unavailable API fallback');
  console.log('\nAll ' + checks + ' test groups passed.');
}
asyncChecks().catch(error => { console.error(error); process.exitCode = 1; });
