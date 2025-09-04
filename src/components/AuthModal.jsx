import React, { useState } from 'react'
import { X, Wallet, User, Shield, Zap } from 'lucide-react'
import { farcasterAuth, FarcasterUtils } from '../services/farcasterService'
import { userService, SubscriptionTiers } from '../services/userService'

const AuthModal = ({ isOpen, onClose, onAuthenticated }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('connect') // 'connect', 'onboarding', 'subscription'
  const [userData, setUserData] = useState(null)

  if (!isOpen) return null

  const handleConnect = async () => {
    setIsConnecting(true)
    setError('')

    try {
      // Mock wallet connection for development
      // In a real implementation, this would use wagmi/rainbowkit
      const mockWalletAddress = '0x' + Math.random().toString(16).substr(2, 40)
      const mockSignature = 'mock_signature_' + Date.now()

      // Authenticate with Farcaster
      const user = await farcasterAuth.authenticate(mockWalletAddress, mockSignature)
      
      // Create/update user in database
      const dbUser = await userService.upsertUser({
        farcaster_id: user.farcaster_id,
        twitter_handle: null, // Will be set in onboarding
        subscription_tier: 'free',
        subscription_status: 'active'
      })

      setUserData({ ...user, ...dbUser })
      setStep('onboarding')
    } catch (err) {
      setError(err.message || 'Failed to connect. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleOnboardingComplete = async (twitterHandle) => {
    try {
      const updatedUser = await userService.updateUserPreferences(userData.farcaster_id, {
        twitter_handle: twitterHandle
      })
      
      setUserData({ ...userData, ...updatedUser })
      setStep('subscription')
    } catch (err) {
      setError('Failed to save Twitter handle. Please try again.')
    }
  }

  const handleSubscriptionChoice = async (tier) => {
    try {
      const updatedUser = await userService.updateSubscription(
        userData.farcaster_id, 
        tier, 
        tier === 'free' ? 'active' : 'inactive' // Free is immediately active
      )
      
      setUserData({ ...userData, ...updatedUser })
      onAuthenticated({ ...userData, ...updatedUser })
      onClose()
    } catch (err) {
      setError('Failed to set subscription. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-md w-full p-6 relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={20} />
        </button>

        {step === 'connect' && (
          <ConnectStep
            isConnecting={isConnecting}
            error={error}
            onConnect={handleConnect}
          />
        )}

        {step === 'onboarding' && (
          <OnboardingStep
            userData={userData}
            error={error}
            onComplete={handleOnboardingComplete}
          />
        )}

        {step === 'subscription' && (
          <SubscriptionStep
            error={error}
            onChoice={handleSubscriptionChoice}
          />
        )}
      </div>
    </div>
  )
}

const ConnectStep = ({ isConnecting, error, onConnect }) => (
  <>
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
        <Wallet className="text-white" size={24} />
      </div>
      <h2 className="text-headline text-text-primary mb-2">Welcome to ChronoFilter</h2>
      <p className="text-text-secondary">
        Connect your Farcaster account to start curating your Twitter feed
      </p>
    </div>

    {error && (
      <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-md p-3 mb-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )}

    <button
      onClick={onConnect}
      disabled={isConnecting}
      className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
    >
      {isConnecting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Connecting...
        </>
      ) : (
        <>
          <Wallet size={18} />
          Connect Farcaster
        </>
      )}
    </button>

    <div className="mt-4 text-xs text-text-secondary text-center">
      <p>By connecting, you agree to our Terms of Service and Privacy Policy</p>
    </div>
  </>
)

const OnboardingStep = ({ userData, error, onComplete }) => {
  const [twitterHandle, setTwitterHandle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Clean up Twitter handle (remove @ if present)
    const cleanHandle = twitterHandle.replace('@', '').trim()
    
    await onComplete(cleanHandle || null)
    setIsSubmitting(false)
  }

  return (
    <>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="text-white" size={24} />
        </div>
        <h2 className="text-headline text-text-primary mb-2">Complete Your Profile</h2>
        <p className="text-text-secondary">
          Welcome, {userData?.display_name || userData?.username}! Let's set up your preferences.
        </p>
      </div>

      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-md p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Twitter Handle (Optional)
          </label>
          <input
            type="text"
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            placeholder="@your_twitter_handle"
            className="w-full bg-bg border border-gray-600 rounded-md px-3 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
          />
          <p className="text-xs text-text-secondary mt-1">
            This helps us provide better filtering for your Twitter feed
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold py-3 px-4 rounded-md transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </>
  )
}

const SubscriptionStep = ({ error, onChoice }) => {
  const [selectedTier, setSelectedTier] = useState('free')

  return (
    <>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="text-white" size={24} />
        </div>
        <h2 className="text-headline text-text-primary mb-2">Choose Your Plan</h2>
        <p className="text-text-secondary">
          Select the plan that best fits your needs
        </p>
      </div>

      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-md p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {Object.entries(SubscriptionTiers).map(([key, tier]) => (
          <div
            key={key}
            onClick={() => setSelectedTier(key)}
            className={`border rounded-md p-4 cursor-pointer transition-colors ${
              selectedTier === key
                ? 'border-primary bg-primary bg-opacity-10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-text-primary">{tier.name}</h3>
              <span className="text-text-primary font-bold">
                {tier.price === 0 ? 'Free' : `$${tier.price}/mo`}
              </span>
            </div>
            <ul className="text-sm text-text-secondary space-y-1">
              {tier.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Shield size={12} className="text-accent" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onChoice('free')}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-md transition-colors"
        >
          Start Free
        </button>
        <button
          onClick={() => onChoice(selectedTier)}
          disabled={selectedTier === 'free'}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-3 px-4 rounded-md transition-colors"
        >
          {selectedTier === 'free' ? 'Start Free' : `Choose ${SubscriptionTiers[selectedTier].name}`}
        </button>
      </div>

      <p className="text-xs text-text-secondary text-center mt-4">
        You can upgrade or downgrade your plan at any time
      </p>
    </>
  )
}

export default AuthModal
