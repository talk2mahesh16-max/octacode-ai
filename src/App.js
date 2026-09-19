import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [inputPrompt, setInputPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState('JavaScript');
  const [activeTab, setActiveTab] = useState('code');

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('octacode_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('octacode_history', JSON.stringify(history));
  }, [history]);

  const templates = [
    "Responsive Navbar with Tailwind",
    "Fetch API data in React",
    "Authentication Login Form",
    "Binary Search Algorithm",
    "JWT Auth Middleware in Node.js"
  ];

  const languages = ["JavaScript", "Python", "HTML/CSS", "C++", "Java", "SQL"];

  const extensionMap = {
    "JavaScript": "js",
    "Python": "py",
    "HTML/CSS": "html",
    "C++": "cpp",
    "Java": "java",
    "SQL": "sql"
  };

  const handleGenerate = async (customPrompt, customInstruction = '') => {
    const query = customPrompt || inputPrompt;
    if (!query.trim()) return;

    setLoading(true);
    setCopied(false);

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    const finalInstruction = customInstruction 
      ? `${customInstruction} on this code requirement: ${query}`
      : `Write clean, complete, production-ready code in ${language} for: ${query}. Return only clean code with concise comments.`;

    let attempts = 0;
    const maxAttempts = 3;
    let success = false;

    while (attempts < maxAttempts && !success) {
      try {
        attempts++;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are OctaCode AI Studio, an elite engineering assistant. ${finalInstruction}`
                }]
              }]
            })
          }
        );

        const data = await res.json();

        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
          let cleanText = data.candidates[0].content.parts[0].text;
          cleanText = cleanText.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim();
          setResponse(cleanText);

          if (language === 'HTML/CSS') {
            setActiveTab('preview');
          } else {
            setActiveTab('code');
          }

          const newEntry = {
            id: Date.now(),
            prompt: query,
            lang: language,
            code: cleanText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setHistory((prev) => [newEntry, ...prev.filter(item => item.prompt !== query)]);
          success = true;
        } else if (data.error) {
          if (attempts < maxAttempts) {
            // High demand hone par 1.5 second ruk kar auto-retry karega
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } else {
            setResponse("// API Error: " + data.error.message);
          }
        }
      } catch (err) {
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } else {
          setResponse("// Network Error: " + err.message);
        }
      }
    }

    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!response) return;
    const ext = extensionMap[language] || 'txt';
    const blob = new Blob([response], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OctaCode_${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('octacode_history');
  };

  const handleDeleteHistoryItem = (e, id) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Top Studio Navbar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', backgroundColor: '#0b1120', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '-0.5px' }}>OctaCode AI Studio</span>
          <span style={{ backgroundColor: '#0369a1', color: '#e0f2fe', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>v1.0 Beta</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#10b981' }}>
          <span style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
          Engine: Gemini 3.6 Flash Live
        </div>
      </header>

      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar: History */}
        <aside style={{ width: '260px', backgroundColor: '#0b1329', borderRight: '1px solid #1e293b', padding: '18px 14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saved Snippets</span>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #7f1d1d', borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.length === 0 ? (
              <p style={{ color: '#475569', fontSize: '0.85rem' }}>No history recorded yet.</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setResponse(item.code);
                    setLanguage(item.lang);
                    setInputPrompt(item.prompt);
                    if (item.lang === 'HTML/CSS') setActiveTab('preview');
                  }}
                  style={{
                    backgroundColor: '#131e3a',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    border: '1px solid #1e293b'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#38bdf8', marginBottom: '4px' }}>
                    <span>{item.lang}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#64748b' }}>{item.time}</span>
                      <button
                        onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                        style={{ backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.prompt}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Center Controls */}
        <section style={{ width: '400px', padding: '24px', borderRight: '1px solid #1e293b', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Target Environment</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#111827',
                color: '#38bdf8',
                fontSize: '0.95rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {languages.map((lang, i) => (
                <option key={i} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Describe Requirement</label>
            <textarea
              rows="5"
              placeholder={`Describe component, schema, or logic in ${language}...`}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#111827',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.5'
              }}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}
            >
              {loading ? 'Synthesizing Code...' : 'Generate Code'}
            </button>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Quick Starter Presets</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {templates.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputPrompt(item);
                    handleGenerate(item);
                  }}
                  style={{
                    textAlign: 'left',
                    backgroundColor: '#111827',
                    color: '#94a3b8',
                    border: '1px solid #1e293b',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right Code & Live Preview Canvas */}
        <main style={{ flex: 1, backgroundColor: '#070b14', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', gap: '6px', backgroundColor: '#1e293b', padding: '3px', borderRadius: '6px' }}>
              <button
                onClick={() => setActiveTab('code')}
                style={{
                  backgroundColor: activeTab === 'code' ? '#0284c7' : 'transparent',
                  color: activeTab === 'code' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Code
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                style={{
                  backgroundColor: activeTab === 'preview' ? '#0284c7' : 'transparent',
                  color: activeTab === 'preview' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Live Preview
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {response && (
                <>
                  <button
                    onClick={() => handleGenerate(inputPrompt, "Refactor and optimize performance")}
                    style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '4px', padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Optimize
                  </button>
                  <button
                    onClick={() => handleGenerate(inputPrompt, "Add strict error handling and input validation")}
                    style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '4px', padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    + Error Handling
                  </button>
                  <button
                    onClick={handleDownload}
                    style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #0284c7', borderRadius: '4px', padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Export File
                  </button>
                  <button
                    onClick={handleCopy}
                    style={{ backgroundColor: copied ? '#16a34a' : '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {response ? (
              activeTab === 'code' ? (
                <div style={{ height: '100%', padding: '20px', overflow: 'auto', boxSizing: 'border-box' }}>
                  <pre style={{ margin: 0, color: '#e2e8f0', fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.92rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    <code>{response}</code>
                  </pre>
                </div>
              ) : (
                <iframe
                  title="OctaCode Live Preview"
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                          body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background-color: #0f172a; color: #f8fafc; min-height: 100vh; }
                        </style>
                      </head>
                      <body>
                        ${response}
                      </body>
                    </html>
                  `}
                  sandbox="allow-scripts allow-modals"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#0f172a'
                  }}
                />
              )
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.95rem' }}>
                Select a template or describe your component to generate code canvas.
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}

export default App;