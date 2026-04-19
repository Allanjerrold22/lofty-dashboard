# Lofty AI Dashboard

A redesigned, minimalist real-estate CRM dashboard with a Morning Briefing AI hero and a slide-over voice + chat assistant powered by **ElevenLabs Conversational AI**.

Built with Next.js 16 (App Router), React 19, Tailwind v4, Recharts, and `@elevenlabs/react`.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

Create `.env.local` in the project root:

```bash
# ElevenLabs (server-only, used by /api/elevenlabs/signed-url)
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_AGENT_ID=agent_...

# InsForge database
INSFORGE_BASE_URL=https://...insforge.app
INSFORGE_ANON_KEY=...
INSFORGE_API_KEY=ik_...

# Google OAuth (used by /calendar and /aos for Gmail send)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# Anthropic Claude (used by /aos)
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-sonnet-4-5
```

> Without these, the Assistant panel still opens — you'll see a friendly "offline preview" notice and the dashboard remains fully usable.

## Set up Google Calendar (for the `/calendar` page)

1. Go to <https://console.cloud.google.com/apis/credentials> and create a project (or use an existing one).
2. Enable **Google Calendar API** under *APIs & Services → Library*.
3. Configure the **OAuth consent screen** (External, Testing mode is fine for development). Add yourself as a Test user.
4. Create credentials → **OAuth client ID** → *Web application*.
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/google/callback`
5. Copy the client ID + secret into `.env.local` and restart `npm run dev`.
6. Navigate to **Calendar** in the sidebar and click **Connect Google Calendar** — you'll be redirected to Google, approve scopes, and your real events will populate the week grid.

The OAuth flow stores only an HTTP-only refresh-token cookie on this device; revoke any time from the Calendar header (the small `×` next to your email) or from your Google account permissions page.

> Note: the `/aos` page also needs **gmail.send** + **gmail.readonly** scopes. They were added to the OAuth scope list, so if you connected Google before this update, click `×` to disconnect and reconnect once to grant the new scopes.

## AOS — Agentic AI OS (`/aos`)

A Claude-powered chat surface that can read your CRM, send Gmail follow-ups, and book Google Calendar appointments based on a parsed reply.

1. Drop your key into `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
2. Make sure Google is connected with the new Gmail scope (see the note above).
3. Open `/aos` from the sidebar — note the sidebar collapses to icon-only on this page so the chat gets the full canvas.
4. Try the flow:
   - "Show me the leads for today" → the agent calls `list_leads_today` and renders lead cards in chat.
   - Click **Follow up** on a card → the agent drafts an email; review and click **Send via Gmail**.
   - Click **Simulate inbound email reply** → paste a reply like *"Sounds great, can we do Tue 2pm?"* → the agent extracts the time and proposes a calendar event; click **Confirm & add** to push it to Google Calendar (and mirror into the Lofty appointments store).

Streaming text shimmers in a `#3240FF → #FFFFFF → #6089FF` linear gradient while tokens arrive, then resolves to dark gray. Tool calls are visualized as a vertical thinking timeline with running/done states.

## Set up the ElevenLabs agent

1. Go to <https://elevenlabs.io/app/conversational-ai>, create a new **Conversational AI agent**, copy the agent ID.
2. Configure the agent:
   - **Name:** Lofty Assistant
   - **Voice:** any natural voice (Rachel, Sarah, etc.)
   - **First message:** `Hi James, I've already pulled together your morning briefing — want me to walk you through it?`
   - **System prompt** (paste in):

     > You are Lofty, the AI co-pilot for a real estate agent named James. You see his live CRM dashboard. Be brief, warm, and decisive.
     >
     > You have these client tools available — call them rather than guessing:
     > - `get_dashboard_stats` — current KPIs
     > - `list_today` — today's tasks / appointments / leads
     > - `summarize_lead` — look up a lead by name
     > - `navigate_to` — scroll James to a section (`pipeline`, `tasks`, `appointments`, `leads`, `transactions`)
     > - `create_task` — propose a new task (James will approve before it's added)
     > - `complete_task` — mark a task done (requires approval)
     > - `draft_message` — draft an SMS or email (requires approval before send)
     > - `schedule_appointment` — propose an appointment (requires approval)
     > - `update_lead_priority` — change a lead's priority (requires approval)
     >
     > Always tell James what you're about to do before doing it. If a tool requires approval, say "I'll prepare it — review and approve when you're ready."
3. Under **Tools → Client Tools**, register each tool above with the same name and a short description. Parameter shapes are inferred at call time from the JSON the agent sends.
4. Copy the **API key** from your ElevenLabs profile → settings, paste both values into `.env.local`, and restart `npm run dev`.

## What's in the box

### Morning Briefing AI hero
- Streams in highlights with a shimmer reveal animation.
- **Listen** opens the voice panel and pre-seeds the agent's first message with the briefing script.
- **Action chips** (e.g. "Send escrow reminder") open the chat panel and send that intent to the agent.

### KPI strip + charts
- **KpiStrip** — New Leads, Active Pipeline, GCI MTD, Tasks Done with sparklines.
- **PipelineFunnelChart** — five-stage funnel with drop-off conversion %.
- **LeadSourceChart** — donut showing where leads come from.
- **WeeklyActivityChart** — stacked bars (calls / texts / emails) per weekday.

### Today grid
- TasksCard, AppointmentsCard, NewLeadsCard, TransactionsCard — restyled in the new neutral palette and bound to a live in-memory store, so AI-driven changes appear immediately.

### Voice + chat assistant
- Black orb in the navbar (`Ask Lofty`) opens a 420px slide-over.
- **Chat tab** — typing UI with shimmer "thinking" placeholder, suggestion chips, and a simulated reply if no API key is configured.
- **Voice tab** — big aurora orb with a pulse ring while the agent speaks; mic mute toggle; "End call" button.
- All side-effecting actions (create task, send message, schedule appointment, etc.) trigger the **ConfirmActionDialog** so James reviews + edits the parameters before anything happens.

## Project structure (added/changed)

```
src/
  app/
    api/
      briefing/route.ts            # mocked morning briefing payload
      elevenlabs/signed-url/route.ts  # mints signed URL server-side
    layout.tsx                     # mounts AssistantProvider + panel + dialog
    page.tsx                       # new 4-zone dashboard layout
    globals.css                    # tokens, btn-primary, shimmer/aurora keyframes
  components/
    Navbar.tsx                     # restyled, with AssistantOrb on the right
    DashboardHeader.tsx
    MorningBriefingHero.tsx
    KpiStrip.tsx
    PipelineFunnelChart.tsx
    LeadSourceChart.tsx
    WeeklyActivityChart.tsx
    TasksCard.tsx
    AppointmentsCard.tsx
    NewLeadsCard.tsx
    TransactionsCard.tsx
    assistant/
      AssistantProvider.tsx        # ElevenLabs ConversationProvider + tools
      AssistantOrb.tsx
      AssistantPanel.tsx
      AssistantMessage.tsx
      ConfirmActionDialog.tsx
      ToastStack.tsx
  lib/
    store.ts                       # useSyncExternalStore CRM mock
    permission-bus.ts              # request/approve/cancel pending actions
    assistant-tools.ts             # client tools registered with the agent
    assistant-ui.ts                # panel open/tab state
    use-assistant.ts               # wraps useConversation, exposes sendText/startVoice
```

## Out of scope

- Real CRM persistence — state is in-memory and resets on refresh.
- Auth / user accounts.
- The agent's knowledge base / RAG content (configure in the ElevenLabs dashboard).
