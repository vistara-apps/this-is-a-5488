import React, { useState } from 'react'
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Share, 
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Bot,
  Star,
  StarOff,
  Ban,
  Eye
} from 'lucide-react'

const TweetCard = ({ 
  tweet, 
  onBlockSource, 
  onUnblockSource, 
  onPreferSource, 
  onUnpreferSource,
  isBlocked,
  isPreferred 
}) => {
  const [showActions, setShowActions] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400'
      case 'negative': return 'text-red-400'
      default: return 'text-text-secondary'
    }
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      default: return '😐'
    }
  }

  const getCredibilityLevel = (score) => {
    if (score >= 0.8) return { level: 'High', color: 'text-green-400' }
    if (score >= 0.6) return { level: 'Medium', color: 'text-yellow-400' }
    return { level: 'Low', color: 'text-red-400' }
  }

  const credibility = getCredibilityLevel(tweet.analysis.credibilityScore)

  return (
    <div className="bg-surface rounded-lg p-4 shadow-card hover:bg-surface/80 transition-colors animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <img
            src={tweet.author.avatar}
            alt={tweet.author.name}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-text-primary">{tweet.author.name}</h3>
              {tweet.author.verified && (
                <ShieldCheck className="w-4 h-4 text-primary" />
              )}
              {isPreferred && (
                <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-text-secondary">
              <span>@{tweet.author.username}</span>
              <span>•</span>
              <span>{tweet.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 rounded-full hover:bg-bg transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-text-secondary" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-8 bg-surface border border-surface rounded-lg shadow-lg z-10 py-2 min-w-48">
              <button
                onClick={() => {
                  if (isPreferred) {
                    onUnpreferSource(tweet.author.username)
                  } else {
                    onPreferSource(tweet.author.username)
                  }
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-bg transition-colors flex items-center space-x-2"
              >
                {isPreferred ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                <span>{isPreferred ? 'Remove from preferred' : 'Add to preferred'}</span>
              </button>
              
              <button
                onClick={() => {
                  if (isBlocked) {
                    onUnblockSource(tweet.author.username)
                  } else {
                    onBlockSource(tweet.author.username)
                  }
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-bg transition-colors flex items-center space-x-2"
              >
                {isBlocked ? <Eye className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                <span>{isBlocked ? 'Unblock source' : 'Block source'}</span>
              </button>

              <button
                onClick={() => {
                  setShowAnalysis(!showAnalysis)
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-bg transition-colors flex items-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>View analysis</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-body text-text-primary leading-relaxed">
          {tweet.content}
        </p>
      </div>

      {/* Analysis Badge */}
      <div className="flex items-center space-x-4 mb-4 text-sm">
        <div className="flex items-center space-x-1">
          <Shield className={`w-4 h-4 ${credibility.color}`} />
          <span className={credibility.color}>{credibility.level} Credibility</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <span>{getSentimentIcon(tweet.analysis.sentiment)}</span>
          <span className={getSentimentColor(tweet.analysis.sentiment)}>
            {tweet.analysis.sentiment}
          </span>
        </div>

        {tweet.analysis.botProbability > 0.7 && (
          <div className="flex items-center space-x-1 text-orange-400">
            <Bot className="w-4 h-4" />
            <span>Potential Bot</span>
          </div>
        )}
      </div>

      {/* Detailed Analysis */}
      {showAnalysis && (
        <div className="border-t border-bg pt-4 mb-4 animate-slide-up">
          <h4 className="font-semibold text-text-primary mb-2">AI Analysis</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-secondary">Credibility Score:</span>
              <div className="mt-1">
                <div className="bg-bg rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                    style={{ width: `${tweet.analysis.credibilityScore * 100}%` }}
                  />
                </div>
                <span className="text-text-primary font-medium">
                  {Math.round(tweet.analysis.credibilityScore * 100)}%
                </span>
              </div>
            </div>
            <div>
              <span className="text-text-secondary">Bot Probability:</span>
              <div className="mt-1">
                <div className="bg-bg rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${tweet.analysis.botProbability * 100}%` }}
                  />
                </div>
                <span className="text-text-primary font-medium">
                  {Math.round(tweet.analysis.botProbability * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-bg">
        <div className="flex items-center space-x-6">
          <button className="flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{tweet.replies}</span>
          </button>
          
          <button className="flex items-center space-x-2 text-text-secondary hover:text-green-400 transition-colors">
            <Repeat2 className="w-5 h-5" />
            <span className="text-sm">{tweet.retweets}</span>
          </button>
          
          <button className="flex items-center space-x-2 text-text-secondary hover:text-red-400 transition-colors">
            <Heart className="w-5 h-5" />
            <span className="text-sm">{tweet.likes}</span>
          </button>
        </div>
        
        <button className="text-text-secondary hover:text-text-primary transition-colors">
          <Share className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default TweetCard