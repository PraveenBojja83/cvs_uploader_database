import React, { useState } from "react";

export default function SearchUpload() {
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("⚠️ Please select a file!");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        alert("✅ CSV uploaded successfully!");
      } else {
        alert("❌ Upload failed: " + data.error);
      }
    } catch (err) {
      alert("❌ Error uploading file: " + err.message);
    }
  };

  const handleSubmit = () => {
    alert(`Searching for: ${search}`);
  };

  return (
    <div style={{
      padding: "20px",
      maxWidth: "400px",
      margin: "auto",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ marginBottom: "10px" }}>CSV Uploader</h2>
      <input
        type="text"
        placeholder="Search..."
        style={{ padding: "8px", width: "100%", marginBottom: "10px" }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <input type="file" onChange={handleFileChange} style={{ marginBottom: "10px" }} />
      <div>
        <button
          onClick={handleUpload}
          style={{ backgroundColor: "blue", color: "white", padding: "8px 16px", marginRight: "8px", border: "none", borderRadius: "6px" }}
        >
          Upload
        </button>
        <button
          onClick={handleSubmit}
          style={{ backgroundColor: "green", color: "white", padding: "8px 16px", border: "none", borderRadius: "6px" }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
