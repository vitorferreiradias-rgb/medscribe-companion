import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_HOURS = 6;
const MAX_PER_CATEGORY = 20;
const FETCH_TIMEOUT = 8000;

const INTERNATIONAL_SOURCES = ["FDA", "FDA Drugs", "EMA", "PubMed", "PubMed Estudos", "PubMed Novos Fármacos", "OMS"];

interface Headline {
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  priority: number;
}

const HIGH_PRIORITY_TERMS = [
  "aprovação", "falsificação", "recall", "urgente", "emergência", "alerta",
  "suspensão", "proibição", "interdição",
  "approval", "fda", "recall", "alert", "emergency", "warning", "banned",
  // Vigilância sanitária
  "vigilância", "farmacovigilância", "sanitário", "fiscalização", "monitoramento",
  "surveillance", "pharmacovigilance",
  // Sociedades & órgãos
  "cfm", "sociedade", "conselho",
  // Novos fármacos / ensaios
  "novo medicamento", "new drug", "clinical trial", "ensaio clínico",
];

const NATIONAL_SOURCES = [
  "ANVISA", "Min. Saúde", "CONITEC", "CFM", "SBC", "SBD", "SBEM",
  "FIOCRUZ", "AMB", "Farmacovigilância", "ANVISA Vigilância",
];

function calcPriority(title: string, summary: string, source = ""): number {
  const text = `${title} ${summary}`.toLowerCase();
  let score = 0;
  for (const term of HIGH_PRIORITY_TERMS) {
    if (text.includes(term.toLowerCase())) score += 10;
  }
  // Bônus nacional
  if (NATIONAL_SOURCES.some((ns) => source.includes(ns))) score += 5;
  return score;
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function parseDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
  } catch { /* ignore */ }
  return new Date().toLocaleDateString("pt-BR");
}

async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// ─── RSS Parser ──────────────────────────────────────────────
async function fetchRSS(url: string, source: string): Promise<Headline[]> {
  try {
    console.log(`Fetching RSS: ${url}`);
    const res = await fetchWithTimeout(url);
    if (!res.ok) { console.warn(`RSS ${url} returned ${res.status}`); return []; }
    const xml = await res.text();

    const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
    const entries = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
    const allBlocks = [...items, ...entries];

    const headlines: Headline[] = [];
    for (const block of allBlocks.slice(0, 20)) {
      const title = decodeHTMLEntities(block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
      if (!title) continue;

      const link = block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1]
        || decodeHTMLEntities(block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || "");

      const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]
        || block.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]
        || block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] || "";

      const description = decodeHTMLEntities(
        block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]
        || block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] || ""
      ).substring(0, 300);

      headlines.push({
        title: title.substring(0, 200), summary: description, source, url: link,
        published_at: parseDate(pubDate), priority: calcPriority(title, description, source),
      });
    }
    console.log(`RSS ${source}: ${headlines.length} items`);
    return headlines;
  } catch (err) { console.warn(`RSS fetch failed for ${source}:`, err); return []; }
}

// ─── HTML Scraper ────────────────────────────────────────────
async function scrapeHTML(url: string, source: string, linkPattern: RegExp, baseUrl: string): Promise<Headline[]> {
  try {
    console.log(`Scraping HTML: ${url}`);
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const html = await res.text();

    const headlines: Headline[] = [];
    let match;
    while ((match = linkPattern.exec(html)) !== null && headlines.length < 20) {
      const href = match[1];
      const title = decodeHTMLEntities(match[2] || "");
      if (!title || title.length < 10) continue;

      const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
      headlines.push({
        title: title.substring(0, 200), summary: "", source, url: fullUrl,
        published_at: new Date().toLocaleDateString("pt-BR"),
        priority: calcPriority(title, "", source),
      });
    }
    console.log(`Scrape ${source}: ${headlines.length} items`);
    return headlines;
  } catch (err) { console.warn(`Scrape failed for ${source}:`, err); return []; }
}

