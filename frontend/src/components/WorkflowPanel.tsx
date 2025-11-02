import { useState } from 'react'
import { Play, Loader2, CheckCircle2, FileText, Briefcase, MessageSquare, Lightbulb } from 'lucide-react'

interface WorkflowPanelProps {
  userId: string
}

interface WorkflowResult {
  analysis: string
  tailoredResume: string
  coverLetter: string
  interviewTips: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

function WorkflowPanel({ userId }: WorkflowPanelProps) {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [result, setResult] = useState<WorkflowResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startWorkflow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobTitle || !company || !jobDescription || !resumeText) {
      setError('All fields are required')
      return
    }

    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      // Start workflow
      const response = await fetch(`${API_BASE_URL}/workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle,
          company,
          jobDescription,
          resumeText,
          userId,
        }),
      })

      const data = await response.json()

      if (data.workflowId) {
        setWorkflowId(data.workflowId)
        // Poll for results
        pollWorkflowStatus(data.workflowId)
      } else {
        throw new Error('Failed to start workflow')
      }
    } catch (err) {
      setError('Failed to start workflow. Please try again.')
      setIsRunning(false)
    }
  }

  const pollWorkflowStatus = async (id: string) => {
    const maxAttempts = 60 // 5 minutes max
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/workflow/${id}`)
        const data = await response.json()

        if (data.status === 'complete' && data.output) {
          setResult(data.output)
          setIsRunning(false)
        } else if (data.status === 'error') {
          setError('Workflow failed. Please try again.')
          setIsRunning(false)
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(poll, 5000) // Poll every 5 seconds
        } else {
          setError('Workflow timed out. Please try again.')
          setIsRunning(false)
        }
      } catch (err) {
        setError('Failed to check workflow status.')
        setIsRunning(false)
      }
    }

    poll()
  }

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Application Workflow</h2>
          <p className="text-gray-600">
            Generate a complete application package: analysis, tailored resume, cover letter, and interview tips.
          </p>
        </div>

        <form onSubmit={startWorkflow} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="input-field"
                disabled={isRunning}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Cloudflare"
                className="input-field"
                disabled={isRunning}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={6}
              className="input-field resize-none"
              disabled={isRunning}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Resume *
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your current resume text here..."
              rows={8}
              className="input-field resize-none"
              disabled={isRunning}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isRunning}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing... This may take a few minutes</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Workflow</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Job Analysis */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Job Analysis</h3>
                <p className="text-sm text-gray-500">Key requirements and insights</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
            </div>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
                {result.analysis}
              </pre>
            </div>
          </div>

          {/* Tailored Resume */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tailored Resume</h3>
                <p className="text-sm text-gray-500">Optimized for this position</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
            </div>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
                {result.tailoredResume}
              </pre>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cover Letter</h3>
                <p className="text-sm text-gray-500">Personalized for this application</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
            </div>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
                {result.coverLetter}
              </pre>
            </div>
          </div>

          {/* Interview Tips */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Interview Preparation</h3>
                <p className="text-sm text-gray-500">Tips and likely questions</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
            </div>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
                {result.interviewTips}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkflowPanel
