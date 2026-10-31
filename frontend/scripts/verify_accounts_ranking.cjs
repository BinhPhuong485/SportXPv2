const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (const line of envFile.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRankings() {
  console.log('Signing in as Account A...');
  await supabase.auth.signInWithPassword({
    email: 'bp@gmail.com',
    password: (process.env.TEST_PWD || "")
  });

  console.log('Querying profiles for A and B...');
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, display_name, elo_rating, tier_name, win_streak, home_court_id, onboarding_step')
    .in('id', ['9ded99f9-af7d-4297-829a-18e213294403', 'b86ef8fb-4486-4a71-a5a9-d6430f48857d']);

  if (pErr) console.error('Error fetching profiles:', pErr);
  else console.log('Profiles A & B:', profiles);

  // Fetch all courts
  const { data: courts } = await supabase.from('courts').select('id, name');
  console.log('Courts:', courts);

  // Check leaderboard for each court
  for (const c of courts) {
    const { data: lb } = await supabase
      .from('profiles')
      .select('id, display_name, elo_rating, tier_name')
      .not('elo_rating', 'is', null)
      .eq('onboarding_step', 5)
      .eq('home_court_id', c.id)
      .order('elo_rating', { ascending: false })
      .order('id', { ascending: true });

    console.log(`\nCourt: ${c.name} (${c.id}) -> Total ranked players: ${lb?.length}`);
    if (lb && lb.length > 0) {
      lb.forEach((p, idx) => {
        const isA = p.id === '9ded99f9-af7d-4297-829a-18e213294403' ? ' [ACCOUNT A]' : '';
        const isB = p.id === 'b86ef8fb-4486-4a71-a5a9-d6430f48857d' ? ' [ACCOUNT B]' : '';
        console.log(`  #${idx + 1}: ${p.display_name} - ${p.elo_rating} Elo (${p.tier_name})${isA}${isB}`);
      });
    }
  }
}

verifyRankings();
