import React, { useState, useEffect } from 'react'
import AppShell from './components/AppShell'
import TweetCard from './components/TweetCard'
import SettingsPanel from './components/SettingsPanel'
import { mockTweets } from './data/mockTweets'
import { analyzeTweet } from './services/aiService'

function App() {
  const [tweets, setTweets] = useState([])
  const [filteredTweets, setFilteredTweets] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    sentimentPreference: 'neutral', // 'positive', 'neutral', 'negative'
    credibilityThreshold: 0.5,
    hideBot: true,
    blockedSources: new Set(),
    preferredSources: new Set()
  })

  // Initialize with mock data and analyze tweets
  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true)
      
      // Simulate loading time and analyze tweets
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

  const handleBlockSource = (username) => {
    setFilters(prev => ({
      ...prev,
      blockedSources: new Set([...prev.blockedSources, username])
    }))
  }

  const handleUnblockSource = (username) => {
    setFilters(prev => {
      const newBlocked = new Set(prev.blockedSources)
      newBlocked.delete(username)
      return {
        ...prev,
        blockedSources: newBlocked
      }
    })
  }

  const handlePreferSource = (username) => {
    setFilters(prev => ({
      ...prev,
      preferredSources: new Set([...prev.preferredSources, username])
    }))
  }

  const handleUnpreferSource = (username) => {
    setFilters(prev => {
      const newPreferred = new Set(prev.preferredSources)
      newPreferred.delete(username)
      return {
        ...prev,
        preferredSources: newPreferred
      }
    })
  }

  return (
    <AppShell 
      onToggleSettings={() => setShowSettings(!showSettings)}
      showSettings={showSettings}
      filteredCount={filteredTweets.length}
      totalCount={tweets.length}
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
            onFiltersChange={setFilters}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </AppShell>
  )
}

export default App