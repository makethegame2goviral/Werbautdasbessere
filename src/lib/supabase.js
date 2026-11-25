import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xbefkwirfijxglgoogrn.supabase.co";
const supabaseKey = "sb_publishable_3hsQ2uEpBBYOQ2rh44J2BQ_6mt9md6T";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 10 } }
});