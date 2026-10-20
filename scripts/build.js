'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const data = require('../assets/js/products-data.js');
const categories = [['all', 'すべて'], ['trading-card', 'トレカ'], ['camera', 'カメラ'], ['lens', 'レンズ'], ['watch', '腕時計'], ['bag', 'バッグ'], ['figure', 'フィギュア']];
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const price = value => '¥' + value.toLocaleString('ja-JP');
const category = product => categories.find(entry => entry[0] === product.category)[1];
function page(title, content, prefix) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="description" content="eBaseマーケットの架空の商品ページです。購入・取引はできません。">
<title>${escape(title)} | eBaseマーケット(デモ)</title>
<link rel="stylesheet" href="${prefix}assets/css/market.css">
<script src="${prefix}assets/js/config.js" defer></script>
<script src="${prefix}assets/js/market.js" defer></script>
</head>
<body>
<a class="skip-link" href="#main">本文へスキップ</a>
<div class="demo-banner">デモ用の架空ページです。購入・取引はできません</div>
<header class="site-header wrap">
<a class="wordmark" href="${prefix}index.html"><span class="brand-symbol" aria-hidden="true">e</span><span>eBaseマーケット<span class="demo-label">(デモ)</span></span></a>
<div class="header-actions"><a class="app-link" data-app-link target="_blank" rel="noopener noreferrer">オートパイロット体験版へ →<span class="sr-only">（新しいタブ）</span></a><button class="theme-toggle" type="button" data-theme-toggle aria-label="ダークテーマに切り替え" aria-pressed="false">ダークに切替</button></div>
</header>
${content}
<footer class="site-footer wrap"><a class="footer-brand" href="${prefix}index.html">eBaseマーケット(デモ)</a><p>体験版: 表示される数字・料金はすべて例です。</p><p class="small">商品・出品者・画像はすべてデモ用です。</p></footer>
<div class="toast" role="status" aria-live="polite" aria-atomic="true" data-toast></div>
</body>
</html>
`;
}
function card(product, index) {
  return `<article class="product-card" data-category="${escape(product.category)}"><a class="card-link" href="items/${escape(product.slug)}.html"><div class="card-image"><img src="assets/img/${escape(product.images[0].file)}" alt="${escape(product.name)} — ${escape(product.images[0].caption)}" ${product.slug === 'figure-large' ? 'width="825" height="1100"' : 'width="1100" height="825"'} ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}><span class="category-label">${category(product)}</span></div><div class="card-content"><h2>${escape(product.name)}</h2><p class="card-price">${price(product.cost)}<span>(例)</span></p><p class="condition">${escape(product.condition)}</p><div class="card-meta"><span>${escape(product.seller.name)}</span><span>出品日 <time datetime="${product.posted}">${product.posted}</time></span></div></div></a></article>`;
}
function index() {
  return page('商品一覧', `<main id="main" class="wrap">
<section class="hero"><div><p class="eyebrow">ようこそ、デモのマーケットへ</p><h1>気になるひと品から、<br>出品を体験しよう。</h1><p class="hero-intro">商品を選んで URL をコピーし、体験版の「AI出品」に貼り付けてください。</p></div><div class="hero-note"><span class="note-icon" aria-hidden="true">↗</span><p>見つける。コピーする。<br>AI出品を試してみる。</p><span>6つの架空の商品をご用意しました</span></div></section>
<section class="catalog" aria-labelledby="catalog-heading"><div class="section-heading"><h2 id="catalog-heading">商品をさがす</h2><p data-result-count role="status" aria-live="polite">6 件の商品</p></div><div class="filter-chips" role="group" aria-label="カテゴリで絞り込み">${categories.map(([id, label]) => `<button type="button" class="chip" data-filter="${id}" aria-pressed="${id === 'all'}">${label}</button>`).join('')}</div><div class="product-grid">${data.products.map(card).join('\n')}</div></section>
</main>`, '');
}
function item(product, index) {
  const images = product.images;
  const adjacent = (offset, label) => {
    const other = data.products[index + offset];
    return other ? `<a href="${escape(other.slug)}.html"><span>${label}</span>${escape(other.name)}</a>` : '<span></span>';
  };
  return page(product.name, `<main id="main" class="wrap item-main">
