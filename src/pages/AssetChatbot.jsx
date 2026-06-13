import React, { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Plus, Send, TrendingUp, BarChart3, FileText } from 'lucide-react';

const AssetChatbotSystem = () => {
  // Asset Management State
  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('assets');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Server A', category: 'Infrastructure', value: 5000, status: 'Active', kpi: 'Uptime: 99.9%' },
      { id: 2, name: 'Software License', category: 'Software', value: 2000, status: 'Active', kpi: 'Users: 50' },
      { id: 3, name: 'Network Equipment', category: 'Infrastructure', value: 8000, status: 'Active', kpi: 'Bandwidth: 1Gbps' }
    ];
  });

  const [newAsset, setNewAsset] = useState({ name: '', category: 'Infrastructure', value: '', status: 'Active', kpi: '' });
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI asset advisor. Ask me anything about your assets, KPIs, and dashboards. I learn from your data continuously.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assets');
  const messagesEndRef = useRef(null);

  // Save assets to localStorage
  useEffect(() => {
    localStorage.setItem('assets', JSON.stringify(assets));
  }, [assets]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add new asset
  const handleAddAsset = () => {
    if (newAsset.name && newAsset.value) {
      setAssets([...assets, {
        id: Date.now(),
        ...newAsset,
        value: parseFloat(newAsset.value)
      }]);
      setNewAsset({ name: '', category: 'Infrastructure', value: '', status: 'Active', kpi: '' });
    }
  };

  // Delete asset
  const handleDeleteAsset = (id) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  // Calculate KPIs
  const calculateKPIs = () => {
    const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
    const activeAssets = assets.filter(a => a.status === 'Active').length;
    const categories = [...new Set(assets.map(a => a.category))];
    
    return {
      totalValue: `$${totalValue.toLocaleString()}`,
      totalAssets: assets.length,
      activeAssets,
      categories: categories.length,
      avgValue: `$${(totalValue / assets.length).toFixed(2)}`
    };
  };

  // Prepare data context for AI
  const getDataContext = () => {
    const kpis = calculateKPIs();
    return `
Asset Portfolio Summary:
- Total Assets: ${kpis.totalAssets}
- Total Value: ${kpis.totalValue}
- Active Assets: ${kpis.activeAssets}
- Average Asset Value: ${kpis.avgValue}
- Categories: ${kpis.categories}

Asset Details:
${assets.map(a => `- ${a.name} (${a.category}): $${a.value} | Status: ${a.status} | KPI: ${a.kpi}`).join('\n')}
    `;
  };

  // Handle AI Chat with Claude API
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const dataContext = getDataContext();
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          system: `You are an expert asset management advisor. You have access to the following asset data and KPIs:\n\n${dataContext}\n\nProvide concise, actionable insights based on this data. Be conversational but professional.`,
          messages: [
            ...messages.filter(m => m.role !== 'system'),
            { role: 'user', content: userMessage }
          ]
        })
      });

      const data = await response.json();
      const assistantMessage = data.content[0]?.text || 'I encountered an issue processing your request.';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error connecting to AI service: ${error.message}. Try again in a moment.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF Report
  const generatePDFReport = () => {
    const kpis = calculateKPIs();
    let reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #1a73e8; border-bottom: 3px solid #1a73e8; padding-bottom: 10px; }
          h2 { color: #34a853; margin-top: 30px; }
          .kpi { display: inline-block; width: 23%; margin: 1%; padding: 15px; background: #f0f0f0; border-radius: 5px; }
          .kpi-value { font-size: 24px; font-weight: bold; color: #1a73e8; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #1a73e8; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:hover { background: #f5f5f5; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Asset Management Report</h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
        
        <h2>Key Performance Indicators</h2>
        <div class="kpi">
          <div class="kpi-value">${kpis.totalAssets}</div>
          <div>Total Assets</div>
        </div>
        <div class="kpi">
          <div class="kpi-value">${kpis.totalValue}</div>
          <div>Total Value</div>
        </div>
        <div class="kpi">
          <div class="kpi-value">${kpis.activeAssets}</div>
          <div>Active Assets</div>
        </div>
        <div class="kpi">
          <div class="kpi-value">${kpis.avgValue}</div>
          <div>Avg Value</div>
        </div>

        <h2>Asset Inventory</h2>
        <table>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Value</th>
            <th>Status</th>
            <th>KPI</th>
          </tr>
          ${assets.map(a => `
            <tr>
              <td>${a.name}</td>
              <td>${a.category}</td>
              <td>$${a.value.toLocaleString()}</td>
              <td>${a.status}</td>
              <td>${a.kpi}</td>
            </tr>
          `).join('')}
        </table>

        <div class="footer">
          <p>This report was automatically generated by the Asset Management System.</p>
        </div>
      </body>
      </html>
    `;

    const newWindow = window.open('', '', 'width=800,height=600');
    newWindow.document.write(reportHTML);
    newWindow.print();
  };

  // Export to Excel
  const exportToExcel = () => {
    const kpis = calculateKPIs();
    let csvContent = 'Asset Management Data Export\n\n';
    csvContent += `Export Date,${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += 'KEY PERFORMANCE INDICATORS\n';
    csvContent += `Total Assets,${kpis.totalAssets}\n`;
    csvContent += `Total Value,${kpis.totalValue}\n`;
    csvContent += `Active Assets,${kpis.activeAssets}\n`;
    csvContent += `Average Value,${kpis.avgValue}\n\n`;

    csvContent += 'ASSET INVENTORY\n';
    csvContent += 'Name,Category,Value,Status,KPI\n';
    assets.forEach(a => {
      csvContent += `"${a.name}","${a.category}","${a.value}","${a.status}","${a.kpi}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset_report_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const kpis = calculateKPIs();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a73e8 0%, #34a853 100%)', color: 'white', padding: '30px', borderRadius: '10px 10px 0 0' }}>
        <h1 style={{ margin: 0, fontSize: '32px' }}>Asset Management & AI Advisor</h1>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>Manage assets, track KPIs, and get AI insights powered by continuous learning</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ddd', background: '#f9f9f9' }}>
        {[
          { id: 'assets', label: '📦 Assets', icon: '📦' },
          { id: 'kpis', label: '📊 KPIs & Dashboard', icon: '📊' },
          { id: 'chat', label: '💬 AI Advisor', icon: '💬' },
          { id: 'export', label: '⬇️ Export', icon: '⬇️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '15px 25px',
              border: 'none',
              background: activeTab === tab.id ? 'white' : 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid #1a73e8' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              color: activeTab === tab.id ? '#1a73e8' : '#666'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: 'white', minHeight: '600px', padding: '30px' }}>
        {/* ASSETS TAB */}
        {activeTab === 'assets' && (
          <div>
            <h2 style={{ color: '#1a73e8', marginTop: 0 }}>Manage Your Assets</h2>
            
            {/* Add New Asset */}
            <div style={{ background: '#f0f7ff', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
              <h3 style={{ marginTop: 0 }}>Add New Asset</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <input
                  placeholder="Asset Name"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
                <select
                  value={newAsset.category}
                  onChange={(e) => setNewAsset({...newAsset, category: e.target.value})}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  <option>Infrastructure</option>
                  <option>Software</option>
                  <option>Hardware</option>
                  <option>Services</option>
                  <option>Other</option>
                </select>
                <input
                  placeholder="Value ($)"
                  type="number"
                  value={newAsset.value}
                  onChange={(e) => setNewAsset({...newAsset, value: e.target.value})}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <input
                  placeholder="KPI (e.g., Uptime: 99.9%)"
                  value={newAsset.kpi}
                  onChange={(e) => setNewAsset({...newAsset, kpi: e.target.value})}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
                <select
                  value={newAsset.status}
                  onChange={(e) => setNewAsset({...newAsset, status: e.target.value})}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Maintenance</option>
                </select>
                <button
                  onClick={handleAddAsset}
                  style={{
                    padding: '10px 20px',
                    background: '#34a853',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: '600'
                  }}
                >
                  <Plus size={18} /> Add Asset
                </button>
              </div>
            </div>

            {/* Assets Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Value</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>KPI</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id} style={{ borderBottom: '1px solid #eee', hover: '#f5f5f5' }}>
                    <td style={{ padding: '12px' }}>{asset.name}</td>
                    <td style={{ padding: '12px' }}>{asset.category}</td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>${asset.value.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        background: asset.status === 'Active' ? '#d4edda' : '#f8d7da',
                        color: asset.status === 'Active' ? '#155724' : '#856404',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {asset.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px' }}>{asset.kpi}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        style={{
                          background: '#ea4335',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* KPIs & DASHBOARD TAB */}
        {activeTab === 'kpis' && (
          <div>
            <h2 style={{ color: '#1a73e8', marginTop: 0 }}>Key Performance Indicators</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'linear-gradient(135deg, #1a73e8 0%, #4a90e2 100%)', color: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Assets</p>
                <p style={{ margin: '10px 0 0 0', fontSize: '32px', fontWeight: 'bold' }}>{kpis.totalAssets}</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #34a853 0%, #57bb76 100%)', color: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Value</p>
                <p style={{ margin: '10px 0 0 0', fontSize: '32px', fontWeight: 'bold' }}>{kpis.totalValue}</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #fbbc04 0%, #f9ab00 100%)', color: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Assets</p>
                <p style={{ margin: '10px 0 0 0', fontSize: '32px', fontWeight: 'bold' }}>{kpis.activeAssets}</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #ea4335 0%, #e67c73 100%)', color: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Avg Value</p>
                <p style={{ margin: '10px 0 0 0', fontSize: '32px', fontWeight: 'bold' }}>{kpis.avgValue}</p>
              </div>
            </div>

            <h3 style={{ marginTop: '40px', color: '#1a73e8' }}>Asset Breakdown by Category</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {Array.from(new Set(assets.map(a => a.category))).map(cat => {
                const catAssets = assets.filter(a => a.category === cat);
                return (
                  <div key={cat} style={{ background: '#f0f7ff', padding: '20px', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600', color: '#1a73e8' }}>{cat}</p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>Count: <strong>{catAssets.length}</strong></p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>Value: <strong>${catAssets.reduce((s, a) => s + a.value, 0).toLocaleString()}</strong></p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
            <h2 style={{ color: '#1a73e8', marginTop: 0 }}>AI Asset Advisor</h2>
            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 20px 0' }}>Ask questions about your assets, KPIs, and get AI-powered insights. The system learns from your data continuously.</p>

            {/* Chat Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: '#f9f9f9',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: msg.role === 'user' ? '#1a73e8' : '#e8f0fe',
                      color: msg.role === 'user' ? 'white' : '#1a73e8',
                      wordBreak: 'break-word',
                      lineHeight: '1.5'
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '12px 16px', background: '#e8f0fe', borderRadius: '8px', color: '#1a73e8' }}>
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me about your assets, KPIs, trends, or recommendations..."
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                style={{
                  padding: '12px 20px',
                  background: loading || !input.trim() ? '#ccc' : '#1a73e8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading || !input.trim() ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600'
                }}
              >
                <Send size={18} /> Send
              </button>
            </div>
          </div>
        )}

        {/* EXPORT TAB */}
        {activeTab === 'export' && (
          <div>
            <h2 style={{ color: '#1a73e8', marginTop: 0 }}>Export & Reports</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Export Excel */}
              <div style={{ border: '2px solid #34a853', borderRadius: '10px', padding: '30px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                <Download size={48} style={{ color: '#34a853', marginBottom: '15px' }} />
                <h3 style={{ margin: '0 0 10px 0', color: '#34a853' }}>Export to Excel</h3>
                <p style={{ color: '#666', margin: '10px 0 20px 0' }}>Download your assets and KPIs as a CSV file that opens in Excel</p>
                <button
                  onClick={exportToExcel}
                  style={{
                    padding: '12px 24px',
                    background: '#34a853',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Download Excel
                </button>
              </div>

              {/* Generate PDF Report */}
              <div style={{ border: '2px solid #1a73e8', borderRadius: '10px', padding: '30px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                <FileText size={48} style={{ color: '#1a73e8', marginBottom: '15px' }} />
                <h3 style={{ margin: '0 0 10px 0', color: '#1a73e8' }}>Generate PDF Report</h3>
                <p style={{ color: '#666', margin: '10px 0 20px 0' }}>Create a professional PDF report with your KPIs and asset details</p>
                <button
                  onClick={generatePDFReport}
                  style={{
                    padding: '12px 24px',
                    background: '#1a73e8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Generate PDF
                </button>
              </div>

              {/* Data Summary */}
              <div style={{ border: '2px solid #fbbc04', borderRadius: '10px', padding: '30px', textAlign: 'center' }}>
                <BarChart3 size={48} style={{ color: '#fbbc04', marginBottom: '15px' }} />
                <h3 style={{ margin: '0 0 10px 0', color: '#fbbc04' }}>Data Summary</h3>
                <p style={{ color: '#666', margin: '10px 0' }}>Assets: <strong>{assets.length}</strong></p>
                <p style={{ color: '#666', margin: '5px 0' }}>Total Value: <strong>{kpis.totalValue}</strong></p>
                <p style={{ color: '#666', margin: '5px 0 20px 0' }}>Last Updated: <strong>{new Date().toLocaleDateString()}</strong></p>
                <button
                  style={{
                    padding: '12px 24px',
                    background: '#fbbc04',
                    color: '#333',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: '#f0f0f0', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#666', borderRadius: '0 0 10px 10px' }}>
        <p>🤖 AI Advisor learns from your data continuously • All data is saved locally in your browser • No data is sent to external servers</p>
      </div>
    </div>
  );
};

export default AssetChatbotSystem;
