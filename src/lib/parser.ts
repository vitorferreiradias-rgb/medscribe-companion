import { Utterance, NoteSection } from "@/types";
import { soapTemplate } from "./soap-template";

/**
 * Intelligent parser that synthesizes transcript utterances into
 * properly formatted medical note sections (SOAP format).
 * 
 * Instead of dumping raw transcript lines, it extracts relevant
 * information and writes coherent clinical content for each section.
 */

// ── Keyword groups for classification ──────────────────────────────
const SECTION_PATTERNS: Record<string, RegExp[]> = {
  chief_complaint: [
    /queixa\s*principal/i,
    /\b(dor|desconforto|incômodo|mal[\s-]?estar|febre|tontura|falta de ar|cansaço|náusea|vômito|tosse|coceira|inchaço|sangramento)\b/i,
    /\b(motivo|trouxe|problema)\b/i,
  ],
  hda: [
    /\bhá\s+\d+/i,
    /\b(dias?|semanas?|meses?|anos?)\b/i,
    /\b(piora|melhora|começou|início|evolução|progressão|intensidade|frequência|duração|contínuo|intermitente)\b/i,
    /\b(quando|como começou|desde)\b/i,
    /\b(noite|manhã|tarde|esforço|repouso|alimentação)\b/i,
  ],
  antecedentes: [
    /\b(histórico|cirurgia|internação|internado|operação|doença\s+crônica)\b/i,
    /\b(diabetes|hipertensão|asma|câncer|cardio|infarto|avc|depressão)\b/i,
    /\b(já\s+tive|já\s+fiz|tratamento\s+anterior)\b/i,
  ],
  medicamentos: [
    /\b(tomo|uso\s+de|medicação|medicamento|remédio|comprimido)\b/i,
    /\d+\s*mg\b/i,
    /\b(losartana|omeprazol|paracetamol|ibuprofeno|dipirona|enalapril|metformina|sinvastatina|atenolol|amoxicilina)\b/i,
  ],
  alergias: [
    /\b(alergia|alérgico|alérgica|reação\s+alérgica|intolerância)\b/i,
    /\bnão\s+tenho\s+alergia\b/i,
    /\bnão\s+sou\s+alérgic[oa]\b/i,
  ],
  exame_fisico: [
    /\b(exame\s+físico|pressão\s+arterial|frequência\s+cardíaca|temperatura|ausculta|palpação|inspeção|PA\s*[:=]|FC\s*[:=])\b/i,
    /\b(\d+[/x]\d+\s*mmHg|\d+\s*bpm|\d+[.,]\d*\s*°?C)\b/i,
  ],
  hipoteses: [
    /\b(hipótese|diagnóstico|suspeita|avaliação|sugere|compatível|provável|possível)\b/i,
    /\b(cefaleia|gastrite|hipertensão|lombalgia|cervicalgia|sinusite|amigdalite|bronquite)\b/i,
  ],
  plano: [
    /\b(orientei|recomendei|conduta|plano|tratamento|prescrev[oi]|indicar)\b/i,
    /\b(iniciar|manter|suspender|ajustar|aumentar|reduzir)\b/i,
  ],
  prescricoes: [
    /\b(solicitar|solicitei|exame|pedido|prescrev[oi]|receita|hemograma|raio[\s-]?x|tomografia|ultrassom|ressonância|eletrocardiograma)\b/i,
    /\b(imagem|laborat[oó]rio|sangue)\b/i,
  ],
  orientacoes: [
    /\b(retorno|orientação|orientei|cuidado|evitar|repouso|dieta|atividade\s+física)\b/i,
    /\b(voltar|agendar|acompanhamento|controle)\b/i,
    /\b(\d+\s+dias?\b.*retorno|\bretorno\b.*\d+\s+dias?)\b/i,
  ],
  cid: [
    /\bCID\b/i,
    /\b[A-Z]\d{2}(\.\d)?\b/,
  ],
};

// ── Helpers ────────────────────────────────────────────────────────

/** Check if an utterance matches any pattern for a section */
function matchesSection(text: string, sectionId: string): boolean {
  const patterns = SECTION_PATTERNS[sectionId];
  if (!patterns) return false;
  return patterns.some((p) => p.test(text));
}

