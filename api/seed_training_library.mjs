// Edge function script om training_library data in te voeren via Supabase REST API
// Deze functie gebruikt SUPABASE_SERVICE_ROLE_KEY (beschikbaar in Vercel env)
// Deploy als: supabase functions new seed_training_library && supabase functions deploy

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

async function seedTrainingLibrary() {
  const count = 128
  let inserted = 0
  let updated = 0

  for (let ageIdx = 0; ageIdx < 4; ageIdx++) {
    const ageGroup = ['O9', 'O10', 'O11', 'O12'][ageIdx]

    for (let num = 1; num <= 32; num++) {
      // Read from the pre-generated SQL file
      const sqlLine = await readSqlLine(ageGroup, num)
      if (!sqlLine) continue

      // Extract JSON from the SQL line
      const jsonStr = extractJsonFromSql(sqlLine)
      if (!jsonStr) continue

      const exercises = JSON.parse(jsonStr)

      const { data, error } = await supabase
        .from('training_library')
        .upsert({
          age_group: ageGroup,
          training_number: num,
          exercises: exercises
        }, {
          onConflict: 'age_group,training_number'
        })

      if (error) {
        if (error.code === '23505') {
          // Duplicate key, skip
          continue
        }
        console.error(`Error inserting ${ageGroup} training ${num}:`, error.message)
      } else {
        if (data && data.length > 0) {
          updated++
        } else {
          inserted++
        }
      }
    }
  }

  console.log(`Training library seed complete: ${inserted} inserted, ${updated} updated`)
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTrainingLibrary()
}

export default seedTrainingLibrary
