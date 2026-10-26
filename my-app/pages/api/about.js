export default function handler(req, res) {
  if (req.method === "POST") {
    const { title, content } = req.body;

    res
      .status(200)
      .json({ message: "Post created successfully", title, content });
    // Process the POST request
  } else if (req.method === "GET") {
    // Process the GET request
    res.status(200).json({ message: "This is a GET request" });
  }
}
