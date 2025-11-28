# Flow: Visual Workflow Automation Builder

**Flow** is a modern, full-stack workflow automation platform. With Flow, users can visually build, execute, and manage workflows by connecting triggers, data sources, logic/transform steps, and powerful actions—all using a drag-and-drop interface.

##  Features

- **Visual Builder:** Create workflows with an intuitive drag-and-drop canvas powered by React Flow.
- **Flexible Triggers:** Start workflows via schedule (cron-like), webhooks, or manually.
- **Data Sources:** Integrate real-time data from Weather, GitHub, and more; easily extendable to new sources.
- **AI & Logic Steps:** Add condition checks, transformations, and even AI-powered nodes (OpenAI) in your flows.
- **Smart Actions:** Drive results via Email, Slack, Webhooks, SMS, Notifications, Social Media, and more.
- **Realtime Execution Logs:** Monitor workflow runs step-by-step.
- **User Authentication & Persistence:** Secure sign up/login (Supabase Auth) with all workflows tied to your account.
- **Rich API & Extensibility:** Clean, typed backend (Supabase/Postgres) for storage; easy to add services.
- **Client-Side Scheduling:** Robust in-browser engine for running and scheduling automations.

##  Quickstart

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) account with a "workflows" table as per types.

### Local Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd Flow

# 2. Install dependencies
npm install

# 3. Create a `.env.local` for API keys (see below)

# 4. Start the dev server
npm run dev
```

### Environment Setup

Create a `.env.local` with the following (get keys from the respective services; see code for all options):

```
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

### Database Setup

Create a table in Supabase:

- `workflows` (see `types/workflow.ts` for columns like: id, name, description, graph_data, is_active, user_id, ...)

### Usage

1. **Sign Up/Login** to save your workflows securely.
2. **Create a new workflow** from the dashboard.
3. **Drag nodes** (triggers, data sources, logic, actions) from the sidebar into the builder.
4. **Connect nodes** by drawing lines; configure each node for source/action details (right panel).
5. **Save** your workflow.
6. **Run workflows** manually, on schedule, or via webhook. Watch real-time logs.
7. **Extend**: Add new APIs or actions in the `lib/integrations` directory.

##  Main Tech Stack

- **Frontend**: Next.js (app router), React, TypeScript, Tailwind CSS, React Flow
- **Backend/Storage**: Supabase/Postgres
- **Integrations**: OpenWeather, OpenAI, GitHub, Slack, Email (Brevo)
- **Authentication**: Supabase Auth
- **State/Execution Engine**: Custom client-side engine (`lib/executionEngine.ts`, `lib/scheduler.ts`)

##  Extending

- Add a new integration: Create a service in `lib/integrations/` and adjust `executionEngine.ts`.
- Add new workflow node types: Edit `types/workflow.ts` and `components/workflow/NodeTypes.tsx`.

##  Scripts

- `npm run dev` – Local development
- `npm run build` – Production build
- `npm start` – Run built app
- `npm run lint` – Lint code with ESLint

##  File Structure (Major Parts)

```
components/workflow/    # Visual builder, node types, sidebar, execution panel
lib/integrations/       # All external services for data & actions
lib/executionEngine.ts  # Workflow step execution
lib/scheduler.ts        # In-browser/workflow scheduling
types/workflow.ts       # Node & graph type definitions
app/                    # Next.js app pages & routes
public/                 # Static assets/icons
```
