// MedicationKnowledgeMock — local knowledge base for smart prescription
// Now integrated with database tables (tipos_receita, categorias_medicamentos, medicamentos)
// Local array kept as offline fallback

import { supabase } from "@/integrations/supabase/client";

export interface DosePattern {
  concentration: string;
  dosage: string;
  duration?: string;
  quantity?: string;
}

export interface DoseVariant {
  label: string;
  description: string;
  dosage: string;
  concentration?: string;
  duration?: string;
}

export interface MedicationKnowledge {
  name: string;
  aliases: string[];
  category: "simples" | "antimicrobiano" | "controlado";
  defaultDosePatterns: DosePattern[];
  commonForms: string[];
  cautions: string[];
  variants?: DoseVariant[];
}

// DB record shape from the medicamentos table
export interface MedicamentoDB {
  id: number;
  nome_comercial: string;
  principio_ativo: string;
  dosagem_padrao: string;
  forma_administracao: string;
  apresentacao: string | null;
  indicacoes: string | null;
  contraindicacoes: string | null;
  interacoes: string | null;
  efeitos_colaterais: string | null;
  id_categoria: number;
  id_tipo_receita: number;
}

// Map id_tipo_receita to our internal category
function mapTipoReceitaToCategory(idTipoReceita: number): "simples" | "antimicrobiano" | "controlado" {
  switch (idTipoReceita) {
    case 1: return "simples";       // Receita Simples
    case 2: return "controlado";    // Receita de Controle Especial
    case 3: return "controlado";    // Receita Azul (psicotrópicos)
    case 4: return "controlado";    // Receita Amarela (entorpecentes)
    case 5: return "antimicrobiano"; // RDC 471/2021
    default: return "simples";
  }
}

// Convert a DB record to MedicationKnowledge format
function dbToMedicationKnowledge(med: MedicamentoDB): MedicationKnowledge {
  const forms = med.apresentacao?.split(",").map(s => s.trim()) || [med.forma_administracao];
  const cautions: string[] = [];
  if (med.contraindicacoes) cautions.push(med.contraindicacoes);
  if (med.efeitos_colaterais) cautions.push(med.efeitos_colaterais);

  return {
    name: med.nome_comercial,
    aliases: med.principio_ativo.toLowerCase() !== med.nome_comercial.toLowerCase()
      ? [med.principio_ativo.toLowerCase()]
      : [],
    category: mapTipoReceitaToCategory(med.id_tipo_receita),
    defaultDosePatterns: [{
      concentration: med.dosagem_padrao,
      dosage: `Conforme orientação médica`,
      duration: undefined,
      quantity: undefined,
    }],
    commonForms: forms,
    cautions,
  };
}

// ============= LOCAL FALLBACK DATA =============
// ... keep existing code (MEDICATIONS_DB array from line 29 to line 320)

