// ComplianceRouter — regulatory classification for prescriptions
// Uses mock data now, designed to be replaced by a backend API

import { findMedication } from "./medication-knowledge";

export type RecipeType = "simples" | "antimicrobiano" | "controle_especial";

export interface ComplianceInput {
  items: { medicationName: string; concentration?: string }[];
  patient: { id: string; name: string };
  prescriber: { name: string; crm: string };
}

export interface ComplianceResult {
  recipeType: RecipeType;
  requirements: string[];
  warnings: string[];
  needsConfirmation: boolean;
  suggestedTemplateId: string;
  regulatorySource: string;
}

const RECIPE_CONFIG: Record<RecipeType, { templateId: string; source: string; requirements: string[] }> = {
  simples: {
    templateId: "receita_simples",
    source: "Geral",
    requirements: ["Identificação do paciente", "Identificação do prescritor com CRM", "Data"],
  },
  antimicrobiano: {
    templateId: "receita_antimicrobiano",
    source: "RDC_471_2021",
    requirements: [
      "Receita em 2 vias (1ª via retida pela farmácia)",
      "Identificação completa do paciente",
      "Identificação do prescritor com CRM",
      "Validade: 10 dias",
      "Data",
    ],
  },
  controle_especial: {
    templateId: "receita_controle_especial",
    source: "Portaria_344_98",
    requirements: [
      "Notificação de Receita (quando aplicável)",
      "Receita em 2 vias (controle especial) ou Receita Azul (B1/B2)",
      "Identificação completa do paciente com endereço",
      "Identificação do prescritor com CRM e endereço",
      "Quantidade em algarismos arábicos e por extenso",
      "Validade: 30 dias",
      "Data",
    ],
  },
};

/**
 * Classify a prescription based on its items
 * Pluggable: replace this function body with an API call in the future
 */
export function classifyPrescription(input: ComplianceInput): ComplianceResult {
  const warnings: string[] = [];
  let highestCategory: RecipeType = "simples";
  let unknownItems = 0;

  for (const item of input.items) {
    const med = findMedication(item.medicationName);
    if (!med) {
      unknownItems++;
      warnings.push(`"${item.medicationName}": Categoria regulatória não identificada (mock).`);
      continue;
    }

    if (med.category === "controlado" && highestCategory !== "controle_especial") {
      highestCategory = "controle_especial";
    } else if (med.category === "antimicrobiano" && highestCategory === "simples") {
      highestCategory = "antimicrobiano";
    }

    // Add medication-specific cautions as warnings
    if (med.cautions.length > 0) {
      warnings.push(`${med.name}: ${med.cautions[0]}`);
    }
  }

  const needsConfirmation = unknownItems > 0 || highestCategory === "controle_especial";
  const config = RECIPE_CONFIG[highestCategory];

  if (unknownItems > 0) {
    warnings.push("Selecione o tipo de receita manualmente se necessário.");
  }

  return {
    recipeType: highestCategory,
    requirements: config.requirements,
    warnings,
    needsConfirmation,
    suggestedTemplateId: config.templateId,
    regulatorySource: `${config.source} (mock)`,
  };
}

/**
 * Get all available recipe types for manual selection
 */
export function getRecipeTypes(): { value: RecipeType; label: string }[] {
  return [
    { value: "simples", label: "Receita Simples" },
    { value: "antimicrobiano", label: "Receita Antimicrobiano" },
    { value: "controle_especial", label: "Receita Controle Especial" },
  ];
}
