import Link from "next/link";

export default async function Home() {
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
