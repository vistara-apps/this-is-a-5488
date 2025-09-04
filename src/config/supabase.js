import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Using mock data.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database schema types for TypeScript-like documentation
export const DatabaseSchema = {
  users: {
    id: 'uuid',
    farcaster_id: 'text',
    twitter_handle: 'text',
    preferred_sources: 'text[]',
    blocked_sources: 'text[]',
    sentiment_preference: 'text', // 'positive', 'neutral', 'negative'
    credibility_threshold: 'real',
    hide_bots: 'boolean',
    subscription_tier: 'text', // 'free', 'basic', 'premium'
    subscription_status: 'text', // 'active', 'inactive', 'cancelled'
    created_at: 'timestamp',
    updated_at: 'timestamp'
  },
  tweet_analysis: {
    id: 'uuid',
    tweet_id: 'text',
    content: 'text',
    author_username: 'text',
    credibility_score: 'real',
    bot_probability: 'real',
    sentiment: 'text', // 'positive', 'neutral', 'negative'
    analyzed_at: 'timestamp',
    created_at: 'timestamp'
  },
  user_interactions: {
    id: 'uuid',
    user_id: 'uuid',
    tweet_id: 'text',
    action: 'text', // 'block_source', 'prefer_source', 'hide_tweet'
    created_at: 'timestamp'
  }
}

// SQL schema for database setup
export const createTablesSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farcaster_id TEXT UNIQUE NOT NULL,
  twitter_handle TEXT,
  preferred_sources TEXT[] DEFAULT '{}',
  blocked_sources TEXT[] DEFAULT '{}',
  sentiment_preference TEXT DEFAULT 'neutral' CHECK (sentiment_preference IN ('positive', 'neutral', 'negative')),
  credibility_threshold REAL DEFAULT 0.5 CHECK (credibility_threshold >= 0 AND credibility_threshold <= 1),
  hide_bots BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tweet analysis table
CREATE TABLE IF NOT EXISTS tweet_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  author_username TEXT NOT NULL,
  credibility_score REAL NOT NULL CHECK (credibility_score >= 0 AND credibility_score <= 1),
  bot_probability REAL NOT NULL CHECK (bot_probability >= 0 AND bot_probability <= 1),
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tweet_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('block_source', 'prefer_source', 'hide_tweet')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_farcaster_id ON users(farcaster_id);
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_tweet_id ON tweet_analysis(tweet_id);
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_author ON tweet_analysis(author_username);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_tweet_id ON user_interactions(tweet_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (farcaster_id = current_setting('app.current_user_farcaster_id'));
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (farcaster_id = current_setting('app.current_user_farcaster_id'));
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (farcaster_id = current_setting('app.current_user_farcaster_id'));

-- Users can only access their own interactions
CREATE POLICY "Users can view own interactions" ON user_interactions FOR SELECT USING (user_id IN (SELECT id FROM users WHERE farcaster_id = current_setting('app.current_user_farcaster_id')));
CREATE POLICY "Users can insert own interactions" ON user_interactions FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE farcaster_id = current_setting('app.current_user_farcaster_id')));

-- Tweet analysis is publicly readable but only insertable by service
CREATE POLICY "Tweet analysis is publicly readable" ON tweet_analysis FOR SELECT TO public USING (true);
`
