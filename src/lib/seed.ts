import { AppData } from "@/types";

function daysAgo(n: number, hour = 9, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function endTime(start: string, durationSec: number): string {
  return new Date(new Date(start).getTime() + durationSec * 1000).toISOString();
}

export const SOAP_TEMPLATE_ID = "template_soap_v1";

export const soapTemplate = {
  id: SOAP_TEMPLATE_ID,
  name: "SOAP + Essenciais",
  sections: [
    { id: "identification", title: "Identificação", hint: "Paciente, médico, data/hora", generationRules: "auto" },
    { id: "chief_complaint", title: "Queixa Principal (QP)", hint: "Motivo da consulta", generationRules: "queixa,dor,problema,motivo" },
    { id: "hda", title: "História da Doença Atual (HDA)", hint: "Evolução dos sintomas", generationRules: "há,dias,semana,piora,melhora,sintoma,começou" },
    { id: "antecedentes", title: "Antecedentes Pessoais (AP)", hint: "Histórico médico", generationRules: "histórico,cirurgia,internação,doença" },
    { id: "medicamentos", title: "Medicamentos em Uso", hint: "Medicação atual", generationRules: "uso de,tomo,medicação,medicamento,remédio,mg" },
    { id: "alergias", title: "Alergias", hint: "Alergias conhecidas", generationRules: "alergia,alérgico" },
    { id: "revisao_sistemas", title: "Revisão de Sistemas", hint: "Revisão por sistemas (opcional)", generationRules: "sistema" },
    { id: "exame_fisico", title: "Exame Físico", hint: "Achados do exame (opcional)", generationRules: "exame físico,pressão,frequência,ausculta" },
    { id: "hipoteses", title: "Hipóteses / Avaliação", hint: "Diagnósticos considerados", generationRules: "hipótese,diagnóstico,suspeita,avaliação" },
    { id: "plano", title: "Plano / Conduta", hint: "Plano terapêutico", generationRules: "orientei,recomendei,conduta,plano,tratamento" },
    { id: "prescricoes", title: "Prescrições / Solicitações", hint: "Exames e prescrições", generationRules: "exame,solicitar,pedido,prescrevo,receita" },
    { id: "orientacoes", title: "Orientações ao Paciente", hint: "Instruções dadas", generationRules: "retorno,orientação,cuidado,evitar,repouso" },
    { id: "cid", title: "CID (opcional)", hint: "Código CID", generationRules: "cid" },
    { id: "anexos", title: "Anexos", hint: "Documentos anexos", generationRules: "" },
  ],
};

const mockTranscript1 = [
  { speaker: "medico" as const, text: "Bom dia, qual a sua queixa principal hoje?", tsSec: 0 },
  { speaker: "paciente" as const, text: "Doutor, estou com uma dor forte na cabeça há 3 dias, piora à noite.", tsSec: 5 },
  { speaker: "medico" as const, text: "Entendo. Tem alguma alergia a medicamentos?", tsSec: 15 },
  { speaker: "paciente" as const, text: "Sim, tenho alergia a dipirona.", tsSec: 20 },
  { speaker: "medico" as const, text: "Está em uso de algum medicamento atualmente?", tsSec: 28 },
  { speaker: "paciente" as const, text: "Tomo losartana 50mg para pressão.", tsSec: 33 },
  { speaker: "medico" as const, text: "Certo. Vou solicitar um exame de imagem. Orientei repouso e retorno em 7 dias.", tsSec: 45 },
  { speaker: "paciente" as const, text: "Obrigado, doutor.", tsSec: 55 },
];

const mockTranscript2 = [
  { speaker: "medico" as const, text: "Boa tarde, o que trouxe você aqui hoje?", tsSec: 0 },
  { speaker: "paciente" as const, text: "Estou com dor no estômago há uma semana, melhora depois de comer.", tsSec: 4 },
  { speaker: "medico" as const, text: "Tem histórico de gastrite ou úlcera?", tsSec: 12 },
  { speaker: "paciente" as const, text: "Já tive gastrite ano passado. Não tenho alergia a nada.", tsSec: 18 },
  { speaker: "medico" as const, text: "Prescrevo omeprazol 20mg. Recomendei evitar alimentos ácidos e retorno em 15 dias.", tsSec: 30 },
];

export function createSeedData(): AppData {
  const clinicians = [
    { id: "cli_1", name: "Dr. Ricardo Mendes", specialty: "Clínica Geral", crm: "CRM/SP 123456" },
    { id: "cli_2", name: "Dra. Ana Beatriz Costa", specialty: "Cardiologia", crm: "CRM/SP 654321" },
  ];

  const patients = [
    { id: "pat_1", name: "João Silva", birthDate: "1985-03-15", sex: "M" as const, phone: "(11) 99876-5432" },
    { id: "pat_2", name: "Maria Oliveira", birthDate: "1990-07-22", sex: "F" as const, phone: "(11) 98765-4321" },
    { id: "pat_3", name: "Carlos Santos", birthDate: "1978-11-08", sex: "M" as const, phone: "(11) 97654-3210" },
    { id: "pat_4", name: "Ana Paula Lima", birthDate: "1995-01-30", sex: "F" as const, phone: "(21) 99988-7766" },
    { id: "pat_5", name: "Roberto Ferreira", birthDate: "1960-05-12", sex: "M" as const, phone: "(11) 96543-2109" },
    { id: "pat_6", name: "Fernanda Alves", birthDate: "2000-09-18", sex: "F" as const, phone: "(31) 99877-6655" },
    { id: "pat_7", name: "Pedro Henrique Souza", birthDate: "1988-12-04", sex: "M" as const, phone: "(21) 98877-6655" },
    { id: "pat_8", name: "Camila Rodrigues", birthDate: "1992-04-25", sex: "F" as const, phone: "(11) 95432-1098" },
  ];

  const enc1Start = daysAgo(1, 9, 30);
  const enc2Start = daysAgo(2, 14, 0);
  const enc3Start = daysAgo(3, 10, 15);
  const enc4Start = daysAgo(5, 11, 0);
  const enc5Start = daysAgo(7, 16, 30);
  const enc6Start = daysAgo(8, 8, 45);
  const enc7Start = daysAgo(10, 13, 0);
  const enc8Start = daysAgo(12, 9, 0);

  const encounters = [
    { id: "enc_1", patientId: "pat_1", clinicianId: "cli_1", startedAt: enc1Start, endedAt: endTime(enc1Start, 900), durationSec: 900, status: "draft" as const, chiefComplaint: "Cefaleia intensa", transcriptId: "tr_1", noteId: "note_1" },
    { id: "enc_2", patientId: "pat_2", clinicianId: "cli_1", startedAt: enc2Start, endedAt: endTime(enc2Start, 720), durationSec: 720, status: "reviewed" as const, chiefComplaint: "Dor epigástrica", transcriptId: "tr_2", noteId: "note_2" },
    { id: "enc_3", patientId: "pat_3", clinicianId: "cli_2", startedAt: enc3Start, endedAt: endTime(enc3Start, 600), durationSec: 600, status: "final" as const, chiefComplaint: "Check-up anual" },
    { id: "enc_4", patientId: "pat_4", clinicianId: "cli_2", startedAt: enc4Start, endedAt: endTime(enc4Start, 1200), durationSec: 1200, status: "draft" as const, chiefComplaint: "Dor lombar" },
    { id: "enc_5", patientId: "pat_5", clinicianId: "cli_1", startedAt: enc5Start, endedAt: endTime(enc5Start, 480), durationSec: 480, status: "final" as const, chiefComplaint: "Controle de hipertensão" },
    { id: "enc_6", patientId: "pat_6", clinicianId: "cli_2", startedAt: enc6Start, endedAt: endTime(enc6Start, 660), durationSec: 660, status: "reviewed" as const, chiefComplaint: "Dermatite" },
    { id: "enc_7", patientId: "pat_7", clinicianId: "cli_1", startedAt: enc7Start, endedAt: endTime(enc7Start, 540), durationSec: 540, status: "draft" as const, chiefComplaint: "Insônia" },
    { id: "enc_8", patientId: "pat_8", clinicianId: "cli_2", startedAt: enc8Start, endedAt: endTime(enc8Start, 780), durationSec: 780, status: "final" as const, chiefComplaint: "Dor torácica" },
  ];

  const transcripts = [
    { id: "tr_1", encounterId: "enc_1", source: "mock" as const, content: mockTranscript1 },
    { id: "tr_2", encounterId: "enc_2", source: "mock" as const, content: mockTranscript2 },
  ];

  const makeSections = (encId: string) =>
    soapTemplate.sections.map((s) => ({
      id: `${encId}_${s.id}`,
      title: s.title,
      content: "",
      autoGenerated: true,
    }));

  const notes = [
    { id: "note_1", encounterId: "enc_1", templateId: SOAP_TEMPLATE_ID, sections: makeSections("enc_1") },
    { id: "note_2", encounterId: "enc_2", templateId: SOAP_TEMPLATE_ID, sections: makeSections("enc_2") },
  ];

  return {
    clinicians,
    patients,
    encounters,
    transcripts,
    notes,
    settings: {
      persistLocal: true,
      showSimulatedBanner: true,
      sessionSimulated: { isLoggedIn: true },
    },
  };
}
