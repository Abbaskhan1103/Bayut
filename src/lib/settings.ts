import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export const getHijriOffset = cache(async (): Promise<number> => {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("app_settings")
      .select("value")
      .eq("key", "hijri_offset")
      .single();
    return data ? parseInt(data.value, 10) || 0 : 0;
  } catch {
    return 0;
  }
});
