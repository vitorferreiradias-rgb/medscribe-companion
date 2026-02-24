import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_HOURS = 24;

const categoryQueries: Record<string, string> = {
  hoje: "notícias medicina saúde Brasil 2026",
  diretrizes: "novas diretrizes clínicas protocolos medicina Brasil",
  medicacoes: "medicamentos aprovados Anvisa alertas farmacológicos",
  eventos: "congressos simpósios medicina Brasil 2026",
};

const domainToSource: Record<string, string> = {
  "anvisa.gov.br": "Anvisa",
  "gov.br": "Min. Saúde",
  "portal.cfm.org.br": "CFM",
  "cfm.org.br": "CFM",
  "sbc.org.br": "SBC",
  "inca.gov.br": "INCA",
  "sbp.com.br": "SBP",
  "pebmed.com.br": "PEBMED",
  "medscape.com": "Medscape",
  "sbmfc.org.br": "SBMFC",
  "saude.gov.br": "Min. Saúde",
};

function extractSource(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    for (const [domain, source] of Object.entries(domainToSource)) {
      if (hostname.includes(domain)) return source;
    }
    // Fallback: use first part of domain
    const parts = hostname.split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return "Web";
  }
}

function extractDate(item: any): string {
  // Try pagemap metatags for date
  try {
    const metatags = item.pagemap?.metatags?.[0];
    const dateStr =
      metatags?.["article:published_time"] ||
      metatags?.["og:updated_time"] ||
      metatags?.["date"] ||
      item.snippet?.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/)?.[0];
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("pt-BR");
      }
    }
  } catch {
    // ignore
  }
  return new Date().toLocaleDateString("pt-BR");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, force } = await req.json();

    if (!category || !categoryQueries[category]) {
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
        .limit(5);

      if (cached && cached.length > 0) {
        return new Response(JSON.stringify({ news: cached, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Google CSE API
    const cseApiKey = Deno.env.get("GOOGLE_CSE_API_KEY")?.trim();
    const cseCx = Deno.env.get("GOOGLE_CSE_CX")?.trim();

    if (!cseApiKey || !cseCx) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_CSE_API_KEY or GOOGLE_CSE_CX not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("CSE config - cx length:", cseCx.length, "key length:", cseApiKey.length, "cx preview:", cseCx.substring(0, 5) + "...");

    const query = encodeURIComponent(categoryQueries[category]);
    const cseUrl = `https://www.googleapis.com/customsearch/v1?key=${cseApiKey}&cx=${cseCx}&q=${query}&num=5&dateRestrict=m1`;

    const cseResponse = await fetch(cseUrl);

    if (!cseResponse.ok) {
      const errText = await cseResponse.text();
      console.error("CSE API error:", errText);

      // On rate limit (429) or other errors, try returning stale cache
      const { data: staleCache } = await supabase
        .from("medical_news")
        .select("*")
        .eq("category", category)
        .order("fetched_at", { ascending: false })
        .limit(5);

      if (staleCache && staleCache.length > 0) {
        return new Response(JSON.stringify({ news: staleCache, cached: true, stale: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ error: `Google CSE error: ${cseResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cseData = await cseResponse.json();
    const items = cseData.items ?? [];

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No results from Google CSE" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete old news for this category and insert new ones
    await supabase.from("medical_news").delete().eq("category", category);

    const rows = items.slice(0, 5).map((item: any) => ({
      title: (item.title ?? "").substring(0, 200),
      summary: (item.snippet ?? "").substring(0, 300),
      source: extractSource(item.link ?? ""),
      url: item.link ?? "",
      category,
      published_at: extractDate(item),
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
