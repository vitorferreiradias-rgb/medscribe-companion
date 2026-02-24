import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_HOURS = 6;
const MAX_PER_CATEGORY = 15;
const FETCH_TIMEOUT = 8000;

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
];

function calcPriority(title: string, summary: string): number {
  const text = `${title} ${summary}`.toLowerCase();
  let score = 0;
  for (const term of HIGH_PRIORITY_TERMS) {
    if (text.includes(term)) score += 10;
  }
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
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("pt-BR");
    }
  } catch { /* ignore */ }
  return new Date().toLocaleDateString("pt-BR");
}

async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// ─── RSS Parser ──────────────────────────────────────────────
async function fetchRSS(url: string, source: string): Promise<Headline[]> {
  try {
    console.log(`Fetching RSS: ${url}`);
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.warn(`RSS ${url} returned ${res.status}`);
      return [];
    }
    const xml = await res.text();

    // Parse <item> or <entry> blocks
    const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
    const entries = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
    const allBlocks = [...items, ...entries];

    const headlines: Headline[] = [];
    for (const block of allBlocks.slice(0, 20)) {
      const title = decodeHTMLEntities(
        block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""
      );
      if (!title) continue;

      // <link> can be text content or href attribute
      let link = block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1]
        || decodeHTMLEntities(block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || "");

      const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]
        || block.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]
        || block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1]
        || "";

      const description = decodeHTMLEntities(
        block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]
        || block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1]
        || ""
      ).substring(0, 300);

      headlines.push({
        title: title.substring(0, 200),
        summary: description,
        source,
        url: link,
        published_at: parseDate(pubDate),
        priority: calcPriority(title, description),
      });
    }
    console.log(`RSS ${source}: ${headlines.length} items`);
    return headlines;
  } catch (err) {
    console.warn(`RSS fetch failed for ${source}:`, err);
    return [];
  }
}

// ─── HTML Scraper ────────────────────────────────────────────
async function scrapeHTML(
  url: string,
  source: string,
  linkPattern: RegExp,
  baseUrl: string
): Promise<Headline[]> {
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
        title: title.substring(0, 200),
        summary: "",
        source,
        url: fullUrl,
        published_at: new Date().toLocaleDateString("pt-BR"),
        priority: calcPriority(title, ""),
      });
    }
    console.log(`Scrape ${source}: ${headlines.length} items`);
    return headlines;
  } catch (err) {
    console.warn(`Scrape failed for ${source}:`, err);
    return [];
  }
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
        source,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        published_at: parseDate(article.pubdate || ""),
        priority: calcPriority(title, ""),
      });
    }
    console.log(`PubMed: ${headlines.length} items`);
    return headlines;
  } catch (err) {
    console.warn("PubMed fetch failed:", err);
    return [];
  }
}

// ─── Category Sources ────────────────────────────────────────
type CategoryFetcher = () => Promise<Headline[]>;

const categoryFetchers: Record<string, CategoryFetcher[]> = {
  hoje: [
    () => fetchRSS("https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/RSS", "ANVISA"),
    () => fetchRSS("https://www.gov.br/saude/pt-br/assuntos/noticias/RSS", "Min. Saúde"),
    () => fetchRSS("https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml", "FDA"),
  ],
  diretrizes: [
    () => scrapeHTML(
      "https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/protocolos-clinicos-e-diretrizes-terapeuticas",
      "CONITEC",
      /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      "https://www.gov.br"
    ),
    () => fetchPubMed("Practice Guideline[pt] AND (clinical OR medicine)", "PubMed"),
  ],
  medicacoes: [
    () => fetchRSS("https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/RSS", "ANVISA"),
    () => fetchRSS("https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/drugs/rss.xml", "FDA Drugs"),
    () => fetchPubMed("drug approval OR drug recall OR pharmacovigilance", "PubMed"),
  ],
  eventos: [
    () => fetchPubMed("medical congress OR medical symposium OR clinical meeting 2026", "PubMed"),
    () => fetchRSS("https://www.who.int/rss-feeds/news-english.xml", "OMS"),
  ],
};

// Category-specific keyword filters
const categoryKeywords: Record<string, string[]> = {
  hoje: [], // no filter, show all
  diretrizes: ["diretriz", "protocolo", "guia", "resolução", "pcdt", "guideline", "protocol", "recommendation", "standard"],
  medicacoes: ["medicamento", "droga", "remédio", "registro", "aprovação", "bula", "recall", "drug", "medicine", "approval", "fda", "ema", "anvisa"],
  eventos: ["congresso", "simpósio", "webinar", "encontro", "evento", "reunião", "congress", "symposium", "meeting", "webinar", "event", "conference"],
};

function filterByKeywords(items: Headline[], category: string): Headline[] {
  const keywords = categoryKeywords[category];
  if (!keywords || keywords.length === 0) return items;

  // For categories with keywords, prefer matching items but keep others if needed
  const matching = items.filter((item) => {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });

  if (matching.length >= 5) return matching;
  // If not enough matches, return all items (sources are already relevant)
  return items;
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
      // Return stale cache if no new results
      const { data: staleCache } = await supabase
        .from("medical_news")
        .select("*")
        .eq("category", category)
        .order("fetched_at", { ascending: false })
        .limit(MAX_PER_CATEGORY);

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
      title: h.title,
      summary: h.summary,
      source: h.source,
      url: h.url,
      category,
      published_at: h.published_at,
      fetched_at: new Date().toISOString(),
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("medical_news")
      .insert(rows)
      .select();

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
