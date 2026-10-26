// 预定义的api路由 > 动态api路由 > 捕获所有api的路由 （优先级）
export default function handler(req, res) {
  const { id } = req.query;
  res.end(`Post: ${id}`);
}
