import React, { useState } from 'react';

export const Scanner: React.FC<any> = () => {
  const [text, setText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        jobDescription, 
        keywords: jobDescription.split(' ').filter(w => w.length > 3) 
      })
    });
    const data = await response.json();
    setResult(data);
  };

  return (
    <div className="scanner-container">
      <h1>AI Resume Scanner</h1>
      <textarea 
        placeholder="Paste Resume Text" 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
      />
      <textarea 
        placeholder="Paste Job Description" 
        value={jobDescription} 
        onChange={(e) => setJobDescription(e.target.value)} 
      />
      <button onClick={handleScan}>Analyze Match</button>
      
      {result && (
        <div className="results">
          <h2>Score: {result.score.toFixed(2)}%</h2>
          <ul>
            {result.breakdown.map((item: any, idx: number) => (
              <li key={idx} style={{ color: item.found ? 'green' : 'red' }}>
                {item.keyword}: {item.found ? 'Found' : 'Missing'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};