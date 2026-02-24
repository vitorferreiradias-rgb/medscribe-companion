import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MedicalNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string | null;
  category: string;
  published_at: string;
  fetched_at: string;
  created_at: string;
}

async function fetchNewsFromCache(category: string): Promise<MedicalNewsItem[]> {
  const { data, error } = await supabase
    .from("medical_news")
    .select("*")
    .eq("category", category)
    .order("fetched_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data as unknown as MedicalNewsItem[]) ?? [];
}

async function refreshNews(category: string): Promise<MedicalNewsItem[]> {
  const { data, error } = await supabase.functions.invoke("fetch-medical-news", {
    body: { category, force: false },
  });

  if (error) throw error;
  return data?.news ?? [];
}

async function forceRefreshNews(category: string): Promise<MedicalNewsItem[]> {
  const { data, error } = await supabase.functions.invoke("fetch-medical-news", {
    body: { category, force: true },
  });

  if (error) throw error;
  return data?.news ?? [];
}

export function useMedicalNews(category: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["medical-news", category],
    queryFn: async () => {
      // Try cache first
      const cached = await fetchNewsFromCache(category);
      if (cached.length > 0) {
        // Check if cache is fresh (< 24h)
        const fetchedAt = new Date(cached[0].fetched_at).getTime();
        const now = Date.now();
        if (now - fetchedAt < 24 * 60 * 60 * 1000) {
          return cached;
        }
      }
      // Cache empty or stale — fetch from edge function
      return refreshNews(category);
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });

  const forceRefresh = useMutation({
    mutationFn: () => forceRefreshNews(category),
    onSuccess: (news) => {
      queryClient.setQueryData(["medical-news", category], news);
    },
  });

  return { ...query, forceRefresh };
}
