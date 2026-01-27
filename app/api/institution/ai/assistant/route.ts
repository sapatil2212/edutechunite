import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Get API keys
const getGeminiKey = () => {
  const key = process.env.GEMINI_API_KEY || ''
  return key.replace(/['"]+/g, '').trim()
}

const getOpenRouterKey = () => {
  const key = process.env.OPENROUTER_API_KEY || ''
  return key.replace(/['"]+/g, '').trim()
}

const getOpenAIKey = () => {
  const key = process.env.OPENAI_API_KEY || ''
  return key.replace(/['"]+/g, '').trim()
}

const SYSTEM_PROMPT = `You are an AI assistant for an Education ERP system. Your job is to understand user commands and convert them into executable actions.

Available action types:
1. click - Click on a button or link
2. fill - Fill in an input field with a value
3. select - Select an option from a dropdown
4. navigate - Navigate to a different page
5. scroll - Scroll the page
6. clear - Clear an input field
7. check - Check or uncheck a checkbox

Available pages in this system:
- Dashboard (/dashboard)
- Timetable View (/dashboard/timetable)
- Timetable Management (/dashboard/academic/timetable)
- Timetable Templates (/dashboard/academic/timetable/templates)
- Classes (/dashboard/academic/classes)
- Subjects (/dashboard/academic/subjects)
- Teachers (/dashboard/academic/teachers)
- Academic Years (/dashboard/academic/years)
- Settings (/dashboard/settings)

Common buttons users might want to click:
- "Add Subject" - On subjects page
- "Add Teacher" - On teachers page
- "Add Class" - On classes page
- "New Template" - On templates page
- "Create Template" - On templates page
- "Open Editor" - On timetable management page
- "Publish" - To publish a timetable
- "Save" - To save changes

Common form fields:
- "name", "email", "phone", "description"
- "subject name", "subject code"
- "teacher name", "employee id"
- "template name", "periods per day"

Based on the user's command, respond with a JSON object containing:
1. "response" - A friendly response message to the user
2. "actions" - An array of actions to execute (can be empty if no action needed)

Each action should have:
- "type" - The action type (click, fill, select, navigate, scroll, clear, check)
- "target" - The element to interact with (button text, input label, etc.)
- "value" - The value to enter (for fill, select actions)

Examples:

User: "Click the Add Subject button"
Response:
{
  "response": "I'll click the Add Subject button for you.",
  "actions": [{"type": "click", "target": "Add Subject"}]
}

User: "Fill the name field with Mathematics"
Response:
{
  "response": "I'll fill in the name field with 'Mathematics'.",
  "actions": [{"type": "fill", "target": "name", "value": "Mathematics"}]
}

User: "Go to the teachers page"
Response:
{
  "response": "Navigating to the Teachers page.",
  "actions": [{"type": "navigate", "target": "/dashboard/academic/teachers"}]
}

User: "Add a new subject called English with code ENG"
Response:
{
  "response": "I'll help you add a new subject. Let me click the Add Subject button and fill in the details.",
  "actions": [
    {"type": "click", "target": "Add Subject"},
    {"type": "fill", "target": "name", "value": "English"},
    {"type": "fill", "target": "code", "value": "ENG"}
  ]
}

User: "What can you do?"
Response:
{
  "response": "I can help you navigate the Education ERP system! I can:\n- Click buttons (e.g., 'Click Add Subject')\n- Fill forms (e.g., 'Fill name with Mathematics')\n- Navigate pages (e.g., 'Go to Teachers')\n- And more! Just tell me what you need.",
  "actions": []
}

Always respond with valid JSON. Be helpful and friendly. If you're not sure what the user wants, ask for clarification in your response.`

// Try Gemini first
async function tryGemini(command: string): Promise<{ response: string; actions: any[] } | null> {
  const apiKey = getGeminiKey()
  if (!apiKey) return null

  const models = ['gemini-2.0-flash-exp', 'gemini-exp-1206', 'gemini-pro']

  for (const modelName of models) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: modelName })

      const result = await model.generateContent([
        SYSTEM_PROMPT,
        `

User command: ${command}

Respond with valid JSON only.`,
      ])

      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          response: parsed.response || 'Command processed.',
          actions: parsed.actions || [],
        }
      }
    } catch (error: any) {
      console.error(`Gemini ${modelName} error:`, error.message)
      continue
    }
  }

  return null
}