/** Group utterances by section relevance (an utterance can match multiple sections) */
function classifyUtterances(utterances: Utterance[]): Record<string, Utterance[]> {
  const groups: Record<string, Utterance[]> = {};
  for (const sectionId of Object.keys(SECTION_PATTERNS)) {
    groups[sectionId] = [];
  }

  for (const u of utterances) {
    for (const sectionId of Object.keys(SECTION_PATTERNS)) {
      if (matchesSection(u.text, sectionId)) {
        groups[sectionId].push(u);
      }
    }
  }

  return groups;
}

// ── Content synthesizers per section ───────────────────────────────

function synthesizeChiefComplaint(utterances: Utterance[]): string {
  // Extract the main symptom mentioned by the patient
  const patientLines = utterances.filter((u) => u.speaker === "paciente");
  if (patientLines.length === 0) return "";

  // Find the first patient complaint
  const complaints: string[] = [];
  for (const u of patientLines) {
    const text = u.text;
    // Extract symptom descriptions
    const match = text.match(/(dor(?:\s+(?:de|na|no|forte|intensa?|leve|moderada))*\s+[\w\sà]+?)(?:\s+há\b|,|\.|$)/i);
    if (match) {
      complaints.push(match[1].trim());
    } else {
      // Try simpler symptom keywords
      const simpleMatch = text.match(/\b(febre|tontura|falta de ar|cansaço|náusea|vômito|tosse|coceira|inchaço|mal[\s-]?estar|desconforto[\w\s]*?)\b/i);
      if (simpleMatch) complaints.push(simpleMatch[1].trim());
    }
  }

  if (complaints.length > 0) {
    return complaints.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join("; ") + ".";
  }

  // Fallback: use the first patient utterance summarized
  return patientLines[0].text.replace(/^(doutor[a]?,?\s*|dr[a]?\.,?\s*)/i, "").trim();
}

function synthesizeHDA(utterances: Utterance[]): string {
  const parts: string[] = [];
  const allText = utterances.map((u) => u.text).join(" ");

  // Extract duration
  const durationMatch = allText.match(/há\s+(\d+\s+(?:dias?|semanas?|meses?|anos?))/i);
  if (durationMatch) parts.push(`Início há ${durationMatch[1]}`);

  // Extract aggravating/relieving factors
  const pioraMatch = allText.match(/piora\s+([\w\sà]+?)(?:\.|,|$)/i);
  if (pioraMatch) parts.push(`Piora ${pioraMatch[1].trim()}`);

  const melhoraMatch = allText.match(/melhora\s+([\w\sà]+?)(?:\.|,|$)/i);
  if (melhoraMatch) parts.push(`Melhora ${melhoraMatch[1].trim()}`);

  // Extract intensity/character
  const intensityMatch = allText.match(/\b(forte|intensa?|leve|moderada?|constante|intermitente|pulsátil|pontada)\b/i);
  if (intensityMatch) parts.push(`Caráter: ${intensityMatch[1].toLowerCase()}`);

  if (parts.length > 0) {
    return "Paciente relata " + parts[0].toLowerCase() + ". " + parts.slice(1).join(". ") + (parts.length > 1 ? "." : "");
  }

  // Fallback: patient descriptions
  const patientLines = utterances.filter((u) => u.speaker === "paciente");
  if (patientLines.length > 0) {
    return "Paciente relata: " + patientLines.map((u) => u.text).join(" ");
  }

  return "";
}

function synthesizeAllergies(utterances: Utterance[]): string {
  const allText = utterances.map((u) => u.text).join(" ").toLowerCase();

  // Check for "no allergies"
  if (/não\s+(tenho|tem|possui|sou)\s+(alergia|alérgic)/i.test(allText) || /nega\s+alergia/i.test(allText)) {
    return "Nega alergias medicamentosas.";
  }

  // Extract specific allergies
  const allergyMatch = allText.match(/alergia\s+(?:a\s+)?([\w\s]+?)(?:\.|,|$)/i);
  if (allergyMatch) {
    const allergen = allergyMatch[1].trim();
    return `Alergia a ${allergen}.`;
  }

  return "";
}

function synthesizeMedications(utterances: Utterance[]): string {
  const meds: string[] = [];
  const allText = utterances.map((u) => u.text).join(" ");

  // Find medication mentions with dosages
  const medPatterns = [
    /(\w+)\s+(\d+\s*mg)/gi,
    /(?:tomo|uso)\s+(?:de\s+)?([\w\s]+?)(?:\s+para|\s+quando|\.|,|$)/gi,
  ];

  // Pattern 1: Drug + dosage
  let match;
  const regex1 = /(\w+)\s+(\d+\s*mg)/gi;
  while ((match = regex1.exec(allText)) !== null) {
    meds.push(`${match[1]} ${match[2]}`);
  }

  if (meds.length > 0) {
    return meds.map((m) => `- ${m}`).join("\n");
  }

  // Pattern 2: "tomo/uso" mentions  
  const patientLines = utterances.filter((u) => u.speaker === "paciente");
  for (const u of patientLines) {
    if (/tomo|uso/i.test(u.text)) {
      return `- ${u.text.replace(/^.*?(tomo|uso\s+de?)\s*/i, "").trim()}`;
    }
  }

  return "";
}

