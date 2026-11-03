import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const customProvider = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || "https://api.deepseek.com/v1",
  apiKey: process.env.OPEN_AI_API_KEY,
});

export async function POST(req: Request) {
  const { text } = await req.json();

  // 定义期望的JSON结构

  const schema = z.object({
    sentiment: z
      .enum(["positive", "negative", "neutral"])
      .describe("情感分析结果"),
    score: z.number().min(0).max(5).describe("情感分数，范围0-5"),
    tags: z.array(z.string()).describe("相关标签"),
    replay: z.string().describe("回复内容"),
  });

  try {
    const result = await generateObject({
      model: customProvider("deepseek-chat"),
      schema,
      prompt: `请分析以下内容：${text}`,
    });
    return Response.json(result.object);
  } catch (error: unknown) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
