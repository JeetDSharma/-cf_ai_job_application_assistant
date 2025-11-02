# Deployment Guide

Complete step-by-step guide for deploying the AI Job Application Assistant to Cloudflare.

## Prerequisites Checklist

- ✅ Cloudflare account (sign up at [cloudflare.com](https://cloudflare.com))
- ✅ Node.js 18+ installed
- ✅ Git installed
- ✅ Wrangler CLI installed globally: `npm install -g wrangler`

## Step 1: Prepare Your Project

```bash
# Clone or navigate to project directory
cd -cf_ai_job_application_assistant

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Step 2: Authenticate with Cloudflare

```bash
# Login to Cloudflare
wrangler login
```

This will open a browser window to authenticate. Follow the prompts.

```bash
# Verify login
wrangler whoami
```

## Step 3: Configure Cloudflare Resources

### Create KV Namespace (Optional)

```bash
# Create production KV namespace
wrangler kv:namespace create "KV"

# Create preview KV namespace
wrangler kv:namespace create "KV" --preview
```

You'll receive output like:
```
{ binding = "KV", id = "xxxxxxxxxxxxx" }
{ binding = "KV", preview_id = "yyyyyyyyyyyyy" }
```

Update `wrangler.toml` with these IDs:
```toml
[[kv_namespaces]]
binding = "KV"
id = "xxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyy"
```

### Configure Durable Objects

Durable Objects are already configured in `wrangler.toml`. No additional setup needed.

> **Note:** Durable Objects require a paid Workers plan ($5/month).

### Enable Workers AI

Workers AI is enabled by default on your account. The configuration is already set in `wrangler.toml`:

```toml
[ai]
binding = "AI"
```

## Step 4: Deploy the Backend Worker

```bash
# Deploy to Cloudflare
npm run deploy
```

You should see output like:
```
Published ai-job-assistant (X.XX sec)
  https://ai-job-assistant.<your-subdomain>.workers.dev
```

**Save this URL!** You'll need it for the frontend configuration.

### Test the Worker

```bash
# Test the health endpoint
curl https://ai-job-assistant.<your-subdomain>.workers.dev/

# You should see a JSON response with API info
```

## Step 5: Deploy the Frontend

### Option A: Deploy via Wrangler (Quickest)

```bash
# Build the frontend
cd frontend
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name ai-job-assistant-frontend

# Follow prompts to create the project
cd ..
```

### Option B: Deploy via Git (Recommended for Production)

1. **Push your code to GitHub/GitLab**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Connect to Cloudflare Pages**

- Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
- Navigate to **Pages** → **Create a project**
- Click **Connect to Git**
- Select your repository
- Configure build settings:
  - **Framework preset:** Vite
  - **Build command:** `cd frontend && npm install && npm run build`
  - **Build output directory:** `frontend/dist`
  - **Root directory:** `/`

3. **Add Environment Variable**

In Pages project settings:
- Go to **Settings** → **Environment variables**
- Add variable:
  - **Variable name:** `VITE_API_URL`
  - **Value:** `https://ai-job-assistant.<your-subdomain>.workers.dev/api`
- Click **Save**

4. **Trigger Deployment**

- Go to **Deployments** tab
- Click **Retry deployment** or push a new commit

Your frontend will be available at:
```
https://ai-job-assistant-frontend.pages.dev
```

## Step 6: Configure Custom Domain (Optional)

### For the Worker

```bash
# Add a custom domain
wrangler route add "api.yourdomain.com/*" --zone-name yourdomain.com
```

### For Pages

1. Go to your Pages project
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `app.yourdomain.com`)
5. Follow DNS configuration instructions

## Step 7: Verify Deployment

### Test Backend Endpoints

```bash
# Test chat endpoint
curl -X POST https://ai-job-assistant.<your-subdomain>.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!","sessionId":"test-session","userId":"test-user"}'
```

### Test Frontend

1. Open your Pages URL: `https://ai-job-assistant-frontend.pages.dev`
2. Navigate to Chat Assistant tab
3. Send a test message
4. Verify AI responds
5. Try the Workflow tab with sample data

## Troubleshooting

### "Error: No such namespace" for KV

Make sure you've created the KV namespace and updated the IDs in `wrangler.toml`.

### "Durable Object not found"

Ensure:
1. You have a paid Workers plan
2. Migrations are in `wrangler.toml`
3. You've deployed with `wrangler deploy` (not just `wrangler dev`)

### Frontend shows CORS errors

Verify:
1. Backend is deployed and accessible
2. CORS is enabled in `src/index.ts` (it is by default)
3. API URL is correctly set in frontend environment

### "AI model not available"

- Ensure Workers AI is enabled on your account
- Check you're using the correct model name: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- Verify you're on a plan that supports Workers AI

### Workflow times out

Workflows can take 1-2 minutes for complex operations. Increase the polling timeout in `WorkflowPanel.tsx` if needed.

## Monitoring & Logs

### View Worker Logs

```bash
# Stream real-time logs
wrangler tail

# Or view in dashboard
# https://dash.cloudflare.com > Workers & Pages > ai-job-assistant > Logs
```

### View Pages Logs

- Go to Cloudflare Dashboard
- Navigate to **Pages** → Your project → **Deployments**
- Click on a deployment to view build logs

### Monitor Usage

- **Workers:** Dashboard → Workers & Pages → ai-job-assistant → Analytics
- **AI Usage:** Dashboard → AI → Usage
- **Pages:** Dashboard → Pages → Your project → Analytics

## Updating Your Deployment

### Update Backend

```bash
# Make changes to src/
# Then deploy
npm run deploy
```

### Update Frontend

**Option A: Wrangler**
```bash
cd frontend
npm run build
wrangler pages deploy dist --project-name ai-job-assistant-frontend
cd ..
```

**Option B: Git (if connected)**
```bash
git add .
git commit -m "Update frontend"
git push
# Pages will automatically rebuild
```

## Cost Estimate

### Free Tier
- **Workers:** 100,000 requests/day
- **Workers AI:** 10,000 neurons/day (roughly 1,000-2,000 requests)
- **Pages:** Unlimited requests
- **Bandwidth:** 100 GB/month

### Paid Requirements
- **Durable Objects:** Requires Workers Paid plan ($5/month)
  - Includes 1M requests/month
  - Additional: $0.15/million requests

### Recommended Plan
- **Workers Paid:** $5/month (required for Durable Objects)
- **Workers AI usage:** Pay-as-you-go after free tier

## Security Best Practices

1. **Rate Limiting:** Implement rate limiting on chat endpoints
2. **Authentication:** Add user authentication for production use
3. **Input Validation:** Validate all user inputs (already implemented)
4. **Secrets:** Never commit `.env` files or secrets
5. **CORS:** Restrict CORS origins in production

## Next Steps

- [ ] Add user authentication
- [ ] Implement rate limiting
- [ ] Set up monitoring/alerting
- [ ] Configure custom domain
- [ ] Add analytics tracking
- [ ] Implement caching for AI responses
- [ ] Add more workflow types
- [ ] Optimize AI prompts

## Support

- [Cloudflare Workers Discord](https://discord.gg/cloudflaredev)
- [Cloudflare Community](https://community.cloudflare.com/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)

---

**Deployment complete!** 🎉 Your AI Job Application Assistant is now live on Cloudflare's global network.
