'use strict';
// Deterministic, self-contained vector studio illustrations. No image dependencies.
const fs = require('fs');
const path = require('path');
const products = require('../assets/js/products-data.js').products;
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const rect = (x, y, w, h, fill, radius = 0, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" ${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, width = 1, extra = '') => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const shape = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const group = (body, transform = '') => `<g transform="${transform}">${body}</g>`;
const repeat = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
const shadow = (x, y, rx, ry) => ellipse(x, y, rx, ry, '#25222b', 'opacity=".24" filter="url(#blur)"');
const screw = (x, y, r = 6) => circle(x, y, r, 'url(#steel)', 'stroke="#3c4045" stroke-width="1.5"') + line(x - r * .6, y + r * .4, x + r * .6, y - r * .4, '#40434a', 1.5);
function ticks(cx, cy, radius, count, length, color, width) {
  return repeat(count, i => {
    const a = i * Math.PI * 2 / count;
    return line((cx + Math.sin(a) * radius).toFixed(2), (cy - Math.cos(a) * radius).toFixed(2), (cx + Math.sin(a) * (radius - length)).toFixed(2), (cy - Math.cos(a) * (radius - length)).toFixed(2), color, width);
  });
}
const defs = `<defs>
<linearGradient id="bg" x2=".8" y2="1"><stop stop-color="BACKGROUND_LIGHT"/><stop offset="1" stop-color="BACKGROUND_DARK"/></linearGradient>
<linearGradient id="steel" x1="0" y1="0" x2="1" y2=".65"><stop stop-color="#5d636a"/><stop offset=".19" stop-color="#f0f2f3"/><stop offset=".35" stop-color="#a3aab0"/><stop offset=".49" stop-color="#f8f9f8"/><stop offset=".65" stop-color="#707880"/><stop offset=".83" stop-color="#d5d8d9"/><stop offset="1" stop-color="#555d65"/></linearGradient>
<linearGradient id="black" x2=".8" y2="1"><stop stop-color="#53575b"/><stop offset=".3" stop-color="#25282c"/><stop offset=".7" stop-color="#111519"/><stop offset="1" stop-color="#383c40"/></linearGradient>
<linearGradient id="leather" x2=".85" y2="1"><stop stop-color="#45434a"/><stop offset=".35" stop-color="#25242b"/><stop offset=".7" stop-color="#17171d"/><stop offset="1" stop-color="#333139"/></linearGradient>
<linearGradient id="gold" x2=".8" y2="1"><stop stop-color="#8a7042"/><stop offset=".25" stop-color="#f6e7b8"/><stop offset=".45" stop-color="#ba9a5e"/><stop offset=".6" stop-color="#f3e7c6"/><stop offset="1" stop-color="#7a5f36"/></linearGradient>
<radialGradient id="glass" cx=".35" cy=".25" r=".8"><stop stop-color="#769eac"/><stop offset=".25" stop-color="#35505d"/><stop offset=".5" stop-color="#192936"/><stop offset=".8" stop-color="#090f1b"/><stop offset="1" stop-color="#3c5965"/></radialGradient>
<linearGradient id="coating" x2=".8" y2="1"><stop stop-color="#7cdbc8" stop-opacity=".7"/><stop offset=".35" stop-color="#8a6cce" stop-opacity=".15"/><stop offset=".7" stop-color="#c05d9a" stop-opacity=".4"/><stop offset="1" stop-color="#dbc284" stop-opacity=".1"/></linearGradient>
<linearGradient id="glint" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".6"/><stop offset=".45" stop-color="#ffffff" stop-opacity=".03"/><stop offset="1" stop-color="#ffffff" stop-opacity=".12"/></linearGradient>
<linearGradient id="foil" x2="1" y2=".75"><stop stop-color="#adaddc"/><stop offset=".17" stop-color="#a9e1df"/><stop offset=".33" stop-color="#e6e5a6"/><stop offset=".5" stop-color="#e4a6c4"/><stop offset=".68" stop-color="#a2b9ec"/><stop offset=".85" stop-color="#95d9cb"/><stop offset="1" stop-color="#e6c598"/></linearGradient>
<linearGradient id="blue" x2="1" y2="1"><stop stop-color="#193252"/><stop offset=".5" stop-color="#437f9d"/><stop offset="1" stop-color="#152a51"/></linearGradient>
<linearGradient id="armor" x2="1" y2=".6"><stop stop-color="#b2d0cf"/><stop offset=".2" stop-color="#627f85"/><stop offset=".55" stop-color="#294953"/><stop offset=".8" stop-color="#61858a"/><stop offset="1" stop-color="#193a46"/></linearGradient>
<linearGradient id="cape" x2="1" y2=".3"><stop stop-color="#4a344b"/><stop offset=".3" stop-color="#8e6976"/><stop offset=".5" stop-color="#4d354d"/><stop offset=".75" stop-color="#a27b86"/><stop offset="1" stop-color="#4d3448"/></linearGradient>
<linearGradient id="skin" x2="1" y2=".3"><stop stop-color="#f3cdb2"/><stop offset=".5" stop-color="#c8937e"/><stop offset="1" stop-color="#825a54"/></linearGradient>
<filter id="blur" x="-.5" y="-.8" width="2" height="2.6"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" seed="12" result="noise"/><feColorMatrix in="noise" type="saturate" values="0"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="soft-light"/></filter>
<pattern id="pebble" width="9" height="8" patternUnits="userSpaceOnUse"><path d="M1 2q2-2 4 0M4 6q2-2 4 0" fill="none" stroke="#b4a5ac" stroke-opacity=".14" stroke-width=".7"/></pattern>
<pattern id="weave" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 0L7 7M0 7L7 0" stroke="#d3c3b5" stroke-opacity=".14" stroke-width=".7"/></pattern>
</defs>`;
function render(product, i, body, palette) {
  const title = `${product.images[i].caption} — ${product.slug} のデモ用商品イラスト`;
  const xmlNamespace = 'http:' + '//www.w3.org/2000/svg';
  return `<svg xmlns="${xmlNamespace}" width="800" height="800" viewBox="0 0 800 800" role="img" aria-labelledby="title"><title id="title">${esc(title)}</title>${defs.replace('BACKGROUND_LIGHT', palette[0]).replace('BACKGROUND_DARK', palette[1])}${rect(0, 0, 800, 800, 'url(#bg)')}${ellipse(240, 170, 440, 300, '#fff', 'opacity=".15" filter="url(#blur)"')}${body}</svg>\n`;
}
function cardFace(back) {
  let body = rect(217, 116, 366, 526, '#9a91a1', 19) + rect(220, 112, 360, 526, back ? 'url(#blue)' : 'url(#foil)', 18, 'stroke="#eee5cb" stroke-width="3"');
  if (back) {
    body += rect(238, 130, 324, 490, 'none', 13, 'stroke="#a3b7ce" stroke-width="3"');
    body += repeat(14, i => ellipse(400, 375, 44 + i * 8, 75 + i * 11, 'none', `stroke="${i % 2 ? '#679cb7' : '#d0d6de'}" stroke-opacity=".35" transform="rotate(${i * 13} 400 375)"`));
    body += shape('M400 278L464 375 400 472 336 375Z', 'url(#steel)', 'opacity=".8"') + circle(400, 375, 43, 'url(#blue)') + circle(400, 375, 28, 'none', 'stroke="#bacadf" stroke-width="2"');
    body += repeat(4, i => circle(i % 2 ? 539 : 261, i < 2 ? 156 : 592, 7, '#c2d5e1'));
  } else {
    body += rect(241, 140, 318, 378, '#303955', 10, 'stroke="#f9edca" stroke-width="3"');
    body += rect(247, 146, 306, 366, 'url(#blue)', 7);
    body += repeat(30, i => circle(260 + ((i * 73) % 279), 160 + ((i * 47) % 332), i % 3 + 1, '#e5f6df', 'opacity=".6"'));
    // An original faceted celestial bloom, with no character or lettering.
    body += repeat(9, i => shape('M400 325Q342 258 400 190Q458 258 400 325Z', i % 2 ? 'url(#foil)' : 'url(#steel)', `transform="rotate(${i * 40} 400 325)" opacity=".86"`));
    body += shape('M400 252L449 325 400 400 351 325Z', 'url(#gold)', 'stroke="#f7e6c4" stroke-width="2"') + shape('M400 270L430 325 400 380 370 325Z', 'url(#glass)');
    body += shape('M267 473Q340 407 402 460T536 447L536 505H254Z', 'url(#foil)', 'opacity=".6"');
    body += rect(245, 539, 307, 69, 'url(#gold)', 7, 'opacity=".65"');
    body += repeat(6, i => shape(`M${270 + i * 46} 563l7 10-7 10-7-10Z`, '#62627c', 'opacity=".7"'));
    body += shape('M230 125L320 116 577 555 577 625 553 636Z', 'url(#glint)');
  }
  return body;
}
function cards(view) {
  if (view === 0) return shadow(420, 667, 215, 30) + group(cardFace(false), 'rotate(-8 400 400)');
  if (view === 1) return shadow(412, 671, 210, 28) + group(cardFace(true), 'rotate(7 400 400)');
  if (view === 2) return shadow(410, 692, 310, 30) + group(cardFace(false), 'translate(-194 -37) scale(1.7) rotate(-14 400 400)') + line(306, 234, 322, 230, '#d7ccba', 1.3, 'opacity=".8"') + line(319, 242, 328, 239, '#6b6c85', .8, 'opacity=".5"');
  return shadow(400, 698, 235, 29) + group(rect(184, 76, 432, 620, '#e9f3fa', 15, 'fill-opacity=".3" stroke="#b5c8d4" stroke-width="5"') + rect(198, 94, 404, 586, 'none', 11, 'stroke="#fff" stroke-opacity=".8" stroke-width="3"') + rect(205, 103, 390, 556, '#deebf2', 9, 'fill-opacity=".4" stroke="#a3bbc7"') + cardFace(false) + line(196, 100, 602, 100, '#d2e4ed', 10) + shape('M198 130L252 105 590 626 590 673 556 673Z', 'url(#glint)') + line(607, 121, 607, 655, '#fff', 3, 'opacity=".85"'), 'rotate(-5 400 400)');
}
function dial(x, y, r) { return circle(x, y, r, 'url(#black)', 'stroke="#686c70" stroke-width="3"') + ticks(x, y, r - 4, 36, 6, '#9a9c9e', 2) + circle(x, y, r - 12, '#272a2e') + line(x, y - r + 15, x, y - r + 22, '#ece5cb', 3) + screw(x, y, 5); }
function cameraFront() {
  let b = rect(137, 281, 526, 304, 'url(#black)', 30, 'stroke="#15181c" stroke-width="4"');
  b += rect(150, 361, 503, 203, 'url(#pebble)', 17);
  b += shape('M142 355L142 292Q142 267 168 267H305L344 215H445L492 267H632Q659 269 659 292V355Z', 'url(#black)', 'stroke="#676c72" stroke-width="2"');
  b += shape('M316 278L352 229H436L475 278Z', '#3e4247') + rect(357, 258, 72, 18, '#151a21', 3) + line(350, 230, 434, 230, '#9a9c9e', 2);
  b += rect(166, 244, 99, 31, 'url(#black)', 7) + rect(539, 246, 80, 28, 'url(#black)', 7);
  b += repeat(12, i => line(172 + i * 7, 248, 172 + i * 7, 269, '#797b80', 1));
  b += circle(400, 422, 120, '#0f1216', 'stroke="#575c63" stroke-width="5"') + circle(400, 422, 108, 'url(#steel)') + circle(400, 422, 89, '#14171c') + circle(400, 422, 76, '#080c11');
  b += rect(350, 374, 100, 88, 'url(#glass)', 3) + shape('M352 460L448 377H352Z', '#9aaab0', 'opacity=".36"') + line(354, 458, 446, 458, '#8b949e', 3);
  b += repeat(4, i => screw(400 + Math.sin(i * Math.PI / 2 + .6) * 98, 422 + Math.cos(i * Math.PI / 2 + .6) * 98, 5));
  b += circle(477, 344, 5, '#ac5b48') + rect(535, 375, 17, 60, 'url(#steel)', 8) + circle(543, 430, 12, 'url(#black)');
  b += rect(126, 316, 20, 38, 'url(#steel)', 6) + rect(656, 316, 20, 38, 'url(#steel)', 6) + screw(175, 304) + screw(627, 304);
  b += line(170, 571, 254, 574, '#96908c', 2, 'opacity=".55"') + line(580, 285, 625, 286, '#96908c', 1.5, 'opacity=".6"');
  return b;
}
function cameras(view) {
  if (view === 0) return shadow(405, 611, 270, 33) + group(cameraFront(), 'rotate(-5 400 400)');
  if (view === 1) {
    let b = rect(105, 264, 449, 298, 'url(#black)', 23) + shape('M222 265L259 216H374L411 266Z', 'url(#black)') + rect(272, 237, 91, 52, 'url(#steel)', 7) + rect(281, 245, 73, 35, 'url(#glass)', 3);
    b += rect(127, 320, 405, 222, '#101216', 8, 'stroke="#767778" stroke-width="3"') + rect(217, 337, 216, 183, '#2c2d31', 2);
    b += repeat(9, i => line(225, 348 + i * 19, 425, 348 + i * 19, '#55565a', 1.5));
    b += rect(146, 330, 51, 200, 'url(#black)', 18) + ellipse(171, 332, 25, 8, 'url(#steel)') + rect(460, 327, 42, 207, 'url(#black)', 12);
    b += repeat(12, i => rect(455, 338 + i * 16, 8, 6, '#b8b4a5', 1) + rect(501, 338 + i * 16, 8, 6, '#b8b4a5', 1));
    b += line(209, 326, 209, 531, '#afb1b0', 5) + line(441, 326, 441, 531, '#afb1b0', 5);
    b += shape('M550 290L710 248 722 533 553 558Z', 'url(#black)', 'stroke="#777779" stroke-width="3"') + shape('M573 322L687 293 696 502 575 524Z', '#1b1d22', 'stroke="#595b60" stroke-width="2"') + shape('M590 343L675 321 681 482 590 501Z', 'url(#black)');
    b += rect(540, 305, 17, 227, 'url(#steel)', 4) + dial(169, 273, 30) + shape('M442 274L520 233 540 244 470 293Z', 'url(#steel)');
    return shadow(409, 594, 299, 34) + group(b, 'rotate(-4 400 400)');
  }
  if (view === 2) {
    let b = rect(119, 289, 563, 223, 'url(#black)', 36, 'stroke="#6c7074" stroke-width="3"');
    b += rect(136, 309, 530, 170, '#393c41', 22) + shape('M302 309L348 253H446L492 309V466H302Z', 'url(#black)', 'stroke="#818489" stroke-width="2"');
    b += rect(354, 321, 83, 64, 'url(#steel)', 5) + rect(362, 329, 67, 47, '#24272c', 2) + line(367, 333, 367, 372, '#c3c7c9', 5) + line(430, 333, 430, 372, '#c3c7c9', 5);
    b += dial(217, 387, 62) + dial(560, 376, 60) + circle(634, 434, 23, 'url(#steel)') + circle(634, 434, 13, '#242b32');
    b += shape('M549 413Q582 436 653 467L650 491Q572 480 534 443Z', 'url(#black)', 'stroke="#858587" stroke-width="2"');
    b += rect(350, 481, 91, 23, '#14171c', 5) + screw(151, 473) + screw(659, 315) + line(324, 286, 341, 262, '#b2b1ab', 2);
    return shadow(401, 556, 282, 32) + group(b, 'rotate(-12 400 400)');
  }
  let b = shape('M192 528C64 238 201 104 422 182S735 275 631 464L589 479C688 283 522 278 413 230S165 197 225 512Z', 'url(#black)', 'stroke="#5b5c60" stroke-width="2"');
  b += shape('M194 494C116 242 223 155 420 207S701 288 609 453', 'none', 'stroke="#b3a99a" stroke-width="2" stroke-dasharray="5 5" opacity=".5"');
  b += rect(170, 477, 73, 88, 'url(#steel)', 8) + rect(182, 489, 49, 62, '#28292c', 4) + rect(178, 503, 57, 23, '#55565a', 3);
  b += circle(429, 526, 126, 'url(#black)', 'stroke="#75787b" stroke-width="4"') + circle(429, 526, 108, '#23262a', 'stroke="#4e5257" stroke-width="3"') + ticks(429, 526, 121, 70, 8, '#777a7c', 2) + rect(360, 514, 139, 24, '#1b1e22', 8) + screw(590, 480, 10);
  return shadow(426, 665, 224, 31) + b;
}
function bagBody(back) {
  let b = shape('M188 348C183 235 216 119 400 121S614 243 611 351', 'none', 'stroke="#26252b" stroke-width="28"') + shape('M188 348C183 235 216 119 400 121S614 243 611 351', 'none', 'stroke="#6b636b" stroke-width="2"');
  b += shape('M180 300Q400 265 620 300L651 584Q645 624 603 633H193Q151 625 149 585Z', 'url(#leather)', 'stroke="#5e5760" stroke-width="3"');
  b += shape('M180 300Q400 265 620 300L651 584Q645 624 603 633H193Q151 625 149 585Z', 'url(#pebble)');
  b += shape('M184 325L167 575Q164 611 200 614H599Q630 607 632 576L615 324', 'none', 'stroke="#857581" stroke-width="2" stroke-dasharray="4 5" opacity=".55"');
  if (!back) {
    b += shape('M177 300Q400 274 624 300L600 455Q400 527 199 455Z', 'url(#leather)', 'stroke="#625b65" stroke-width="2"') + shape('M177 300Q400 274 624 300L600 455Q400 527 199 455Z', 'url(#pebble)');
    b += shape('M190 311L210 447Q399 511 588 447L611 311', 'none', 'stroke="#a18f96" stroke-width="1.5" stroke-dasharray="4 5" opacity=".5"');
    b += rect(344, 426, 112, 45, 'url(#gold)', 7, 'stroke="#8e7547" stroke-width="2"') + rect(353, 434, 94, 27, 'none', 3, 'stroke="#f9edc8" stroke-opacity=".6"');
  } else {
    b += shape('M230 385Q400 371 571 385', 'none', 'stroke="#111217" stroke-width="13"') + repeat(45, i => line(237 + i * 7.3, 379, 237 + i * 7.3, 387, '#a79b89', 2));
    b += rect(542, 385, 13, 43, 'url(#gold)', 4) + shape('M225 415L231 535Q402 558 570 531L578 416', 'none', 'stroke="#70646f" stroke-width="2"');
  }
  b += ellipse(178, 316, 17, 30, 'none', 'stroke="url(#gold)" stroke-width="9"') + ellipse(622, 316, 17, 30, 'none', 'stroke="url(#gold)" stroke-width="9"');
  b += shape('M170 583l13 20 18 3M608 610l19-9 6-13', 'none', 'stroke="#9c8b8d" stroke-width="2" opacity=".4"');
  return b;
}
function bags(view) {
  if (view < 2) return shadow(405, 661, 271, 31) + group(bagBody(view === 1), view ? 'rotate(5 400 400)' : 'rotate(-4 400 400)');
  if (view === 2) return shadow(404, 686, 300, 32) + group(rect(81, 135, 638, 529, 'url(#leather)', 48) + rect(81, 135, 638, 529, 'url(#pebble)', 48) + shape('M79 368Q397 533 720 367', 'none', 'stroke="#8a7a83" stroke-width="3"') + shape('M85 382Q396 548 714 381', 'none', 'stroke="#b4a0a8" stroke-width="2" stroke-dasharray="6 7" opacity=".65"') + rect(226, 347, 348, 147, 'url(#gold)', 20, 'stroke="#9e814c" stroke-width="5"') + rect(244, 365, 311, 109, 'none', 12, 'stroke="#fff0ca" stroke-width="2" opacity=".6"') + line(267, 458, 303, 452, '#917348', 1.2) + line(468, 390, 510, 386, '#fff4cf', 1.5), 'rotate(-9 400 400)');
  let b = shape('M155 434C65 245 169 119 393 115S736 188 642 457', 'none', 'stroke="#26232b" stroke-width="24"') + shape('M155 434C65 245 169 119 393 115S736 188 642 457', 'none', 'stroke="#8d7a83" stroke-width="1.5" stroke-dasharray="5 6"');
  b += shape('M176 386L214 223Q399 168 585 223L625 383Z', 'url(#leather)', 'stroke="#82717c" stroke-width="2"') + shape('M220 243Q400 197 578 243L595 352Q397 298 204 352Z', '#5b4852') + shape('M220 243Q400 197 578 243L595 352Q397 298 204 352Z', 'url(#weave)');
  b += shape('M153 403Q400 311 647 403L672 585Q400 704 129 585Z', 'url(#leather)', 'stroke="#6a5d67" stroke-width="3"') + ellipse(400, 408, 245, 83, '#16151b', 'stroke="#7d6973" stroke-width="5"');
  b += ellipse(400, 407, 221, 62, '#54404b') + ellipse(400, 407, 221, 62, 'url(#weave)') + shape('M195 421Q400 357 606 421Q401 479 195 421Z', '#2c222b') + shape('M234 401Q400 362 565 401', 'none', 'stroke="#b59a86" stroke-width="5" stroke-dasharray="3 4"');
  b += rect(317, 251, 167, 61, '#44333e', 8, 'stroke="#8f7582" stroke-width="2"') + rect(374, 260, 54, 24, 'url(#gold)', 4) + screw(173, 427, 10) + screw(628, 427, 10);
  return shadow(405, 665, 278, 30) + b;
}
function bracelet(x, y, count, width = 136) {
  return repeat(count, i => rect(x, y + i * 29, width, 27, 'url(#steel)', 5, 'stroke="#666d73" stroke-width="1.4"') + rect(x + width * .28, y + i * 29 + 2, width * .44, 23, 'url(#steel)', 3, 'stroke="#93999f" stroke-width="1"') + line(x + 5, y + i * 29 + 3, x + width - 5, y + i * 29 + 3, '#fff', 1, 'opacity=".6"'));
}
function watchFace(back) {
  let b = bracelet(332, 67, 7) + bracelet(332, 503, 8);
  b += shape('M306 248L323 199H477L494 248V548L477 593H323L306 548Z', 'url(#steel)', 'stroke="#646b73" stroke-width="3"');
  b += rect(553, 367, 35, 65, 'url(#steel)', 9) + repeat(7, i => line(557 + i * 4, 374, 557 + i * 4, 425, '#5f666b', 1.6));
  b += circle(400, 400, 177, 'url(#steel)', 'stroke="#696f75" stroke-width="3"') + circle(400, 400, 156, back ? 'url(#steel)' : '#d7d9d6', 'stroke="#737a80" stroke-width="3"');
  if (back) {
    b += circle(400, 400, 135, 'none', 'stroke="#91999e" stroke-width="2"') + circle(400, 400, 125, 'url(#steel)', 'stroke="#e1e3e2" stroke-width="1"');
    b += repeat(6, i => group(rect(392, 253, 16, 7, '#575e65', 2), `rotate(${i * 60} 400 400)`));
    b += shape('M350 410Q400 370 450 410M358 425Q400 395 442 425', 'none', 'stroke="#7a8389" stroke-width="2" opacity=".5"');
  } else {
    b += circle(400, 400, 150, 'url(#glint)') + ticks(400, 400, 144, 60, 7, '#747d80', 1.3) + ticks(400, 400, 135, 12, 20, '#525b60', 7) + ticks(400, 400, 134, 12, 17, '#eff0e9', 2);
    b += rect(448, 384, 78, 31, 'url(#steel)', 3, 'stroke="#747b80" stroke-width="2"') + rect(454, 389, 38, 21, '#e9e7db', 1) + rect(496, 389, 24, 21, '#e9e7db', 1);
    // Calendar windows are intentionally blank: no readable lettering in artwork.
    b += shape('M394 404L331 312 344 311 407 396Z', '#343b40', 'stroke="#f5f5e9" stroke-width="2"') + shape('M396 394L474 318 482 321 405 407Z', '#343b40', 'stroke="#f5f5e9" stroke-width="2"') + line(384, 441, 436, 293, '#79574b', 2) + circle(400, 400, 9, 'url(#steel)');
    b += shape('M268 337Q320 230 445 260L535 425Q414 299 268 337Z', '#fff', 'opacity=".2"') + line(306, 457, 333, 439, '#fff', 1.2, 'opacity=".5"') + line(315, 463, 329, 454, '#848b8d', .6);
  }
  return b;
}
function watches(view) {
  if (view < 2) return shadow(411, 711, 184, 31) + group(watchFace(view === 1), `rotate(${view ? 17 : -18} 400 400)`);
  if (view === 2) {
    let b = group(bracelet(100, 340, 5, 125), 'rotate(-80 163 400)') + group(bracelet(540, 357, 5, 125), 'rotate(-80 603 410)');
    b += ellipse(401, 439, 194, 79, 'url(#steel)', 'stroke="#6c737b" stroke-width="3"') + rect(208, 355, 387, 84, 'url(#steel)', 30) + ellipse(401, 354, 194, 68, 'url(#steel)', 'stroke="#737b82" stroke-width="3"') + ellipse(401, 348, 172, 52, '#d2d8d6', 'stroke="#f0f4f5" stroke-width="4"') + ellipse(401, 346, 160, 47, 'url(#glint)');
    b += line(400, 348, 325, 331, '#454d52', 4) + line(400, 348, 456, 324, '#454d52', 4) + rect(370, 407, 72, 75, 'url(#steel)', 9) + ellipse(406, 478, 36, 12, 'url(#steel)') + repeat(12, i => line(374 + i * 5.5, 416, 374 + i * 5.5, 474, '#555f68', 2));
    return shadow(401, 558, 281, 29) + group(b, 'rotate(-8 400 400)');
  }
  let b = bracelet(309, 70, 8, 182) + bracelet(309, 514, 7, 182);
  b += rect(302, 290, 196, 245, 'url(#steel)', 26, 'stroke="#7d858d" stroke-width="3"') + rect(319, 308, 162, 205, 'none', 16, 'stroke="#e0e5e4" stroke-width="3"') + rect(334, 328, 132, 164, 'url(#steel)', 10, 'stroke="#858d94" stroke-width="2"') + rect(350, 467, 100, 28, 'url(#black)', 5) + line(321, 321, 478, 321, '#fbfcfa', 3) + line(354, 362, 387, 375, '#7e868a', 1, 'opacity=".5"') + line(367, 373, 398, 385, '#fff', 1, 'opacity=".65"');
  return shadow(406, 722, 185, 26) + group(b, 'rotate(24 400 400)');
}
function optic(cx, cy, r, rear) {
  let b = circle(cx, cy, r, 'url(#black)', 'stroke="#85878b" stroke-width="3"') + ticks(cx, cy, r - 3, 100, 7, '#818285', 1.6) + circle(cx, cy, r * .87, rear ? 'url(#steel)' : '#171c23', 'stroke="#74797f" stroke-width="2"');
  if (rear) b += repeat(4, i => group(shape(`M${cx - 30} ${cy - r * .81}h60v17h-60Z`, '#cdd1d3'), `rotate(${i * 90} ${cx} ${cy})`)) + repeat(4, i => screw(cx + Math.sin(i * Math.PI / 2 + .5) * r * .74, cy + Math.cos(i * Math.PI / 2 + .5) * r * .74, 7));
  const gr = r * (rear ? .54 : .73);
  b += circle(cx, cy, gr + 9, '#0b1017', 'stroke="#51585e" stroke-width="4"') + circle(cx, cy, gr, 'url(#glass)');
  b += repeat(7, i => group(shape(`M${cx} ${cy - gr * .4}L${cx + gr * .87} ${cy - gr * .48}L${cx + gr * .35} ${cy + gr * .37}L${cx} ${cy}Z`, '#536069', 'fill-opacity=".14" stroke="#a9b0a9" stroke-opacity=".1"'), `rotate(${i * 360 / 7} ${cx} ${cy})`));
  b += circle(cx, cy, gr, 'url(#coating)') + ellipse(cx - gr * .28, cy - gr * .39, gr * .52, gr * .17, '#e3f7ed', `opacity=".35" transform="rotate(-32 ${cx} ${cy})"`) + ellipse(cx + gr * .34, cy + gr * .51, gr * .29, gr * .07, '#c59cdd', 'opacity=".45"') + circle(cx, cy, gr * .88, 'none', 'stroke="#87b7c0" stroke-width="2" opacity=".24"');
  return b;
}
function lenses(view) {
  if (view === 1 || view === 2) return shadow(407, 657, 224, 31) + group(optic(400, 385, 235, view === 2), view === 2 ? 'rotate(15 400 400)' : '') + (view === 2 ? rect(543, 218, 24, 60, 'url(#gold)', 4) : '');
  if (view === 0) {
    let b = rect(216, 246, 369, 313, 'url(#black)', 22, 'stroke="#474e54" stroke-width="3"');
    b += ellipse(400, 554, 184, 61, 'url(#black)', 'stroke="#5c6065" stroke-width="3"') + rect(216, 431, 369, 92, 'url(#black)');
    b += repeat(64, i => line(222 + i * 5.65, 430, 222 + i * 5.65, 524, i % 2 ? '#62686b' : '#080d12', 2));
    b += ellipse(400, 429, 184, 57, 'url(#black)', 'stroke="#76797b" stroke-width="2"') + rect(211, 312, 378, 103, 'url(#black)');
    b += repeat(68, i => line(216 + i * 5.5, 321, 216 + i * 5.5, 414, i % 2 ? '#64696d' : '#151a20', 2.5));
    b += ellipse(400, 310, 188, 69, 'url(#black)', 'stroke="#686d71" stroke-width="4"') + group(optic(400, 320, 175, false), 'translate(0 182) scale(1 .4)');
    b += ellipse(400, 537, 185, 49, 'none', 'stroke="#d1d1c8" stroke-width="4"') + repeat(18, i => line(263 + i * 16, 543 + Math.sin(i / 17 * Math.PI) * 35, 263 + i * 16, 550 + Math.sin(i / 17 * Math.PI) * 35, '#f2ead7', 2));
    b += circle(403, 565, 4, '#c19b66') + line(399, 436, 399, 453, '#efe2c3', 3);
    return shadow(410, 652, 234, 32) + group(b, 'rotate(-13 400 400)');
  }
  let b = ellipse(294, 446, 163, 151, '#151b20') + circle(294, 419, 164, 'url(#black)', 'stroke="#6d7478" stroke-width="3"') + ticks(294, 419, 158, 80, 8, '#70777b', 2) + circle(294, 419, 144, '#252b30', 'stroke="#464f56" stroke-width="2"') + rect(177, 387, 84, 66, '#10161c', 10, 'stroke="#495159" stroke-width="3"') + rect(327, 387, 84, 66, '#10161c', 10, 'stroke="#495159" stroke-width="3"') + line(194, 400, 194, 439, '#737b80', 3) + line(392, 400, 392, 439, '#737b80', 3);
  b += rect(504, 318, 165, 163, 'url(#black)', 18) + ellipse(587, 479, 82, 29, 'url(#black)') + repeat(25, i => line(510 + i * 6.4, 343, 510 + i * 6.4, 468, '#686e72', 1.8)) + ellipse(587, 323, 83, 35, 'url(#black)', 'stroke="#70777d" stroke-width="3"') + ellipse(587, 321, 65, 25, '#272e35');
  return shadow(386, 612, 280, 34) + group(b, 'rotate(-9 400 400)');
}
function head(back) {
  if (back) return shape('M354 205Q340 130 400 118Q464 124 451 204L433 236H371Z', 'url(#armor)', 'stroke="#24414c" stroke-width="3"') + shape('M400 124L414 211 400 242 385 209Z', 'url(#gold)') + line(358, 177, 444, 177, '#9eb1b2', 2);
  let b = shape('M355 170Q358 118 399 117Q444 119 447 169L437 220 408 244 378 230 358 206Z', 'url(#skin)', 'stroke="#866a61" stroke-width="2"');
  b += shape('M350 184L349 142Q362 97 403 107Q448 109 455 152L449 200 433 180 425 139 381 137 365 181Z', 'url(#armor)', 'stroke="#233c49" stroke-width="3"');
  b += shape('M394 106L402 88 414 111 413 149 400 169 391 145Z', 'url(#gold)') + shape('M365 175L383 169 391 177M411 175L429 170 436 177', 'none', 'stroke="#624d4a" stroke-width="4"');
  b += line(369, 183, 385, 183, '#3a393d', 3) + line(414, 183, 430, 181, '#3a393d', 3) + shape('M399 178L394 203 404 205', 'none', 'stroke="#926a5c" stroke-width="2"') + shape('M386 218Q400 223 416 216', 'none', 'stroke="#83574e" stroke-width="2"');
  return b;
}
function warrior(back) {
  let b = ellipse(401, 678, 174, 38, 'url(#black)', 'stroke="#6a7478" stroke-width="3"') + ellipse(401, 663, 171, 32, '#48565b') + shape('M279 650L320 624 421 632 452 615 526 654 472 678 329 680Z', '#6c7473');
  b += shape('M328 230Q290 324 260 554L328 595 381 565 425 588 537 563Q484 349 467 235Z', 'url(#cape)', 'stroke="#483747" stroke-width="3"');
  b += shape('M336 263L299 548M370 275L346 562M443 264L494 545M405 274L425 554', 'none', 'stroke="#c3989f" stroke-width="3" opacity=".3"');
  b += shape('M340 435L331 535 309 635 352 648 389 547 400 463Z', 'url(#armor)', 'stroke="#233e49" stroke-width="3"') + shape('M408 452L415 547 453 648 496 633 467 530 458 434Z', 'url(#armor)', 'stroke="#233e49" stroke-width="3"');
  b += shape('M315 613L350 619 360 655Q325 670 294 653Z', 'url(#black)') + shape('M452 617L486 610 516 650Q485 666 453 653Z', 'url(#black)');
  b += shape('M338 337L326 462 376 489 400 455 430 489 479 464 461 334Z', 'url(#armor)', 'stroke="#223d47" stroke-width="3"') + shape('M345 393L453 392 462 414 335 415Z', 'url(#gold)');
  b += shape('M330 246Q398 217 469 247L455 363 404 388 343 360Z', 'url(#armor)', 'stroke="#1f3b46" stroke-width="3"');
  b += shape(back ? 'M353 258L400 242 447 258 427 346 400 369 374 346Z' : 'M348 269L396 291 452 268 434 339 401 364 366 340Z', 'url(#steel)', 'opacity=".65"');
  b += shape('M322 239L281 260 277 308 332 320 354 272Z', 'url(#armor)', 'stroke="#b39c72" stroke-width="4"') + shape('M466 239L504 264 512 309 465 320 440 270Z', 'url(#armor)', 'stroke="#b39c72" stroke-width="4"');
  b += shape('M283 303L270 360 282 418 314 414 311 350 330 315Z', 'url(#armor)', 'stroke="#253f49" stroke-width="3"') + shape('M474 318L497 373 538 389 552 361 525 343 509 303Z', 'url(#armor)', 'stroke="#253f49" stroke-width="3"');
  b += ellipse(297, 425, 18, 25, 'url(#skin)') + ellipse(547, 371, 22, 18, 'url(#skin)');
  b += shape('M555 211L566 153 579 208 572 595 558 595Z', 'url(#steel)', 'stroke="#4a5e64" stroke-width="2"') + rect(552, 330, 26, 100, 'url(#black)', 5) + rect(528, 323, 75, 12, 'url(#gold)', 4);
  if (back) b += shape('M341 250Q398 280 457 250L483 413 518 565 469 585 423 568 385 591 325 573 292 552 321 393Z', 'url(#cape)', 'stroke="#483747" stroke-width="3"') + shape('M354 276L326 548M390 287L375 561M424 282L434 551M449 278L487 551', 'none', 'stroke="#c3989f" stroke-width="3" opacity=".32"') + shape('M379 251L400 273 421 251', 'none', 'stroke="url(#gold)" stroke-width="5"');
  b += shape('M378 220L377 252 400 265 424 250 423 219Z', 'url(#skin)') + head(back);
  return b;
}
function figures(view) {
  if (view < 2) return shadow(405, 705, 207, 28) + warrior(view === 1);
  if (view === 2) return shadow(405, 724, 264, 31) + group(warrior(false), 'translate(-540 -170) scale(2.35)');
  let b = shape('M197 172L521 121 659 205 636 641 318 700 173 587Z', '#7a777c', 'stroke="#79767b" stroke-width="3"');
  b += shape('M197 172L517 125 502 561 318 696 177 585Z', '#b6aeaa') + shape('M197 172L326 251 659 205 521 121Z', '#dad2c8') + shape('M326 251L659 205 636 641 318 700Z', 'url(#blue)');
  b += shape('M353 279L628 240 612 606 345 654Z', '#273943', 'stroke="#8ca4ac" stroke-width="3"') + shape('M373 299L606 266 591 579 366 620Z', '#536369');
  b += group(warrior(false), 'translate(341 269) scale(.34 .48)');
  b += shape('M373 299L423 292 591 579 555 588Z', '#fff', 'opacity=".1"');
  b += shape('M197 172L220 183 214 211 184 221 190 190Z', '#8d7e72', 'stroke="#ede3d5" stroke-width="2"') + shape('M318 700L317 666 340 678 346 695Z', '#9a8c7b') + shape('M637 641L619 626 626 602 641 606Z', '#aa9c89');
  b += line(200, 193, 224, 214, '#655c57', 2) + line(323, 676, 339, 689, '#605751', 2) + line(533, 632, 584, 621, '#d0c5ad', 1.5, 'opacity=".6"');
  b += shape('M218 264L282 303 277 565 205 518Z', '#9c9691', 'stroke="#cfc5b8" stroke-width="2"') + shape('M230 313L269 336 265 510 220 487Z', '#777977');
  return shadow(417, 727, 263, 29) + b;
}
const makers = { 'holo-card': cards, 'film-camera': cameras, 'shoulder-bag': bags, 'wrist-watch': watches, 'fd-lens': lenses, 'figure-large': figures };
const palettes = { 'holo-card': ['#ede8f4', '#d0c9de'], 'film-camera': ['#e9ecec', '#c9d0ce'], 'shoulder-bag': ['#f0e7dc', '#d8c6b4'], 'wrist-watch': ['#e6eff3', '#bdcfda'], 'fd-lens': ['#e4ece4', '#c2cfbf'], 'figure-large': ['#ede2db', '#cbb9b1'] };
for (const product of products) {
  product.images.forEach((img, i) => fs.writeFileSync(path.join(__dirname, '..', 'assets', 'img', img.file), render(product, i, makers[product.slug](i), palettes[product.slug])));
}
console.log('Created 24 studio product illustrations.');
