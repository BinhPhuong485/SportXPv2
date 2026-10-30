const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (const line of envFile.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
}

const clientA = createClient(supabaseUrl, supabaseAnonKey);
const clientB = createClient(supabaseUrl, supabaseAnonKey);

async function testWaitlist() {
  await clientA.auth.signInWithPassword({ email: 'bp@gmail.com', password: '12345678@' });
  await clientB.auth.signInWithPassword({ email: 'domixi@gmail.com', password: '12345678@' });

  const { data: courts } = await clientA.from('courts').select('id').limit(1);
  const now = Date.now();
  const startsAt = new Date(now + 3600 * 1000);

  // Create room with capacity 1, host_plays = true (so room is FULL with host)
  const { data: roomId, error: errCreate } = await clientA.rpc('room_command_v2', {
    p_room_id: null,
    p_action: 'create',
    p_request_id: crypto.randomUUID(),
    p_payload: {
      court_id: courts[0].id,
      title: '[TEST] Kèo waitlist kiểm thử',
      starts_at: startsAt.toISOString(),
      ends_at: new Date(startsAt.getTime() + 7200 * 1000).toISOString(),
      cancel_by: startsAt.toISOString(),
      capacity: 1,
      min_elo: 0,
      max_elo: 3000,
      fee: 30000,
      visibility: 'PUBLIC',
      host_plays: true,
      notes: '[TEST] Test waitlist',
      court_label: 'Sân 1',
      draft: false,
      room_code: '#XP-WL01'
    }
  });
  console.log('Created room for waitlist:', roomId, 'Error:', errCreate);

  const { data: roomBefore } = await clientB.rpc('get_room_v2', { p_room_id: roomId });
  console.log('Room status before waitlist:', roomBefore.status, 'reserved:', roomBefore.reserved, 'capacity:', roomBefore.capacity);

  // B joins waitlist
  const { data: resWl, error: errWl } = await clientB.rpc('room_command_v2', {
    p_room_id: roomId,
    p_action: 'waitlist',
    p_request_id: crypto.randomUUID(),
    p_payload: { expected_revision: roomBefore.revision }
  });
  console.log('B waitlist result:', resWl, 'Error:', errWl);

  const { data: roomWithWl } = await clientB.rpc('get_room_v2', { p_room_id: roomId });
  console.log('Room with WL - my_status for B:', roomWithWl.my_status, 'members:', JSON.stringify(roomWithWl.members));

  // Host tries to leave
  const { data: resLeaveHost, error: errLeaveHost } = await clientA.rpc('room_command_v2', {
    p_room_id: roomId,
    p_action: 'leave',
    p_request_id: crypto.randomUUID(),
    p_payload: {}
  });
  console.log('Host leave result:', resLeaveHost, 'Error:', errLeaveHost?.message);

  // Clean up
  await clientA.rpc('room_command_v2', {
    p_room_id: roomId,
    p_action: 'cancel',
    p_request_id: crypto.randomUUID(),
    p_payload: { reason: '[TEST] Xong test waitlist' }
  });
  console.log('Cancelled room successfully');
}

testWaitlist();

