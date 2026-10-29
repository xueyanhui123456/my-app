import React from "react";
import type { FormProps } from "antd";
import { Button, Checkbox, Form, Input, message } from "antd";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";

type FieldType = {
  name?: string;
  password?: string;
  remember?: string;
  email: string;
};

const Login: React.FC = () => {
  const router = useRouter();

  const onFinish: FormProps<FieldType>["onFinish"] = async (values: FieldType) => {
    // 调用 NextAuth 引擎
    const result = await signIn("credentials", {
      redirect: false, // 阻止默认的页面跳转，方便我们自定义错误提示
      email: values.email,
      password: values.password,
    });
    if (result?.error) {
      message.error(result.error); // 显示错误提示
    } else {
      message.success("登录成功！");

      router.push("/posts"); // 登录成功跳回首页
    }
  };

  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
    errorInfo,
  ) => {
    console.log("Failed:", errorInfo);
  };
  return (
    <Form
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600, background: "#f0f2f5", padding: "20px 100px 20px 0", borderRadius: "8px" }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <h1>登录页面</h1>
      </Form.Item>
      <Form.Item<FieldType>
        label="名称"
        name="name"
        rules={[{ required: false, message: "Please input your name!" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item<FieldType>
        label="邮箱"
        name="email"
        rules={[{ required: true, message: "Please input your email!" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item<FieldType>
        label="密码"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item<FieldType>
        name="remember"
        valuePropName="checked"
        label={null}
      >
        <Checkbox>记住密码</Checkbox>
      </Form.Item>

      <Form.Item label={null}>
        <Button type="primary" htmlType="submit">
          登录
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Login;
