

# Renomear botao "Gerar prontuario" para "Gerar prontuario IA"

Alteracao simples de texto no arquivo `src/pages/NovaConsulta.tsx` para deixar claro que a funcao usa inteligencia artificial.

## O que muda

Os tres estados do botao passam a incluir "IA" no label:

- "Gerar prontuario" → **"Gerar prontuario IA"**
- "Gerar novamente" → **"Gerar novamente IA"** (opcional, mas mantem consistencia)
- "Gerando..." → **"Gerando IA..."**

## Secao tecnica

**Arquivo: `src/pages/NovaConsulta.tsx`** (linhas ~675-681)

Trocar os textos dentro do botao secundario:

- `Gerando…` → `Gerando IA…`
- `Gerar novamente` → `Gerar prontuario IA`
- `Gerar prontuário` → `Gerar prontuario IA`

