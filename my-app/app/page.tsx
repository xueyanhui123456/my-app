import Link from "next/link";
import { prisma } from '@/lib/prisma'

export default async function Home() {
   const count = await prisma.user.count()
  console.log('当前用户总数:', count) // 输出在启动 Next.js 的终端里
  return (
    <div>
      <main>
        <h1>Home Page</h1>
        <Link href="/about">About 页面</Link>
        <Link href="/posts/1">Post 1</Link>
      </main>
    </div>
  );
}
