import React from 'react'
import { Settings, Filter, Shield, Sparkles, User, LogOut, LogIn } from 'lucide-react'

const AppShell = ({ 
  children, 
  onToggleSettings, 
  showSettings, 
  filteredCount, 
  totalCount,
  user,
  isAuthenticated,
  onSignOut,
  onSignIn
}) => {
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-surface">
        <div className="max-w-screen-sm mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-headline text-text-primary">ChronoFilter</h1>
                <p className="text-sm text-text-secondary">Curate Your Twitter Feed</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Filter Stats */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-text-secondary">
                <Filter className="w-4 h-4" />
                <span>{filteredCount}/{totalCount}</span>
              </div>

              {/* User Profile */}
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-2">
                  <img
                    src={user.avatar_url}
                    alt={user.display_name || user.username}
                    className="w-8 h-8 rounded-full border-2 border-accent"
                  />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-text-primary">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {user.subscription_tier === 'free' ? 'Free Plan' : 
                       user.subscription_tier === 'basic' ? 'Basic Plan' : 'Premium Plan'}
                    </p>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface rounded-md transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onSignIn}
                  className="flex items-center space-x-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
              
              {/* Settings Button */}
              <button
                onClick={onToggleSettings}
                className={`p-2 rounded-md transition-colors ${
                  showSettings 
                    ? 'bg-primary text-white' 
                    : 'bg-surface hover:bg-surface/80 text-text-secondary hover:text-text-primary'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface bg-surface/50 py-6 mt-12">
        <div className="max-w-screen-sm mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-text-secondary text-sm">
            <Shield className="w-4 h-4" />
            <span>Powered by AI • Built for Base</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AppShell
