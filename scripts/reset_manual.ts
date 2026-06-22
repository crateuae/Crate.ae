import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
sb.from('products').delete().eq('source', 'manual').then(({error, count}) => {
  if(error) console.error(error.message)
  else console.log('Deleted manual products')
  process.exit(0)
})
