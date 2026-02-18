import { ClinicalDocument } from "@/types";

const STORAGE_KEY = "medscribe_documents";

export function loadDocuments(): ClinicalDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveDocuments(docs: ClinicalDocument[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function addDocument(doc: Omit<ClinicalDocument, "id">): ClinicalDocument {
  const docs = loadDocuments();
  const newDoc: ClinicalDocument = {
    id: `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    ...doc,
  };
  docs.push(newDoc);
  saveDocuments(docs);
  return newDoc;
}

export function getDocumentsForPatient(patientId: string): ClinicalDocument[] {
  return loadDocuments()
    .filter((d) => d.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);
}
