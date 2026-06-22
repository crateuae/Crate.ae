import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
sb.from('products').select('slug, name_en, source, gap_score, market_signal, registration_status, acquisition_type').order('created_at').then(({data}) => {
  data?.forEach(p => console.log(`${p.source} | ${p.slug} | ${p.name_en}`))
  process.exit(0)
})
