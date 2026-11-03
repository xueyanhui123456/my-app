import { Rate, Tag, Badge, Card, Space, Input } from "antd";
import { useState } from "react";

export default function AnalyzePage() {
  const { Search } = Input;
  const [inputText, setInputText] = useState("");
  const [analysisResult, setAnalysisResult] = useState({
    score: 0.9,
    sentiment: "",
    tags: [],
    replay: "",
  });

  const handleSearch = (value: string) => {
    setInputText(value); // 更新输入文本状态
    fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: value || inputText }), // 如果value为空，则使用inputText的值
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("分析结果:", data);
        setAnalysisResult(data);
      })
      .catch((error) => {
        console.error("分析请求出错:", error);
      });
  };

  const customs = ["#f50", "#2db7f5", "#87d068"];
  return (
    <div
      style={{
        width: "80%",
        margin: "0 auto",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <Search
          placeholder="输入你要问的问题"
          onSearch={handleSearch}
          enterButton
        />
      </div>
      {analysisResult ? (
        <div>
          <Space>
            分数: <Rate value={analysisResult.score} />
            情感: <Badge status="processing" text={analysisResult.sentiment} />
            标签:
            <Space>
              {analysisResult.tags?.map((tag: string, index) => (
                <Tag key={tag} color={customs[index]}>
                  {tag}
                </Tag>
              ))}
            </Space>
          </Space>
          <Card title="回答内容" style={{ marginTop: "20px" }}>
            {analysisResult.replay}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
