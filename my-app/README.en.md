# create-next-app (my-app)

[简体中文](./README.md) | [English]

A hands-on project for learning **full-stack Next.js** from a backend-minded perspective. It uses both the App Router and the Pages Router, and covers routing, API design, data access with Prisma + PostgreSQL (Neon), NextAuth authentication, plus Vercel AI SDK features: streaming chat, structured output, a tool-calling agent, and pgvector retrieval (RAG).

## Tech Stack

| Area | Choices |
| --- | --- |
| Framework | Next.js 16.4 (App Router + Pages Router), React 19, TypeScript 5 |
| UI | Ant Design 6, Tailwind CSS 4 |
| Data | Prisma 7 (driver adapters), PostgreSQL / Neon Serverless, pgvector |
| Auth | NextAuth 4 (Credentials Provider + JWT session), bcryptjs |
| AI | Vercel AI SDK 7 (`streamText` / `generateObject` / `embedMany` / `embed`) |
| Models / Services | DeepSeek (chat, agent), OpenRouter (free models), SiliconFlow BAAI/bge-m3 (1024-dim embeddings) |
| Misc | Zod 4 (tool and output schemas), Nodemailer (163 SMTP) |

## Project Layout

```text
my-app/
├── app/                          # App Router
│   ├── api/
│   │   ├── agent/route.ts        # Agent: tool calls + human approval + streaming
│   │   ├── analyze/route.ts      # Structured output: Zod schema -> JSON
│   │   ├── chat/route.ts         # Basic streaming chat
│   │   └── rag/
│   │       ├── chat/route.ts     # Vector search + citations + streaming answer
│   │       └── ingest/route.ts   # Chunk -> embed -> store
│   ├── layout.tsx / page.tsx
│   └── globals.css
├── pages/                        # Pages Router
│   ├── api/
│   │   ├── auth/[...nextauth].ts # NextAuth credentials login
│   │   ├── posts/index.ts        # GET list / POST create (auth required)
│   │   ├── posts/[id].ts         # GET / PUT / DELETE one post
│   │   └── register.ts           # Registration (bcrypt hashing)
│   ├── login.tsx / register.tsx
│   ├── posts/index.tsx / posts/[id].tsx
│   ├── agent.tsx / analyze/index.tsx / chat/index.tsx
│   ├── about.tsx
│   └── _app.tsx                  # Injects SessionProvider
├── lib/prisma.ts                 # PrismaClient + Neon adapter singleton
├── prisma/
│   ├── schema.prisma             # User / Post / DocumentChunk
│   └── migrations/               # init, add_vector_table
├── prisma7.config.ts             # CLI config: direct URL + pgvector in shadow DB
└── next.config.ts
```

## Getting Started

```bash
npm install
```

### 1. Environment Variables

Copy `.env.example` to `.env`, then fill in the following keys (names match the code):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Runtime connection string, Neon pooled, used by the `PrismaNeon` adapter |
| `DATABASE_URL_UNPOOLED` | Direct connection string for CLI migrations, read by `prisma7.config.ts` |
| `NEXTAUTH_SECRET` | NextAuth session signing secret |
| `OPEN_AI_API_KEY` | DeepSeek API key (agent, RAG generation) |
| `OPENROUTER_API_KEY` | OpenRouter API key (`/api/chat`, `/api/analyze`) |
| `SILICONFLOW_API_KEY` | SiliconFlow API key (bge-m3 embeddings) |
| `EMAIL_USER` / `EMAIL_PASS` | 163 mailbox account and SMTP password (agent email tool) |

> `OPENAI_BASE_URL` and `SHADOW_DATABASE_URL` appear in the sample .env but are not used by the current code.

### 2. Set Up the Database

Enable the extension in the Neon SQL Editor, then run the migrations:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

```bash
npx prisma migrate dev        # Local development: apply migrations
npx prisma migrate deploy     # Deployment: apply existing migrations only
npx prisma generate           # Generate the client into lib/generated/prisma
```

