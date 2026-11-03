import { generateObject } from "ai";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
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
      model: openrouter("openrouter/free"), // 零配置，无需API Key
      schema,
      prompt: `请分析以下内容：${text}`,
      // 可选：加个 system prompt 让模型更听话
      system: "你是一个专业的数据提取助手，请严格按 JSON 格式返回数据。",
    });
    // const result = await generateObject({
    //   model: customProvider("deepseek-chat"),
    //   schema,
    //   prompt: `提取标签时，必须控制在两个字以内。回复话术要像淘宝客服一样亲切。请分析以下内容：${text}`,
    // });

    return Response.json(result.object);
  } catch (error: unknown) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
