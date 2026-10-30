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

async function runSessionTest() {
  console.log('--- 1. Authenticate A & B ---');
  const { data: authA } = await clientA.auth.signInWithPassword({
    email: 'bp@gmail.com',
    password: '12345678@'
  });
  console.log('Account A (Host):', authA.user.id);

  const { data: authB } = await clientB.auth.signInWithPassword({
    email: 'domixi@gmail.com',
    password: '12345678@'
  });
  console.log('Account B (Member):', authB.user.id);

  // Fetch court id
  const { data: courts } = await clientA.from('courts').select('id, name').limit(1);
  const courtId = courts[0].id;
  console.log('Using court:', courts[0].name, courtId);

  // First, cancel c9928951-477c-4979-8248-808e4a53090a
  try {
    await clientA.rpc('room_command_v2', {
      p_room_id: 'c9928951-477c-4979-8248-808e4a53090a',
      p_action: 'cancel',
      p_request_id: crypto.randomUUID(),
      p_payload: { reason: '[TEST] Dọn dẹp phòng chưa hoàn tất' }
    });
  } catch (e) {}

  // -------------------------------------------------------------
  // Test A: Create room with startsAt 5s in future
  // -------------------------------------------------------------
  const now = Date.now();
  const startsAt = new Date(now + 5 * 1000);
  const endsAt = new Date(now + 2 * 60 * 60 * 1000);
  const cancelBy = startsAt; // 0 minutes before
  let roomId1;

  console.log('\n--- 2. Create room with p_room_id: null ---');
  const { data: createdRoomId, error: errCreate1 } = await clientA.rpc('room_command_v2', {
    p_room_id: null,
    p_action: 'create',
    p_request_id: crypto.randomUUID(),
    p_payload: {
      court_id: courtId,
      title: '[TEST] Kèo trực tiếp kiểm thử flow',
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      cancel_by: cancelBy.toISOString(),
      capacity: 2,
      min_elo: 0,
      max_elo: 3000,
      fee: 50000,
      visibility: 'PUBLIC',
      host_plays: true,
      notes: '[TEST] Kiểm thử luồng bắt đầu trận',
      court_label: 'Sân 1',
      draft: false,
      room_code: '#XP-LIVE01'
    }
  });

  if (errCreate1) {
    console.error('Error creating room 1:', errCreate1.message);
    return;
  }
  roomId1 = createdRoomId;
  console.log('Room 1 created successfully with ID:', roomId1);

  // Get room to find revision
  const { data: roomBeforeJoin } = await clientA.rpc('get_room_v2', { p_room_id: roomId1 });
  console.log('Room revision before join:', roomBeforeJoin.revision);

  // Member B joins room 1
  console.log('\n--- 3. Account B joins room 1 with expected_revision ---');
  const { data: resJoin1, error: errJoin1 } = await clientB.rpc('room_command_v2', {
    p_room_id: roomId1,
    p_action: 'join',
    p_request_id: crypto.randomUUID(),
    p_payload: {
      expected_revision: roomBeforeJoin.revision
    }
  });
  if (errJoin1) console.error('Error B joining:', errJoin1.message);
  else console.log('B joined successfully:', resJoin1);

  // Check room status
  const { data: room1 } = await clientA.rpc('get_room_v2', { p_room_id: roomId1 });
  if (room1) {
    console.log('Room 1 status before start:', room1.status, 'reserved:', room1.reserved, 'capacity:', room1.capacity);
  }

  console.log('Waiting 8 seconds for start window (so now() >= startsAt)...');
  await new Promise(r => setTimeout(r, 8000));

  // Host A starts room 1
  console.log('\n--- 4. Host A starts room 1 ---');
  const { data: resStart, error: errStart } = await clientA.rpc('room_command_v2', {
    p_room_id: roomId1,
    p_action: 'start',
    p_request_id: crypto.randomUUID(),
    p_payload: {}
  });
  if (errStart) {
    console.error('Error starting room 1:', errStart.message);
  } else {
    console.log('Room 1 started successfully! Result:', resStart);
  }

  const { data: room1AfterStart } = await clientA.rpc('get_room_v2', { p_room_id: roomId1 });
  if (room1AfterStart) {
    console.log('Room 1 status after start:', room1AfterStart.status);
  }

  // Attendance check-in
  console.log('\n--- 5. Attendance check-in by Host A ---');
  const { data: resAtt, error: errAtt } = await clientA.rpc('room_command_v2', {
    p_room_id: roomId1,
    p_action: 'attendance_mark',
    p_request_id: crypto.randomUUID(),
    p_payload: {
      player_id: authB.user.id,
      outcome: 'PRESENT',
      reason: '[TEST] Có mặt đầy đủ',
      expected_version: 0
    }
  });
  if (errAtt) console.error('Error attendance_mark:', errAtt.message);
  else console.log('Attendance marked successfully:', resAtt);

  // Record set / Match create
  console.log('\n--- 6. Record match by Host A ---');
  const { data: resMatch, error: errMatch } = await clientA.rpc('room_command_v2', {
    p_room_id: roomId1,
    p_action: 'match_create',
    p_request_id: crypto.randomUUID(),
    p_payload: {
      team_a: [authA.user.id],
      team_b: [authB.user.id],
      score: '21-19 21-17',
      winner: 'A'
    }
  });
  if (errMatch) console.error('Error match_create:', errMatch.message);
  else console.log('Match created successfully:', resMatch);

  // Finish session
  console.log('\n--- 7. Finish session by Host A ---');
  const { data: resFinish, error: errFinish } = await clientA.rpc('room_command_v2', {
    p_room_id: roomId1,
    p_action: 'finish',
    p_request_id: crypto.randomUUID(),
    p_payload: {}
  });
  if (errFinish) console.error('Error finish:', errFinish.message);
  else console.log('Session finished successfully:', resFinish);

  const { data: room1Final } = await clientA.rpc('get_room_v2', { p_room_id: roomId1 });
  if (room1Final) {
    console.log('Final Room 1 status:', room1Final.status);
  }

  // Cancel Room 1 if not COMPLETED
  if (room1Final && room1Final.status !== 'COMPLETED') {
    await clientA.rpc('room_command_v2', {
      p_room_id: roomId1,
      p_action: 'cancel',
      p_request_id: crypto.randomUUID(),
      p_payload: { reason: '[TEST] Dọn dẹp' }
    });
  }

  return { roomId1 };
}

runSessionTest();
