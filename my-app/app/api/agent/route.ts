import {
  tool,
  streamText,
  convertToModelMessages,
  UIMessage,
  createUIMessageStreamResponse,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";

const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.OPEN_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const result = await streamText({
      model: deepseek.chat("deepseek-chat"),
      system:
        "你是一个贴心的天气穿搭助手。如果用户问天气，请务必调用getWeather工具获取真实数据，再给出建议。",
      messages: await convertToModelMessages(messages),
      tools: {
        // 查看天气
        getWeather: tool({
          description: "获取指定城市的实时天气和温度",
          // parameters 用来约束AI传过来的参数格式
          inputSchema: z.object({
            city: z.string().describe("城市名称，例如:西安"),
          }),
          // execute 是真正执行逻辑的地方（比如去调真实的气象 API）
          execute: async ({ city }) => {
            console.log(`AI决定查询城市 ${city}`);
            // 这里我们写死一个假数据，模拟API返回
            if (city.includes("西安")) {
              return {
                weather: "晴天",
                temperature: 14,
                suggestion: "穿厚外套",
              };
            }

            return {
              weather: "雨天",
              temperature: 10,
              suggestion: "穿羽绒服吧",
            };
          },
        }),

        // 搜索博客文章
        searchPost: tool({
          description: "在博客知识库中搜索相关的技术文章",
          inputSchema: z.object({
            keyword: z.string().describe("搜索关键词，例如：RAG,react,AI"),
          }),
          execute: async ({ keyword }) => {
            console.log(`📝 AI 决定搜索博客，关键词：${keyword}`);
            // 模拟查询数据库
            if (keyword.includes("RAG")) {
              return {
                results: [
                  "《从零手写 RAG：前端工程师的逆袭》",
                  "《pgvector 踩坑指南》",
                ],
              };
            }
            return { results: ["暂无相关文章"] };
          },
        }),

        // 发邮件，增加人类确认
        sendEmail: tool({
          description: "发送邮件给用户（这是一个危险操作，必须经过确认）",
          inputSchema: z.object({
            to: z.string().describe("收件人信箱"),
            subject: z.string().describe("邮件主题"),
            content: z.string().describe("邮件正文内容"),
          }),
          needsApproval: true,
          execute: async ({ to, subject, content }) => {
            console.log(
              `📧 真的发送邮件了！发给: ${to}，发送主题是${subject}，发送内容是${content}`,
            );
            return { success: true, message: "邮件发送成功" };
          },
        }),
      },
      // ==========================================
      // 🔥 核心 API 2：允许 AI 多步执行
      // ==========================================
      // 因为 AI 要先调用工具 -> 拿到结果 -> 再生成回答。这至少需要 2 步。
      // 如果不加这个，它调用完工具就直接结束了，不会回答你的问题。
      stopWhen: stepCountIs(5),
    });

    return createUIMessageStreamResponse({
      stream: result.toUIMessageStream(),
    });
  } catch (error: unknown) {
    console.error("🔥 Agent 报错:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
