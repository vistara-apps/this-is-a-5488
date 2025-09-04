import React, { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const SourceInput = ({ variant = 'add', placeholder, onAdd }) => {
  const [username, setUsername] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleanUsername = username.replace('@', '').trim()
    if (cleanUsername) {
      onAdd(cleanUsername)
      setUsername('')
    }
  }

  const getIcon = () => {
    switch (variant) {
      case 'add':
        return <Plus className="w-4 h-4" />
      case 'remove':
        return <Minus className="w-4 h-4" />
      default:
        return <Plus className="w-4 h-4" />
    }
  }

  const getButtonColor = () => {
    switch (variant) {
      case 'add':
        return 'bg-primary hover:bg-primary/80'
      case 'remove':
        return 'bg-red-500 hover:bg-red-600'
      default:
        return 'bg-primary hover:bg-primary/80'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <div className="flex-1 relative">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-bg border border-surface rounded-md px-3 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {username && !username.startsWith('@') && (
          <span className="absolute left-3 top-2 text-text-secondary pointer-events-none">@</span>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!username.trim()}
        className={`px-4 py-2 rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor()}`}
      >
        {getIcon()}
      </button>
    </form>
  )
}

export default SourceInput