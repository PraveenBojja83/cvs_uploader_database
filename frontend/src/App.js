import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");

  // Fetch uploaded files on mount and after upload/delete
  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/uploads");
      setUploadedFiles(res.data.files || []);
    } catch (err) {
      alert("❌ Could not fetch uploaded files");
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload CSV
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("http://localhost:5000/upload", formData);
      setMessage("✅ File uploaded successfully!");
      alert("✅ File uploaded successfully!");
      fetchUploadedFiles(); // Refresh file list
    } catch (err) {
      setMessage("❌ Upload failed!");
      alert("❌ Upload failed!");
    }
  };

  // Search in DB
  const handleSearch = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/search?query=${searchQuery}`);
      setSearchResults(res.data.results || []);
    } catch (err) {
      alert("❌ Error fetching results");
    }
  };

  // Delete selected file
  const handleDeleteFile = async () => {
    if (!selectedFile) {
      alert("Please select a file to delete!");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${selectedFile}"?`)) return;
    try {
      await axios.delete(`http://localhost:5000/uploads/${selectedFile}`);
      alert("File deleted!");
      setSelectedFile("");
      fetchUploadedFiles(); // Refresh file list
    } catch (err) {
      alert("❌ Could not delete file");
    }
  };

  return (
    <div className="centered-box">
      <h2>📂 CSV Uploader to Database</h2>

      {/* File Upload */}
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <p>{message}</p>

      <hr />

      {/* Delete Uploaded File */}
      <h3>Delete Uploaded File</h3>
      <select
        value={selectedFile}
        onChange={e => setSelectedFile(e.target.value)}
      >
        <option value="">-- Select a file --</option>
        {uploadedFiles.map(file => (
          <option key={file} value={file}>{file}</option>
        ))}
      </select>
      <button onClick={handleDeleteFile}>Delete</button>

      <hr />

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search database..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      {/* Search Results */}
      <ul>
        {searchResults.map((row, index) => (
          <li key={index}>{JSON.stringify(row)}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;