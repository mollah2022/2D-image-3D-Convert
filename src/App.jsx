import React, { useState } from 'react';
import '@google/model-viewer';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [modelUrl, setModelUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/convert', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      // Add a timestamp to the URL to prevent browser caching old models
      setModelUrl(`${data.model_url}?t=${Date.now()}`);
    } catch (error) {
      alert("Error generating 3D model. Check if backend is running.");
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '40px', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>AI 2D ➔ 3D Converter</h1>
      <p>Using Microsoft TRELLIS Engine</p>
      
      <div style={{ margin: '30px auto', padding: '20px', border: '1px dashed #555', borderRadius: '10px', maxWidth: '400px' }}>
        <input type="file" onChange={handleFileChange} accept="image/*" />
        <br />
        <button 
          onClick={handleSubmit} 
          disabled={!selectedFile || loading}
          style={{ 
            marginTop: '15px', 
            padding: '10px 20px', 
            fontSize: '16px', 
            backgroundColor: !selectedFile || loading ? '#555' : '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: !selectedFile || loading ? 'not-allowed' : 'pointer' 
          }}
        >
          {loading ? 'Converting...' : 'Generate 3D Model'}
        </button>
      </div>

      {loading && (
        <div style={{ margin: '20px' }}>
          <div className="spinner"></div>
          <p>Generating high-fidelity mesh... (Approx 60 seconds)</p>
        </div>
      )}

      {modelUrl && !loading && (
        <div style={{ marginTop: '20px' }}>
          <model-viewer 
            src={modelUrl} 
            camera-controls 
            auto-rotate 
            shadow-intensity="1"
            style={{ width: '80%', height: '500px', margin: '0 auto', backgroundColor: '#333', borderRadius: '15px' }}>
          </model-viewer>
          <br />
          <a href={modelUrl} download="my_model.glb">
            <button style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Download .GLB File
            </button>
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
