import { Rate, Tag, Badge, Card, Space } from "antd";
import { useEffect, useState } from "react";

export default function AnalyzePage() {
  const [analysisResult, setAnalysisResult] = useState({
    score: "0",
    sentiment: "",
    tags: [],
    replay: "",
  });
  useEffect(() => {
    fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("分析结果:", data);
        setAnalysisResult(data);
      })
      .catch((error) => {
        console.error("分析请求出错:", error);
      });
  }, []);

  const customs = ["#f50", "#2db7f5", "#87d068"];
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      {analysisResult ? (
        <div>
          分数: <Rate defaultValue={Number(analysisResult.score)} />
          情感: <Badge status="processing" text={analysisResult.sentiment} />
          标签:
          <Space>
            {analysisResult.tags.map((tag: string, index) => (
              <Tag key={tag} color={customs[index]}>
                {tag}
              </Tag>
            ))}
          </Space>
           <Card title="重放">{analysisResult.replay}</Card>
        </div>
      ) : null}
    </div>
  );
}
