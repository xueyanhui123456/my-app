import { Table, Button, Modal, Form, Input, Space } from "antd";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type Post = { id: string; title: string; content: string };

// 放到组件外：只负责请求，不碰 state。
// 这样在 effect 里调用它不会被 react-hooks/set-state-in-effect 判为“同步 setState”
async function fetchPosts(): Promise<Post[]> {
  const res = await fetch("/api/posts");
  if (!res.ok) throw new Error(`加载失败: ${res.status}`);
  const data = await res.json();
  return data.posts ?? [];
}

export default function PostsList() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isAdd, setIsAdd] = useState(true);
  const [currentPost, setCurrentPost] = useState<Post>({
    id: "",
    title: "",
    content: "",
  });

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Content", dataIndex: "content", key: "content" },
    {
      title: "操作",
      dataIndex: "action",
      key: "action",
      render: (_: unknown, record: Post) => (
        <Space>
          <Button type="link" onClick={() => handleUpdate(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
          <Button
            type="link"
            onClick={() => router.push(`/posts/${record.id}`)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  const handleGetPosts = async () => {
    setPosts(await fetchPosts());
  };

  useEffect(() => {
    let cancelled = false;
    // setState 放在 then 回调里（异步），effect 体本身不直接 setState
    fetchPosts().then(
      (list) => {
        if (!cancelled) setPosts(list);
      },
      (err) => console.error(err),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Modal 内容在首次打开时才挂载，此时 form 还没连接，
  // 所以要等挂载完成（effect 里）再回填，不能直接调 setFieldsValue
  useEffect(() => {
    if (!isModalOpen) return;
    form.setFieldsValue({
      title: isAdd ? "" : currentPost.title,
      content: isAdd ? "" : currentPost.content,
    });
  }, [isModalOpen, isAdd, currentPost, form]);

  const handleUpdate = (post: Post) => {
    setIsAdd(false);
    // 直接用入参，不能用 currentPost（setState 还没生效）
    setCurrentPost(post);
    handleOpenModal();
  };

  const handleUpdatePost = async (values: {
    title: string;
    content: string;
  }) => {
    if (!currentPost.id) return;

    const res = await fetch(`/api/posts/${currentPost.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      // 只提交要改的字段，authorId 不动
      body: JSON.stringify({ title: values.title, content: values.content }),
    });

    if (!res.ok) {
      console.error("更新失败:", res.status, await res.text());
      return;
    }

    await handleGetPosts();
    handleCloseModal();
    form.resetFields();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    // 204 没有响应体，不能调 res.json()
    if (!res.ok) {
      console.error("删除失败:", res.status);
      return;
    }
    await handleGetPosts();
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleAdd = () => {
    setIsAdd(true);
    handleOpenModal();
  };

  const handleAddPost = async (values: { title: string; content: string }) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      console.error("新增失败:", res.status, await res.text());
      return;
    }

    await handleGetPosts();
    handleCloseModal();
    form.resetFields();
  };

  return (
    <div>
      <h1>Posts List</h1>
      <Button type="primary" onClick={handleAdd}>
        新增
      </Button>
      <Table dataSource={posts} columns={columns} rowKey="id" />

      <Modal
        title={isAdd ? "新增文章" : "编辑文章"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form form={form} onFinish={isAdd ? handleAddPost : handleUpdatePost}>
          <Form.Item
            label="博客标题"
            name="title"
            rules={[{ required: true, message: "Please input the title!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="博客内容"
            name="content"
            rules={[{ required: true, message: "Please input the content!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
