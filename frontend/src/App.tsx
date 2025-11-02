import { useState, useEffect } from 'react'
import { Briefcase, Send, Loader2, Sparkles, FileText, RotateCcw } from 'lucide-react'
import Chat from './components/Chat'
import WorkflowPanel from './components/WorkflowPanel'

function App() {
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`)
  const [activeTab, setActiveTab] = useState<'chat' | 'workflow'>('chat')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-500 rounded-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Job Assistant</h1>
                <p className="text-sm text-gray-500">Powered by Cloudflare Workers AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span>Llama 3.3 • Durable Objects • Workflows</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'chat'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Chat Assistant</span>
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'workflow'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Application Workflow</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'chat' ? (
          <Chat sessionId={sessionId} userId={userId} />
        ) : (
          <WorkflowPanel userId={userId} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Built with Cloudflare Workers AI, Durable Objects, and Workflows</p>
            <p>Session: {sessionId.slice(0, 20)}...</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
