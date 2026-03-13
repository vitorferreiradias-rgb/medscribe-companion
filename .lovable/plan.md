

# Avaliação do Prompt Sugerido vs. Prompt Atual

## Diagnóstico

O prompt sugerido pela outra IA traz **conceitos válidos**, mas o nosso prompt atual já cobre a maioria deles — e com mais profundidade. Veja a comparação:

| Aspecto | Prompt sugerido | Nosso prompt atual | Veredicto |
|---|---|---|---|
| Gordura abdominal | ✅ mencionado | ✅ Análise Regional detalhada (abdômen, flancos, padrão androide/ginoide) | Já cobrimos melhor |
| Perda de definição muscular | ✅ mencionado | ✅ "Massa muscular: desenvolvimento por grupo muscular visível" | Já cobrimos |
| Postura anteriorizada | ✅ mencionado | ✅ Seção "Análise Postural" com cifose, lordose, escoliose, inclinação pélvica | Já cobrimos melhor |
| Assimetria muscular | ✅ mencionado | ✅ "simetria" em cada região da tabela + "proporção entre membros" | Já cobrimos |
| Edema periférico | ✅ mencionado | ✅ "retenção hídrica aparente" nas pernas + "sinais de edema" nos alertas | Já cobrimos |
| Alterações cutâneas | ✅ mencionado | ✅ Seção "Alertas Cutâneos" + "Aspectos dermatológicos" | Já cobrimos melhor |
| **Correlação metabólica/saúde** | ✅ educativo | 🟡 Parcial — mencionamos critérios de gravidade mas falta correlação educativa | **Ponto a melhorar** |

## O que falta no nosso prompt

O prompt sugerido tem um diferencial: **explicação educativa** de como os achados visuais se relacionam com saúde, metabolismo e estilo de vida. Nosso prompt atual é mais técnico/clínico, mas não explica ao paciente *por que* aquilo importa.

Proposta: adicionar uma nova seção **"Correlações Metabólicas e Funcionais"** entre a Integração Clínica (seção 3) e as Observações (seção 4), com instruções para a IA explicar:

- Como a distribuição de gordura observada se relaciona com risco metabólico (ex: gordura visceral → resistência insulínica)
- Como alterações posturais podem impactar funcionalidade e dor
- Como sinais de edema ou alterações cutâneas podem indicar processos sistêmicos
- Linguagem acessível e educativa, que o médico possa compartilhar com o paciente

## Mudanças

| Arquivo | Mudança |
|---|---|
| `supabase/functions/consolidated-analysis/index.ts` | Adicionar seção "Correlações Metabólicas e Funcionais" no prompt de `composition` e `evolution`, entre Integração Clínica e Observações |

A seção será concisa (3-5 bullets) e usará linguagem que o médico possa usar diretamente na comunicação com o paciente.

