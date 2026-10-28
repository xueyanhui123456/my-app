import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. 创建一个用户
  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john.doe@example.com",
      password: "password123",
    },
  });
  // 2.查询所有用户
  const users = await prisma.user.findMany();
  // 3.返回响应
  res.status(200).json({ 刚刚创建的用户: user, 所有的用户: users });
}