const MEDICATIONS_DB: MedicationKnowledge[] = [
  // ====== SIMPLES ======
  {
    name: "Paracetamol",
    aliases: ["tylenol", "acetoaminofeno"],
    category: "simples",
    defaultDosePatterns: [
      { concentration: "500 mg", dosage: "1 comprimido de 6/6 horas se dor ou febre", duration: "5 dias", quantity: "20 comprimidos" },
      { concentration: "750 mg", dosage: "1 comprimido de 6/6 horas se dor ou febre", duration: "5 dias", quantity: "20 comprimidos" },
    ],
    commonForms: ["comprimido", "gotas"],
    cautions: ["Hepatotoxicidade em doses elevadas", "Evitar em hepatopatas graves"],
  },
  {
    name: "Ibuprofeno",
    aliases: ["advil", "alivium"],
    category: "simples",
    defaultDosePatterns: [
      { concentration: "400 mg", dosage: "1 comprimido de 8/8 horas", duration: "5 dias", quantity: "15 comprimidos" },
      { concentration: "600 mg", dosage: "1 comprimido de 8/8 horas", duration: "5 dias", quantity: "15 comprimidos" },
    ],
    commonForms: ["comprimido", "gotas", "suspensão"],
    cautions: ["Risco gastrointestinal", "Cuidado em nefropatas"],
  },
  {
    name: "Dipirona",
    aliases: ["novalgina", "metamizol"],
    category: "simples",
    defaultDosePatterns: [
      { concentration: "500 mg", dosage: "1 comprimido de 6/6 horas se dor ou febre", duration: "5 dias", quantity: "20 comprimidos" },
      { concentration: "1 g", dosage: "1 comprimido de 6/6 horas se dor ou febre", duration: "5 dias", quantity: "20 comprimidos" },
    ],
    commonForms: ["comprimido", "gotas", "solução oral"],
    cautions: ["Risco raro de agranulocitose"],
  },
  {
    name: "Omeprazol",
    aliases: ["losec", "peprazol"],
    category: "simples",
    defaultDosePatterns: [
      { concentration: "20 mg", dosage: "1 cápsula em jejum, 1x ao dia", duration: "30 dias", quantity: "30 cápsulas" },
      { concentration: "40 mg", dosage: "1 cápsula em jejum, 1x ao dia", duration: "30 dias", quantity: "30 cápsulas" },
    ],
    commonForms: ["cápsula"],
    cautions: ["Uso prolongado: risco de hipomagnesemia e fraturas"],
  },
  {
    name: "Losartana",
    aliases: ["losartana potássica", "cozaar"],
    category: "simples",
    defaultDosePatterns: [
      { concentration: "50 mg", dosage: "1 comprimido 1x ao dia", duration: "uso contínuo", quantity: "30 comprimidos" },
      { concentration: "100 mg", dosage: "1 comprimido 1x ao dia", duration: "uso contínuo", quantity: "30 comprimidos" },
    ],
    commonForms: ["comprimido"],
    cautions: ["Monitorar potássio e função renal", "Contraindicado na gestação"],
  },
  {
    name: "Metformina",
    aliases: ["glifage", "glucoformin"],
    category: "simples",
    defaultDosePatterns: [
      { concentration: "500 mg", dosage: "1 comprimido 2x ao dia após refeições", duration: "uso contínuo", quantity: "60 comprimidos" },
      { concentration: "850 mg", dosage: "1 comprimido 2x ao dia após refeições", duration: "uso contínuo", quantity: "60 comprimidos" },
    ],
    commonForms: ["comprimido", "comprimido XR"],
    cautions: ["Suspender antes de exames com contraste", "Contraindicado em insuficiência renal grave"],
  },
  {
    name: "Atorvastatina",
    aliases: ["lipitor", "citalor"],
    category: "simples",
    defaultDosePatterns: [
      { concentration: "10 mg", dosage: "1 comprimido à noite", duration: "uso contínuo", quantity: "30 comprimidos" },
      { concentration: "20 mg", dosage: "1 comprimido à noite", duration: "uso contínuo", quantity: "30 comprimidos" },
      { concentration: "40 mg", dosage: "1 comprimido à noite", duration: "uso contínuo", quantity: "30 comprimidos" },
    ],
    commonForms: ["comprimido"],
    cautions: ["Monitorar enzimas hepáticas", "Risco de miopatia"],
  },
  {
    name: "AAS",
    aliases: ["ácido acetilsalicílico", "aspirina"],
    category: "simples",
    defaultDosePatterns: [
      { concentration: "100 mg", dosage: "1 comprimido 1x ao dia após almoço", duration: "uso contínuo", quantity: "30 comprimidos" },
    ],
    commonForms: ["comprimido"],
    cautions: ["Risco de sangramento gastrointestinal", "Suspender antes de cirurgias"],
  },

  // ====== ANTIMICROBIANOS ======
  {
    name: "Amoxicilina",
    aliases: ["amoxil"],
    category: "antimicrobiano",
    defaultDosePatterns: [
      { concentration: "500 mg", dosage: "1 cápsula de 8/8 horas", duration: "7 dias", quantity: "21 cápsulas" },
      { concentration: "875 mg", dosage: "1 comprimido de 12/12 horas", duration: "7 dias", quantity: "14 comprimidos" },
    ],
    commonForms: ["cápsula", "comprimido", "suspensão"],
    cautions: ["Alergia a penicilinas", "Ajustar dose em insuficiência renal"],
  },
  {
    name: "Azitromicina",
    aliases: ["zitromax", "astro"],
    category: "antimicrobiano",
    defaultDosePatterns: [
      { concentration: "500 mg", dosage: "1 comprimido 1x ao dia", duration: "3 dias", quantity: "3 comprimidos" },
      { concentration: "500 mg", dosage: "1 comprimido 1x ao dia", duration: "5 dias", quantity: "5 comprimidos" },
    ],
    commonForms: ["comprimido", "suspensão"],
    cautions: ["Prolongamento de QT", "Interação com anticoagulantes"],
  },
  {
    name: "Cefalexina",
    aliases: ["keflex"],
    category: "antimicrobiano",
    defaultDosePatterns: [
      { concentration: "500 mg", dosage: "1 cápsula de 6/6 horas", duration: "7 dias", quantity: "28 cápsulas" },
    ],
    commonForms: ["cápsula", "suspensão"],
    cautions: ["Alergia a cefalosporinas", "Reação cruzada com penicilinas"],
  },
  {
    name: "Ciprofloxacino",
    aliases: ["cipro", "ciprobiot"],
    category: "antimicrobiano",
    defaultDosePatterns: [
      { concentration: "500 mg", dosage: "1 comprimido de 12/12 horas", duration: "7 dias", quantity: "14 comprimidos" },
    ],
    commonForms: ["comprimido"],
    cautions: ["Risco de tendinopatia", "Fotossensibilidade", "Evitar em < 18 anos"],
  },
  {
    name: "Metronidazol",
    aliases: ["flagyl"],
    category: "antimicrobiano",
    defaultDosePatterns: [
      { concentration: "400 mg", dosage: "1 comprimido de 8/8 horas", duration: "7 dias", quantity: "21 comprimidos" },
      { concentration: "250 mg", dosage: "1 comprimido de 8/8 horas", duration: "7 dias", quantity: "21 comprimidos" },
    ],
    commonForms: ["comprimido", "suspensão", "creme vaginal"],
    cautions: ["Efeito antabuse (não ingerir álcool)", "Gosto metálico"],
  },
  {
    name: "Levofloxacino",
    aliases: ["levaquin", "tavanic"],
    category: "antimicrobiano",
    defaultDosePatterns: [
      { concentration: "500 mg", dosage: "1 comprimido 1x ao dia", duration: "7 dias", quantity: "7 comprimidos" },
      { concentration: "750 mg", dosage: "1 comprimido 1x ao dia", duration: "5 dias", quantity: "5 comprimidos" },
    ],
    commonForms: ["comprimido"],
    cautions: ["Risco de tendinopatia", "Prolongamento de QT"],
  },
  {
    name: "Sulfametoxazol + Trimetoprima",
    aliases: ["bactrim", "bactrim f"],
    category: "antimicrobiano",
    defaultDosePatterns: [
      { concentration: "800/160 mg", dosage: "1 comprimido de 12/12 horas", duration: "7 dias", quantity: "14 comprimidos" },
      { concentration: "400/80 mg", dosage: "1 comprimido de 12/12 horas", duration: "7 dias", quantity: "14 comprimidos" },
    ],
    commonForms: ["comprimido", "suspensão"],
    cautions: ["Alergia a sulfonamidas", "Monitorar função renal", "Risco de hipercalemia"],
  },

  // ====== CONTROLADOS ======
  {
    name: "Clonazepam",
    aliases: ["rivotril"],
    category: "controlado",
    defaultDosePatterns: [
      { concentration: "0,5 mg", dosage: "1 comprimido à noite", duration: "30 dias", quantity: "30 comprimidos" },
      { concentration: "2 mg", dosage: "1 comprimido à noite", duration: "30 dias", quantity: "30 comprimidos" },
    ],
    commonForms: ["comprimido", "gotas"],
    cautions: ["Risco de dependência", "Evitar uso prolongado", "Sonolência"],
  },
  {
    name: "Alprazolam",
    aliases: ["frontal"],
    category: "controlado",
    defaultDosePatterns: [
      { concentration: "0,25 mg", dosage: "1 comprimido de 12/12 horas", duration: "30 dias", quantity: "60 comprimidos" },
      { concentration: "0,5 mg", dosage: "1 comprimido de 12/12 horas", duration: "30 dias", quantity: "60 comprimidos" },
    ],
    commonForms: ["comprimido"],
    cautions: ["Risco de dependência", "Evitar uso prolongado", "Sonolência intensa"],
  },
  {
    name: "Fluoxetina",
    aliases: ["prozac"],
    category: "controlado",
    defaultDosePatterns: [
      { concentration: "20 mg", dosage: "1 cápsula pela manhã", duration: "30 dias", quantity: "30 cápsulas" },
    ],
    commonForms: ["cápsula"],
    cautions: ["Pode levar 2-4 semanas para efeito", "Risco de síndrome serotoninérgica"],
  },
  {
    name: "Sertralina",
    aliases: ["zoloft", "assert"],
    category: "controlado",
    defaultDosePatterns: [
      { concentration: "50 mg", dosage: "1 comprimido 1x ao dia", duration: "30 dias", quantity: "30 comprimidos" },
      { concentration: "100 mg", dosage: "1 comprimido 1x ao dia", duration: "30 dias", quantity: "30 comprimidos" },
    ],
    commonForms: ["comprimido"],
    cautions: ["Pode levar 2-4 semanas para efeito", "Cuidado com interações medicamentosas"],
  },
  {
    name: "Escitalopram",
    aliases: ["lexapro", "cipralex"],
    category: "controlado",
    defaultDosePatterns: [
      { concentration: "10 mg", dosage: "1 comprimido 1x ao dia", duration: "30 dias", quantity: "30 comprimidos" },
      { concentration: "20 mg", dosage: "1 comprimido 1x ao dia", duration: "30 dias", quantity: "30 comprimidos" },
    ],
    commonForms: ["comprimido"],
    cautions: ["Pode levar 2-4 semanas para efeito", "Prolongamento de QT em doses altas"],
  },
  {
    name: "Metilfenidato",
    aliases: ["ritalina", "concerta"],
    category: "controlado",
    defaultDosePatterns: [
      { concentration: "10 mg", dosage: "1 comprimido pela manhã", duration: "30 dias", quantity: "30 comprimidos" },
      { concentration: "20 mg", dosage: "1 comprimido pela manhã", duration: "30 dias", quantity: "30 comprimidos" },
    ],
    commonForms: ["comprimido", "comprimido LA"],
    cautions: ["Monitorar PA e FC", "Risco de insônia e inapetência", "Receita tipo A3"],
  },
  {
    name: "Zolpidem",
    aliases: ["stilnox"],
    category: "controlado",
    defaultDosePatterns: [
      { concentration: "10 mg", dosage: "1 comprimido ao deitar", duration: "30 dias", quantity: "30 comprimidos" },
    ],
    commonForms: ["comprimido"],
    cautions: ["Risco de dependência", "Sonambulismo", "Uso apenas a curto prazo"],
  },

  // ====== COM VARIANTES ======
  {
    name: "Tirzepatida",
    aliases: ["mounjaro"],
    category: "simples",
    defaultDosePatterns: [
      { concentration: "2,5 mg", dosage: "1 aplicação subcutânea 1x por semana", duration: "4 semanas", quantity: "4 canetas" },
    ],
    commonForms: ["caneta injetável"],
    cautions: ["Náusea é efeito adverso comum", "Titular dose gradualmente", "Contraindicado em história pessoal/familiar de CMT"],
    variants: [
      { label: "Esquema inicial", description: "Dose de titulação — 2,5 mg/semana por 4 semanas", dosage: "2,5 mg SC 1x/semana", concentration: "2,5 mg", duration: "4 semanas" },
      { label: "Manutenção 5 mg", description: "Após titulação — 5 mg/semana", dosage: "5 mg SC 1x/semana", concentration: "5 mg", duration: "4 semanas" },
      { label: "Manutenção 10 mg", description: "Escalonamento — 10 mg/semana", dosage: "10 mg SC 1x/semana", concentration: "10 mg", duration: "4 semanas" },
    ],
  },
  {
    name: "Semaglutida",
    aliases: ["ozempic", "wegovy", "rybelsus"],
    category: "simples",
    defaultDosePatterns: [
      { concentration: "0,25 mg", dosage: "1 aplicação subcutânea 1x por semana", duration: "4 semanas", quantity: "1 caneta" },
    ],
    commonForms: ["caneta injetável", "comprimido oral"],
    cautions: ["Náusea frequente", "Titular dose", "Pancreatite rara"],
    variants: [
      { label: "Esquema inicial", description: "Titulação — 0,25 mg/semana por 4 semanas", dosage: "0,25 mg SC 1x/semana", concentration: "0,25 mg", duration: "4 semanas" },
      { label: "Manutenção 0,5 mg", description: "Após titulação — 0,5 mg/semana", dosage: "0,5 mg SC 1x/semana", concentration: "0,5 mg", duration: "4 semanas" },
      { label: "Manutenção 1 mg", description: "Escalonamento — 1 mg/semana", dosage: "1 mg SC 1x/semana", concentration: "1 mg", duration: "4 semanas" },
    ],
  },
  {
    name: "Contrave",
    aliases: ["naltrexona/bupropiona"],
    category: "controlado",
    defaultDosePatterns: [
      { concentration: "8/90 mg", dosage: "1 comprimido pela manhã", duration: "30 dias", quantity: "30 comprimidos" },
    ],
    commonForms: ["comprimido"],
    cautions: ["Risco de convulsão com bupropiona", "Não usar com opioides", "Titular dose nas primeiras semanas"],
    variants: [
      { label: "Semana 1", description: "Titulação — 1 cp manhã", dosage: "1 comprimido pela manhã", duration: "7 dias" },
      { label: "Semana 2", description: "Titulação — 1 cp manhã + 1 cp noite", dosage: "1 comprimido 2x ao dia (manhã e noite)", duration: "7 dias" },
      { label: "Dose plena", description: "2 cp manhã + 2 cp noite", dosage: "2 comprimidos 2x ao dia (manhã e noite)", duration: "30 dias" },
    ],
  },
];

