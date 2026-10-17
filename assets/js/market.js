(function () {
  'use strict';
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : { matches: false };
  var themeButton = document.querySelector('[data-theme-toggle]');
  var preference = null;
  try { preference = window.localStorage.getItem('market-theme'); } catch (error) { /* Storage can be unavailable on local pages. */ }
  if (preference === 'light' || preference === 'dark') root.setAttribute('data-theme', preference);
  function dark() { return root.getAttribute('data-theme') ? root.getAttribute('data-theme') === 'dark' : media.matches; }
  function updateThemeButton() {
    if (!themeButton) return;
    themeButton.textContent = dark() ? 'ライトに切替' : 'ダークに切替';
    themeButton.setAttribute('aria-label', dark() ? 'ライトテーマに切り替え' : 'ダークテーマに切り替え');
    themeButton.setAttribute('aria-pressed', String(dark()));
  }
  updateThemeButton();
  if (media.addEventListener) media.addEventListener('change', updateThemeButton);
  if (themeButton) themeButton.addEventListener('click', function () {
    var next = dark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { window.localStorage.setItem('market-theme', next); } catch (error) { /* The current page still changes theme. */ }
    updateThemeButton();
  });
  document.querySelectorAll('[data-app-link]').forEach(function (link) {
    if (window.MarketConfig && window.MarketConfig.appUrl) link.href = window.MarketConfig.appUrl;
  });
  var toast = document.querySelector('[data-toast]');
  var toastTimer;
  function announce(message) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = window.setTimeout(function () { toast.classList.remove('visible'); toast.textContent = ''; }, 6500);
  }
  var chips = document.querySelectorAll('[data-filter]');
  var cards = document.querySelectorAll('[data-category]');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var selected = chip.getAttribute('data-filter');
      var count = 0;
      chips.forEach(function (button) { button.setAttribute('aria-pressed', String(button === chip)); });
      cards.forEach(function (card) {
        card.hidden = selected !== 'all' && selected !== card.getAttribute('data-category');
        if (!card.hidden) count += 1;
      });
      document.querySelector('[data-result-count]').textContent = count + ' 件の商品';
    });
  });
  var gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    var thumbnails = Array.prototype.slice.call(gallery.querySelectorAll('[data-image]'));
    function selectPhoto(button) {
      var caption = button.getAttribute('data-caption-text');
      var main = gallery.querySelector('[data-main-image]');
      main.src = button.getAttribute('data-image');
      main.alt = caption;
      gallery.querySelector('[data-caption]').textContent = (thumbnails.indexOf(button) + 1) + ' / ' + thumbnails.length + ' ' + caption;
      thumbnails.forEach(function (thumbnail) { thumbnail.setAttribute('aria-pressed', String(button === thumbnail)); });
    }
    thumbnails.forEach(function (button, i) {
      button.addEventListener('click', function () { selectPhoto(button); });
      button.addEventListener('keydown', function (event) {
        var index = i;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') index = (i + 1) % thumbnails.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') index = (i + thumbnails.length - 1) % thumbnails.length;
        else if (event.key === 'Home') index = 0;
        else if (event.key === 'End') index = thumbnails.length - 1;
        else return;
        event.preventDefault();
        thumbnails[index].focus();
        selectPhoto(thumbnails[index]);
      });
    });
  }
  var urlInput = document.querySelector('[data-page-url]');
  var copyButton = document.querySelector('[data-copy]');
  if (urlInput && copyButton) {
    var pageUrl = window.location.href.split(/[?#]/)[0];
    urlInput.value = pageUrl;
    copyButton.addEventListener('click', async function () {
      var message;
      try {
        await navigator.clipboard.writeText(pageUrl);
        message = 'コピーしました。体験版の AI出品に貼り付けてください';
      } catch (error) {
        urlInput.focus();
        urlInput.select();
        urlInput.setSelectionRange(0, urlInput.value.length);
        message = '長押しでコピーしてください。パソコンでは Ctrl+C / ⌘C でコピーできます。';
      }
      document.querySelector('[data-copy-help]').textContent = message;
      announce(message);
    });
  }
  document.querySelectorAll('[data-purchase]').forEach(function (button) {
    button.addEventListener('click', function () { announce('デモのため購入できません'); });
  });
})();
