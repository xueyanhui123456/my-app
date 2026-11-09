"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import {
  Input,
  Button,
  Card,
  Avatar,
  Space,
  Typography,
  Spin,
  Flex,
  Tag,
  Alert,
} from "antd";
import {
  UserOutlined,
  RobotOutlined,
  SendOutlined,
  StopOutlined,
  ToolOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { TextArea } = Input;

export default function AgentPage() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 这里的 api 路径指向我们刚刚写的 Agent 接口
  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent" }),
  });

  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";
  const isBusy = isSubmitted || isStreaming;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <Flex
      vertical
      style={{
        height: "100vh",
        maxWidth: 900,
        margin: "0 auto",
        padding: 20,
        background: "#f5f5f5",
      }}
    >
      <Typography.Title
        level={3}
        style={{ textAlign: "center", marginBottom: 20 }}
      >
        🤖 Agent 工具调用测试台
      </Typography.Title>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 10px",
          marginBottom: 20,
        }}
      >
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                }}
              >
                <Space
                  align="start"
                  style={{
                    flexDirection: isUser ? "row-reverse" : "row",
                    maxWidth: "85%",
                  }}
                >
                  <Avatar
                    icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: isUser ? "#1677ff" : "#52c41a",
                      flexShrink: 0,
                    }}
                  />

                  <Card
                    size="small"
                    style={{
                      backgroundColor: isUser ? "#e6f4ff" : "#fff",
                      borderRadius: 12,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                    }}
                    styles={{ body: { padding: "12px 16px" } }}
                  >
                    {message.parts.map((part, idx) => {
                      // 1. 渲染普通文本
                      if (part.type === "text") {
                        return (
                          <Text
                            key={idx}
                            style={{
                              whiteSpace: "pre-wrap",
                              fontSize: 15,
                              display: "block",
                              marginTop: 8,
                            }}
                          >
                            {part.text}
                          </Text>
                        );
                      }

                      // 2. 渲染 Agent 的工具调用过程（匹配以 'tool-' 开头的类型）
                      if (part.type.startsWith("tool-")) {
                        const toolName = part.type.replace("tool-", "");
                        // 截图中显示状态叫 'output-available'，代表执行完成
                        const isDone =
                          (part as any).state === "output-available";

                        return (
                          <div
                            key={idx}
                            style={{
                              margin: "12px 0",
                              padding: "12px",
                              background: "#fffbe6",
                              border: "1px solid #ffe58f",
                              borderRadius: 8,
                            }}
                          >
                            <div style={{ marginBottom: 8 }}>
                              <Tag color="orange">
                                {isDone
                                  ? `✅ 工具 ${toolName} 执行完毕`
                                  : `⏳ 正在调用工具: ${toolName}`}
                              </Tag>
                            </div>

                            {/* 截图里入参叫 input */}
                            <div
                              style={{
                                fontSize: 13,
                                color: "#595959",
                                fontFamily: "monospace",
                              }}
                            >
                              <strong>📥 输入参数：</strong>{" "}
                              {JSON.stringify((part as any).input)}
                            </div>

                            {/* 截图里结果叫 output */}
                            {isDone && (
                              <div
                                style={{
                                  marginTop: 8,
                                  fontSize: 13,
                                  color: "#595959",
                                  fontFamily: "monospace",
                                  background: "#fff",
                                  padding: 8,
                                  borderRadius: 4,
                                }}
                              >
                                <strong>📤 返回结果：</strong>{" "}
                                {JSON.stringify((part as any).output)}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return null;
                    })}
                  </Card>
                </Space>
              </div>
            );
          })}

          {isSubmitted && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <Space align="start">
                <Avatar
                  icon={<RobotOutlined />}
                  style={{ backgroundColor: "#52c41a" }}
                />
                <Card size="small" style={{ borderRadius: 12 }}>
                  <Spin size="small" />{" "}
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    Agent 正在思考...
                  </Text>
                </Card>
              </Space>
            </div>
          )}

          {error && (
            <Alert
              type="error"
              showIcon
              message={`Agent 报错：${error.message}`}
            />
          )}
          <div ref={messagesEndRef} />
        </Space>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 10,
          background: "#fff",
          padding: 15,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <TextArea
          value={input}
          placeholder="比如：西安今天天气怎么样？我该穿什么？ (Enter 发送)"
          onChange={(e) => setInput(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          disabled={isBusy}
          style={{ resize: "none" }}
        />
        {isStreaming ? (
          <Button
            type="primary"
            danger
            icon={<StopOutlined />}
            onClick={stop}
            style={{ height: "auto" }}
          >
            停止
          </Button>
        ) : (
          <Button
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            disabled={isBusy || !input.trim()}
            style={{ height: "auto" }}
          >
            发送
          </Button>
        )}
      </form>
    </Flex>
  );
}
