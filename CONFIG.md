# OpsDock Configuration & Deployment Guide

This document describes what needs to be configured when deploying OpsDock to Manufact MCP Cloud or another production environment.

## Environment Variables

For the fully functional production version (with actual calling capabilities enabled), you will need the following APIs:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# AI Services
OPENAI_API_KEY=sk-your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Manufact MCP Deployment
MCP_URL=https://opsdock.yoursubdomain.manufact.com
```

## Production Considerations

When transitioning from this Demo to Production:

1. **State Management**: The current in-memory `store.ts` should be replaced with a persistent database (e.g., PostgreSQL via Prisma or Supabase).
2. **Call Webhooks**: The `run_next_call` tool currently creates a synchronous simulated event. In production, this will:
   - Make an asynchronous API call to Twilio.
   - Set up Webhook endpoints to handle Twilio TwiML events.
   - Use ElevenLabs conversational AI for live call handling.
3. **Resource Endpoints**: Ensure the `server.resource` endpoints correctly output the persistent database information, mapped to appropriate formats (like the `href` linking fix applied previously).
4. **Authentication**: If being published securely, add WorkOS or Supabase authentication to protect the Campaign endpoints using `mcp-use` Auth patterns.

## Deploying to Manufact MCP Cloud

You can deploy the app directly using the CLI:
`npm run deploy`

This command bundles the backend server (`index.ts`) and the compiled widgets from `/resources` and pushes them to the Manufact Cloud infrastructure. Ensure you have logged in via `npx mcp-use login` first.
