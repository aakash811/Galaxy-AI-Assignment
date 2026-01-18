"use client";

import { testCrop } from "@/app/actions/test-crop";
import { useState } from "react";

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const res = await testCrop();
    setResult(res);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <button
        onClick={run}
        disabled={loading}
        style={{
          padding: "12px 20px",
          background: "#7c3aed",
          color: "white",
          borderRadius: 8,
        }}
      >
        {loading ? "Running..." : "Run Crop Task"}
      </button>

      {result && (
        <pre style={{ marginTop: 20 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
