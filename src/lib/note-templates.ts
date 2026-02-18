import { CustomNoteTemplate } from "@/types";
import { soapTemplate } from "./soap-template";

const STORAGE_KEY = "medscribe_note_templates";

function loadAll(): CustomNoteTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveAll(items: CustomNoteTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Generate the default SOAP template as Markdown text */
export function getDefaultSoapMarkdown(): string {
  return soapTemplate.sections
    .filter((s) => !["identification", "interconsultas", "anexos"].includes(s.id))
    .map((s) => `## ${s.title}\n${s.hint}\n`)
    .join("\n");
}

export function saveTemplate(name: string, content: string): CustomNoteTemplate {
  const items = loadAll();
  const entry: CustomNoteTemplate = {
    id: `tmpl_${Date.now().toString(36)}`,
    name,
    content,
    createdAt: new Date().toISOString(),
  };
  items.unshift(entry);
  saveAll(items);
  return entry;
}

export function listTemplates(): CustomNoteTemplate[] {
  return loadAll();
}

export function deleteTemplate(id: string) {
  const items = loadAll().filter((t) => t.id !== id);
  saveAll(items);
}
