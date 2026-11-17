export const runtime = 'nodejs';
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, password, email } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "邮箱和密码是必填项" });
  }
  // 1.检查邮箱是否被注册过
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (existingEmail) {
    return res.status(400).json({ error: "该邮箱已被注册" });
  }

  // 2.密码加密（哈希），10代表加密强度
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3.存入数据库
  try {
    const user = await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
        email,
      },
    });

    res
      .status(201)
      .json({
        message: "用户注册成功",
        userId: user.id,
        email: user.email,
        name: user.name,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "注册失败" });
  }
}
