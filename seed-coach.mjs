/**
 * Demo coach seed — creates v.munster@weareimpact.nl as coach for Impact JO10-1
 * Run with: node seed-coach.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL   = 'https://ezbsychffwnavedwiqvw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6YnN5Y2hmZnduYXZlZHdpcXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTcyNzgsImV4cCI6MjA5NDA3MzI3OH0.nDtUgUuTE9isLJlfNaBUnCI6WDRtbaJsiaV6jcv--ZE';

const COACH_EMAIL    = 'v.munster@weareimpact.nl';
const COACH_PASSWORD = 'Demo1234';
const TEAM_ID        = 'IMPACT-JO10-1';
const CLUB_ID        = 'IMPACT-FC';

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log(`\n🔐 Aanmaken / inloggen als ${COACH_EMAIL}...`);

  // Try signup first
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: COACH_EMAIL,
    password: COACH_PASSWORD,
  });

  if (signUpError && !signUpError.message.includes('already registered')) {
    console.error('❌ Signup fout:', signUpError.message);
    process.exit(1);
  }

  // Sign in to get session
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: COACH_EMAIL,
    password: COACH_PASSWORD,
  });

  if (signInError) {
    console.error('❌ Inloggen mislukt:', signInError.message);
    process.exit(1);
  }

  const userId = signInData.user.id;
  console.log(`   ✅ Auth user ID: ${userId}`);

  const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${signInData.session.access_token}` } },
  });

  // Upsert profile
  const { error: profileError } = await authedClient.from('profiles').upsert({
    id: userId,
    role: 'coach',
    team_id: TEAM_ID,
    club_id: CLUB_ID,
    email: COACH_EMAIL,
  }, { onConflict: 'id' });

  if (profileError) console.warn('   ⚠️  Profile upsert:', profileError.message);
  else console.log(`   ✅ Profile aangemaakt (coach, ${TEAM_ID})`);

  console.log('\n' + '═'.repeat(45));
  console.log('🎉 Demo coach klaar!\n');
  console.log(`  Email:      ${COACH_EMAIL}`);
  console.log(`  Wachtwoord: ${COACH_PASSWORD}`);
  console.log(`  Team:       ${TEAM_ID}`);
  console.log(`  Club:       ${CLUB_ID}\n`);
}

run().catch(console.error);
