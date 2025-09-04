import { supabase } from '../config/supabase'

/**
 * User Service
 * Manages user data, preferences, and interactions with Supabase
 */
export class UserService {
  constructor() {
    this.currentUser = null
  }

  /**
   * Create or update user profile
   */
  async upsertUser(userData) {
    if (!supabase) {
      console.warn('Supabase not configured, storing user data locally')
      return this.storeUserLocally(userData)
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          farcaster_id: userData.farcaster_id,
          twitter_handle: userData.twitter_handle || null,
          preferred_sources: userData.preferred_sources || [],
          blocked_sources: userData.blocked_sources || [],
          sentiment_preference: userData.sentiment_preference || 'neutral',
          credibility_threshold: userData.credibility_threshold || 0.5,
          hide_bots: userData.hide_bots !== undefined ? userData.hide_bots : true,
          subscription_tier: userData.subscription_tier || 'free',
          subscription_status: userData.subscription_status || 'inactive',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'farcaster_id'
        })
        .select()
        .single()

      if (error) throw error

      this.currentUser = data
      return data
    } catch (error) {
      console.error('Failed to upsert user:', error)
      return this.storeUserLocally(userData)
    }
  }

  /**
   * Get user by Farcaster ID
   */
  async getUserByFarcasterID(farcasterID) {
    if (!supabase) {
      return this.getUserLocally(farcasterID)
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('farcaster_id', farcasterID)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to fetch user:', error)
      return null
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(farcasterID, preferences) {
    if (!supabase) {
      return this.updateUserPreferencesLocally(farcasterID, preferences)
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('farcaster_id', farcasterID)
        .select()
        .single()

      if (error) throw error

      this.currentUser = data
      return data
    } catch (error) {
      console.error('Failed to update user preferences:', error)
      return this.updateUserPreferencesLocally(farcasterID, preferences)
    }
  }

  /**
   * Add source to blocked list
   */
  async blockSource(farcasterID, sourceUsername) {
    const user = await this.getUserByFarcasterID(farcasterID)
    if (!user) return null

    const blockedSources = [...(user.blocked_sources || []), sourceUsername]
    const preferredSources = (user.preferred_sources || []).filter(s => s !== sourceUsername)

    return this.updateUserPreferences(farcasterID, {
      blocked_sources: [...new Set(blockedSources)], // Remove duplicates
      preferred_sources: preferredSources
    })
  }

  /**
   * Remove source from blocked list
   */
  async unblockSource(farcasterID, sourceUsername) {
    const user = await this.getUserByFarcasterID(farcasterID)
    if (!user) return null

    const blockedSources = (user.blocked_sources || []).filter(s => s !== sourceUsername)

    return this.updateUserPreferences(farcasterID, {
      blocked_sources: blockedSources
    })
  }

  /**
   * Add source to preferred list
   */
  async preferSource(farcasterID, sourceUsername) {
    const user = await this.getUserByFarcasterID(farcasterID)
    if (!user) return null

    const preferredSources = [...(user.preferred_sources || []), sourceUsername]
    const blockedSources = (user.blocked_sources || []).filter(s => s !== sourceUsername)

    return this.updateUserPreferences(farcasterID, {
      preferred_sources: [...new Set(preferredSources)], // Remove duplicates
      blocked_sources: blockedSources
    })
  }

  /**
   * Remove source from preferred list
   */
  async unpreferSource(farcasterID, sourceUsername) {
    const user = await this.getUserByFarcasterID(farcasterID)
    if (!user) return null

    const preferredSources = (user.preferred_sources || []).filter(s => s !== sourceUsername)

    return this.updateUserPreferences(farcasterID, {
      preferred_sources: preferredSources
    })
  }

  /**
   * Record user interaction
   */
  async recordInteraction(farcasterID, tweetID, action) {
    if (!supabase) {
      console.log('Recording interaction locally:', { farcasterID, tweetID, action })
      return
    }

    try {
      const user = await this.getUserByFarcasterID(farcasterID)
      if (!user) return

      const { error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          tweet_id: tweetID,
          action: action
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to record interaction:', error)
    }
  }

  /**
   * Get user interaction history
   */
  async getUserInteractions(farcasterID, limit = 100) {
    if (!supabase) {
      return []
    }

    try {
      const user = await this.getUserByFarcasterID(farcasterID)
      if (!user) return []

      const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to fetch user interactions:', error)
      return []
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscription(farcasterID, tier, status) {
    return this.updateUserPreferences(farcasterID, {
      subscription_tier: tier,
      subscription_status: status
    })
  }

  /**
   * Check if user has premium features
   */
  async hasPremiumAccess(farcasterID) {
    const user = await this.getUserByFarcasterID(farcasterID)
    return user && 
           (user.subscription_tier === 'basic' || user.subscription_tier === 'premium') &&
           user.subscription_status === 'active'
  }

  /**
   * Check if user has advanced AI features
   */
  async hasAdvancedAI(farcasterID) {
    const user = await this.getUserByFarcasterID(farcasterID)
    return user && 
           user.subscription_tier === 'premium' &&
           user.subscription_status === 'active'
  }

  // Local storage fallback methods
  storeUserLocally(userData) {
    const users = JSON.parse(localStorage.getItem('chronofilter_users') || '{}')
    users[userData.farcaster_id] = {
      ...userData,
      updated_at: new Date().toISOString()
    }
    localStorage.setItem('chronofilter_users', JSON.stringify(users))
    this.currentUser = users[userData.farcaster_id]
    return this.currentUser
  }

  getUserLocally(farcasterID) {
    const users = JSON.parse(localStorage.getItem('chronofilter_users') || '{}')
    return users[farcasterID] || null
  }

  updateUserPreferencesLocally(farcasterID, preferences) {
    const users = JSON.parse(localStorage.getItem('chronofilter_users') || '{}')
    if (users[farcasterID]) {
      users[farcasterID] = {
        ...users[farcasterID],
        ...preferences,
        updated_at: new Date().toISOString()
      }
      localStorage.setItem('chronofilter_users', JSON.stringify(users))
      this.currentUser = users[farcasterID]
      return this.currentUser
    }
    return null
  }
}

// Export singleton instance
export const userService = new UserService()

/**
 * Subscription tiers and their features
 */
export const SubscriptionTiers = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Basic tweet filtering',
      'Simple sentiment analysis',
      'Manual source blocking',
      'Up to 10 preferred sources'
    ],
    limits: {
      preferredSources: 10,
      dailyAnalysis: 100
    }
  },
  basic: {
    name: 'Basic',
    price: 3,
    priceId: import.meta.env.VITE_BASIC_PLAN_PRICE_ID,
    features: [
      'Advanced filtering algorithms',
      'Enhanced bot detection',
      'Unlimited preferred sources',
      'Priority support'
    ],
    limits: {
      preferredSources: -1, // unlimited
      dailyAnalysis: 1000
    }
  },
  premium: {
    name: 'Premium',
    price: 5,
    priceId: import.meta.env.VITE_PREMIUM_PLAN_PRICE_ID,
    features: [
      'AI-powered credibility scoring',
      'Advanced sentiment analysis',
      'Social graph analysis',
      'Custom filtering rules',
      'Analytics dashboard',
      'API access'
    ],
    limits: {
      preferredSources: -1, // unlimited
      dailyAnalysis: -1 // unlimited
    }
  }
}

/**
 * Utility functions for user management
 */
export const UserUtils = {
  /**
   * Check if user can perform action based on subscription
   */
  canPerformAction(user, action) {
    const tier = SubscriptionTiers[user?.subscription_tier || 'free']
    
    switch (action) {
      case 'add_preferred_source':
        return tier.limits.preferredSources === -1 || 
               (user.preferred_sources?.length || 0) < tier.limits.preferredSources
      case 'ai_analysis':
        return user?.subscription_tier === 'premium' && user?.subscription_status === 'active'
      case 'advanced_filtering':
        return ['basic', 'premium'].includes(user?.subscription_tier) && 
               user?.subscription_status === 'active'
      default:
        return true
    }
  },

  /**
   * Get user's remaining quota for daily analysis
   */
  getRemainingQuota(user, usedToday = 0) {
    const tier = SubscriptionTiers[user?.subscription_tier || 'free']
    if (tier.limits.dailyAnalysis === -1) return -1 // unlimited
    return Math.max(0, tier.limits.dailyAnalysis - usedToday)
  },

  /**
   * Format subscription status for display
   */
  formatSubscriptionStatus(user) {
    if (!user) return 'Not signed in'
    
    const tier = SubscriptionTiers[user.subscription_tier || 'free']
    const status = user.subscription_status || 'inactive'
    
    if (status === 'active') {
      return `${tier.name} Plan - Active`
    } else {
      return `${tier.name} Plan - ${status.charAt(0).toUpperCase() + status.slice(1)}`
    }
  }
}
