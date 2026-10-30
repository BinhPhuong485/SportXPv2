const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = trimmed.substring('VITE_SUPABASE_URL='.length).trim();
  }
  if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = trimmed.substring('VITE_SUPABASE_ANON_KEY='.length).trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function run() {
  console.log('Testing authentication for bp@gmail.com ...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'bp@gmail.com',
    password: (process.env.TEST_PWD || ""),
  });

  if (authError) {
    console.error('Sign-in failed:', authError.message);
    process.exit(1);
  }

  console.log('Sign-in SUCCESS!');
  console.log('User ID:', authData.user?.id);
  console.log('Email:', authData.user?.email);
  console.log('User metadata:', JSON.stringify(authData.user?.user_metadata));

  console.log('\nChecking onboarding state via RPC get_onboarding_state ...');
  const { data: onboardingData, error: rpcError } = await supabase.rpc('get_onboarding_state');

  if (rpcError) {
    console.error('get_onboarding_state RPC failed:', rpcError.message);
  } else {
    console.log('get_onboarding_state SUCCESS:');
    console.log(JSON.stringify(onboardingData, null, 2));
  }

  console.log('\nTesting sign-out ...');
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error('Sign-out failed:', signOutError.message);
  } else {
    console.log('Sign-out SUCCESS!');
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

