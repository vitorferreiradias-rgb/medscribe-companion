import { TranscriptArchive } from "@/types";

const STORAGE_KEY = "medscribe_transcriptions";

function loadAll(): TranscriptArchive[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveAll(items: TranscriptArchive[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function saveTranscription(data: Omit<TranscriptArchive, "id">): TranscriptArchive {
  const items = loadAll();
  const entry: TranscriptArchive = {
    id: `txn_${Date.now().toString(36)}`,
    ...data,
  };
  items.unshift(entry);
  saveAll(items);
  return entry;
}

export function listTranscriptions(): TranscriptArchive[] {
  return loadAll();
}

export function getTranscription(id: string): TranscriptArchive | undefined {
  return loadAll().find((t) => t.id === id);
}