// ─── FDA Drug Approvals Scraper ──────────────────────────────
async function fetchFDADrugApprovals(): Promise<Headline[]> {
  const url = "https://www.fda.gov/drugs/novel-drug-approvals-fda/novel-drug-approvals-2026";
  try {
    console.log("Scraping FDA Drug Approvals table");
    const res = await fetchWithTimeout(url, 10000);
    if (!res.ok) { console.warn(`FDA approvals page returned ${res.status}`); return []; }
    const html = await res.text();

    const headlines: Headline[] = [];
    // Match table rows: Number, Drug Name (with optional link), Active Ingredient, Date, Approved Use
    const rowRegex = /<tr[^>]*>\s*<td[^>]*>\s*(\d+)\.?\s*<\/td>\s*<td[^>]*>(?:<a[^>]+href=["']([^"']+)["'][^>]*>)?\s*([\s\S]*?)\s*(?:<\/a>)?\s*<\/td>\s*<td[^>]*>\s*([\s\S]*?)\s*<\/td>\s*<td[^>]*>\s*([\s\S]*?)\s*<\/td>\s*<td[^>]*>\s*([\s\S]*?)\s*<\/td>/gi;

    let match;
    while ((match = rowRegex.exec(html)) !== null && headlines.length < 20) {
      const drugLink = match[2] || "";
      const drugName = decodeHTMLEntities(match[3]).trim();
      const activeIngredient = decodeHTMLEntities(match[4]).trim();
      const approvalDate = decodeHTMLEntities(match[5]).trim();
      const approvedUse = decodeHTMLEntities(match[6]).trim();

      if (!drugName || drugName.length < 2) continue;

      const fullUrl = drugLink.startsWith("http") ? drugLink : drugLink ? `https://www.fda.gov${drugLink}` : url;

      headlines.push({
        title: `${drugName} (${activeIngredient}) — aprovação FDA`,
        summary: `Aprovado em ${approvalDate}. ${approvedUse}`.substring(0, 300),
        source: "FDA Drugs",
        url: fullUrl,
        published_at: parseDate(approvalDate),
        priority: calcPriority(drugName, approvedUse, "FDA Drugs") + 5,
      });
    }
    console.log(`FDA Drug Approvals: ${headlines.length} items`);
    return headlines;
  } catch (err) { console.warn("FDA Drug Approvals fetch failed:", err); return []; }
}