function synthesizeAntecedentes(utterances: Utterance[]): string {
  const parts: string[] = [];
  const allText = utterances.map((u) => u.text).join(" ");

  const conditions = [
    { pattern: /\b(diabetes)\b/i, label: "Diabetes" },
    { pattern: /\b(hipertensão|pressão\s+alta)\b/i, label: "Hipertensão arterial" },
    { pattern: /\b(asma)\b/i, label: "Asma" },
    { pattern: /\b(gastrite)\b/i, label: "Gastrite" },
    { pattern: /\b(úlcera)\b/i, label: "Úlcera" },
    { pattern: /\b(cirurgia|operação)\b/i, label: "Cirurgia prévia" },
    { pattern: /\b(internação|internado)\b/i, label: "Internação prévia" },
    { pattern: /\b(depressão|ansiedade)\b/i, label: "Transtorno psiquiátrico" },
  ];

  for (const { pattern, label } of conditions) {
    if (pattern.test(allText)) {
      // Try to get context
      const contextMatch = allText.match(new RegExp(`(?:já\\s+tive|teve|tem|possui|história\\s+de)?\\s*${pattern.source}[^.]*`, "i"));
      if (contextMatch) {
        parts.push(contextMatch[0].trim());
      } else {
        parts.push(label);
      }
    }
  }

  if (parts.length > 0) {
    return parts.map((p) => `- ${p.charAt(0).toUpperCase() + p.slice(1)}`).join("\n");
  }

  return "";
}

function synthesizePlanAndConduct(utterances: Utterance[]): string {
  const doctorLines = utterances.filter((u) => u.speaker === "medico");
  const parts: string[] = [];

  for (const u of doctorLines) {
    const text = u.text;
    // Extract conduct items
    if (/orientei|recomendei|prescrev|solicit|conduta|tratamento|iniciar|manter/i.test(text)) {
      // Clean up and format as plan items
      const cleaned = text
        .replace(/^(certo\.|ok\.|bem\.)?\s*/i, "")
        .trim();
      if (cleaned) parts.push(cleaned);
    }
  }

  if (parts.length > 0) {
    return parts.map((p) => `- ${p}`).join("\n");
  }

  return "";
}

function synthesizePrescriptions(utterances: Utterance[]): string {
  const parts: string[] = [];
  const allText = utterances.map((u) => u.text).join(" ");

  // Extract exam requests
  const examPatterns = [
    /(?:solicit[aeo]r?|pedir?|solicite[i])\s+(?:um\s+)?(?:exame\s+de\s+)?([\w\s]+?)(?:\.|,|$)/gi,
    /\b(hemograma|raio[\s-]?x|tomografia|ultrassom|ressonância|eletrocardiograma|ecocardiograma|endoscopia)\b/gi,
    /\b(exame\s+de\s+(?:sangue|urina|imagem|fezes))\b/gi,
  ];

  for (const pattern of examPatterns) {
    let match;
    while ((match = pattern.exec(allText)) !== null) {
      const item = match[1]?.trim() || match[0]?.trim();
      if (item && !parts.some((p) => p.toLowerCase() === item.toLowerCase())) {
        parts.push(item);
      }
    }
  }

  // Extract prescriptions (medications)
  const prescMatch = allText.match(/prescrev[oi]\s+([\w\s]+?\d*\s*mg?)/gi);
  if (prescMatch) {
    for (const p of prescMatch) {
      const med = p.replace(/prescrev[oi]\s+/i, "").trim();
      if (med) parts.push(`Prescrição: ${med}`);
    }
  }

  if (parts.length > 0) {
    return parts.map((p) => `- ${p.charAt(0).toUpperCase() + p.slice(1)}`).join("\n");
  }

  return "";
}

