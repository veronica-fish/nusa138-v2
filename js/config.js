const SUPABASE_URL = 'https://caiofdtxwcngglftqrhe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GDnMAXnZQs1Byf5FeB_69w_F1yra1IL';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentSession = null;
let generatedCaptcha = "";