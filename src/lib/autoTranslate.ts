/**
 * Runtime auto-translation of the whole UI.
 *
 * The app is authored in Portuguese. When the user picks another language we
 * walk the DOM, collect visible strings, translate them (cached in
 * localStorage, batched through the `translate-texts` edge function) and swap
 * the text in place. Switching back to "pt" restores the original strings.
 */
import { supabase } from "@/integrations/supabase/client";

type Lang = "pt" | "en" | "es";

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "SVG", "PATH", "CANVAS", "IFRAME",
]);

const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

// Text nodes -> original portuguese content
const originalText = new WeakMap<Text, string>();
// Element -> { attr: original value }
const originalAttrs = new WeakMap<Element, Record<string, string>>();

let currentLang: Lang = "pt";
let observer: MutationObserver | null = null;
let pending = false;
let inFlight = false;
const missing = new Set<string>();
const failed = new Set<string>();

function cacheKey(lang: Lang) {
  return `i18n:auto:${lang}`;
}

function loadCache(lang: Lang): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(lang)) || "{}");
  } catch {
    return {};
  }
}

function saveCache(lang: Lang, cache: Record<string, string>) {
  try {
    localStorage.setItem(cacheKey(lang), JSON.stringify(cache));
  } catch {
    /* quota */
  }
}

let cache: Record<string, string> = {};

function translatable(value: string) {
  const v = value.trim();
  if (v.length < 2 || v.length > 400) return false;
  if (!/\p{L}{2,}/u.test(v)) return false; // needs actual letters
  if (/^https?:\/\//i.test(v)) return false;
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(v)) return false;
  return true;
}

function skipElement(el: Element | null): boolean {
  let node: Element | null = el;
  while (node) {
    if (SKIP_TAGS.has(node.tagName)) return true;
    if (node.hasAttribute?.("data-no-translate")) return true;
    if (node.getAttribute?.("translate") === "no") return true;
    node = node.parentElement;
  }
  return false;
}

function collect(root: Node) {
  const texts: Text[] = [];
  const attrTargets: Element[] = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (SKIP_TAGS.has(el.tagName) || el.hasAttribute("data-no-translate")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
      const text = node as Text;
      if (!text.nodeValue || !translatable(text.nodeValue)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let n = walker.currentNode as Node | null;
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) texts.push(n as Text);
    else if (n.nodeType === Node.ELEMENT_NODE) {
      const el = n as Element;
      if (ATTRS.some((a) => el.hasAttribute(a))) attrTargets.push(el);
    }
    n = walker.nextNode();
  }
  return { texts, attrTargets };
}

function applyToNode(node: Text, lang: Lang) {
  const original = originalText.get(node) ?? node.nodeValue ?? "";
  if (!originalText.has(node)) originalText.set(node, original);

  if (lang === "pt") {
    if (node.nodeValue !== original) node.nodeValue = original;
    return;
  }
  const key = original.trim();
  const translated = cache[key];
  if (translated) {
    const prefix = original.match(/^\s*/)?.[0] ?? "";
    const suffix = original.match(/\s*$/)?.[0] ?? "";
    const next = prefix + translated + suffix;
    if (node.nodeValue !== next) node.nodeValue = next;
  } else if (!failed.has(key)) {
    missing.add(key);
  }
}

function applyToAttrs(el: Element, lang: Lang) {
  const store = originalAttrs.get(el) ?? {};
  for (const attr of ATTRS) {
    const value = el.getAttribute(attr);
    if (value == null) continue;
    if (!(attr in store)) {
      store[attr] = value;
    }
    const original = store[attr];
    if (!translatable(original)) continue;
    if (lang === "pt") {
      if (value !== original) el.setAttribute(attr, original);
      continue;
    }
    const translated = cache[original.trim()];
    if (translated) {
      if (value !== translated) el.setAttribute(attr, translated);
    } else if (!failed.has(original.trim())) {
      missing.add(original.trim());
    }
  }
  originalAttrs.set(el, store);
}

function sweep(root: Node = document.body) {
  if (!root) return;
  if (root.nodeType === Node.ELEMENT_NODE && skipElement(root as Element)) return;
  const { texts, attrTargets } = collect(root);
  observer?.disconnect();
  for (const t of texts) applyToNode(t, currentLang);
  for (const el of attrTargets) applyToAttrs(el, currentLang);
  connectObserver();
  if (currentLang !== "pt" && missing.size > 0) void flushMissing();
}

async function flushMissing() {
  if (inFlight || currentLang === "pt") return;
  const batch = Array.from(missing).slice(0, 80);
  if (batch.length === 0) return;
  inFlight = true;
  const lang = currentLang;
  try {
    const { data, error } = await supabase.functions.invoke("translate-texts", {
      body: { texts: batch, target: lang },
    });
    if (error) throw error;
    const translations: string[] = data?.translations ?? [];
    batch.forEach((source, i) => {
      missing.delete(source);
      const value = translations[i];
      if (typeof value === "string" && value.trim()) cache[source] = value;
      else failed.add(source);
    });
    if (lang === currentLang) {
      saveCache(lang, cache);
      sweep();
    }
  } catch (e) {
    console.warn("[i18n] translation batch failed", e);
    batch.forEach((s) => {
      missing.delete(s);
      failed.add(s);
    });
  } finally {
    inFlight = false;
    if (missing.size > 0) setTimeout(() => void flushMissing(), 300);
  }
}

function scheduleSweep() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    setTimeout(() => {
      pending = false;
      sweep();
    }, 120);
  });
}

function connectObserver() {
  if (!observer) {
    observer = new MutationObserver(() => scheduleSweep());
  }
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributeFilter: [...ATTRS],
  });
}

export function setAutoTranslateLanguage(lang: Lang) {
  currentLang = lang;
  missing.clear();
  failed.clear();
  cache = lang === "pt" ? {} : loadCache(lang);
  document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
  if (!document.body) {
    window.addEventListener("DOMContentLoaded", () => setAutoTranslateLanguage(lang), { once: true });
    return;
  }
  connectObserver();
  sweep();
}

export function stopAutoTranslate() {
  observer?.disconnect();
  observer = null;
}
