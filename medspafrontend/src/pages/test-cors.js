import { useEffect, useState } from "react";

export default function TestCors() {
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/test", {
      method: "GET",
      credentials: "include", // important for CORS with cookies/tokens
    })
      .then((res) => {
        if (!res.ok) throw new Error("CORS blocked or server error");
        return res.text();
      })
      .then((text) => setResult(`✅ Success: ${text}`))
      .catch((err) => setResult(`❌ Failed: ${err.message}`));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>CORS Test</h1>
      <p>{result}</p>
    </div>
  );
}
