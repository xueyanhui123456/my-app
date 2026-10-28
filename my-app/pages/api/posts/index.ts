// RESTful API 设计风格
// 针对整体集合,没有id的,查列表,新增

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    // GET /api/posts
    case "GET": {
      // 固定排序，否则更新后列表顺序会变，看起来像“没更新对”
      const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
      return res.status(200).json({ posts });
    }

    // POST /api/posts
    case "POST": {
      const { title, content, authorId } = req.body ?? {};

      if (
        typeof title !== "string" ||
        typeof content !== "string" ||
        typeof authorId !== "string"
      ) {
        return res
          .status(400)
          .json({ error: "title, content and authorId are required" });
      }

      const post = await prisma.post.create({
        data: { title, content, authorId },
      });
      return res.status(201).json({ post });
    }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
