import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { prisma } from "@/lib/prisma";

// 1. 初始化硅基流动的 Provider（用于把文本变成向量）
const siliconflow = createOpenAI({
  baseURL: "https://api.siliconflow.cn/v1",
  apiKey: process.env.SILICONFLOW_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return Response.json({ error: "文本不能为空" }, { status: 400 });

    // 2.简单的文本切片
    const chunkSize = 200; // 每个切片的最大长度
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    // 3.批量生成向量（注意：bge-m3的维度是1024，与建表保持一致）
    const { embeddings } = await embedMany({
      model: siliconflow.embedding("BAAI/bge-m3"), // 选择大模型
      values: chunks,
    });

    // 4.将向量存入数据库
    // Prisma 还没原生支持vector,所以我们要用原生SQL 批量插入
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vectorStr = `[${embeddings[i].join(",")}]`; // 转成字符串
      await prisma.$executeRaw`INSERT INTO "DocumentChunk" ("id", "content", "embedding") 
        VALUES (gen_random_uuid(), ${chunk}, ${vectorStr}::vector)`;
    }

    return Response.json({ success: true, message: "文本切片和向量存储成功", count: chunks.length });
  } catch (error: unknown) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
