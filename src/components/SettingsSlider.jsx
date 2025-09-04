import React from 'react'

const SettingsSlider = ({ 
  variant = 'sentiment', 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  label 
}) => {
  const getSliderColor = () => {
    switch (variant) {
      case 'sentiment':
        return 'accent-primary'
      case 'sourcePriority':
        return 'accent-accent'
      default:
        return 'accent-primary'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-medium text-text-primary">{Math.round(value)}</span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full h-2 bg-bg rounded-lg appearance-none cursor-pointer slider-${variant}`}
          style={{
            background: `linear-gradient(to right, hsl(240, 80%, 50%) 0%, hsl(240, 80%, 50%) ${value}%, hsl(220, 25%, 25%) ${value}%, hsl(220, 25%, 25%) 100%)`
          }}
        />
      </div>
      
      <style jsx>{`
        .slider-${variant}::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(240, 80%, 50%);
          cursor: pointer;
          border: 2px solid hsl(220, 25%, 15%);
        }
        
        .slider-${variant}::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(240, 80%, 50%);
          cursor: pointer;
          border: 2px solid hsl(220, 25%, 15%);
        }
      `}</style>
    </div>
  )
}

export default SettingsSlider