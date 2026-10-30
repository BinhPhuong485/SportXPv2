const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('E:/SQUARE/STUDY/EXE/v3/.env', 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (const line of envFile.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim();
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanup() {
  console.log('Logging in as Host bp@gmail.com...');
  const { data: authA, error: errA } = await supabase.auth.signInWithPassword({
    email: 'bp@gmail.com',
    password: '12345678@'
  });
  if (errA) {
    console.error('Failed to log in as bp@gmail.com:', errA);
    return;
  }
  console.log('Logged in as bp@gmail.com.');

  const roomsToCancel = [
    'c91aed08-0874-4488-a870-0d915e413037',
    'dd2c94a6-a4b6-46a9-8e59-6e7826feb6be'
  ];

  for (const roomId of roomsToCancel) {
    console.log(`Cancelling room ${roomId}...`);
    const { data, error } = await supabase.rpc('room_command_v2', {
      p_room_id: roomId,
      p_action: 'cancel',
      p_request_id: crypto.randomUUID(),
      p_payload: {
        reason: '[TEST] Dọn dẹp kiểm thử sau khi hoàn thành kiểm thử Parity'
      }
    });

    if (error) {
      console.warn(`Error cancelling ${roomId}:`, error.message);
    } else {
      console.log(`Successfully cancelled room ${roomId}:`, data);
    }
  }

  console.log('Verifying room statuses...');
  for (const roomId of roomsToCancel) {
    const { data, error } = await supabase.rpc('get_room_v2', { p_room_id: roomId });
    if (error) {
      console.error(`Error verifying ${roomId}:`, error.message);
    } else {
      console.log(`Room ${roomId} status: ${data.status}`);
    }
  }
}

cleanup();
