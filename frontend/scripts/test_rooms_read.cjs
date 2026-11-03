const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRead() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'bp@gmail.com',
    password: (process.env.TEST_PWD || ""),
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }

  console.log('Signed in as:', authData.user.id);

  try {
    const { data: rooms, error: roomsError } = await supabase.rpc('list_rooms_v2', {
      p_scope: 'discover',
      p_offset: 0,
    });
    console.log('list_rooms_v2 (discover) result count:', rooms ? rooms.length : 0);
    if (roomsError) console.error('list_rooms_v2 error:', roomsError);
    else console.log('Sample room:', rooms && rooms[0] ? rooms[0] : 'None');
  } catch (err) {
    console.error('Error calling list_rooms_v2:', err);
  }

  try {
    const { data: notices, error: noticesError } = await supabase.rpc('room_notices_v2');
    console.log('room_notices_v2 result count:', notices ? notices.length : 0);
    if (noticesError) console.error('room_notices_v2 error:', noticesError);
  } catch (err) {
    console.error('Error calling room_notices_v2:', err);
  }

  try {
    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('id, name, distance_km')
      .order('name');
    console.log('courts count:', courts ? courts.length : 0);
    if (courts && courts.length > 0) {
      console.log('Sample court:', courts[0]);
    }
  } catch (err) {
    console.error('Error querying courts:', err);
  }
}

testRead();

