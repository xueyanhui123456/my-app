'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect } from 'react';
import {
  Input, Button, Card, Avatar, Space, Typography, Spin, Flex,
  Alert, Tag
} from 'antd';
import {
  UserOutlined, RobotOutlined, SendOutlined, StopOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

export default function ChatPage() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // v7 核心：transport 指定 API 路径，status 替代 isLoading
  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isStreaming = status === 'streaming';
  const isSubmitted = status === 'submitted';
  const isBusy = isSubmitted || isStreaming;

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    sendMessage({ text: trimmed }); // v7 用 sendMessage，而非 handleSubmit
    setInput('');
  };

  return (
    <Flex vertical style={{ height: '100vh', maxWidth: 900, margin: '0 auto', padding: 20, background: '#f5f5f5' }}>
      <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 20 }}>
        AI 流式对话
        <Tag color={isStreaming ? 'processing' : 'default'} style={{ marginLeft: 12 }}>
          {status}
        </Tag>
      </Typography.Title>

      {/* 消息列表区 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px', marginBottom: 20 }}>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div key={message.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                <Space align="start" style={{ flexDirection: isUser ? 'row-reverse' : 'row', maxWidth: '80%' }}>
                  <Avatar
                    icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                    style={{ backgroundColor: isUser ? '#1677ff' : '#52c41a', flexShrink: 0 }}
                  />
                  <Card
                    size="small"
                    style={{
                      backgroundColor: isUser ? '#e6f4ff' : '#fff',
                      borderRadius: 12,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    }}
                    styles={{ body: { padding: '10px 16px' } }}
                  >
                    {/* v7 必须遍历 parts，不能直接读 message.content */}
                    {message.parts.map((part, idx) => {
                      if (part.type === 'text') {
                        return (
                          <Text key={idx} style={{ whiteSpace: 'pre-wrap', fontSize: 14 ,lineHeight: 1.5, wordBreak: 'break-word',fontWeight: 600}}>
                            {part.text}
                          </Text>
                        );
                      }
                      if (part.type === 'reasoning') {
                        return (
                          <div key={idx} style={{ color: '#999', fontSize: 13, marginBottom: 4 }}>
                            <i>{part.text}</i>
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

          {/* “思考中”状态：用户消息已发出，但 AI 还没开始流式返回 */}
          {isSubmitted && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Space align="start">
                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
                <Card size="small" style={{ borderRadius: 12 }}>
                  <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8 }}>AI 正在思考...</Text>
                </Card>
              </Space>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <Alert
              type="error"
              showIcon
              title={`请求出错：${error.message}`}
              action={<Button size="small" onClick={clearError}>忽略</Button>}
            />
          )}

          <div ref={messagesEndRef} />
        </Space>
      </div>

      {/* 输入区 */}
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: 10, background: '#fff', padding: 15, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <TextArea
          value={input}
          placeholder="问我点什么... (Enter 发送，Shift+Enter 换行)"
          onChange={(e) => setInput(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          disabled={isBusy}
          style={{ resize: 'none' }}
        />
        {isStreaming ? (
          <Button type="primary" danger icon={<StopOutlined />} onClick={stop} style={{ height: 'auto' }}>
            停止
          </Button>
        ) : (
          <Button type="primary" htmlType="submit" icon={<SendOutlined />} disabled={isBusy || !input.trim()} style={{ height: 'auto' }}>
            发送
          </Button>
        )}
      </form>
    </Flex>
  );
}