// Try OpenRouter
async function tryOpenRouter(command: string): Promise<{ response: string; actions: any[] } | null> {
  const apiKey = getOpenRouterKey()
  if (!apiKey) return null

  const models = [
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-flash-1.5',
    'meta-llama/llama-3.1-8b-instruct:free',
  ]

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `${command}\n\nRespond with valid JSON only.` },
          ],
          temperature: 0.3,
        }),
      })

      if (!response.ok) continue

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          response: parsed.response || 'Command processed.',
          actions: parsed.actions || [],
        }
      }
    } catch (error) {
      continue
    }
  }

  return null
}

// Try OpenAI
async function tryOpenAI(command: string): Promise<{ response: string; actions: any[] } | null> {
  const apiKey = getOpenAIKey()
  if (!apiKey) return null

  const models = ['gpt-4o-mini', 'gpt-3.5-turbo']

  for (const model of models) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `${command}\n\nRespond with valid JSON only.` },
          ],
          temperature: 0.3,
        }),
      })

      if (!response.ok) continue

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          response: parsed.response || 'Command processed.',
          actions: parsed.actions || [],
        }
      }
    } catch (error) {
      continue
    }
  }

  return null
}

// Simple fallback command parser
function parseCommandFallback(command: string): { response: string; actions: any[] } {
  const cmd = command.toLowerCase()
  
  // Navigation commands
  if (cmd.includes('go to') || cmd.includes('navigate') || cmd.includes('open')) {
    const pageMatches: Record<string, string> = {
      'dashboard': '/dashboard',
      'timetable': '/dashboard/timetable',
      'timetable management': '/dashboard/academic/timetable',
      'templates': '/dashboard/academic/timetable/templates',
      'classes': '/dashboard/academic/classes',
      'subjects': '/dashboard/academic/subjects',
      'teachers': '/dashboard/academic/teachers',
      'academic years': '/dashboard/academic/years',
      'years': '/dashboard/academic/years',
      'settings': '/dashboard/settings',
    }

    for (const [page, path] of Object.entries(pageMatches)) {
      if (cmd.includes(page)) {
        return {
          response: `Navigating to ${page}...`,
          actions: [{ type: 'navigate', target: path }],
        }
      }
    }
  }

  // Click commands
  if (cmd.includes('click')) {
    const buttonMatches = [
      'add subject', 'add teacher', 'add class', 'new template', 
      'create template', 'publish', 'save', 'cancel', 'edit', 
      'delete', 'open editor', 'add', 'create', 'submit'
    ]

    for (const button of buttonMatches) {
      if (cmd.includes(button)) {
        return {
          response: `Clicking the ${button} button...`,
          actions: [{ type: 'click', target: button }],
        }
      }
    }

    // Generic click - extract target
    const clickMatch = cmd.match(/click (?:on |the )?(.+?)(?:\s*button)?$/i)
    if (clickMatch) {
      return {
        response: `Clicking ${clickMatch[1]}...`,
        actions: [{ type: 'click', target: clickMatch[1] }],
      }
    }
  }

  // Fill commands
  const fillMatch = cmd.match(/fill (?:the |in )?(.+?) (?:field |input )?with (.+)/i)
  if (fillMatch) {
    return {
      response: `Filling ${fillMatch[1]} with "${fillMatch[2]}"...`,
      actions: [{ type: 'fill', target: fillMatch[1], value: fillMatch[2] }],
    }
  }

  // Help command
  if (cmd.includes('help') || cmd.includes('what can you do')) {
    return {
      response: `I can help you with:
• Clicking buttons: "Click Add Subject"
• Filling forms: "Fill name with English"
• Navigation: "Go to Teachers page"
• And more! Just ask naturally.`,
      actions: [],
    }
  }

  // Default response
  return {
    response: `I'm not sure how to do that. Try commands like:\n• "Click Add Subject"\n• "Go to Teachers page"\n• "Fill name with English"`,
    actions: [],
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { command } = body

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Command is required' },
        { status: 400 }
      )
    }

    console.log(`AI Assistant command: ${command}`)

    // Try AI providers in order
    let result = await tryGemini(command)
    
    if (!result) {
      result = await tryOpenRouter(command)
    }
    
    if (!result) {
      result = await tryOpenAI(command)
    }

    // Fallback to simple parsing
    if (!result) {
      result = parseCommandFallback(command)
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      actions: result.actions,
    })
  } catch (error) {
    console.error('AI Assistant error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process command',
        response: 'Sorry, something went wrong. Please try again.',
        actions: [],
      },
      { status: 500 }
    )
  }
}
