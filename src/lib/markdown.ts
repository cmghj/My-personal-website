import { Marked } from "marked";
import xss from "xss";

// The package exposes these helpers as properties of its CommonJS default.
const { escapeAttrValue, FilterXSS, getDefaultWhiteList, safeAttrValue, friendlyAttrValue } =
  xss as typeof xss & typeof import("xss");

const sanitizer = new FilterXSS({
  whiteList: {
    ...getDefaultWhiteList(),
    a: ["href", "title"],
    code: ["class"],
    img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
    ol: ["start"],
    source: ["src", "type"],
    video: ["src", "controls", "playsinline", "preload", "poster", "width", "height", "aria-label"],
  },
  safeAttrValue(tag, name, value, cssFilter) {
    if (tag === "code" && name === "class" && !/^language-[\w.+#-]+$/.test(value)) return "";
    if (name === "href" || name === "src" || name === "poster") {
      // The sanitizer accepts ./path. Markdown also accepts a bare path, for
      // example photos/lake.jpg. Preserve the browser's relative resolution.
      const path = friendlyAttrValue(value).trim();
      if (name === "href" && /^data:/i.test(path)) return "";
      if (path.startsWith("?")) return escapeAttrValue(path);
      if (/^[\p{L}\p{N}_~%-][^/?#:]*([/?#]|$)/u.test(path)) {
        value = "./" + path;
      }
      return safeAttrValue(tag, name === "poster" ? "src" : name, value, cssFilter);
    }
    return safeAttrValue(tag, name, value, cssFilter);
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "iframe", "template", "object"],
});

const markdown = new Marked({
  renderer: {
    image({ href, text, title }) {
      const src = escapeAttrValue(href);
      const description = escapeAttrValue(text);
      if (/\.(?:mp4|webm|mov|m4v)(?:[?#]|$)/i.test(href)) {
        return '<video src="' + src + '" aria-label="' + description + '" controls playsinline preload="metadata"></video>';
      }
      const tooltip = title ? ' title="' + escapeAttrValue(title) + '"' : "";
      return '<img src="' + src + '" alt="' + description + '"' + tooltip + ' loading="lazy" decoding="async">';
    },
    checkbox({ checked }) {
      return checked ? "☑ " : "☐ ";
    },
  },
});

/** Shared by the published article and the unsaved editor preview. */
export function renderMarkdown(source: string): string {
  return sanitizer.process(markdown.parse(source, { async: false }));
}
