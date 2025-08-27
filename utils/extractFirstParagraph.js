function stripTags(str) {
  // Убирает теги, декодирует простые HTML-сущности для читаемости.
  // Замечание: для полного декодирования сущностей нужна библиотека; здесь простая реализация для популярных сущностей.
  const withoutTags = str.replace(/<\/?[^>]+(>|$)/g, "");
  return withoutTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractWithDOMParser(html) {
  // В браузере: DOMParser
  if (typeof DOMParser !== "undefined") {
    const dp = new DOMParser();
    const doc = dp.parseFromString(html, "text/html");
    const p = doc.querySelector("p");
    return p ? p.textContent.trim() : null;
  }
  return null;
}

function extractWithJsdom(html) {
  // В Node: jsdom если установлен
  try {
    // eslint-disable-next-line global-require
    const { JSDOM } = require("jsdom");
    const dom = new JSDOM(html);
    const p = dom.window.document.querySelector("p");
    return p ? p.textContent.trim() : null;
  } catch (e) {
    return null;
  }
}

function extractWithRegex(html) {
  // Фоллбек: найдем первый <p ...>...</p> и уберём теги
  const match = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!match) return null;
  const inner = match[1];
  return stripTags(inner).trim();
}

/**
 * Возвращает текст из первого <p>...</p> или null если не найден.
 * @param {string} html - входной HTML
 * @returns {string|null}
 */
function extractFirstParagraph(html) {
  if (typeof html !== "string") {
    throw new TypeError("html must be a string");
  }

  // 1) браузерный DOMParser
  const fromDOM = extractWithDOMParser(html);
  if (fromDOM) return fromDOM;

  // 2) jsdom (Node, если доступен)
  const fromJSDOM = extractWithJsdom(html);
  if (fromJSDOM) return fromJSDOM;

  // 3) regexp-фоллбек
  return extractWithRegex(html);
}

// Экспорт: поддерживаем ES modules и CommonJS
if (typeof module !== "undefined" && module.exports) {
  module.exports = extractFirstParagraph;
  module.exports.default = extractFirstParagraph;
}
if (typeof define === "function" && define.amd) {
  define(() => extractFirstParagraph);
}
export default extractFirstParagraph;
