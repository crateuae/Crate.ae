import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
sb.from('products').select('*').limit(1).then(({data}) => {
  if (data?.[0]) console.log(Object.keys(data[0]).join('\n'))
  process.exit(0)
})
