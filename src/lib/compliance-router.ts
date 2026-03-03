// ComplianceRouter — regulatory classification for prescriptions
// Now integrated with database tables (tipos_receita, medicamentos)
// Local config kept as fallback

import { findMedication, findMedicationAsync, getMedicationTipoReceita } from "./medication-knowledge";
import { supabase } from "@/integrations/supabase/client";

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
  autoClassified: boolean;
  tipoReceitaId?: number;
  tipoReceitaCor?: string;
  tipoReceitaNome?: string;
  validadeDias?: number;
  vias?: number;
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

// Map id_tipo_receita from DB to our RecipeType
function mapIdToRecipeType(id: number): RecipeType {
  switch (id) {
    case 1: return "simples";
    case 2: return "controle_especial";
    case 3: return "controle_especial"; // Receita Azul
    case 4: return "controle_especial"; // Receita Amarela
    case 5: return "antimicrobiano";    // RDC 471/2021
    default: return "simples";
  }
}

/**
 * Async version: classifies prescription using database data with local fallback
 */
export async function classifyPrescriptionAsync(input: ComplianceInput): Promise<ComplianceResult> {
  const warnings: string[] = [];
  let highestCategory: RecipeType = "simples";
  let highestTipoReceitaId = 1;
  let unknownItems = 0;

  for (const item of input.items) {
    // Try DB first
    const tipoId = await getMedicationTipoReceita(item.medicationName);
    
    if (tipoId !== null) {
      const mappedType = mapIdToRecipeType(tipoId);
      if (tipoId > highestTipoReceitaId) {
        highestTipoReceitaId = tipoId;
      }
      if (mappedType === "controle_especial" && highestCategory !== "controle_especial") {
        highestCategory = "controle_especial";
      } else if (mappedType === "antimicrobiano" && highestCategory === "simples") {
        highestCategory = "antimicrobiano";
      }
    } else {
      // Fallback to local
      const med = findMedication(item.medicationName);
      if (!med) {
        unknownItems++;
        warnings.push(`"${item.medicationName}": Categoria regulatória não identificada.`);
        continue;
      }
      if (med.category === "controlado" && highestCategory !== "controle_especial") {
        highestCategory = "controle_especial";
        highestTipoReceitaId = 2;
      } else if (med.category === "antimicrobiano" && highestCategory === "simples") {
        highestCategory = "antimicrobiano";
      }
    }

    // Get cautions from async search
    const med = await findMedicationAsync(item.medicationName);
    if (med && med.cautions.length > 0) {
      warnings.push(`${med.name}: ${med.cautions[0]}`);
    }
  }

  const autoClassified = unknownItems === 0;
  const needsConfirmation = !autoClassified || highestCategory === "controle_especial";
  const config = RECIPE_CONFIG[highestCategory];

  if (!autoClassified) {
    warnings.push("Confirme o tipo de receita manualmente.");
  }

  // Fetch tipo_receita details from DB
  let tipoReceitaCor: string | undefined;
  let tipoReceitaNome: string | undefined;
  let validadeDias: number | undefined;
  let vias: number | undefined;

  try {
    const { data } = await supabase
      .from("tipos_receita")
      .select("*")
      .eq("id", highestTipoReceitaId)
      .limit(1);
    
    if (data && data.length > 0) {
      const tipo = data[0] as any;
      tipoReceitaCor = tipo.cor;
      tipoReceitaNome = tipo.nome;
      validadeDias = tipo.validade_dias;
      vias = tipo.vias;
    }
  } catch {
    // Use defaults from config
  }

  return {
    recipeType: highestCategory,
    requirements: config.requirements,
    warnings,
    needsConfirmation,
    suggestedTemplateId: config.templateId,
    regulatorySource: config.source,
    autoClassified,
    tipoReceitaId: highestTipoReceitaId,
    tipoReceitaCor,
    tipoReceitaNome,
    validadeDias,
    vias,
  };
}

/**
 * Synchronous version (local only) — kept for backward compatibility
 */
export function classifyPrescription(input: ComplianceInput): ComplianceResult {
  const warnings: string[] = [];
  let highestCategory: RecipeType = "simples";
  let unknownItems = 0;

  for (const item of input.items) {
    const med = findMedication(item.medicationName);
    if (!med) {
      unknownItems++;
      warnings.push(`"${item.medicationName}": Categoria regulatória não identificada.`);
      continue;
    }

    if (med.category === "controlado" && highestCategory !== "controle_especial") {
      highestCategory = "controle_especial";
    } else if (med.category === "antimicrobiano" && highestCategory === "simples") {
      highestCategory = "antimicrobiano";
    }

    if (med.cautions.length > 0) {
      warnings.push(`${med.name}: ${med.cautions[0]}`);
    }
  }

  const autoClassified = unknownItems === 0;
  const needsConfirmation = !autoClassified || highestCategory === "controle_especial";
  const config = RECIPE_CONFIG[highestCategory];

  if (!autoClassified) {
    warnings.push("Confirme o tipo de receita manualmente.");
  }

  return {
    recipeType: highestCategory,
    requirements: config.requirements,
    warnings,
    needsConfirmation,
    suggestedTemplateId: config.templateId,
    regulatorySource: config.source,
    autoClassified,
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
