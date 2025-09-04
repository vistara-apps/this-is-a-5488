import React from 'react'
import { X, Shield, Bot, Heart, Star, Ban } from 'lucide-react'
import SettingsSlider from './SettingsSlider'
import SourceInput from './SourceInput'

const SettingsPanel = ({ filters, onFiltersChange, onClose }) => {
  const handleSentimentChange = (value) => {
    onFiltersChange(prev => ({
      ...prev,
      sentimentPreference: value
    }))
  }

  const handleCredibilityChange = (value) => {
    onFiltersChange(prev => ({
      ...prev,
      credibilityThreshold: value / 100
    }))
  }

  const handleBotToggle = () => {
    onFiltersChange(prev => ({
      ...prev,
      hideBot: !prev.hideBot
    }))
  }

  const handleAddBlockedSource = (username) => {
    onFiltersChange(prev => ({
      ...prev,
      blockedSources: new Set([...prev.blockedSources, username])
    }))
  }

  const handleRemoveBlockedSource = (username) => {
    onFiltersChange(prev => {
      const newBlocked = new Set(prev.blockedSources)
      newBlocked.delete(username)
      return {
        ...prev,
        blockedSources: newBlocked
      }
    })
  }

  const handleAddPreferredSource = (username) => {
    onFiltersChange(prev => ({
      ...prev,
      preferredSources: new Set([...prev.preferredSources, username])
    }))
  }

  const handleRemovePreferredSource = (username) => {
    onFiltersChange(prev => {
      const newPreferred = new Set(prev.preferredSources)
      newPreferred.delete(username)
      return {
        ...prev,
        preferredSources: newPreferred
      }
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-surface border-l border-bg z-50 animate-slide-up">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-bg">
          <h2 className="text-headline text-text-primary">Filter Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-bg transition-colors text-text-secondary hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Sentiment Filter */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text-primary">Sentiment Preference</h3>
            </div>
            
            <div className="space-y-3">
              {['positive', 'neutral', 'negative'].map((sentiment) => (
                <label key={sentiment} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sentiment"
                    value={sentiment}
                    checked={filters.sentimentPreference === sentiment}
                    onChange={(e) => handleSentimentChange(e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-text-primary capitalize">{sentiment}</span>
                  <span className="text-sm text-text-secondary">
                    {sentiment === 'positive' && '😊 Optimistic content'}
                    {sentiment === 'neutral' && '😐 Balanced content'}
                    {sentiment === 'negative' && '😔 Critical content'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Credibility Threshold */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text-primary">Credibility Threshold</h3>
            </div>
            
            <SettingsSlider
              variant="sourcePriority"
              value={filters.credibilityThreshold * 100}
              onChange={handleCredibilityChange}
              min={0}
              max={100}
              label={`${Math.round(filters.credibilityThreshold * 100)}% minimum credibility`}
            />
          </div>

          {/* Bot Detection */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Bot className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text-primary">Bot Detection</h3>
            </div>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hideBot}
                onChange={handleBotToggle}
                className="w-4 h-4 text-primary rounded"
              />
              <span className="text-text-primary">Hide potential bot accounts</span>
            </label>
          </div>

          {/* Preferred Sources */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Star className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text-primary">Preferred Sources</h3>
            </div>
            
            <SourceInput
              variant="add"
              placeholder="Add username to prioritize"
              onAdd={handleAddPreferredSource}
            />
            
            {filters.preferredSources.size > 0 && (
              <div className="mt-3 space-y-2">
                {Array.from(filters.preferredSources).map((username) => (
                  <div key={username} className="flex items-center justify-between bg-bg rounded-md px-3 py-2">
                    <span className="text-text-primary">@{username}</span>
                    <button
                      onClick={() => handleRemovePreferredSource(username)}
                      className="text-text-secondary hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blocked Sources */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Ban className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text-primary">Blocked Sources</h3>
            </div>
            
            <SourceInput
              variant="remove"
              placeholder="Add username to block"
              onAdd={handleAddBlockedSource}
            />
            
            {filters.blockedSources.size > 0 && (
              <div className="mt-3 space-y-2">
                {Array.from(filters.blockedSources).map((username) => (
                  <div key={username} className="flex items-center justify-between bg-bg rounded-md px-3 py-2">
                    <span className="text-text-primary">@{username}</span>
                    <button
                      onClick={() => handleRemoveBlockedSource(username)}
                      className="text-text-secondary hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-bg p-6">
          <div className="text-center text-sm text-text-secondary">
            <p>AI-powered filtering • Real-time updates</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel