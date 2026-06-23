import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const userId = users[0].id;
  
  const { error } = await supabase.from('saved_posts').insert({
    user_id: userId,
    generator_type: 'achievement_generator',
    title: 'test',
    content: 'test',
    word_count: 1
  });
  console.log("Error:", error);
}

test();
