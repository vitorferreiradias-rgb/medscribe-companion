

# Problema: IA ignora dados de biópsia/exames no contexto

## Causa raiz

O `buildPatientContext()` monta uma string única com todos os dados do paciente, incluindo biópsias e exames. Porém, no edge function `evolution-compare`, essa string é inserida como um apêndice genérico: `"Contexto do paciente: ..."`. A IA recebe tudo junto numa frase longa e não dá destaque aos resultados de exames/biópsias.

O prompt focal (Passo 3) já instrui a IA a usar a hierarquia de evidência (biópsia > lab > visual), mas como os dados chegam misturados com idade, peso e ângulo da foto, o modelo frequentemente os ignora.

## Solução

Separar os dados de exames/biópsias do contexto geral e enviá-los como uma seção destacada e explícita na mensagem do usuário enviada à IA.

### Mudanças

**1. `src/pages/PacienteDetalhe.tsx`** — Modificar `buildPatientContext()` para retornar um objeto com duas propriedades em vez de uma string única:
- `context`: dados gerais do paciente (idade, sexo, peso, ângulo, datas das fotos)
- `labData`: string separada com exames laboratoriais e biópsias formatados

**2. `supabase/functions/evolution-compare/index.ts`** — Receber `labData` como campo separado no body e incluí-lo na mensagem do usuário com destaque explícito:
```
DADOS CLÍNICOS E EXAMES COMPLEMENTARES DO PACIENTE:
Biópsias: Carcinoma basocelular em 12/01/2026
Exames laboratoriais: TSH: 8.5 (ref: 0.4-4.0) em 10/02/2026

IMPORTANTE: Considere OBRIGATORIAMENTE estes resultados na sua análise,
seguindo a hierarquia de evidência (anatomopatológico > laboratorial > visual).
```

Isso garante que a IA veja os exames como uma seção separada e obrigatória, não como parte de um parágrafo genérico.