// ============= DATABASE SEARCH =============

/**
 * Search medication in the database first, then fallback to local array
 */
export async function findMedicationAsync(query: string): Promise<MedicationKnowledge | null> {
  const q = query.toLowerCase().trim();
  
  try {
    // Search by nome_comercial or principio_ativo (case-insensitive)
    const { data, error } = await supabase
      .from("medicamentos")
      .select("*")
      .or(`nome_comercial.ilike.%${q}%,principio_ativo.ilike.%${q}%`)
      .limit(5);
    
    if (!error && data && data.length > 0) {
      const dbMed = data[0] as unknown as MedicamentoDB;
      const localMed = findMedicationLocal(q);
      if (localMed) {
        return {
          ...localMed,
          category: mapTipoReceitaToCategory(dbMed.id_tipo_receita),
        };
      }
      return dbToMedicationKnowledge(dbMed);
    }

    // If exact DB search failed, try broader search (first 4+ chars for fuzzy)
    if (q.length >= 4) {
      const prefix = q.slice(0, Math.ceil(q.length * 0.6));
      const { data: fuzzyData } = await supabase
        .from("medicamentos")
        .select("*")
        .or(`nome_comercial.ilike.%${prefix}%,principio_ativo.ilike.%${prefix}%`)
        .limit(10);
      
      if (fuzzyData && fuzzyData.length > 0) {
        // Find best fuzzy match
        let bestMatch: MedicamentoDB | null = null;
        let bestDist = Infinity;
        for (const row of fuzzyData) {
          const med = row as unknown as MedicamentoDB;
          const d1 = levenshtein(q, med.nome_comercial.toLowerCase());
          const d2 = levenshtein(q, med.principio_ativo.toLowerCase());
          const dist = Math.min(d1, d2);
          const maxAllowed = Math.max(q.length, med.nome_comercial.length) >= 8 ? 3 : 2;
          if (dist <= maxAllowed && dist < bestDist) {
            bestDist = dist;
            bestMatch = med;
          }
        }
        if (bestMatch) {
          const localMed = findMedicationLocal(bestMatch.nome_comercial);
          if (localMed) {
            return { ...localMed, category: mapTipoReceitaToCategory(bestMatch.id_tipo_receita) };
          }
          return dbToMedicationKnowledge(bestMatch);
        }
      }
    }
  } catch (err) {
    console.warn("[medication-knowledge] DB search failed, using local fallback:", err);
  }
  
  // Fallback to local (now includes fuzzy matching)
  return findMedicationLocal(q);
}

