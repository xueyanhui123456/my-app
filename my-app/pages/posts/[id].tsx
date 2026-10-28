import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function Post() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState({title: '', content: '', authorId: ''});

  useEffect(() => {
    if (id) {
      fetch(`/api/posts/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setPost(data.post);
        })
        .catch((error) => {
          console.error("Error fetching post:", error);
        });
    }
  }, [id]);
  return (
    <div>
      <h1>Post--- {post.title}--- 详情页面</h1>
      <p>Post--- {post.content}--- page</p>
    </div>
  );
}
export default Post;
