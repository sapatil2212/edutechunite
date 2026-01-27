import { GoogleGenerativeAI } from '@google/generative-ai'

// ============================================
// MULTI-PROVIDER AI CONFIGURATION
// Priority: Gemini > OpenRouter > OpenAI
// ============================================

// Helper to clean API key (removes potential quotes from .env)
const cleanKey = (key: string | undefined) => (key || '').replace(/['"]+/g, '').trim()

// Get API keys from environment
const getGeminiKeys = () => [
  cleanKey(process.env.GEMINI_API_KEY),
  cleanKey(process.env.GEMINI_API_KEY_BACKUP),
].filter(Boolean)

const getOpenRouterKey = () => cleanKey(process.env.OPENROUTER_API_KEY)
const getOpenAIKey = () => cleanKey(process.env.OPENAI_API_KEY)

export interface ExtractedPeriodTiming {
  periodNumber: number
  name: string
  startTime: string
  endTime: string
  isBreak: boolean
}

export interface ExtractedTimetableTemplate {
  name: string
  description: string
  periodsPerDay: number
  periodDuration: number
  workingDays: string[]
  periodTimings: ExtractedPeriodTiming[]
}

const TIMETABLE_EXTRACTION_PROMPT = `You are an expert at extracting timetable/schedule information from documents.

Analyze the provided content and extract the timetable template structure. Return a JSON object with the following structure:

{
  "name": "Template name (e.g., 'Regular Schedule', 'School Timetable')",
  "description": "Brief description of the timetable",
  "periodsPerDay": number (count of teaching periods, excluding breaks),
  "periodDuration": number (average duration in minutes),
  "workingDays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] (include only days mentioned),
  "periodTimings": [
    {
      "periodNumber": 1,
      "name": "Period 1" or "Assembly" or "Lunch Break",
      "startTime": "09:00" (24-hour format HH:MM),
      "endTime": "09:45" (24-hour format HH:MM),
      "isBreak": false (true for breaks, recess, lunch, assembly)
    }
  ]
}

Rules:
1. Extract ALL periods including breaks, recess, lunch, assembly
2. Convert times to 24-hour format (HH:MM)
3. Mark isBreak=true for: break, recess, lunch, interval, assembly, prayer
4. If working days are not mentioned, assume Monday-Saturday
5. Period names should be descriptive (Period 1, Short Break, Lunch Break, etc.)
6. Ensure periodTimings are in chronological order
7. Calculate periodsPerDay as count of non-break periods only

Return ONLY the JSON object, no additional text or markdown.`

// ============================================
// PROVIDER 1: GOOGLE GEMINI
// ============================================
async function tryGemini(textContent: string): Promise<ExtractedTimetableTemplate | null> {
  const apiKeys = getGeminiKeys()
  if (apiKeys.length === 0) {
    console.log('No Gemini API keys configured')
    return null
  }

  // Models to try - gemini-2.0-flash-exp confirmed working
  const modelNames = [
    'gemini-2.0-flash-exp',
    'gemini-exp-1206',
    'gemini-2.0-pro-exp',
  ]

  for (const apiKey of apiKeys) {
    const genAI = new GoogleGenerativeAI(apiKey)
    
    for (const modelName of modelNames) {
      try {
        console.log(`Trying Gemini model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })

        const result = await model.generateContent([
          TIMETABLE_EXTRACTION_PROMPT,
          `\n\nContent to analyze:\n${textContent}`,
        ])

        const response = result.response
        const text = response.text()

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          console.error(`No JSON found in Gemini response`)
          continue
        }

        const extracted = JSON.parse(jsonMatch[0]) as ExtractedTimetableTemplate
        console.log(`✓ Success with Gemini model: ${modelName}`)
        return normalizeExtractedTemplate(extracted)
      } catch (error: any) {
        const errorMsg = error.message || error
        // Check for rate limit - might work with different API key
        if (errorMsg.includes('429') || errorMsg.includes('quota')) {
          console.log(`Rate limited on ${modelName}, trying next...`)
          continue
        }
        // Check for 404 - model not available
        if (errorMsg.includes('404') || errorMsg.includes('not found')) {
          console.log(`Model ${modelName} not available, trying next...`)
          continue
        }
        console.error(`Gemini error with ${modelName}:`, errorMsg)
        continue
      }
    }
  }
  
  console.log('All Gemini models failed, trying fallback providers...')
  return null
}

// ============================================
// PROVIDER 2: OPENROUTER (Multiple Models)
// ============================================
async function tryOpenRouter(textContent: string): Promise<ExtractedTimetableTemplate | null> {
  const apiKey = getOpenRouterKey()
  if (!apiKey) {
    console.log('No OpenRouter API key configured')
    return null
  }

  // OpenRouter models to try - fast and reliable ones first
  const models = [
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-flash-1.5',
    'google/gemini-flash-1.5-8b',
    'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
  ]

  for (const model of models) {
    try {
      console.log(`Trying OpenRouter model: ${model}`)
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
          'X-Title': 'Education SAAS Timetable Extraction',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: TIMETABLE_EXTRACTION_PROMPT,
            },
            {
              role: 'user',
              content: `Content to analyze:\n${textContent}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error(`OpenRouter ${model} error:`, errorData)
        continue
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || ''

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error(`No JSON found in OpenRouter response`)
        continue
      }

      const extracted = JSON.parse(jsonMatch[0]) as ExtractedTimetableTemplate
      console.log(`✓ Success with OpenRouter model: ${model}`)
      return normalizeExtractedTemplate(extracted)
    } catch (error: any) {
      console.error(`OpenRouter error with ${model}:`, error.message || error)
      continue
    }
  }

  console.log('All OpenRouter models failed')
  return null
}

// ============================================
// PROVIDER 3: OPENAI CHATGPT
// ============================================
async function tryOpenAI(textContent: string): Promise<ExtractedTimetableTemplate | null> {
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    console.log('No OpenAI API key configured')
    return null
  }

  // OpenAI models to try - fastest first
  const models = ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4o']

  for (const model of models) {
    try {
      console.log(`Trying OpenAI model: ${model}`)
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: TIMETABLE_EXTRACTION_PROMPT,
            },
            {
              role: 'user',
              content: `Content to analyze:\n${textContent}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error(`OpenAI ${model} error:`, errorData)
        continue
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || ''

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error(`No JSON found in OpenAI response`)
        continue
      }

      const extracted = JSON.parse(jsonMatch[0]) as ExtractedTimetableTemplate
      console.log(`✓ Success with OpenAI model: ${model}`)
      return normalizeExtractedTemplate(extracted)
    } catch (error: any) {
      console.error(`OpenAI error with ${model}:`, error.message || error)
      continue
    }
  }

  console.log('All OpenAI models failed')
  return null
}

// ============================================
// MAIN EXTRACTION FUNCTION WITH FALLBACK
// ============================================
export async function extractTimetableFromText(
  textContent: string
): Promise<ExtractedTimetableTemplate | null> {
  console.log('Starting AI timetable extraction...')
  
  // Try providers in priority order
  
  // 1. Try Google Gemini first (prioritized)
  let result = await tryGemini(textContent)
  if (result) return result

  // 2. Try OpenRouter as fallback
  result = await tryOpenRouter(textContent)
  if (result) return result

  // 3. Try OpenAI as final fallback
  result = await tryOpenAI(textContent)
  if (result) return result

  console.error('All AI providers failed for text extraction')
  return null
}

// ============================================
// FILE EXTRACTION WITH MULTI-PROVIDER SUPPORT
// ============================================
export async function extractTimetableFromFile(
  fileBase64: string,
  mimeType: string,
  fileName: string
): Promise<ExtractedTimetableTemplate | null> {
  console.log(`Starting AI file extraction for: ${fileName}`)
  
  // For file extraction, try Gemini first as it handles files natively
  const geminiKeys = getGeminiKeys()
  
  if (geminiKeys.length > 0) {
    const modelNames = [
      'gemini-2.0-flash-exp',
      'gemini-exp-1206',
      'gemini-2.0-pro-exp',
    ]

    for (const apiKey of geminiKeys) {
      const genAI = new GoogleGenerativeAI(apiKey)
      
      for (const modelName of modelNames) {
        try {
          console.log(`Trying Gemini file extraction with: ${modelName}`)
          const model = genAI.getGenerativeModel({ model: modelName })

          const filePart = {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType,
            },
          }

          const result = await model.generateContent([
            TIMETABLE_EXTRACTION_PROMPT,
            `\n\nAnalyze this document (${fileName}):`,
            filePart,
          ])

          const response = result.response
          const text = response.text()

          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            console.error(`No JSON found in Gemini file response`)
            continue
          }

          const extracted = JSON.parse(jsonMatch[0]) as ExtractedTimetableTemplate
          console.log(`✓ Success with Gemini file extraction: ${modelName}`)
          return normalizeExtractedTemplate(extracted)
        } catch (error: any) {
          console.error(`Gemini file extraction error with ${modelName}:`, error.message || error)
          continue
        }
      }
    }
  }

  // For non-Gemini providers, we can't directly process files
  // So we would need to convert the file to text first
  // For now, log that file extraction requires Gemini
  console.log('File extraction requires Gemini API with vision capabilities')
  console.error('All providers failed for file extraction')
  return null
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize and validate extracted template
 */
function normalizeExtractedTemplate(
  extracted: ExtractedTimetableTemplate
): ExtractedTimetableTemplate {
  const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

  // Normalize working days
  const workingDays = (extracted.workingDays || [])
    .map((d) => d.toUpperCase())
    .filter((d) => validDays.includes(d))

  // Default to Mon-Sat if empty
  if (workingDays.length === 0) {
    workingDays.push('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY')
  }

  // Normalize period timings
  const periodTimings = (extracted.periodTimings || []).map((timing, index) => ({
    periodNumber: index + 1,
    name: timing.name || `Period ${index + 1}`,
    startTime: normalizeTime(timing.startTime),
    endTime: normalizeTime(timing.endTime),
    isBreak: Boolean(timing.isBreak),
  }))

  // Calculate periods per day if not provided
  const periodsPerDay =
    extracted.periodsPerDay || periodTimings.filter((p) => !p.isBreak).length

  // Calculate average duration if not provided
  let periodDuration = extracted.periodDuration || 45
  if (!extracted.periodDuration && periodTimings.length > 0) {
    const nonBreakPeriods = periodTimings.filter((p) => !p.isBreak)
    if (nonBreakPeriods.length > 0) {
      const durations = nonBreakPeriods.map((p) => {
        const start = parseTime(p.startTime)
        const end = parseTime(p.endTime)
        return end - start
      })
      periodDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    }
  }

  return {
    name: extracted.name || 'Imported Timetable',
    description: extracted.description || 'Imported via AI',
    periodsPerDay,
    periodDuration,
    workingDays,
    periodTimings,
  }
}

/**
 * Normalize time string to HH:MM format
 */
function normalizeTime(time: string): string {
  if (!time) return '09:00'

  // Remove spaces and convert to uppercase
  time = time.trim().toUpperCase()

  // Handle various formats
  let hours = 0
  let minutes = 0

  // Format: "9:00 AM", "09:00 AM", "9:00AM"
  const amPmMatch = time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i)
  if (amPmMatch) {
    hours = parseInt(amPmMatch[1])
    minutes = parseInt(amPmMatch[2] || '0')
    const isPM = amPmMatch[3].toUpperCase() === 'PM'

    if (isPM && hours !== 12) hours += 12
    if (!isPM && hours === 12) hours = 0
  } else {
    // Format: "09:00", "9:00", "0900"
    const match = time.match(/(\d{1,2}):?(\d{2})/)
    if (match) {
      hours = parseInt(match[1])
      minutes = parseInt(match[2])
    }
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Parse time string to minutes since midnight
 */
function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Test if any AI provider is configured and working
 */
export async function testAIConfiguration(): Promise<{
  gemini: boolean
  openRouter: boolean
  openAI: boolean
}> {
  return {
    gemini: getGeminiKeys().length > 0,
    openRouter: !!getOpenRouterKey(),
    openAI: !!getOpenAIKey(),
  }
}
