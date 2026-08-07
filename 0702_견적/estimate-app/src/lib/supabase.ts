import { createClient } from '@supabase/supabase-js'

// jm-system과 같은 Supabase 프로젝트 사용 (계정·estimates·price_book 테이블 공유)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
