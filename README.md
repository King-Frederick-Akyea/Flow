# Flow: Visual Workflow Automation Platform

**Flow** is a full-stack, modern workflow automation system. It lets users visually create, execute, and manage automated workflows that connect triggers, data sources, logic, transforms, AI, and action steps—all with a drag-and-drop UI. Integrated scheduling and extensible “services” mean you can automate anything from simple reminders to complex business processes with real-time feedback.

---

## Features

- **Visual Builder**: Drag-and-drop workflow creation using React Flow.
- **Node Types**: Triggers (schedule, webhook, manual), Data Sources (Weather, GitHub, API, Database), Logic, Transforms, AI, Actions (Email, Slack, Webhook, SMS, Notification, and more).
- **Concurrent (Parallel) Branch Execution**: If a node has multiple outputs, all downstream nodes execute in parallel.
- **Real-Time Logs**: Step-by-step execution feedback during workflow runs.
- **Trigger Options**: Start flows with schedule, webhooks, or manually.
- **Rich Integrations**: Easily add new services in `lib/integrations/`.
- **Secure**: Users and workflow data tied to Supabase authentication.
- **Extensible**: Typed backend for integrations, node types, and actions.

---

## Quickstart

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with a `workflows` table (see database section).

### Local Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd Flow

# Install dependencies
npm install

# Set up environment variables (see .env.local section)
cp .env.local.example .env.local   # create and fill in as shown below

# Start the development server
npm run dev
```

### Environment Setup

Create a `.env.local` file in the root directory with the following (replace with your own API keys):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
NEXT_PUBLIC_BREVO_API_KEY=your_brevo_key       # for email sending
NEXT_PUBLIC_DEFAULT_FROM_EMAIL=your@email.com
NEXT_PUBLIC_EMAIL_SENDER_NAME=Workflow Automation
OPENAI_API_KEY=your_openai_key                 # for AI/LLM steps
GITHUB_TOKEN=your_github_token                 # for GitHub integration
SLACK_WEBHOOK_URL=your_slack_webhook
```
*See the relevant code/comments for additional integration options as needed.*

### Database Setup

Create a `workflows` table in Supabase to store user flows:

- Core columns: `id, name, description, graph_data, is_active, user_id, created_at, updated_at`

Refer to `types/workflow.ts` for expected schema.

1. **Sign Up/Login** to save your workflows securely.
2. **Create a new workflow** from the dashboard.
3. **Drag nodes** (triggers, data sources, logic, actions) from the sidebar into the builder.
4. **Connect nodes** by drawing lines; configure each node for source/action details (right panel).
5. **Save** your workflow.
6. **Run workflows** manually, on schedule, or via webhook. Watch real-time logs.
7. **Extend**: Add new APIs or actions in the `lib/integrations` directory.

## Usage

1. **Sign Up/Login** to save your workflows securely (Supabase-based auth).
2. **Create new workflows** from the dashboard.
3. **Drag and configure nodes** (triggers, data sources, logic steps, transforms, actions).
4. **Connect nodes visually** and edit settings in side/execution panels.
5. **Save** your automation — all configs are persisted.
6. **Run manually, via schedule, or webhooks**. Get real-time log feedback.
7. **Extend** functionality by adding integrations to `lib/integrations/`.

---

## Technology Stack

- **Frontend**: Next.js (app router), React, TypeScript, Tailwind CSS, React Flow
- **Backend/Storage**: Supabase/Postgres
- **Integrations**: OpenWeather, OpenAI, GitHub, Slack, Email (Brevo), more
- **Authentication**: Supabase Auth (social + email/password)
- **State/Execution Engine**: Client-side workflow logic (`lib/executionEngine.ts`, `lib/scheduler.ts`)

---

## Workflow Execution Details

- **Concurrent Branching**: Supports parallel execution for nodes with multiple output edges (fan-out). If a node (e.g., Weather) connects to both an email and notification node, both are executed concurrently. This is supported anywhere in your workflows.
- **Logs**: Each step’s execution, errors, and completion state are reported live in the UI panel.
- **Extensibility**: New services can be added by implementing the `BaseService` interface in `lib/integrations/` and registering in `lib/integrations/index.ts`.

---

## Folder Structure

```
components/workflow/    # Visual builder components, node types, sidebar, execution panel
lib/integrations/       # Integrations and services for data & actions
lib/executionEngine.ts  # Core workflow step execution engine (parallel and sequential support)
lib/scheduler.ts        # In-browser workflow scheduling (recurring/cron-style jobs)
types/workflow.ts       # Node, graph, and run type definitions
app/                    # Next.js app pages, layouts, and API routes
public/                 # Static assets/icons
```

---

## Main Scripts

- `npm run dev` — Start local development server.
- `npm run build` — Production build.
- `npm start` — Start the built app.
- `npm run lint` — Run code linter (ESLint).

---

## How to Extend

- **New Integrations**: Add a new file in `lib/integrations/`, then register it in `lib/integrations/index.ts`.
- **Node Types**: See/add node definitions in `types/workflow.ts` and `components/workflow/NodeTypes.tsx`.
- **Custom Actions/Data Sources**: Update the registry in `lib/integrations/index.ts` and provide the service implementation.

---

## Environment Variables Reference

**.env.local**

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase instance URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public Supabase anonymous key
- `NEXT_PUBLIC_OPENWEATHER_API_KEY` — API key for weather data
- `NEXT_PUBLIC_BREVO_API_KEY` — Email/SMS sending
- `NEXT_PUBLIC_DEFAULT_FROM_EMAIL`, `NEXT_PUBLIC_EMAIL_SENDER_NAME` — Email defaults
- `OPENAI_API_KEY` — OpenAI API for LLM/AI workflow nodes
- `GITHUB_TOKEN` — GitHub integration
- `SLACK_WEBHOOK_URL` — Slack integration

---

## Security and Auth

- All user data and workflow graphs are scoped and stored per-user via Supabase Auth.
- User sign-up, login, and session management are implemented in `lib/auth.ts` and on the main pages.

---

## Contributing & Development

- Follow the type definitions and patterns throughout `lib`, `types`, and `components`.
- Use the UI builder, but you can also add/modify workflow definitions in code as needed.
- Use the real-time log and error reporting for quick debugging.

---

**Need help?** Explore the codebase inline, refer to type definitions in `types/workflow.ts`, or see service implementations in `lib/integrations/`.
