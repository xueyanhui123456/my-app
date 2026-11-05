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
  Collapse,
  Tag,
  Alert,
} from "antd";
import {
  UserOutlined,
  RobotOutlined,
  SendOutlined,
  StopOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { TextArea } = Input;

export default function ChatPage() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/rag/chat" }), // 注意这里是 RAG 接口
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
        RAG 知识库对话
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

            // 👇 核心改动：从 parts 里提取引用数据
            const citationPart = message.parts.find(
              (part) => part.type === "data-citations",
            );
            const citations =
              citationPart && "data" in citationPart && Array.isArray(citationPart.data)
                ? (citationPart.data as string[])
                : [];

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
                    {/* 渲染文本内容 */}
                    {message.parts.map((part, idx) => {
                      if (part.type === "text") {
                        return (
                          <Text
                            key={idx}
                            style={{ whiteSpace: "pre-wrap", fontSize: 15 }}
                          >
                            {part.text}
                          </Text>
                        );
                      }
                      return null;
                    })}

                    {/* 👇 渲染引用来源卡片 */}
                    {!isUser && citations.length > 0 && (
                      <Collapse
                        ghost
                        size="small"
                        style={{
                          marginTop: 12,
                          background: "#fafafa",
                          borderRadius: 8,
                        }}
                        items={[
                          {
                            key: "1",
                            label: (
                              <Text type="secondary" style={{ fontSize: 13 }}>
                                📚 查看参考来源 ({citations.length})
                              </Text>
                            ),
                            children: (
                              <Space
                                orientation="vertical"
                                size="small"
                                style={{ width: "100%" }}
                              >
                                {citations.map((cite: string, i: number) => (
                                  <div
                                    key={i}
                                    style={{
                                      fontSize: 13,
                                      color: "#555",
                                      padding: 10,
                                      background: "#fff",
                                      borderRadius: 6,
                                      border: "1px solid #eee",
                                    }}
                                  >
                                    <Tag
                                      color="blue"
                                      style={{ marginBottom: 4 }}
                                    >
                                      片段 {i + 1}
                                    </Tag>
                                    <div style={{ marginTop: 4 }}>{cite}</div>
                                  </div>
                                ))}
                              </Space>
                            ),
                          },
                        ]}
                      />
                    )}
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
                    正在检索知识库...
                  </Text>
                </Card>
              </Space>
            </div>
          )}

          {error && (
            <Alert
              type="error"
              showIcon
              message={`请求出错：${error.message}`}
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
          placeholder="问问知识库里的内容... (Enter 发送)"
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
