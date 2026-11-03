// app/api/chat/route.ts
import { createOpenAI } from "@ai-sdk/openai";
import {
  streamText,
  convertToModelMessages,
  UIMessage,
  createUIMessageStreamResponse,
} from "ai";

// 初始化兼容 OpenAI 协议的 Provider（以 DeepSeek 为例）
const customProvider = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || "https://api.deepseek.com/v1",
  apiKey: process.env.OPEN_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // 调用模型生成流
    const result = await streamText({
      model: customProvider("deepseek-chat"), // 如果你用 OpenAI 或其他，改这里
      messages: await convertToModelMessages(messages), // v7 必须把 UIMessage 转为 ModelMessage
    });

    // v7 的最新写法：返回流式响应
    // 注：如果你的 ai 包版本较低提示找不到，可以换回 return result.toUIMessageStreamResponse();
    return createUIMessageStreamResponse({
      stream: result.toUIMessageStream(),
    });
  } catch (error: unknown) {
    console.error("🔥 后端接口报错:", error); // 如果报错，终端会打印这句话
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
