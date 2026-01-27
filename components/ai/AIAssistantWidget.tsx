'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Loader2,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { executeAction, ExecutableAction, ActionResult } from '@/lib/ai/action-executor'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  actions?: ExecutedAction[]
}

interface ExecutedAction {
  type: string
  target?: string
  value?: string
  success: boolean
  message: string
}

// Speech Recognition types
interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I can click buttons, fill forms & navigate. Try "Click Add Subject" or "Go to Teachers".',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [error, setError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sendButtonRef = useRef<HTMLButtonElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const handleSubmitRef = useRef<(text?: string) => void>(() => {})
  const [isAutoTyping, setIsAutoTyping] = useState(false)
  const shouldRestartRef = useRef(false) // Track if we should restart on end

  // Animated typing function
  const animateTyping = useCallback(async (text: string) => {
    setIsAutoTyping(true)
    setInputValue('')
    
    // Type each character with animation
    for (let i = 0; i < text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 25)) // 25ms per character
      setInputValue(text.substring(0, i + 1))
    }
    
    // Wait a moment then animate send button click
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Animate send button press
    if (sendButtonRef.current) {
      sendButtonRef.current.classList.add('scale-90', 'brightness-110')
      await new Promise(resolve => setTimeout(resolve, 150))
      sendButtonRef.current.classList.remove('scale-90', 'brightness-110')
    }
    
    setIsAutoTyping(false)
    
    // Now submit
    handleSubmitRef.current(text)
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const initRecognition = () => {
          const recognition = new SpeechRecognition()
          recognition.continuous = true // Keep listening
          recognition.interimResults = true
          recognition.lang = 'en-US'

          recognition.onstart = () => {
            console.log('🎤 Speech recognition started - speak now!')
          }

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            console.log('✅ Got result:', event.results)
            const transcript = Array.from({ length: event.results.length })
              .map((_, i) => event.results[i][0].transcript)
              .join('')

            console.log('📝 Transcript:', transcript, '| Final:', event.results[event.results.length - 1].isFinal)

            // Show interim results in input (real-time)
            if (!event.results[event.results.length - 1].isFinal) {
              setInputValue(transcript)
            }

            // Auto-submit on final result with typing animation
            if (event.results[event.results.length - 1].isFinal) {
              shouldRestartRef.current = false // Don't restart, we got speech
              setIsListening(false)
              try {
                recognition.stop()
              } catch (e) {}
              
              // Clear input first, then animate typing
              setInputValue('')
              setTimeout(() => {
                const animateAndSubmit = async () => {
                  setIsAutoTyping(true)
                  // Type each character with animation
                  for (let i = 0; i < transcript.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, 25))
                    setInputValue(transcript.substring(0, i + 1))
                  }
                  // Wait then animate send button
                  await new Promise(resolve => setTimeout(resolve, 300))
                  const btn = document.querySelector('[data-send-button]') as HTMLButtonElement
                  if (btn) {
                    btn.classList.add('scale-90', 'brightness-110')
                    await new Promise(resolve => setTimeout(resolve, 150))
                    btn.classList.remove('scale-90', 'brightness-110')
                  }
                  setIsAutoTyping(false)
                  handleSubmitRef.current(transcript)
                }
                animateAndSubmit()
              }, 100)
            }
          }

          recognition.onerror = (event: any) => {
            console.log('❌ Speech error:', event.error)
            // Handle different error types
            if (event.error === 'no-speech') {
              // Normal - user hasn't spoken yet, will auto-restart
              console.log('⏳ No speech detected, waiting...')
              return
            } else if (event.error === 'aborted') {
              // User stopped - this is fine, ignore
              return
            } else if (event.error === 'not-allowed') {
              setError('Microphone blocked. Click lock icon in address bar to allow.')
              setIsListening(false)
              shouldRestartRef.current = false
            } else if (event.error === 'network') {
              setError('Network error. Check internet connection.')
              setIsListening(false)
              shouldRestartRef.current = false
            } else {
              console.warn('Speech error:', event.error)
              setError(`Voice error: ${event.error}`)
            }
          }

          recognition.onend = () => {
            console.log('🛑 Recognition ended, shouldRestart:', shouldRestartRef.current)
            // Auto-restart if we should still be listening
            if (shouldRestartRef.current) {
              console.log('🔄 Restarting recognition...')
              try {
                setTimeout(() => {
                  recognition.start()
                }, 100) // Small delay before restart
              } catch (e) {
                console.log('Could not restart recognition:', e)
                setIsListening(false)
              }
            } else {
              setIsListening(false)
            }
          }

          return recognition
        }

        recognitionRef.current = initRecognition()
      } else {
        console.warn('Speech recognition not supported in this browser')
      }

      synthRef.current = window.speechSynthesis
    }
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Text-to-speech function
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current) return

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }, [voiceEnabled])

  // Toggle voice listening
  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setError('Voice not supported. Use Chrome or Edge browser.')
      return
    }

    setError('') // Clear any previous errors

    if (isListening) {
      // Stop listening
      shouldRestartRef.current = false
      try {
        recognitionRef.current.stop()
      } catch (e) {}
      setIsListening(false)
    } else {
      // First, explicitly request microphone permission
      try {
        console.log('🎙️ Requesting microphone access...')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log('✅ Microphone access granted!')
        
        // Stop the stream (we just needed permission)
        stream.getTracks().forEach(track => track.stop())
        
        // Now start recognition
        setInputValue('')
        shouldRestartRef.current = true
        
        // Create fresh recognition instance
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = false // Single phrase mode
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          console.log('🎤 Listening... speak now!')
        }
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          console.log('✅ Got speech result!')
          const transcript = Array.from({ length: event.results.length })
            .map((_, i) => event.results[i][0].transcript)
            .join('')
          
          console.log('📝 Transcript:', transcript)
          setInputValue(transcript)
          
          if (event.results[event.results.length - 1].isFinal) {
            shouldRestartRef.current = false
            setIsListening(false)
            
            // Animate and submit
            setInputValue('')
            setTimeout(() => {
              const animateAndSubmit = async () => {
                setIsAutoTyping(true)
                for (let i = 0; i < transcript.length; i++) {
                  await new Promise(resolve => setTimeout(resolve, 25))
                  setInputValue(transcript.substring(0, i + 1))
                }
                await new Promise(resolve => setTimeout(resolve, 300))
                const btn = document.querySelector('[data-send-button]') as HTMLButtonElement
                if (btn) {
                  btn.classList.add('scale-90', 'brightness-110')
                  await new Promise(resolve => setTimeout(resolve, 150))
                  btn.classList.remove('scale-90', 'brightness-110')
                }
                setIsAutoTyping(false)
                handleSubmitRef.current(transcript)
              }
              animateAndSubmit()
            }, 100)
          }
        }
        
        recognition.onerror = (event: any) => {
          console.log('❌ Error:', event.error)
          if (event.error === 'no-speech') {
            // Restart if still listening
            if (shouldRestartRef.current) {
              console.log('🔄 No speech, restarting...')
              setTimeout(() => {
                try { recognition.start() } catch(e) {}
              }, 100)
            }
          } else if (event.error === 'not-allowed') {
            setError('Microphone access denied')
            setIsListening(false)
          } else if (event.error !== 'aborted') {
            console.warn('Speech error:', event.error)
          }
        }
        
        recognition.onend = () => {
          console.log('🛑 Recognition ended')
          if (shouldRestartRef.current) {
            console.log('🔄 Auto-restarting...')
            setTimeout(() => {
              try { recognition.start() } catch(e) { setIsListening(false) }
            }, 100)
          } else {
            setIsListening(false)
          }
        }
        
        recognitionRef.current = recognition
        recognition.start()
        setIsListening(true)
        
      } catch (err: any) {
        console.error('❌ Microphone error:', err)
        if (err.name === 'NotAllowedError') {
          setError('Microphone blocked. Click lock icon in address bar.')
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Connect a microphone.')
        } else {
          setError(`Mic error: ${err.message}`)
        }
      }
    }
  }

  // Process command with AI and execute actions
  const processCommand = async (command: string): Promise<{ response: string; actions: ExecutedAction[] }> => {
    try {
      const response = await fetch('/api/institution/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      })

      const data = await response.json()

      if (!data.success) {
        return {
          response: data.message || 'Sorry, I couldn\'t process that command.',
          actions: [],
        }
      }

      // Execute actions on the client side
      const executedActions: ExecutedAction[] = []
      
      if (data.actions && data.actions.length > 0) {
        for (const action of data.actions) {
          // Small delay between actions for visual feedback
          await new Promise(resolve => setTimeout(resolve, 300))
          
          const result = await executeAction(action as ExecutableAction)
          executedActions.push({
            type: action.type,
            target: action.target,
            value: action.value,
            success: result.success,
            message: result.message,
          })
          
          // If action failed, stop executing remaining actions
          if (!result.success) {
            break
          }
          
          // Wait for DOM updates after navigation
          if (action.type === 'navigate') {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      return {
        response: data.response,
        actions: executedActions,
      }
    } catch (err) {
      console.error('AI processing error:', err)
      return {
        response: 'Sorry, there was an error processing your request. Please try again.',
        actions: [],
      }
    }
  }

  // Handle form submission
  const handleSubmit = useCallback(async (text?: string) => {
    const command = text || inputValue.trim()
    if (!command || isProcessing) return

    setError('')
    setInputValue('')
    setIsProcessing(true)

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: command,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Process the command
      const { response, actions } = await processCommand(command)

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        actions,
      }
      setMessages(prev => [...prev, assistantMessage])

      // Speak the response
      speak(response)
    } catch (err) {
      console.error('Error processing command:', err)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }, [inputValue, isProcessing, speak])

  // Keep ref updated with latest handleSubmit
  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  }, [handleSubmit])

  // Quick action buttons
  const quickActions = [
    { label: 'Add Subject', command: 'Click Add Subject button' },
    { label: 'Add Teacher', command: 'Click Add Teacher button' },
    { label: 'New Template', command: 'Click New Template button' },
    { label: 'Go to Timetable', command: 'Navigate to timetable management' },
  ]

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow ${
          isOpen ? 'hidden' : ''
        }`}
      >
        <Bot className="w-5 h-5" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </motion.button>

      {/* Widget Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-50 w-80 h-[420px] bg-white dark:bg-dark-800 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-dark-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs">AI Assistant</h3>
                  <p className="text-[10px] text-white/70">Voice & Chat</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
                >
                  {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
                <p className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" />
                  {error}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-2.5 py-1.5 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-[11px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Show executed actions */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-white/20 dark:border-dark-600">
                        <p className="text-[9px] opacity-70 mb-0.5">Actions:</p>
                        {message.actions.map((action, idx) => (
                          <div
                            key={idx}
                            className={`text-[9px] flex items-center gap-0.5 ${
                              action.success ? 'text-green-300' : 'text-red-300'
                            }`}
                          >
                            {action.success ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : (
                              <AlertCircle className="w-2.5 h-2.5" />
                            )}
                            {action.message}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-[8px] mt-0.5 opacity-50">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-dark-700 rounded-xl px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400">Processing...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-2.5 py-1.5 border-t border-gray-100 dark:border-dark-700">
              <p className="text-[9px] text-gray-500 dark:text-gray-400 mb-1">Quick:</p>
              <div className="flex flex-wrap gap-1">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(action.command)}
                    disabled={isProcessing}
                    className="px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-dark-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 rounded-full transition-colors flex items-center gap-0.5"
                  >
                    <Zap className="w-2.5 h-2.5" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-2.5 border-t border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
              <div className="flex items-center gap-1.5">
                {/* Voice Button */}
                <button
                  onClick={toggleListening}
                  disabled={isProcessing}
                  className={`p-2 rounded-lg transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => !isAutoTyping && setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isAutoTyping && handleSubmit()}
                    placeholder={isListening ? 'Listening...' : isAutoTyping ? '' : 'Type or speak...'}
                    disabled={isProcessing || isAutoTyping}
                    className={`w-full px-3 py-1.5 text-[11px] bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      isAutoTyping ? 'border-purple-400 ring-1 ring-purple-400' : ''
                    }`}
                  />
                  {(isListening || isAutoTyping) && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      <span className="flex h-1.5 w-1.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isAutoTyping ? 'bg-purple-400' : 'bg-red-400'
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                          isAutoTyping ? 'bg-purple-500' : 'bg-red-500'
                        }`}></span>
                      </span>
                    </span>
                  )}
                </div>

                {/* Send Button */}
                <button
                  ref={sendButtonRef}
                  data-send-button
                  onClick={() => handleSubmit()}
                  disabled={isProcessing || (!inputValue.trim() && !isAutoTyping)}
                  className={`p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-150 ${
                    isAutoTyping ? 'ring-2 ring-purple-300 ring-offset-1' : ''
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Speaking indicator */}
              {isSpeaking && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400">
                  <Volume2 className="w-2.5 h-2.5 animate-pulse" />
                  Speaking...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
