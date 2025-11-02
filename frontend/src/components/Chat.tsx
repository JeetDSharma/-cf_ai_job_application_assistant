import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, User, Bot, RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatProps {
  sessionId: string
  userId: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

function Chat({ sessionId, userId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load conversation history on mount
    loadHistory()
  }, [sessionId])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${sessionId}`)
      const data = await response.json()
      if (data.messages) {
        // Filter out system messages
        const userMessages = data.messages.filter((m: any) => m.role !== 'system')
        setMessages(userMessages)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear the conversation history?')) {
      try {
        await fetch(`${API_BASE_URL}/history/${sessionId}`, {
          method: 'DELETE',
        })
        setMessages([])
      } catch (error) {
        console.error('Failed to clear history:', error)
      }
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          userId,
        }),
      })

      const data = await response.json()

      if (data.response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp || Date.now(),
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('No response from API')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Chat with AI Assistant</h2>
          <p className="text-primary-100 text-sm">Ask about resumes, cover letters, or interview prep</p>
        </div>
        <button
          onClick={handleClearHistory}
          className="p-2 hover:bg-primary-700 rounded-lg transition-colors text-white"
          title="Clear conversation"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Start a conversation</h3>
            <p className="text-gray-500 max-w-md">
              Ask me anything about job applications, resume writing, cover letters, or interview preparation.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={clsx(
              'flex items-start space-x-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-600" />
              </div>
            )}
            <div
              className={clsx(
                'max-w-[70%] rounded-2xl px-4 py-3 shadow-sm',
                message.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 rounded-bl-sm'
              )}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              <span
                className={clsx(
                  'text-xs mt-1 block',
                  message.role === 'user' ? 'text-primary-100' : 'text-gray-400'
                )}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="border-t border-gray-200 p-4 bg-white">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Chat
