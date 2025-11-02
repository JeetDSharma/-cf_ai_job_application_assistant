# AI Prompts Used

This document tracks AI assistance used during development of the AI Job Application Assistant. AI was primarily used for generating boilerplate code, CSS styling, and debugging assistance. All architectural decisions and core logic were designed and implemented independently.

---

## Development Session - Nov 2, 2025

### 1. TypeScript Configuration Issue

**Context:** Encountered a TypeScript error after setting up the project structure with separate frontend and backend configurations.

**Prompt:**
> I'm getting "Cannot find module './components/WorkflowPanel'" error in my TypeScript project. The file exists at the correct path. Help me debug this TypeScript configuration issue.

**AI Assistance:**
- Helped diagnose that TypeScript was using the wrong [tsconfig.json](cci:7://file:///Users/jeetsharma/Documents/projects/-cf_ai_job_application_assistant/tsconfig.json:0:0-0:0)
- Suggested reloading the TypeScript language server

**My Decision:** Configured separate TypeScript configs for frontend (React) and backend (Cloudflare Workers) to maintain proper separation of concerns.

---

### 2. PDF Upload UI Components

**Context:** After deciding to add PDF upload functionality for better UX, needed to implement the UI components.

**Prompt:**
> Generate a drag-and-drop file upload component in React with TypeScript. It should:
> - Accept only PDF files
> - Show upload status with loading spinner
> - Display uploaded file name
> - Have a button to clear/remove the file
> - Use Tailwind CSS for styling
> - Include proper TypeScript types

**AI Assistance:**
- Generated boilerplate JSX structure for file upload UI
- Provided Tailwind CSS classes for drag-and-drop visual states
- Created TypeScript event handler signatures

**My Decisions:**
- Chose to implement client-side PDF parsing to avoid backend changes
- Decided to keep manual text input as fallback option for accessibility
- Integrated with existing [WorkflowPanel](cci:1://file:///Users/jeetsharma/Documents/projects/-cf_ai_job_application_assistant/frontend/src/components/WorkflowPanel.tsx:31:0-471:1) component architecture
- Selected `pdfjs-dist` library after evaluating PDF parsing options

---

### 3. PDF.js Integration

**Prompt:**
> Show me how to integrate pdfjs-dist in a React + Vite project to extract text from PDF files. Include proper worker configuration.

**AI Assistance:**
- Provided code snippet for PDF.js initialization
- Suggested worker configuration approach
- Generated async function structure for PDF text extraction

**My Decisions:**
- Chose PDF.js over server-side parsing for better performance and privacy
- Implemented client-side processing to reduce API calls
- Decided on page-by-page text extraction approach

---

### 4. Vite Asset Handling

**Context:** PDF.js worker wasn't loading correctly with initial CDN approach.

**Prompt:**
> In Vite, how do I properly import a worker file from node_modules as a URL? Getting 404 errors with the CDN approach.

**AI Assistance:**
- Explained Vite's `?url` import syntax
- Provided TypeScript declaration for special imports
- Generated the import statement

**My Decision:** Switched from CDN to local node_modules to ensure reliability and offline capability.

---

### 5. CSS Styling Assistance

**Prompt:**
> Create Tailwind CSS classes for:
> - A file upload dropzone with hover and drag-over states
> - Success indicator badge
> - Smooth transitions between states
> - Responsive padding and spacing

**AI Assistance:**
- Generated Tailwind utility classes
- Provided transition and animation classes
- Suggested color scheme using primary colors

**My Decisions:**
- Maintained consistency with existing design system
- Chose green color scheme for success states to match app theme
- Ensured mobile responsiveness

---

### 6. TypeScript Type Definitions

**Prompt:**
> Generate TypeScript interfaces for:
> - File upload component props
> - PDF parsing result
> - Workflow panel state management

**AI Assistance:**
- Created interface definitions
- Suggested proper typing for async functions
- Provided type guards

**My Decisions:**
- Structured state management with separate flags for different loading states
- Used ref for file input to enable programmatic triggering
- Implemented proper error typing for better error handling

---

## Summary

### AI Was Used For:
- Generating boilerplate React component structure
- CSS/Tailwind styling recommendations
- TypeScript type definitions and interfaces
- Debugging configuration issues
- Code snippets for library integration
- Event handler boilerplate

### I Made Decisions On:
- Overall architecture (Cloudflare Workers + React frontend)
- Feature selection (PDF upload vs. manual input)
- Library choices (PDF.js, pdfjs-dist)
- Client-side vs. server-side processing
- State management approach
- User experience flow
- Error handling strategy
- Component integration patterns
- Project structure and organization

---
