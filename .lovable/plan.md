

# Notícias Reais com Google Cloud API (custo zero)

## Por que mudar
O Lovable AI consome creditos do workspace a cada chamada. A API do Google Cloud (Gemini) tem nivel gratuito generoso, ideal para chamadas recorrentes como busca de noticias.

## Mudanca em relacao ao plano anterior
Apenas o endpoint da IA muda. Todo o resto (tabela, cache 24h, componentes) permanece identico.

- **Antes**: `https://ai.gateway.lovable.dev/v1/chat/completions` com `LOVABLE_API_KEY`
- **Agora**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` com `GOOGLE_AI_API_KEY`

## Pre-requisito
Voce precisa gerar uma chave de API gratuita no Google AI Studio:
1. Acesse https://aistudio.google.com/apikey
2. Clique em "Create API Key"
3. Copie a chave gerada

Depois eu solicito a chave para armazena-la de forma segura no backend.

## Etapas

### 1. Configurar o secret `GOOGLE_AI_API_KEY`
- Solicitar ao usuario a chave via ferramenta segura de secrets
- A chave fica acessivel apenas nas funcoes backend (nunca exposta no frontend)

### 2. Criar tabela `medical_news` (cache)
Mesma estrutura do plano anterior:

```text
medical_news
- id (uuid, PK)
- title (text)
- summary (text)
- source (text)
- url (text)
- category (text) -- hoje, diretrizes, medicacoes, eventos
- published_at (text)
- fetched_at (timestamptz, default now())
- created_at (timestamptz, default now())
```

RLS: leitura permitida para usuarios autenticados.

### 3. Criar Edge Function `fetch-medical-news`
- Recebe parametro `category`
- Verifica cache de 24h no banco
- Se expirado, chama Google Gemini API diretamente:

```text
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
Header: x-goog-api-key = GOOGLE_AI_API_KEY
Body: prompt pedindo noticias medicas reais brasileiras em JSON
```

- Usa tool calling para garantir resposta JSON estruturada
- Salva no banco e retorna

### 4. Atualizar `NewsCard.tsx`
- Substituir array mockado por React Query buscando da tabela `medical_news`
- Botao "Atualizar" chama a Edge Function para forcar refresh

### 5. Atualizar `Noticias.tsx`
- Mesma abordagem: buscar da tabela `medical_news`
- Manter filtros por categoria e busca por texto

## Custo
Zero. A API gratuita do Google Cloud permite chamadas suficientes para este caso de uso. Com cache de 24h, o consumo sera minimo (maximo 4 chamadas por dia, uma por categoria).

## Detalhes Tecnicos

### Chamada ao Gemini (dentro da Edge Function)
```text
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GOOGLE_AI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    }),
  }
);
```

### Prompt por categoria
Cada categoria tera um prompt especifico pedindo 5 noticias reais com titulo, resumo, fonte e data, baseadas em fontes brasileiras como SBC, Anvisa, CFM, INCA, ABN, Ministerio da Saude.

### Fluxo de cache
1. Frontend chama Edge Function com categoria
2. Funcao consulta banco: ha noticias com menos de 24h?
3. Sim -> retorna do banco
4. Nao -> chama Gemini, salva no banco, retorna