function synthesizeOrientations(utterances: Utterance[]): string {
  const parts: string[] = [];
  const allText = utterances.map((u) => u.text).join(" ");

  // Extract return visit
  const retornoMatch = allText.match(/retorno\s+em\s+(\d+\s+dias?)/i);
  if (retornoMatch) parts.push(`Retorno em ${retornoMatch[1]}`);

  // Extract care instructions
  const carePatterns = [
    { pattern: /\brepouso\b/i, label: "Repouso" },
    { pattern: /\bevitar\s+([\w\s]+?)(?:\.|,|e\s|$)/i, extract: true },
    { pattern: /\bdieta\s+([\w\s]+?)(?:\.|,|$)/i, extract: true },
    { pattern: /\bhidratação\b/i, label: "Manter hidratação adequada" },
    { pattern: /\batividade\s+física\b/i, label: "Orientações sobre atividade física" },
  ];

  for (const p of carePatterns) {
    if (p.extract) {
      const match = allText.match(p.pattern);
      if (match) parts.push(`Evitar ${match[1]?.trim() || ""}`);
    } else if (p.pattern.test(allText)) {
      parts.push(p.label!);
    }
  }

  if (parts.length > 0) {
    return parts.map((p) => `- ${p}`).join("\n");
  }

  return "";
}

function synthesizeHypotheses(utterances: Utterance[]): string {
  const parts: string[] = [];
  const allText = utterances.map((u) => u.text).join(" ");

  const conditions = [
    /\b(cefaleia\s*\w*)\b/i,
    /\b(gastrite\s*\w*)\b/i,
    /\b(hipertensão\s*\w*)\b/i,
    /\b(lombalgia)\b/i,
    /\b(cervicalgia)\b/i,
    /\b(sinusite)\b/i,
    /\b(amigdalite)\b/i,
    /\b(bronquite)\b/i,
    /\b(dermatite)\b/i,
    /\b(insônia)\b/i,
    /\b(ansiedade)\b/i,
    /\b(depressão)\b/i,
  ];

  for (const pattern of conditions) {
    const match = allText.match(pattern);
    if (match) {
      const condition = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      if (!parts.includes(condition)) parts.push(condition);
    }
  }

  if (parts.length > 0) {
    return parts.map((p) => `- ${p}`).join("\n");
  }

  return "";
}

// ── Section synthesizer map ────────────────────────────────────────
const SYNTHESIZERS: Record<string, (utterances: Utterance[]) => string> = {
  chief_complaint: synthesizeChiefComplaint,
  hda: synthesizeHDA,
  antecedentes: synthesizeAntecedentes,
  medicamentos: synthesizeMedications,
  alergias: synthesizeAllergies,
  exame_fisico: () => "", // Rarely in transcript, leave for manual
  hipoteses: synthesizeHypotheses,
  plano: synthesizePlanAndConduct,
  prescricoes: synthesizePrescriptions,
  orientacoes: synthesizeOrientations,
  cid: () => "", // Needs explicit mention
};

// ── Main export ────────────────────────────────────────────────────

export function parseTranscriptToSections(
  utterances: Utterance[],
  encounterId: string,
  patientName?: string,
  clinicianName?: string,
  dateStr?: string
): NoteSection[] {
  const classified = classifyUtterances(utterances);

  return soapTemplate.sections.map((tmpl) => {
    let content = "";

    if (tmpl.id === "identification") {
      const parts: string[] = [];
      if (patientName) parts.push(`Paciente: ${patientName}`);
      if (clinicianName) parts.push(`Médico: ${clinicianName}`);
      if (dateStr) parts.push(`Data: ${dateStr}`);
      content = parts.join("\n") || "(Gerado automaticamente — revise e edite)";
    } else {
      // Use the synthesizer if available, passing classified utterances
      const synthesizer = SYNTHESIZERS[tmpl.id];
      const relevantUtterances = classified[tmpl.id] || [];

      if (synthesizer && relevantUtterances.length > 0) {
        content = synthesizer(relevantUtterances);
      }

      // For plan/prescriptions/orientations, also pass ALL doctor utterances as fallback
      if (!content && ["plano", "prescricoes", "orientacoes"].includes(tmpl.id)) {
        const allDoctorUtterances = utterances.filter((u) => u.speaker === "medico");
        if (synthesizer && allDoctorUtterances.length > 0) {
          content = synthesizer(allDoctorUtterances);
        }
      }
    }

    if (!content) {
      content = "(Gerado automaticamente — revise e edite)";
    }

    return {
      id: `${encounterId}_${tmpl.id}`,
      title: tmpl.title,
      content,
      autoGenerated: true,
    };
  });
}
