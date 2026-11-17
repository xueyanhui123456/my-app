# create-next-app

[简体中文] | [English](./README.en.md)

一个用于系统学习 **Next.js 全栈开发** 的实践项目，以后端视角梳理项目全貌。项目同时使用 App Router 与 Pages Router，覆盖路由、API 设计、Prisma + PostgreSQL(Neon) 数据访问、NextAuth 认证，以及基于 Vercel AI SDK 的流式对话、结构化输出、工具调用 Agent 与 pgvector 向量检索（RAG）。

## 技术栈

| 分类 | 选型 |
| --- | --- |
| 框架 | Next.js 16.4（App Router + Pages Router）、React 19、TypeScript 5 |
| UI | Ant Design 6、Tailwind CSS 4 |
| 数据层 | Prisma 7（driver adapter 模式）、PostgreSQL / Neon Serverless、pgvector |
| 认证 | NextAuth 4（Credentials Provider + JWT Session）、bcryptjs |
| AI | Vercel AI SDK 7（`streamText` / `generateObject` / `embedMany` / `embed`） |
| 模型 / 服务 | DeepSeek（对话、Agent）、OpenRouter（免费模型）、硅基流动 BAAI/bge-m3（1024 维向量） |
| 其他 | Zod 4（工具与结构化输出 Schema）、Nodemailer（163 SMTP） |

## 目录结构

```text
create-next-app/
├── README.md / README.en.md
└── my-app/
    ├── app/                          # App Router
    │   ├── api/
    │   │   ├── agent/route.ts        # Agent：工具调用 + 人工确认 + 流式输出
    │   │   ├── analyze/route.ts      # 结构化输出：Zod Schema -> JSON
    │   │   ├── chat/route.ts         # 基础流式对话
    │   │   └── rag/
    │   │       ├── chat/route.ts     # 向量检索 + citations + 流式回答
    │   │       └── ingest/route.ts   # 文本切片 -> 向量化 -> 入库
    │   ├── layout.tsx / page.tsx
    │   └── globals.css
    ├── pages/                        # Pages Router
    │   ├── api/
    │   │   ├── auth/[...nextauth].ts # NextAuth 凭证登录
    │   │   ├── posts/index.ts        # GET 列表 / POST 新建（需登录）
    │   │   ├── posts/[id].ts         # GET / PUT / DELETE 单篇
    │   │   └── register.ts           # 注册（bcrypt 哈希）
    │   ├── login.tsx / register.tsx
    │   ├── posts/index.tsx / posts/[id].tsx
    │   ├── agent.tsx / analyze/index.tsx / chat/index.tsx
    │   ├── about.tsx
    │   └── _app.tsx                  # SessionProvider 注入
    ├── lib/prisma.ts                 # PrismaClient + Neon adapter 单例
    ├── prisma/
    │   ├── schema.prisma             # User / Post / DocumentChunk
    │   └── migrations/               # init、add_vector_table
    ├── prisma7.config.ts             # CLI 配置：直连 URL + 影子库 pgvector
    └── next.config.ts
```

## 快速开始

```bash
cd my-app
npm install
```

### 1. 配置环境变量

复制 `my-app/.env.example` 为 `my-app/.env`，再填写下列变量（键名与代码一致）：

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | 运行时数据库连接串，Neon 池化连接，供 `PrismaNeon` adapter 使用 |
| `DATABASE_URL_UNPOOLED` | CLI 迁移用直连连接串，`prisma7.config.ts` 读取 |
| `NEXTAUTH_SECRET` | NextAuth 会话签名密钥 |
| `OPEN_AI_API_KEY` | DeepSeek API Key（Agent、RAG 生成） |
| `OPENROUTER_API_KEY` | OpenRouter API Key（`/api/chat`、`/api/analyze`） |
| `SILICONFLOW_API_KEY` | 硅基流动 API Key（bge-m3 向量化） |
| `EMAIL_USER` / `EMAIL_PASS` | 163 邮箱账号与 SMTP 授权码（Agent 发信工具） |

> `OPENAI_BASE_URL`、`SHADOW_DATABASE_URL` 在示例 .env 中出现，但当前代码未使用。

### 2. 初始化数据库

在 Neon 控制台的 SQL Editor 中启用扩展，然后执行迁移：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

