import { I18nString } from "../types/boardTypes";

export function normalizeI18nName(raw: any): I18nString {
  if (raw && typeof raw === "object") return raw;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed?.en) return parsed;
      } catch {}
    }
    return { en: trimmed };
  }

  return { en: "" };
}