// ─── PubMed E-Utilities ─────────────────────────────────────
async function fetchPubMed(query: string, source = "PubMed"): Promise<Headline[]> {
  try {
    console.log(`PubMed search: ${query}`);
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=10&sort=date&retmode=json`;
    const searchRes = await fetchWithTimeout(searchUrl);
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const ids: string[] = searchData?.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const summaryRes = await fetchWithTimeout(summaryUrl);
    if (!summaryRes.ok) return [];
    const summaryData = await summaryRes.json();

    const headlines: Headline[] = [];
    for (const id of ids) {
      const article = summaryData?.result?.[id];
      if (!article) continue;
      const title = (article.title || "").replace(/<[^>]+>/g, "");
      if (!title) continue;
      headlines.push({
        title: title.substring(0, 200),
        summary: (article.source || "") + (article.pubdate ? ` (${article.pubdate})` : ""),
        source, url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        published_at: parseDate(article.pubdate || ""),
        priority: calcPriority(title, "", source),
      });
    }
    console.log(`PubMed: ${headlines.length} items`);
    return headlines;
  } catch (err) { console.warn("PubMed fetch failed:", err); return []; }
}

// ─── Reusable link pattern for gov.br and societies ─────────
const govBrLinkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

// ─── Category Sources ────────────────────────────────────────
type CategoryFetcher = () => Promise<Headline[]>;

const categoryFetchers: Record<string, CategoryFetcher[]> = {
  hoje: [
    // Existentes
    () => fetchRSS("https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/RSS", "ANVISA"),
    () => fetchRSS("https://www.gov.br/saude/pt-br/assuntos/noticias/RSS", "Min. Saúde"),
    () => fetchRSS("https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml", "FDA"),
    // Novas: Vigilância sanitária
    () => scrapeHTML("https://www.gov.br/anvisa/pt-br/assuntos/farmacovigilancia", "Farmacovigilância", govBrLinkPattern, "https://www.gov.br"),
    () => scrapeHTML("https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento", "ANVISA Vigilância", govBrLinkPattern, "https://www.gov.br"),
    // Novas: Sociedades & órgãos
    () => scrapeHTML("https://portal.cfm.org.br/noticias/", "CFM", /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "https://portal.cfm.org.br"),
    () => scrapeHTML("https://portal.fiocruz.br/noticias", "FIOCRUZ", govBrLinkPattern, "https://portal.fiocruz.br"),
    () => scrapeHTML("https://amb.org.br/noticias/", "AMB", /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "https://amb.org.br"),
  ],
  diretrizes: [
    // Existentes
    () => scrapeHTML("https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/protocolos-clinicos-e-diretrizes-terapeuticas", "CONITEC", govBrLinkPattern, "https://www.gov.br"),
    () => fetchPubMed("Practice Guideline[pt] AND (clinical OR medicine)", "PubMed"),
    // Novas: Sociedades médicas
    () => scrapeHTML("https://portal.cfm.org.br/noticias/", "CFM", /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "https://portal.cfm.org.br"),
    () => scrapeHTML("https://www.portal.cardiol.br/noticias", "SBC", /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "https://www.portal.cardiol.br"),
    () => scrapeHTML("https://diabetes.org.br/noticias/", "SBD", /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "https://diabetes.org.br"),
    () => scrapeHTML("https://www.endocrino.org.br/noticias/", "SBEM", /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "https://www.endocrino.org.br"),
    // Nova: PubMed estudos clínicos recentes
    () => fetchPubMed("randomized controlled trial[pt] AND 2026[dp]", "PubMed Estudos"),
  ],
  medicacoes: [
    // Existentes
    () => fetchRSS("https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/RSS", "ANVISA"),
    () => fetchFDADrugApprovals(),
    () => fetchPubMed("drug approval OR drug recall OR pharmacovigilance", "PubMed"),
    // Novas: Vigilância
    () => scrapeHTML("https://www.gov.br/anvisa/pt-br/assuntos/farmacovigilancia", "Farmacovigilância", govBrLinkPattern, "https://www.gov.br"),
    () => scrapeHTML("https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento", "ANVISA Vigilância", govBrLinkPattern, "https://www.gov.br"),
    // Nova: EMA
    () => scrapeHTML("https://www.ema.europa.eu/en/news", "EMA", /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "https://www.ema.europa.eu"),
    // Nova: PubMed novos fármacos
    () => fetchPubMed("new drug approval OR novel therapy 2026", "PubMed Novos Fármacos"),
  ],
  eventos: [
    // Existentes
    () => fetchPubMed("medical congress OR medical symposium OR clinical meeting 2026", "PubMed"),
    () => fetchRSS("https://www.who.int/rss-feeds/news-english.xml", "OMS"),
    // Nova: SBC eventos
    () => scrapeHTML("https://www.portal.cardiol.br/noticias", "SBC", /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "https://www.portal.cardiol.br"),
  ],
};

// Category-specific keyword filters
const categoryKeywords: Record<string, string[]> = {
  hoje: [], // no filter, show all
  diretrizes: [
    "diretriz", "protocolo", "guia", "resolução", "pcdt", "guideline", "protocol", "recommendation", "standard",
    "cfm", "sociedade", "ensaio", "trial", "estudo",
  ],
  medicacoes: [
    "medicamento", "droga", "remédio", "registro", "aprovação", "bula", "recall", "drug", "medicine", "approval", "fda", "ema", "anvisa",
    "vigilância", "farmacovigilância", "fiscalização", "monitoramento", "novo medicamento", "new drug", "clinical trial", "terapia", "therapy",
  ],
  eventos: [
    "congresso", "simpósio", "webinar", "encontro", "evento", "reunião", "congress", "symposium", "meeting", "webinar", "event", "conference",
    "sociedade", "sbc", "sbd", "sbem", "jornada",
  ],
};

function filterByKeywords(items: Headline[], category: string): Headline[] {
  const keywords = categoryKeywords[category];
  if (!keywords || keywords.length === 0) return items;

  const matching = items.filter((item) => {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });

  if (matching.length >= 5) return matching;
  return items;
}

// ─── Translation ─────────────────────────────────────────────
async function translateHeadlines(headlines: Headline[]): Promise<Headline[]> {
  const international = headlines.filter((h) => INTERNATIONAL_SOURCES.includes(h.source));
  const national = headlines.filter((h) => !INTERNATIONAL_SOURCES.includes(h.source));

  if (international.length === 0) return headlines;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.warn("LOVABLE_API_KEY not set, skipping translation");
    return headlines;
  }

  try {
    const items = international.map((h, i) => ({
      i,
      t: h.title,
      s: h.summary,
    }));

    const prompt = `Traduza os seguintes títulos e resumos de notícias médicas do inglês para o português brasileiro.
Mantenha termos técnicos médicos reconhecidos (ex: FDA, EMA, PubMed).
Retorne APENAS um JSON array com objetos {\"t\":\"título traduzido\",\"s\":\"resumo traduzido\"} na mesma ordem. Sem explicações.

${JSON.stringify(items.map((x) => ({ t: x.t, s: x.s })))}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!aiRes.ok) {
      console.warn(`Translation API returned ${aiRes.status}, keeping originals`);
      return headlines;
    }

    const aiData = await aiRes.json();
    const content = aiData?.choices?.[0]?.message?.content || "";

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("Translation response has no JSON array, keeping originals");
      return headlines;
    }

    const translations: { t: string; s: string }[] = JSON.parse(jsonMatch[0]);

    if (translations.length !== international.length) {
      console.warn(`Translation count mismatch (${translations.length} vs ${international.length}), keeping originals`);
      return headlines;
    }

    for (let i = 0; i < international.length; i++) {
      if (translations[i]?.t) international[i].title = translations[i].t;
      if (translations[i]?.s) international[i].summary = translations[i].s;
    }

    console.log(`Translated ${international.length} international headlines to PT-BR`);
    return [...national, ...international];
  } catch (err) {
    console.warn("Translation failed, keeping originals:", err);
    return headlines;
  }
}

