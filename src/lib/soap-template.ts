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
