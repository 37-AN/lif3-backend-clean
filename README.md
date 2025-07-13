# LIF3 Backend - Clean Deployment Package

This is a clean, platform-independent version of the LIF3 backend, specifically prepared for Render.com deployment.

## What's removed:
- chromadb (platform-specific)
- Document processing libraries
- Development-only dependencies

## Deploy to Render:
1. Upload this folder to a new GitHub repository
2. Connect to Render.com
3. Use the included render.yaml configuration
4. Add environment variables from your original .env.production

## Environment Variables needed:
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret
CLAUDE_API_KEY=your-key
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
DISCORD_BOT_TOKEN=your-token
FRONTEND_URL=https://lif3-dashboard.vercel.app
```