import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkPolicies() {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/run_sql`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sql: "SELECT * FROM pg_policies WHERE tablename = 'saved_posts';"
    })
  });
  const data = await res.json();
  console.log("pg_policies:", data);
}

checkPolicies();
