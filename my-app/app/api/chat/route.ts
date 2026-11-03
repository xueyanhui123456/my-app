// app/api/chat/route.ts
import {
  streamText, convertToModelMessages, UIMessage, createUIMessageStreamResponse 
} from "ai";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// 初始化兼容 OpenAI 协议的 Provider（以 DeepSeek 为例）
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

     const result = await streamText({
      // 直接使用 free 路由，它会自动挑一个能用的免费文本模型
      model: openrouter('openrouter/free'), 
      messages: await convertToModelMessages(messages),
      // 免费模型有时候会抽风，可以加一点系统提示词让它别废话
      system: '你是一个乐于助人的 AI 助手。请简短、直接地回答用户。',
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