```bash
npx prisma migrate dev        # 本地开发：应用迁移
npx prisma migrate deploy     # 部署：仅应用已有迁移
npx prisma generate           # 生成 lib/generated/prisma 客户端
```

Prisma 7 采用 driver adapter，`.env` 需同时提供池化与直连两个连接串；`prisma7.config.ts` 通过 `initShadowDb` 在影子库中预装 pgvector。

### 3. 创建向量检索函数

迁移脚本只建了 `DocumentChunk` 表，`match_documents` 需在 Neon 中手动创建（`/api/rag/chat` 依赖它）：

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

### 4. 启动

```bash
npm run dev
```

打开 <http://localhost:3000>。首次使用请先访问 `/register` 注册账号，再前往 `/login` 登录。

## 可用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器（基于 Turbopack） |
| `npm run build` | `prisma generate` + 生产构建 |
| `npm run start` | 以生产模式启动 |
| `npm run lint` | ESLint 检查 |

## 页面与接口

### 页面

| 路径 | 说明 |
| --- | --- |
| `/` | App Router 首页，演示 `next/link` 跳转 |
| `/about` | Pages Router 示例页 |
| `/register`、`/login` | 注册与登录（Ant Design 表单 + NextAuth） |
| `/posts` | 文章列表，Ant Design Table + Modal 完成增删改查 |
| `/posts/[id]` | 文章详情 |
| `/chat` | RAG 知识库对话，展示检索到的引用片段 |
| `/agent` | Agent 工具调用测试台，支持工具审批交互 |
| `/analyze` | 文本情感 / 标签分析，结果按结构化 JSON 渲染 |

### API

| 方法与路径 | 说明 |
| --- | --- |
| `POST /api/chat` | OpenRouter 免费模型流式对话 |
| `POST /api/analyze` | `generateObject` + Zod，返回 `{ sentiment, score, tags, replay }` |
| `POST /api/agent` | DeepSeek + 三个工具：`getWeather`、`searchPost`、`sendEmail`；`stopWhen: stepCountIs(5)` 支持多步执行 |
| `POST /api/rag/ingest` | 按 200 字切片 -> `embedMany` 生成 1024 维向量 -> 原生 SQL 写入 `DocumentChunk` |
| `POST /api/rag/chat` | 问题向量化 -> `match_documents` 取 Top 3 -> 先推送 `data-citations`，再由 DeepSeek 基于资料流式作答 |
| `POST /api/register` | 邮箱查重 + bcrypt 哈希 + 创建用户 |
| `GET /api/posts` | 按创建时间倒序返回全部文章 |
| `POST /api/posts` | 需登录（NextAuth Session），关联当前用户写入 |
| `GET/PUT/DELETE /api/posts/[id]` | 单篇查询、更新、删除，处理 `P2025` 记录不存在 |
| `/api/auth/[...nextauth]` | NextAuth 凭证登录，JWT 策略，自定义登录页 `/login` |

## 核心实现说明

- **双路由并存**：`app/` 承担 AI 相关接口（Route Handlers），`pages/` 承担认证与 CRUD（API Routes），用于对比两代路由写法差异。
- **Prisma 单例**：`lib/prisma.ts` 通过 `globalThis` 缓存客户端，避免开发环境热更新重复建连；适配器选用 `@prisma/adapter-neon`，因此在 Node 运行时需注入 `ws` 作为 WebSocket 实现。
- **认证链路**：注册时用 bcrypt 哈希密码；`jwt` 回调把用户 id 写入 token，`session` 回调再回填到 `session.user.id`，供 `/api/posts` 关联作者。
- **Agent 多步执行**：每个工具用 `zod` 描述入参，`needsApproval: true` 的邮件工具必须由前端确认后才会真正执行；前端通过 `lastAssistantMessageIsCompleteWithApprovalResponses` 自动续跑。
- **RAG 流程**：入库与查询共用 bge-m3 的 1024 维向量，与 `Unsupported("vector(1024)")` 字段及 `match_documents` 签名保持一致；引用片段以 `data-citations` 自定义数据块下发给前端。
- **注意**：`getWeather`、`searchPost` 当前返回硬编码模拟数据，接入真实服务时需替换。

## 参与贡献

1. Fork 本仓库
2. 新建 Feat_xxx 分支
3. 提交代码
4. 新建 Pull Request

## 许可证

[Apache License 2.0](./LICENSE)