Prisma 7 uses driver adapters, so `.env` needs both the pooled and direct connection strings; `prisma7.config.ts` preinstalls pgvector in the shadow database via `initShadowDb`.

### 3. Create the Vector Search Function

The migration only creates the `DocumentChunk` table. `match_documents` must be created manually in Neon (`/api/rag/chat` depends on it):

```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1024),
  match_threshold float,
  match_count int
)
RETURNS TABLE (content text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT "content", 1 - ("embedding" <=> query_embedding) AS similarity
  FROM "DocumentChunk"
  WHERE 1 - ("embedding" <=> query_embedding) > match_threshold
  ORDER BY "embedding" <=> query_embedding
  LIMIT match_count;
$$;
```

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>. On first use, register at `/register` and then sign in at `/login`.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start in production mode |
| `npm run lint` | Run ESLint |

## Pages and APIs

### Pages

| Path | Description |
| --- | --- |
| `/` | App Router home, demonstrates `next/link` navigation |
| `/about` | Pages Router example page |
| `/register`, `/login` | Registration and sign-in (Ant Design forms + NextAuth) |
| `/posts` | Post list with create, edit and delete via Ant Design Table + Modal |
| `/posts/[id]` | Post detail |
| `/chat` | RAG chat over the knowledge base, shows retrieved citations |
| `/agent` | Agent tool-calling sandbox with approval interactions |
| `/analyze` | Sentiment / tag analysis rendered from structured JSON |

### APIs

| Method and path | Description |
| --- | --- |
| `POST /api/chat` | Streaming chat with an OpenRouter free model |
| `POST /api/analyze` | `generateObject` + Zod, returns `{ sentiment, score, tags, replay }` |
| `POST /api/agent` | DeepSeek with three tools: `getWeather`, `searchPost`, `sendEmail`; `stopWhen: stepCountIs(5)` enables multi-step runs |
| `POST /api/rag/ingest` | Split text into 200-character chunks -> `embedMany` (1024 dims) -> raw SQL insert into `DocumentChunk` |
| `POST /api/rag/chat` | Embed the question -> `match_documents` top 3 -> emit `data-citations` -> streaming answer from DeepSeek grounded in the context |
| `POST /api/register` | Email duplication check + bcrypt hash + create user |
| `GET /api/posts` | All posts, newest first |
| `POST /api/posts` | Requires a NextAuth session; links the post to the current user |
| `GET/PUT/DELETE /api/posts/[id]` | Fetch, update or delete a single post; handles `P2025` when the record is missing |
| `/api/auth/[...nextauth]` | NextAuth credentials login, JWT strategy, custom sign-in page `/login` |

## Implementation Notes

- **Two routers side by side**: `app/` holds the AI endpoints (Route Handlers) while `pages/` holds auth and CRUD (API Routes), making the differences between the two generations easy to compare.
- **Prisma singleton**: `lib/prisma.ts` caches the client on `globalThis` so hot reload does not open new connections; because it uses `@prisma/adapter-neon`, the Node runtime needs `ws` injected as the WebSocket implementation.
- **Auth flow**: passwords are bcrypt-hashed on registration; the `jwt` callback stores the user id in the token and the `session` callback copies it to `session.user.id`, which `/api/posts` uses as the author.
- **Multi-step agent**: every tool describes its input with `zod`; the email tool sets `needsApproval: true` and only runs after the client approves. The client resumes automatically via `lastAssistantMessageIsCompleteWithApprovalResponses`.
- **RAG flow**: ingest and query share the 1024-dim bge-m3 vectors, matching the `Unsupported("vector(1024)")` field and the `match_documents` signature; citations are sent to the client as a custom `data-citations` part.
- **Caveats**: `getWeather` and `searchPost` return hard-coded mock data; replace them when wiring real services.

## Contributing

1. Fork the repository
2. Create a Feat_xxx branch
3. Commit your changes
4. Open a Pull Request

## License

[Apache License 2.0](../LICENSE)
