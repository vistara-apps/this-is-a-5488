import OpenAI from 'openai'

// Initialize OpenAI client
const openai = import.meta.env.VITE_OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
    })
  : null

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const sentimentKeywords = {
  positive: ['amazing', 'excited', 'beautiful', 'love', 'great', 'awesome', 'fantastic', 'wonderful', 'happy', 'joy'],
  negative: ['terrible', 'awful', 'hate', 'worst', 'broken', 'failed', 'disappointed', 'angry', 'frustrated', 'dead']
}

const botIndicators = [
  'URGENT', 'BREAKING', '🚨', 'Don\'t miss out', 'GUARANTEED', 'ONCE IN A LIFETIME',
  'Buy NOW', 'Follow me for more', 'Not financial advice but', '🚀🚀🚀', '💰💰💰'
]

const credibilityIndicators = {
  positive: ['research shows', 'study reveals', 'according to', 'data suggests', 'evidence indicates', 'analysis shows'],
  negative: ['GUARANTEED', 'EXPLOSIVE', 'MOON', '10000x', 'secret method', 'they don\'t want you to know']
}

// Real OpenAI-powered tweet analysis
export const analyzeTweetWithAI = async (content) => {
  if (!openai) {
    console.warn('OpenAI not configured, falling back to mock analysis')
    return analyzeTweetMock(content)
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert content analyst. Analyze the given tweet and return a JSON object with:
          - sentiment: "positive", "neutral", or "negative"
          - credibilityScore: number between 0-1 (1 being most credible)
          - botProbability: number between 0-1 (1 being most likely a bot)
          
          Consider these factors:
          - Credibility: factual claims, sources, balanced language, expertise indicators
          - Bot detection: excessive emojis, caps, promotional language, repetitive patterns
          - Sentiment: overall emotional tone of the content
          
          Return only valid JSON.`
        },
        {
          role: "user",
          content: `Analyze this tweet: "${content}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    })

    const result = JSON.parse(completion.choices[0].message.content)
    
    // Validate and sanitize the response
    return {
      sentiment: ['positive', 'neutral', 'negative'].includes(result.sentiment) ? result.sentiment : 'neutral',
      credibilityScore: Math.max(0, Math.min(1, parseFloat(result.credibilityScore) || 0.5)),
      botProbability: Math.max(0, Math.min(1, parseFloat(result.botProbability) || 0.5))
    }
  } catch (error) {
    console.error('OpenAI analysis failed:', error)
    return analyzeTweetMock(content)
  }
}

// Fallback mock analysis (original implementation)
export const analyzeTweetMock = async (content) => {
  // Simulate API delay
  await delay(100 + Math.random() * 200)

  const lowerContent = content.toLowerCase()
  
  // Sentiment Analysis
  let sentiment = 'neutral'
  let positiveScore = 0
  let negativeScore = 0

  sentimentKeywords.positive.forEach(word => {
    if (lowerContent.includes(word)) positiveScore++
  })

  sentimentKeywords.negative.forEach(word => {
    if (lowerContent.includes(word)) negativeScore++
  })

  if (positiveScore > negativeScore) sentiment = 'positive'
  else if (negativeScore > positiveScore) sentiment = 'negative'

  // Bot Detection
  let botScore = 0
  botIndicators.forEach(indicator => {
    if (content.includes(indicator)) botScore += 0.2
  })

  // Excessive emojis or caps
  const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
  
  if (emojiCount > 5) botScore += 0.2
  if (capsRatio > 0.3) botScore += 0.2

  const botProbability = Math.min(botScore, 1)

  // Credibility Scoring
  let credibilityScore = 0.5 // Base score

  // Positive credibility indicators
  credibilityIndicators.positive.forEach(indicator => {
    if (lowerContent.includes(indicator)) credibilityScore += 0.1
  })

  // Negative credibility indicators  
  credibilityIndicators.negative.forEach(indicator => {
    if (lowerContent.includes(indicator)) credibilityScore -= 0.2
  })

  // Length and complexity bonus
  if (content.length > 100 && content.length < 500) credibilityScore += 0.1
  if (content.split(' ').length > 20) credibilityScore += 0.1

  // Excessive claims penalty
  if (lowerContent.includes('revolutionary') || lowerContent.includes('game-changer')) {
    credibilityScore -= 0.1
  }

  credibilityScore = Math.max(0, Math.min(1, credibilityScore))

  return {
    sentiment,
    credibilityScore,
    botProbability
  }
}

// Main export - uses AI if available, falls back to mock
export const analyzeTweet = analyzeTweetWithAI
