/**
 * Migrate data from static JSON exports into new Supabase
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx npx tsx supabase/migrate-data.ts
 *
 * Uses the SERVICE_ROLE key (not anon) to bypass RLS for bulk insert.
 * Run once after creating the new Supabase project and running schema.sql.
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
  const dataDir = path.join(__dirname, '../src/data')

  // 1. Blog posts
  console.log('Migrating blog posts...')
  const blogs = JSON.parse(fs.readFileSync(path.join(dataDir, 'blogs.json'), 'utf-8'))
  for (const blog of blogs) {
    const { error } = await supabase.from('blog_posts').upsert({
      card_title: blog.title,
      slug: blog.slug,
      status: blog.status || 'live',
      governance_cluster: blog.governanceCluster,
      meta_title: blog.metaTitle,
      meta_description: blog.metaDesc,
      direct_answer: blog.directAnswer,
      body_content: blog.bodyContent,
      card_excerpt: blog.cardExcerpt,
      author: blog.author || 'Adam Parker',
      youtube_url: blog.youtubeUrl,
      spotify_url: blog.spotifyUrl,
      faq_count: blog.faqCount || 0,
      published_at: blog.publishedAt || null,
      updated_at: blog.updatedAt || null,
    }, { onConflict: 'slug' })
    if (error) console.error(`  Blog error (${blog.slug}):`, error.message)
  }
  console.log(`  ${blogs.length} blog posts migrated`)

  // 2. Questions
  console.log('Migrating questions...')
  const questions = JSON.parse(fs.readFileSync(path.join(dataDir, 'questions.json'), 'utf-8'))
  for (const q of questions) {
    const { error } = await supabase.from('ai_questions').upsert({
      question: q.question,
      slug: q.slug,
      category: q.category,
      signal_category: q.signalCategory,
      status: 'Live',
      meta_title: q.metaTitle,
      meta_description: q.metaDesc,
      concise_answer: q.conciseAnswer,
      full_answer: q.fullAnswer,
      youtube_url: q.youtubeUrl,
      spotify_url: q.spotifyUrl,
      podcast_url: q.podcastUrl,
      podcast_embed_id: q.podcastEmbedId,
      updated_at: q.updatedAt || null,
    }, { onConflict: 'slug' })
    if (error) console.error(`  Question error (${q.slug}):`, error.message)
  }
  console.log(`  ${questions.length} questions migrated`)

  // 3. Stats
  console.log('Migrating stats...')
  const stats = JSON.parse(fs.readFileSync(path.join(dataDir, 'stats.json'), 'utf-8'))
  for (const s of stats) {
    const { error } = await supabase.from('ai_market_stats').upsert({
      title: s.title,
      slug: s.slug,
      status: s.status || 'live',
      category: s.category,
      stat_value: s.statValue,
      stat_date: s.statDate,
      source_name: s.sourceName,
      source_url: s.sourceUrl,
      summary: s.summary,
      body_content: s.bodyContent,
    }, { onConflict: 'slug' })
    if (error) console.error(`  Stat error (${s.slug}):`, error.message)
  }
  console.log(`  ${stats.length} stats migrated`)

  // 4. Weekly intelligence
  console.log('Migrating weekly intelligence...')
  const weekly = JSON.parse(fs.readFileSync(path.join(dataDir, 'weekly.json'), 'utf-8'))
  for (const w of weekly) {
    const { error } = await supabase.from('ai_weekly_intelligence').upsert({
      title: w.title,
      slug: w.slug,
      status: w.status || 'live',
      publish_date: w.publishDate || null,
      top_summary: w.topSummary,
      body_content: w.bodyContent,
      card_excerpt: w.cardExcerpt,
      meta_title: w.metaTitle,
      meta_description: w.metaDesc,
      author: w.author || 'Adam Parker',
    }, { onConflict: 'slug' })
    if (error) console.error(`  Weekly error (${w.slug}):`, error.message)
  }
  console.log(`  ${weekly.length} weekly briefings migrated`)

  // 5. Knowledge library pages
  console.log('Migrating knowledge library pages...')
  const library = JSON.parse(fs.readFileSync(path.join(dataDir, 'knowledge-library-full.json'), 'utf-8'))
  for (const p of library) {
    const { error } = await supabase.from('pages').upsert({
      name: p.name,
      slug: p.slug,
      page_type: p.type || 'topic',
      status: 'live',
      layer: p.layer,
      meta_title: p.metaTitle,
      meta_description: p.metaDesc,
      ai_summary: p.aiSummary,
      direct_answer: p.directAnswer,
      body_content: p.bodyContent,
      faq_count: p.faqCount || 0,
      youtube_url: p.youtubeUrl,
    }, { onConflict: 'slug' })
    if (error) console.error(`  Page error (${p.slug}):`, error.message)
  }
  console.log(`  ${library.length} knowledge library pages migrated`)

  console.log('\nMigration complete!')
  console.log(`Total: ${blogs.length} blogs, ${questions.length} questions, ${stats.length} stats, ${weekly.length} weekly, ${library.length} pages`)
}

migrate().catch(console.error)
