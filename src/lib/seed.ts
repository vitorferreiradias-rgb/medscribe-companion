import { AppData, ScheduleEvent } from "@/types";
import { parseTranscriptToSections } from "./parser";
import { SOAP_TEMPLATE_ID } from "./soap-template";

function daysAgo(n: number, hour = 9, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function endTime(start: string, durationSec: number): string {
  return new Date(new Date(start).getTime() + durationSec * 1000).toISOString();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

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
    { id: "cli_1", name: "Dr. Ricardo Mendes", specialty: "Clínica Geral", crm: "CRM 123456/SP", cpf: "123.456.789-00", email: "ricardo@medscribe.app", clinicAddress: "Clínica Saúde Total — Av. Paulista 1000, São Paulo-SP", clinics: [{ id: "clinic_1", name: "Clínica Saúde Total", address: "Av. Paulista 1000, São Paulo-SP" }] },
    { id: "cli_2", name: "Dra. Ana Beatriz Costa", specialty: "Cardiologia", crm: "CRM 654321/SP", cpf: "987.654.321-00", email: "ana@medscribe.app", clinicAddress: "Instituto Cardio — Rua Augusta 500, São Paulo-SP", clinics: [{ id: "clinic_2", name: "Instituto Cardio", address: "Rua Augusta 500, São Paulo-SP" }] },
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

  const notes = [
    {
      id: "note_1",
      encounterId: "enc_1",
      templateId: SOAP_TEMPLATE_ID,
      sections: parseTranscriptToSections(mockTranscript1, "enc_1", "João Silva", "Dr. Ricardo Mendes"),
    },
    {
      id: "note_2",
      encounterId: "enc_2",
      templateId: SOAP_TEMPLATE_ID,
      sections: parseTranscriptToSections(mockTranscript2, "enc_2", "Maria Oliveira", "Dr. Ricardo Mendes"),
    },
  ];

  const today = todayStr();
  const tomorrow = futureDate(1);
  const dayAfter = futureDate(2);

  const scheduleEvents: ScheduleEvent[] = [
    { id: "sch_1", date: today, startTime: "08:00", endTime: "08:30", patientId: "pat_1", clinicianId: "cli_1", type: "retorno", status: "scheduled", notes: "Retorno cefaleia" },
    { id: "sch_2", date: today, startTime: "08:30", endTime: "09:00", patientId: "pat_3", clinicianId: "cli_1", type: "primeira", status: "scheduled" },
    { id: "sch_3", date: today, startTime: "09:00", endTime: "09:30", patientId: "pat_5", clinicianId: "cli_1", type: "retorno", status: "done", encounterId: "enc_5", notes: "Controle PA" },
    { id: "sch_4", date: today, startTime: "09:30", endTime: "10:00", patientId: "pat_2", clinicianId: "cli_1", type: "retorno", status: "scheduled" },
    { id: "sch_5", date: today, startTime: "10:00", endTime: "10:30", patientId: "pat_6", clinicianId: "cli_1", type: "primeira", status: "scheduled" },
    { id: "sch_6", date: today, startTime: "11:00", endTime: "11:30", patientId: "pat_4", clinicianId: "cli_1", type: "procedimento", status: "scheduled", notes: "Pequeno procedimento" },
    { id: "sch_7", date: today, startTime: "14:00", endTime: "14:30", patientId: "pat_7", clinicianId: "cli_1", type: "retorno", status: "scheduled" },
    { id: "sch_8", date: today, startTime: "15:00", endTime: "15:30", patientId: "pat_8", clinicianId: "cli_1", type: "primeira", status: "scheduled" },
    // Tomorrow
    { id: "sch_9", date: tomorrow, startTime: "08:00", endTime: "08:30", patientId: "pat_2", clinicianId: "cli_1", type: "retorno", status: "scheduled" },
    { id: "sch_10", date: tomorrow, startTime: "09:00", endTime: "09:30", patientId: "pat_4", clinicianId: "cli_1", type: "primeira", status: "scheduled" },
    // Day after
    { id: "sch_11", date: dayAfter, startTime: "10:00", endTime: "10:30", patientId: "pat_1", clinicianId: "cli_1", type: "retorno", status: "scheduled" },
  ];

  const timeBlocks: import("@/types").TimeBlock[] = [
    { id: "tb_1", date: today, startTime: "12:00", endTime: "13:00", reason: "Almoço", recurrence: "daily", clinicianId: "cli_1" },
  ];

  return {
    clinicians,
    patients,
    encounters,
    transcripts,
    notes,
    scheduleEvents,
    timeBlocks,
    settings: {
      persistLocal: true,
      showSimulatedBanner: true,
      sessionSimulated: { isLoggedIn: true },
    },
  };
}
