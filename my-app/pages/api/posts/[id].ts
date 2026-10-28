import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

// 预定义的api路由 > 动态api路由 > 捕获所有api的路由 （优先级）
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 从URL中获取动态参数id
  const id = String(req.query.id);

  switch (req.method) {
    // GET /api/posts/:id
    case "GET": {
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(200).json({ post });
    }

    // PUT /api/posts/:id
    case "PUT": {
      // 没有 Content-Type: application/json 时 req.body 是 null
      const { title, content } = req.body ?? {};

      if (typeof title !== "string" || typeof content !== "string") {
        return res.status(400).json({ error: "title and content are required" });
      }

      try {
        const post = await prisma.post.update({
          where: { id },
          data: { title, content },
        });
        return res.status(200).json({ post });
      } catch (error) {
        // P2025: 要更新的记录不存在
        if (error instanceof Error && "code" in error && error.code === "P2025") {
          return res.status(404).json({ error: "Post not found" });
        }
        throw error;
      }
    }

    // DELETE /api/posts/:id
    case "DELETE": {
      try {
        await prisma.post.delete({ where: { id } });
        return res.status(204).end(); // 成功但是无返回内容
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "P2025") {
          return res.status(404).json({ error: "Post not found" });
        }
        throw error;
      }
    }

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
