'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, Volume2, Loader2 } from 'lucide-react'
import { executeAction, ExecutableAction } from '@/lib/ai/action-executor'

interface VoiceMessage {
  id: string
  text: string
  isUser: boolean
}

export function VoiceAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [status, setStatus] = useState<string>('Ready')
  
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const isActiveRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize TTS voices
  useEffect(() => {
    if (typeof window === 'undefined') return
    synthRef.current = window.speechSynthesis

    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || []
      // Find Microsoft Heera (Indian English Female)
      voiceRef.current = voices.find(v => v.name.includes('Microsoft Heera')) ||
                         voices.find(v => v.name.includes('Google UK English Female')) ||
                         voices.find(v => v.lang === 'en-IN') ||
                         voices.find(v => v.lang.startsWith('en')) ||
                         voices[0]
      if (voiceRef.current) {
        console.log('✅ Voice:', voiceRef.current.name)
      }
    }

    loadVoices()
    synthRef.current.onvoiceschanged = loadVoices

    return () => {
      synthRef.current?.cancel()
      stopRecording()
    }
  }, [])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Speak function - natural Indian female voice
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        resolve()
        return
      }

      synthRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      
      if (voiceRef.current) {
        utterance.voice = voiceRef.current
      }
      
      utterance.rate = 1.0
      utterance.pitch = 1.05
      utterance.volume = 1.0

      utterance.onstart = () => {
        setIsSpeaking(true)
        setStatus('Speaking...')
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }
      
      utterance.onerror = () => {
        setIsSpeaking(false)
        resolve()
      }

      synthRef.current.speak(utterance)
    })
  }, [])

  // Start recording audio
  const startRecording = async () => {
    try {
      setStatus('Starting microphone...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      })
      
      streamRef.current = stream
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0 && isActiveRef.current) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          await transcribeAndProcess(audioBlob)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // Collect data every 100ms
      
      setIsListening(true)
      setStatus('🎤 Listening... speak now!')
      
      // Auto-stop after 5 seconds of recording
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording()
        }
      }, 5000)

    } catch (error: any) {
      console.error('Microphone error:', error)
      setStatus('Microphone error')
      await speak("I couldn't access your microphone. Please check your browser permissions.")
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsListening(false)
  }

  // Transcribe audio using Whisper API
  const transcribeAndProcess = async (audioBlob: Blob) => {
    if (!isActiveRef.current) return

    setIsProcessing(true)
    setStatus('Processing your voice...')

    try {
      // Send audio to Whisper API
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')

      const response = await fetch('/api/institution/ai/transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.transcript) {
        const command = data.transcript.trim()
        console.log('🗣️ You said:', command)
        
        if (command) {
          // Show user message
          setMessages(prev => [...prev, { id: Date.now().toString(), text: command, isUser: true }])
          
          // Process the command
          await processCommand(command)
        } else {
          setStatus('Ready - speak again')
          // Continue listening
          if (isActiveRef.current) {
            setTimeout(startRecording, 500)
          }
        }
      } else {
        await speak("I didn't catch that. Please try again.")
        if (isActiveRef.current) {
          setTimeout(startRecording, 500)
        }
      }
    } catch (error) {
      console.error('Transcription error:', error)
      await speak("Sorry, there was an error. Please try again.")
      if (isActiveRef.current) {
        setTimeout(startRecording, 500)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Process voice command
  const processCommand = async (command: string) => {
    setStatus('Working on it...')

    try {
      const response = await fetch('/api/institution/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      })

      const data = await response.json()

      if (data.success) {
        // Execute actions immediately
        if (data.actions && data.actions.length > 0) {
          for (const action of data.actions) {
            console.log('⚡ Executing:', action)
            await executeAction(action as ExecutableAction)
            await new Promise(r => setTimeout(r, 200))
          }
        }

        // Speak response
        const responseText = data.response || "Done! What's next?"
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: responseText, isUser: false }])
        
        await speak(responseText)
        
        // Continue listening
        setStatus('Ready')
        if (isActiveRef.current) {
          setTimeout(startRecording, 300)
        }
      } else {
        await speak("Sorry, I couldn't do that. What else can I help with?")
        if (isActiveRef.current) {
          setTimeout(startRecording, 300)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      await speak("Oops! Something went wrong. Try again?")
      if (isActiveRef.current) {
        setTimeout(startRecording, 300)
      }
    }
  }

  // Open assistant
  const handleOpen = async () => {
    setIsOpen(true)
    setMessages([])
    isActiveRef.current = true
    
    // Greeting
    const greeting = "Hey! I'm your personal assistant. How can I help you today?"
    setMessages([{ id: '1', text: greeting, isUser: false }])
    
    await speak(greeting)
    
    // Start listening
    if (isActiveRef.current) {
      startRecording()
    }
  }

  // Close assistant
  const handleClose = () => {
    isActiveRef.current = false
    stopRecording()
    synthRef.current?.cancel()
    setIsOpen(false)
    setIsSpeaking(false)
    setIsProcessing(false)
    setIsListening(false)
    setMessages([])
    setStatus('Ready')
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleOpen}
        className={`fixed bottom-4 right-20 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow ${isOpen ? 'hidden' : ''}`}
        title="Voice Assistant"
      >
        <Mic className="w-5 h-5" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
      </motion.button>

      {/* Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 right-20 z-50 w-80 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-dark-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ${isListening ? 'animate-pulse' : ''}`}>
                  {isSpeaking ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Voice Assistant</h3>
                  <p className="text-[10px] text-white/80">{status}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/20">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="p-3 max-h-[280px] overflow-y-auto space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                    msg.isUser
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-dark-700 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-pink-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Working...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Control Area */}
            <div className="p-3 border-t border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
              <div className="flex items-center justify-between">
                {/* Status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                  isListening 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600' 
                    : isSpeaking
                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600'
                    : isProcessing
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                    : 'bg-gray-100 dark:bg-dark-600 text-gray-600'
                }`}>
                  {isListening ? (
                    <><span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative rounded-full h-2 w-2 bg-red-500"></span></span> Listening</>
                  ) : isSpeaking ? (
                    <><Volume2 className="w-3 h-3 animate-pulse" /> Speaking</>
                  ) : isProcessing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Working</>
                  ) : (
                    <><Mic className="w-3 h-3" /> Ready</>
                  )}
                </div>

                {/* Stop Button */}
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 rounded-full bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-300 transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
