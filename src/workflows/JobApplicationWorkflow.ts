import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";

export interface JobApplicationParams {
  jobDescription: string;
  resumeText: string;
  jobTitle: string;
  company: string;
  userId: string;
}

export interface JobApplicationResult {
  analysis: string;
  tailoredResume: string;
  coverLetter: string;
  interviewTips: string;
}

export class JobApplicationWorkflow extends WorkflowEntrypoint<Env, JobApplicationParams> {
  async run(event: WorkflowEvent<JobApplicationParams>, step: WorkflowStep) {
    const { jobDescription, resumeText, jobTitle, company, userId } = event.payload;

    // Step 1: Analyze the job description
    const analysis = await step.do("analyze-job", async () => {
      const prompt = `Analyze this job description for ${jobTitle} at ${company}:

${jobDescription}

Provide key requirements, skills needed, and culture fit indicators.`;

      const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      });

      return response.response;
    });

    // Step 2: Tailor the resume based on job requirements
    const tailoredResume = await step.do("tailor-resume", async () => {
      const prompt = `Given this resume:

${resumeText}

And this job analysis:
${analysis}

Create a tailored version of the resume that emphasizes relevant skills and experience for the ${jobTitle} position at ${company}. Maintain professional formatting.`;

      const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
      });

      return response.response;
    });

    // Step 3: Generate a personalized cover letter
    const coverLetter = await step.do("generate-cover-letter", async () => {
      const prompt = `Write a compelling cover letter for the ${jobTitle} position at ${company}.

Job Requirements:
${analysis}

Candidate Background:
${resumeText}

Create a professional, personalized cover letter that highlights relevant experience and expresses genuine interest in the role.`;

      const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
      });

      return response.response;
    });

    // Step 4: Provide interview preparation tips
    const interviewTips = await step.do("interview-tips", async () => {
      const prompt = `Based on this job for ${jobTitle} at ${company}:

${jobDescription}

Provide 5-7 targeted interview preparation tips, including likely questions and strong answer frameworks.`;

      const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1536,
      });

      return response.response;
    });

    // Return all results
    return {
      analysis,
      tailoredResume,
      coverLetter,
      interviewTips,
    };
  }
}
