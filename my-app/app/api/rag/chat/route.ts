import { createOpenAI } from "@ai-sdk/openai";
import {
  streamText,
  embed,
  convertToModelMessages,
  UIMessage,
  createUIMessageStreamResponse,
  createUIMessageStream,
} from "ai";
import { prisma } from "@/lib/prisma";
import { ca } from "zod/v4/locales";

// 1.硅基流动（用于把输入的问题变成向量）
const siliconflow = createOpenAI({
  baseURL: "https://api.siliconflow.cn/v1",
  apiKey: process.env.SILICONFLOW_API_KEY,
});

// 2.Deepseek （用于根据资料生成回答）
const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.OPEN_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // 获取用户的最新一句话
    const lastUserMessage = messages[messages.length - 1];
    const userText =
      lastUserMessage.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("") || "";

    if (!userText)
      return Response.json({ error: "用户输入不能为空" }, { status: 400 });

    // 3.把用户输入变成向量
    const { embedding: queryVector } = await embed({
      model: siliconflow.embedding("BAAI/bge-m3"),
      value: userText,
    });

    // 4.在数据库中查找最相似的文档切片
    const vectorStr = `[${queryVector.join(",")}]`;
    // 调用我们在Neon中写的match_documents函数，返回最相似的3条记录
    const matchedDocs = await prisma.$queryRaw<
      Array<{ content: string; similarity: number }>
    >`SELECT content, similarity FROM match_documents(${vectorStr}::vector, 0.5, 3)`;

    // 5.把这些文档切片拼接成一个长字符串
    const contextText = matchedDocs
      .map((doc, index) => `【片段${index + 1} \n${doc.content}】`)
      .join("\n\n");

    console.log("🔍 检索到的上下文:", contextText);

    // 6.把用户输入和检索到的上下文一起发送给Deepseek大模型，生成流式回答
    // 构造系统提示词，强制AI只能根据资料回答
    const systemPrompt = `你是一个只能知识库助手。请严格根据下面提供的【参考信息】来回答用户的问题。如果【参考信息】中找不到答案，请直接回答“抱歉，我的知识库中没找到相关信息”，绝对不要自己编造。
    【参考信息】：
        ${contextText || "暂无相关参考信息"}`;

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // 1》先把检索到的上下文（来源）发送给前端
        writer.write({
          type: "data-citations", //type 必须data-开头，前端才能捕获
          data: matchedDocs.map((d) => d.content),
        });
        // 2》 调用DeepSeek
        const result = streamText({
          model: deepseek.chat("deepseek-chat"),
          system: systemPrompt,
          messages: await convertToModelMessages(messages),
        });

        // 3》把大模型的文本流合并进去
        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
    
  } catch (error: unknown) {
    console.error("🔥 RAG 检索报错:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 },
    );
  }
}
