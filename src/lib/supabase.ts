import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to fetch all pages
export async function getPages() {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('status', 'live')
    .order('display_order')
  if (error) throw error
  return data
}

// Helper to fetch all blog posts
export async function getBlogPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'live')
    .order('published_at', { ascending: false })
  if (error) throw error
  return data
}

// Helper to fetch all questions
export async function getQuestions() {
  const { data, error } = await supabase
    .from('ai_questions')
    .select('*')
    .eq('status', 'Live')
    .order('category')
  if (error) throw error
  return data
}

// Helper to fetch all stats
export async function getStats() {
  const { data, error } = await supabase
    .from('ai_market_stats')
    .select('*')
    .eq('status', 'live')
  if (error) throw error
  return data
}

// Helper to fetch ecosystem
export async function getEcosystem() {
  const [social, distribution, community] = await Promise.all([
    supabase.from('ecosystem_social_profiles').select('*').eq('active', true),
    supabase.from('ecosystem_distribution_platforms').select('*').eq('active', true),
    supabase.from('ecosystem_community_platforms').select('*').eq('active', true),
  ])
  return {
    social: social.data || [],
    distribution: distribution.data || [],
    community: community.data || [],
  }
}
