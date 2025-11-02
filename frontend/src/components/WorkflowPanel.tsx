import { useState, useRef } from "react";
import {
  Play,
  Loader2,
  CheckCircle2,
  FileText,
  Briefcase,
  MessageSquare,
  Lightbulb,
  Upload,
  X,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface WorkflowPanelProps {
  userId: string;
}

interface WorkflowResult {
  analysis: string;
  tailoredResume: string;
  coverLetter: string;
  interviewTips: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

function WorkflowPanel({ userId }: WorkflowPanelProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [, setWorkflowId] = useState<string | null>(null);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const text = await extractTextFromPDF(file);
      setResumeText(text);
      setUploadedFileName(file.name);
    } catch (err) {
      setError(
        "Failed to parse PDF. Please try again or paste your resume text manually."
      );
      console.error("PDF parsing error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const clearUploadedFile = () => {
    setResumeText("");
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !company || !jobDescription || !resumeText) {
      setError("All fields are required");
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      // Start workflow
      const response = await fetch(`${API_BASE_URL}/workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle,
          company,
          jobDescription,
          resumeText,
          userId,
        }),
      });

      const data = await response.json();

      if (data.workflowId) {
        setWorkflowId(data.workflowId);
        // Poll for results
        pollWorkflowStatus(data.workflowId);
      } else {
        throw new Error("Failed to start workflow");
      }
    } catch (err) {
      setError("Failed to start workflow. Please try again.");
      setIsRunning(false);
    }
  };

  const pollWorkflowStatus = async (id: string) => {
    const maxAttempts = 120; // 10 minutes max (AI workflow takes time)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/workflow/${id}`);
        
        if (!response.ok) {
          console.error('Workflow status check failed:', response.status, response.statusText);
          setError(`Failed to check workflow status: ${response.statusText}`);
          setIsRunning(false);
          return;
        }
        
        const data = await response.json();
        console.log('Workflow status:', data.status, 'Has output:', !!data.output, 'Attempt:', attempts + 1, 'Full response:', data);

        // Cloudflare Workflows return status as: 'queued', 'running', 'complete', 'errored', 'terminated', 'unknown'
        if (data.status === "complete" || data.status === "Complete") {
          if (data.output && typeof data.output === 'object') {
            console.log('Workflow completed successfully with output');
            setResult(data.output);
            setIsRunning(false);
          } else {
            console.warn('Status is complete but output is missing or invalid:', data.output);
            // Keep polling if status is complete but output not ready
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(poll, 5000);
            } else {
              setError("Workflow completed but no output received. Please try again.");
              setIsRunning(false);
            }
          }
        } else if (data.status === "error" || data.status === "errored" || data.status === "terminated") {
          console.error('Workflow error:', data);
          setError(`Workflow failed: ${data.error || 'Unknown error'}. Please try again.`);
          setIsRunning(false);
        } else if (attempts < maxAttempts) {
          // Still running or queued
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          console.error('Workflow timed out after', maxAttempts * 5, 'seconds. Last status:', data.status);
          setError(`Workflow timed out after ${maxAttempts * 5 / 60} minutes. The job application generation may take longer than expected. Please try with a shorter resume or job description.`);
          setIsRunning(false);
        }
      } catch (err) {
        console.error('Workflow polling error:', err);
        setError("Failed to check workflow status. Please ensure the backend is running.");
        setIsRunning(false);
      }
    };

    poll();
  };

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Job Application Workflow
          </h2>
          <p className="text-gray-600">
            Generate a complete application package: analysis, tailored resume,
            cover letter, and interview tips.
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

            {/* PDF Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 mb-3 transition-colors ${
                isDragging
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${
                isRunning || isUploading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isRunning || isUploading}
              />

              {uploadedFileName ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {uploadedFileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF parsed successfully
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearUploadedFile}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isRunning}
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              ) : isUploading ? (
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Parsing PDF...</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Click to upload
                    </button>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </div>
              )}
            </div>

            {/* Manual Text Input (fallback) */}
            <div className="relative">
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Or paste your resume text here manually..."
                rows={6}
                className="input-field resize-none"
                disabled={isRunning || isUploading}
                required
              />
              {uploadedFileName && (
                <div className="absolute top-2 right-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    From PDF
                  </span>
                </div>
              )}
            </div>
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Job Analysis
                </h3>
                <p className="text-sm text-gray-500">
                  Key requirements and insights
                </p>
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Tailored Resume
                </h3>
                <p className="text-sm text-gray-500">
                  Optimized for this position
                </p>
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Cover Letter
                </h3>
                <p className="text-sm text-gray-500">
                  Personalized for this application
                </p>
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Interview Preparation
                </h3>
                <p className="text-sm text-gray-500">
                  Tips and likely questions
                </p>
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
  );
}

export default WorkflowPanel;
