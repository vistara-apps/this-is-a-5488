import React, { useState, useEffect } from 'react'
import AppShell from './components/AppShell'
import TweetCard from './components/TweetCard'
import SettingsPanel from './components/SettingsPanel'
import AuthModal from './components/AuthModal'
import { mockTweets } from './data/mockTweets'
import { analyzeTweet } from './services/aiService'
import { farcasterAuth } from './services/farcasterService'
import { userService } from './services/userService'

function App() {
  const [tweets, setTweets] = useState([])
  const [filteredTweets, setFilteredTweets] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [filters, setFilters] = useState({
    sentimentPreference: 'neutral', // 'positive', 'neutral', 'negative'
    credibilityThreshold: 0.5,
    hideBot: true,
    blockedSources: new Set(),
    preferredSources: new Set()
  })

  // Initialize authentication and app data
  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true)
      
      // Check for existing authentication
      const existingUser = await farcasterAuth.initialize()
      if (existingUser) {
        setUser(existingUser)
        setIsAuthenticated(true)
        
        // Load user preferences from database
        const dbUser = await userService.getUserByFarcasterID(existingUser.farcaster_id)
        if (dbUser) {
          setFilters(prev => ({
            ...prev,
            sentimentPreference: dbUser.sentiment_preference || 'neutral',
            credibilityThreshold: dbUser.credibility_threshold || 0.5,
            hideBot: dbUser.hide_bots !== undefined ? dbUser.hide_bots : true,
            blockedSources: new Set(dbUser.blocked_sources || []),
            preferredSources: new Set(dbUser.preferred_sources || [])
          }))
        }
      } else {
        // Show auth modal for new users
        setShowAuthModal(true)
      }
      
      // Load and analyze tweets
      const analyzedTweets = await Promise.all(
        mockTweets.map(async (tweet) => {
          const analysis = await analyzeTweet(tweet.content)
          return {
            ...tweet,
            analysis
          }
        })
      )
      
      setTweets(analyzedTweets)
      setLoading(false)
    }

    initializeApp()
  }, [])

  // Filter tweets based on user preferences
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...tweets]

      // Filter by credibility threshold
      filtered = filtered.filter(tweet => 
        tweet.analysis.credibilityScore >= filters.credibilityThreshold
      )

      // Filter bots if enabled
      if (filters.hideBot) {
        filtered = filtered.filter(tweet => 
          tweet.analysis.botProbability < 0.7
        )
      }

      // Filter blocked sources
      filtered = filtered.filter(tweet => 
        !filters.blockedSources.has(tweet.author.username)
      )

      // Prioritize preferred sources
      filtered.sort((a, b) => {
        const aPreferred = filters.preferredSources.has(a.author.username)
        const bPreferred = filters.preferredSources.has(b.author.username)
        
        if (aPreferred && !bPreferred) return -1
        if (!aPreferred && bPreferred) return 1
        
        // Sort by credibility score
        return b.analysis.credibilityScore - a.analysis.credibilityScore
      })

      // Filter by sentiment preference
      if (filters.sentimentPreference !== 'neutral') {
        filtered = filtered.filter(tweet => {
          const sentiment = tweet.analysis.sentiment
          if (filters.sentimentPreference === 'positive') {
            return sentiment === 'positive' || sentiment === 'neutral'
          }
          if (filters.sentimentPreference === 'negative') {
            return sentiment === 'negative' || sentiment === 'neutral'
          }
          return true
        })
      }

      setFilteredTweets(filtered)
    }

    if (tweets.length > 0) {
      applyFilters()
    }
  }, [tweets, filters])

  const handleAuthenticated = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    setShowAuthModal(false)
    
    // Update filters with user preferences
    setFilters(prev => ({
      ...prev,
      sentimentPreference: userData.sentiment_preference || 'neutral',
      credibilityThreshold: userData.credibility_threshold || 0.5,
      hideBot: userData.hide_bots !== undefined ? userData.hide_bots : true,
      blockedSources: new Set(userData.blocked_sources || []),
      preferredSources: new Set(userData.preferred_sources || [])
    }))
  }

  const handleSignOut = () => {
    farcasterAuth.signOut()
    setUser(null)
    setIsAuthenticated(false)
    setShowAuthModal(true)
    
    // Reset filters to defaults
    setFilters({
      sentimentPreference: 'neutral',
      credibilityThreshold: 0.5,
      hideBot: true,
      blockedSources: new Set(),
      preferredSources: new Set()
    })
  }

  const handleBlockSource = async (username) => {
    if (isAuthenticated && user) {
      await userService.blockSource(user.farcaster_id, username)
      await userService.recordInteraction(user.farcaster_id, `block_${username}`, 'block_source')
    }
    
    setFilters(prev => ({
      ...prev,
      blockedSources: new Set([...prev.blockedSources, username])
    }))
  }

  const handleUnblockSource = async (username) => {
    if (isAuthenticated && user) {
      await userService.unblockSource(user.farcaster_id, username)
    }
    
    setFilters(prev => {
      const newBlocked = new Set(prev.blockedSources)
      newBlocked.delete(username)
      return {
        ...prev,
        blockedSources: newBlocked
      }
    })
  }

  const handlePreferSource = async (username) => {
    if (isAuthenticated && user) {
      await userService.preferSource(user.farcaster_id, username)
      await userService.recordInteraction(user.farcaster_id, `prefer_${username}`, 'prefer_source')
    }
    
    setFilters(prev => ({
      ...prev,
      preferredSources: new Set([...prev.preferredSources, username])
    }))
  }

  const handleUnpreferSource = async (username) => {
    if (isAuthenticated && user) {
      await userService.unpreferSource(user.farcaster_id, username)
    }
    
    setFilters(prev => {
      const newPreferred = new Set(prev.preferredSources)
      newPreferred.delete(username)
      return {
        ...prev,
        preferredSources: newPreferred
      }
    })
  }

  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters)
    
    // Save preferences to database if authenticated
    if (isAuthenticated && user) {
      await userService.updateUserPreferences(user.farcaster_id, {
        sentiment_preference: newFilters.sentimentPreference,
        credibility_threshold: newFilters.credibilityThreshold,
        hide_bots: newFilters.hideBot,
        blocked_sources: Array.from(newFilters.blockedSources),
        preferred_sources: Array.from(newFilters.preferredSources)
      })
    }
  }

  return (
    <>
      <AppShell 
        onToggleSettings={() => setShowSettings(!showSettings)}
        showSettings={showSettings}
        filteredCount={filteredTweets.length}
        totalCount={tweets.length}
        user={user}
        isAuthenticated={isAuthenticated}
        onSignOut={handleSignOut}
        onSignIn={() => setShowAuthModal(true)}
      >
      <div className="flex min-h-screen">
        {/* Main Feed */}
        <div className="flex-1 max-w-screen-sm mx-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <span className="ml-3 text-text-secondary">Analyzing tweets...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTweets.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🧹</div>
                  <h3 className="text-headline text-text-primary mb-2">All clean!</h3>
                  <p className="text-text-secondary">No tweets match your current filters.</p>
                </div>
              ) : (
                filteredTweets.map((tweet) => (
                  <TweetCard
                    key={tweet.id}
                    tweet={tweet}
                    onBlockSource={handleBlockSource}
                    onUnblockSource={handleUnblockSource}
                    onPreferSource={handlePreferSource}
                    onUnpreferSource={handleUnpreferSource}
                    isBlocked={filters.blockedSources.has(tweet.author.username)}
                    isPreferred={filters.preferredSources.has(tweet.author.username)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClose={() => setShowSettings(false)}
            user={user}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>
      </AppShell>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={handleAuthenticated}
      />
    </>
  )
}

export default App