<nav class="breadcrumbs" aria-label="パンくず"><a href="../index.html">一覧へ戻る</a><span aria-hidden="true">/</span><span>${category(product)}</span></nav>
<div class="item-layout">
<section class="gallery" aria-label="商品画像" data-gallery><figure class="main-photo"><img data-main-image src="../assets/img/${escape(images[0].file)}" alt="${escape(images[0].caption)}" ${product.slug === 'figure-large' ? 'width="825" height="1100"' : 'width="1100" height="825"'} fetchpriority="high"><figcaption data-caption aria-live="polite" aria-atomic="true"><span>1 / 4</span> ${escape(images[0].caption)}</figcaption></figure><div class="thumbnails" role="group" aria-label="写真を選択">${images.map((img, i) => `<button type="button" data-image="../assets/img/${escape(img.file)}" data-caption-text="${escape(img.caption)}" aria-label="写真 ${i + 1}: ${escape(img.caption)}" aria-pressed="${i === 0}"><img src="../assets/img/${escape(img.file)}" alt="${escape(img.caption)}" ${product.slug === 'figure-large' ? 'width="825" height="1100"' : 'width="1100" height="825"'} loading="lazy"></button>`).join('')}</div><p class="image-note">AI画像ツールで生成したデモ用の商品写真です。実物の写真ではありません。</p></section>
<section class="item-detail" aria-labelledby="item-title"><div class="item-summary"><p class="eyebrow">${category(product)} <span aria-hidden="true">/</span> DEMO ITEM</p><h1 id="item-title">${escape(product.name)}</h1><p class="item-price">${price(product.cost)}<span>(例)</span></p>
<div class="copy-panel"><p class="copy-heading">この商品で、AI出品を体験</p><button type="button" class="button primary" data-copy>このページの URL をコピー <span aria-hidden="true">↗</span></button><label for="page-url">商品ページの URL</label><input id="page-url" data-page-url type="text" readonly spellcheck="false" aria-describedby="copy-help"><p id="copy-help" data-copy-help>コピーした URL を体験版の「AI出品」に貼り付けてください。</p><noscript><p>URL の表示・コピーには JavaScript が必要です。ブラウザのアドレス欄からコピーできます。</p></noscript></div>
</div><div class="item-facts"><div class="condition-block"><h2>商品の状態</h2><p class="condition">${escape(product.condition)}</p><p>${escape(product.conditionNote)}</p></div>
<dl class="seller-details"><div><dt>出品者</dt><dd>${escape(product.seller.name)}<span>${escape(product.seller.rating)} · ${escape(product.seller.area)}</span></dd></div><div><dt>発送元</dt><dd>${escape(product.shipFrom)}</dd></div><div><dt>発送方法</dt><dd>${escape(product.shipMethod)}</dd></div><div><dt>出品日</dt><dd><time datetime="${product.posted}">${product.posted}</time></dd></div></dl>
<button class="button purchase" type="button" aria-disabled="true" data-purchase>購入する <span>（デモ）</span></button><p class="purchase-note">デモのため、購入・取引はできません。</p>
</div></section></div>
<div class="item-information"><section aria-labelledby="description-title"><h2 id="description-title">商品説明</h2>${product.description.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}</section><section aria-labelledby="specs-title"><h2 id="specs-title">商品情報</h2><table><caption class="sr-only">${escape(product.name)}の商品情報</caption><tbody>${product.specs.map(([key, value]) => `<tr><th scope="row">${escape(key)}</th><td>${escape(value)}</td></tr>`).join('')}</tbody></table></section></div>
<nav class="item-navigation" aria-label="前後の商品">${adjacent(-1, '← 前の商品')}${adjacent(1, '次の商品 →')}</nav>
</main>`, '../');
}
function build() {
  fs.mkdirSync(path.join(root, 'items'), { recursive: true });
  fs.writeFileSync(path.join(root, 'index.html'), index());
  data.products.forEach((product, i) => fs.writeFileSync(path.join(root, 'items', product.slug + '.html'), item(product, i)));
  console.log('Built index.html and ' + data.products.length + ' product pages.');
}
if (require.main === module) build();
module.exports = { build, page, item, index, escape };
