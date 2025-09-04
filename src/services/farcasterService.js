import axios from 'axios'

const FARCASTER_API_URL = import.meta.env.VITE_FARCASTER_API_URL || 'https://api.farcaster.xyz'
const FARCASTER_API_KEY = import.meta.env.VITE_FARCASTER_API_KEY

// Create axios instance for Farcaster API
const farcasterApi = axios.create({
  baseURL: FARCASTER_API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(FARCASTER_API_KEY && { 'Authorization': `Bearer ${FARCASTER_API_KEY}` })
  }
})

/**
 * Farcaster Authentication Service
 * Handles user authentication and profile management
 */
export class FarcasterAuthService {
  constructor() {
    this.currentUser = null
    this.isAuthenticated = false
  }

  /**
   * Initialize authentication check
   */
  async initialize() {
    const storedUser = localStorage.getItem('chronofilter_user')
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser)
        this.isAuthenticated = true
        return this.currentUser
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('chronofilter_user')
      }
    }
    return null
  }

  /**
   * Authenticate user with Farcaster
   * In a real implementation, this would use Farcaster's authentication flow
   */
  async authenticate(walletAddress, signature) {
    try {
      // Mock authentication for development
      if (!FARCASTER_API_KEY) {
        console.warn('Farcaster API not configured, using mock authentication')
        return this.mockAuthenticate(walletAddress)
      }

      // Real Farcaster authentication
      const response = await farcasterApi.post('/auth/verify', {
        address: walletAddress,
        signature: signature,
        message: `Sign in to ChronoFilter at ${Date.now()}`
      })

      const userData = response.data
      this.currentUser = {
        farcaster_id: userData.fid,
        username: userData.username,
        display_name: userData.display_name,
        avatar_url: userData.pfp_url,
        wallet_address: walletAddress,
        verified_addresses: userData.verified_addresses || [],
        follower_count: userData.follower_count || 0,
        following_count: userData.following_count || 0
      }

      this.isAuthenticated = true
      localStorage.setItem('chronofilter_user', JSON.stringify(this.currentUser))
      
      return this.currentUser
    } catch (error) {
      console.error('Farcaster authentication failed:', error)
      throw new Error('Authentication failed. Please try again.')
    }
  }

  /**
   * Mock authentication for development
   */
  async mockAuthenticate(walletAddress) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    this.currentUser = {
      farcaster_id: `mock_${walletAddress.slice(-6)}`,
      username: `user_${walletAddress.slice(-4)}`,
      display_name: `User ${walletAddress.slice(-4)}`,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`,
      wallet_address: walletAddress,
      verified_addresses: [walletAddress],
      follower_count: Math.floor(Math.random() * 1000),
      following_count: Math.floor(Math.random() * 500)
    }

    this.isAuthenticated = true
    localStorage.setItem('chronofilter_user', JSON.stringify(this.currentUser))
    
    return this.currentUser
  }

  /**
   * Get user's social graph
   */
  async getUserSocialGraph(fid) {
    try {
      if (!FARCASTER_API_KEY) {
        return this.mockSocialGraph()
      }

      const response = await farcasterApi.get(`/users/${fid}/connections`)
      return {
        following: response.data.following || [],
        followers: response.data.followers || []
      }
    } catch (error) {
      console.error('Failed to fetch social graph:', error)
      return this.mockSocialGraph()
    }
  }

  /**
   * Mock social graph for development
   */
  mockSocialGraph() {
    return {
      following: [
        { fid: '1', username: 'vitalik', display_name: 'Vitalik Buterin' },
        { fid: '2', username: 'dwr', display_name: 'Dan Romero' },
        { fid: '3', username: 'jessepollak', display_name: 'Jesse Pollak' }
      ],
      followers: [
        { fid: '4', username: 'cryptouser1', display_name: 'Crypto User 1' },
        { fid: '5', username: 'defiexplorer', display_name: 'DeFi Explorer' }
      ]
    }
  }

  /**
   * Get user's casts (posts)
   */
  async getUserCasts(fid, limit = 25) {
    try {
      if (!FARCASTER_API_KEY) {
        return this.mockUserCasts()
      }

      const response = await farcasterApi.get(`/casts`, {
        params: { fid, limit }
      })
      
      return response.data.casts || []
    } catch (error) {
      console.error('Failed to fetch user casts:', error)
      return this.mockUserCasts()
    }
  }

  /**
   * Mock user casts for development
   */
  mockUserCasts() {
    return [
      {
        hash: 'mock_cast_1',
        text: 'Excited about the future of decentralized social media! 🚀',
        timestamp: Date.now() - 3600000,
        replies: 5,
        recasts: 12,
        likes: 34
      },
      {
        hash: 'mock_cast_2', 
        text: 'Building on Base is such a great experience. The developer tools are amazing.',
        timestamp: Date.now() - 7200000,
        replies: 8,
        recasts: 15,
        likes: 42
      }
    ]
  }

  /**
   * Sign out user
   */
  signOut() {
    this.currentUser = null
    this.isAuthenticated = false
    localStorage.removeItem('chronofilter_user')
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser
  }

  /**
   * Check if user is authenticated
   */
  getIsAuthenticated() {
    return this.isAuthenticated
  }
}

// Export singleton instance
export const farcasterAuth = new FarcasterAuthService()

/**
 * Utility functions for Farcaster integration
 */
export const FarcasterUtils = {
  /**
   * Format Farcaster username
   */
  formatUsername(username) {
    return username.startsWith('@') ? username : `@${username}`
  },

  /**
   * Get profile URL
   */
  getProfileUrl(username) {
    return `https://warpcast.com/${username.replace('@', '')}`
  },

  /**
   * Validate Farcaster ID
   */
  isValidFid(fid) {
    return typeof fid === 'string' && fid.length > 0 && !isNaN(parseInt(fid))
  },

  /**
   * Generate message for wallet signature
   */
  generateSignMessage(address, timestamp = Date.now()) {
    return `Sign in to ChronoFilter\n\nAddress: ${address}\nTimestamp: ${timestamp}\n\nThis signature proves you own this wallet and want to access ChronoFilter.`
  }
}