/**
 * Get the id_tipo_receita from the database for a medication
 */
export async function getMedicationTipoReceita(query: string): Promise<number | null> {
  const q = query.toLowerCase().trim();
  try {
    const { data, error } = await supabase
      .from("medicamentos")
      .select("id_tipo_receita")
      .or(`nome_comercial.ilike.%${q}%,principio_ativo.ilike.%${q}%`)
      .limit(1);
    
    if (!error && data && data.length > 0) {
      return (data[0] as any).id_tipo_receita;
    }
  } catch {
    // fallback
  }
  return null;
}

// ============= FUZZY MATCHING =============

/** Simple Levenshtein distance for typo tolerance */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Check if query fuzzy-matches a target (max 2 edits for short names, 3 for longer) */
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t === q || t.includes(q) || q.includes(t)) return true;
  const maxDist = Math.max(q.length, t.length) >= 8 ? 3 : 2;
  return levenshtein(q, t) <= maxDist;
}

// ============= LOCAL SEARCH (sync, fallback) =============

function findMedicationLocal(query: string): MedicationKnowledge | null {
  const q = query.toLowerCase().trim();
  // 1. Exact match
  const exact = MEDICATIONS_DB.find(
    (m) =>
      m.name.toLowerCase() === q ||
      m.aliases.some((a) => a.toLowerCase() === q)
  );
  if (exact) return exact;

  // 2. Substring match
  const partial = MEDICATIONS_DB.find(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.aliases.some((a) => a.toLowerCase().includes(q))
  );
  if (partial) return partial;

  // 3. Fuzzy match (typo tolerance)
  let bestMatch: MedicationKnowledge | null = null;
  let bestDist = Infinity;
  for (const m of MEDICATIONS_DB) {
    const names = [m.name, ...m.aliases];
    for (const name of names) {
      if (fuzzyMatch(q, name)) {
        const dist = levenshtein(q, name.toLowerCase());
        if (dist < bestDist) {
          bestDist = dist;
          bestMatch = m;
        }
      }
    }
  }
  return bestMatch;
}

/**
 * Find medication by name or alias (case-insensitive, partial match)
 * Synchronous version — uses local array only (kept for backward compatibility)
 */
export function findMedication(query: string): MedicationKnowledge | null {
  return findMedicationLocal(query);
}

/**
 * Find the best dose pattern matching a concentration
 */
export function findDosePattern(med: MedicationKnowledge, concentration?: string): DosePattern | null {
  if (!concentration) return med.defaultDosePatterns[0] || null;
  const c = concentration.toLowerCase().replace(/\s+/g, "");
  return (
    med.defaultDosePatterns.find((p) => p.concentration.toLowerCase().replace(/\s+/g, "") === c) ||
    med.defaultDosePatterns[0] ||
    null
  );
}

export function getAllMedications(): MedicationKnowledge[] {
  return MEDICATIONS_DB;
}
