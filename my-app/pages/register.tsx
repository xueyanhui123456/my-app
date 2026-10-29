import { Button, Col, Form, Input, Row } from "antd";
import { useRouter } from "next/router";

export default function Register() {
  const router = useRouter();
  const [form] = Form.useForm();

  const handleRegister = async (values: {
    name: string;
    email: string;
    password: string;
  }) => {
    fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    }).then((res) => {
      if (res.ok) {
        router.push("/login");
      } else {
        res.json().then((data) => {
          alert(data.error || "注册失败");
        });
      }
    });
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
      <Col
        span={10}
        style={{ background: "#f5f5f5", padding: "24px", borderRadius: "8px" }}
      >
        <Form
          name="register"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          form={form}
          onFinish={handleRegister}
        >
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <h1>注册页面</h1>
          </Form.Item>
          <Form.Item
            label="用户名"
            name="name"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              注册
            </Button>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  );
}
