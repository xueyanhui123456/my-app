// RESTful API 设计风格
// 针对整体集合,没有id的,查列表,新增

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    // GET /api/posts
    case "GET": {
      // 固定排序，否则更新后列表顺序会变，看起来像“没更新对”
      const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json({ posts });
    }

    // POST /api/posts
    case "POST": {
      // 1. 获取当前登录的用户 Session
      const session: { user: { id: string } } | null = await getServerSession(
        req,
        res,
        authOptions,
      );
      // 👇 加上这行，看看终端输出了什么
      console.log("当前登录用户id:", session?.user?.id);
      // 2. 如果没登录，直接拒绝（401 未授权）
      if (!session || !session.user) {
        return res.status(401).json({ error: "请先登录后再发布文章" });
      }

      const { title, content } = req.body ?? {};

      try {
        const post = await prisma.post.create({
          data: {
            title,
            content,
            author: { connect: { id: session.user.id } },
          },
        });
        return res.status(201).json({ post });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "创建文章失败" });
      }
    }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
