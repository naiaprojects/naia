const { createClient } = require('@supabase/supabase-js');

// IMPORTANT: This script requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set in environment
// or passed as arguments if running locally with access to env.
// For browser console usage, we might need a different approach or manual SQL.
// Assuming this runs in a Next.js API route or similar context where env vars are available.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using anon key, hoping RLS allows creation or user is admin
// ideally we use SERVICE_ROLE_KEY for admin tasks, but it might not be exposed safely.

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
    console.log('Starting Database Setup for Services Module...');

    // 1. Create 'services' table
    // Since we can't run DDL via JS client easily without SQL function, 
    // we will try to insert a row to `services`? No, if table doesn't exist it fails.
    // We will assume the user has to run SQL, OR we use a special RPC if available.
    // BUT, often we can use a "RPC" call to `exec_sql` if we set it up previously.
    // If not, I will output the SQL for the user to run in Supabase SQL Editor.

    const sql = `
    -- Create services table
    CREATE TABLE IF NOT EXISTS services (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price_range TEXT,
      icon_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Add service_id to packages table
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='packages' AND column_name='service_id') THEN 
        ALTER TABLE packages ADD COLUMN service_id UUID REFERENCES services(id);
      END IF; 
    END $$;

    -- Enable RLS (Security)
    ALTER TABLE services ENABLE ROW LEVEL SECURITY;

    -- Create Policy for reading (public)
    CREATE POLICY "Public services are viewable by everyone" ON services
      FOR SELECT USING (true);

    -- Create Policy for modifications (authenticated users only - usually admin)
    CREATE POLICY "Authenticated users can modify services" ON services
      FOR ALL USING (auth.role() = 'authenticated');
  `;

    console.log('---------------------------------------------------------');
    console.log('PLEASE RUN THE FOLLOWING SQL IN YOUR SUPABASE SQL EDITOR:');
    console.log('---------------------------------------------------------');
    console.log(sql);
    console.log('---------------------------------------------------------');
}

setupDatabase();
