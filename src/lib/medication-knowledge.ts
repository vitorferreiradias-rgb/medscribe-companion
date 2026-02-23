// MedicationKnowledgeMock — local knowledge base for smart prescription
// Designed to be replaced by a backend API in the future

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

/**
 * Find medication by name or alias (case-insensitive, partial match)
 * Pluggable: replace this with an API call in the future
 */
export function findMedication(query: string): MedicationKnowledge | null {
  const q = query.toLowerCase().trim();
  return (
    MEDICATIONS_DB.find(
      (m) =>
        m.name.toLowerCase() === q ||
        m.aliases.some((a) => a.toLowerCase() === q)
    ) ||
    MEDICATIONS_DB.find(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.aliases.some((a) => a.toLowerCase().includes(q))
    ) ||
    null
  );
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