// ─── Main Handler ────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, force } = await req.json();

    if (!category || !categoryFetchers[category]) {
      return new Response(
        JSON.stringify({ error: "Invalid category. Use: hoje, diretrizes, medicacoes, eventos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache unless force refresh
    if (!force) {
      const cacheThreshold = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from("medical_news")
        .select("*")
        .eq("category", category)
        .gte("fetched_at", cacheThreshold)
        .order("fetched_at", { ascending: false })
        .limit(MAX_PER_CATEGORY);

      if (cached && cached.length > 0) {
        return new Response(JSON.stringify({ news: cached, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch from all sources in parallel
    const fetchers = categoryFetchers[category];
    const results = await Promise.allSettled(fetchers.map((fn) => fn()));

    let allHeadlines: Headline[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allHeadlines.push(...result.value);
      }
    }

    // Translate international headlines to PT-BR
    allHeadlines = await translateHeadlines(allHeadlines);

    // Filter by category keywords
    allHeadlines = filterByKeywords(allHeadlines, category);

    // Deduplicate by title similarity
    const seen = new Set<string>();
    allHeadlines = allHeadlines.filter((h) => {
      const key = h.title.toLowerCase().substring(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by priority (highest first)
    allHeadlines.sort((a, b) => b.priority - a.priority);

    // Limit
    allHeadlines = allHeadlines.slice(0, MAX_PER_CATEGORY);

    if (allHeadlines.length === 0) {
      const { data: staleCache } = await supabase
        .from("medical_news").select("*").eq("category", category)
        .order("fetched_at", { ascending: false }).limit(MAX_PER_CATEGORY);

      if (staleCache && staleCache.length > 0) {
        return new Response(JSON.stringify({ news: staleCache, cached: true, stale: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ error: "No results from any source" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete old news for this category and insert new ones
    await supabase.from("medical_news").delete().eq("category", category);

    const rows = allHeadlines.map((h) => ({
      title: h.title, summary: h.summary, source: h.source, url: h.url,
      category, published_at: h.published_at, fetched_at: new Date().toISOString(),
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("medical_news").insert(rows).select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to cache news" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ news: inserted, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
