import React, { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Plus, Send, TrendingUp, BarChart3, FileText, DollarSign, AlertCircle, PieChart, ArrowUpRight, ArrowDownLeft, Home, Calculator, Users, Package, Map, MessageCircle } from 'lucide-react';

const ConstructionFinanceApp = () => {
  // ==================== STATE MANAGEMENT ====================
  const [sites, setSites] = useState(() => {
    const saved = localStorage.getItem('constructionSites');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        name: 'Downtown Office Complex',
        location: 'Downtown',
        status: 'In Progress',
        startDate: '2024-01-15',
        budget: 500000,
        spent: 245000,
        materials: [
          { id: 'm1', name: 'Concrete (m³)', quantity: 250, unit: 'm³', unitCost: 150, supplier: 'BuildCo Supply', deliveryDate: '2024-02-01' },
          { id: 'm2', name: 'Steel Rebar', quantity: 50, unit: 'ton', unitCost: 800, supplier: 'Steel Ltd', deliveryDate: '2024-02-05' }
        ],
        contractors: [
          { id: 'c1', name: 'ABC Construction', scope: 'Foundation Work', boqItems: 5, boqTotal: 120000, paid: 60000, status: 'In Progress' }
        ]
      }
    ];
  });

  const [currentSiteId, setCurrentSiteId] = useState(sites[0]?.id || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to Construction Finance AI. I analyze your project finances, flag budget risks, and provide spending insights. Ask about costs, timelines, or recommendations.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Form states
  const [newSite, setNewSite] = useState({ name: '', location: '', budget: '', startDate: '' });
  const [newMaterial, setNewMaterial] = useState({ name: '', quantity: '', unit: '', unitCost: '', supplier: '', deliveryDate: '' });
  const [newContractor, setNewContractor] = useState({ name: '', scope: '', boqTotal: '', status: 'Pending' });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('constructionSites', JSON.stringify(sites));
  }, [sites]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ==================== HELPER FUNCTIONS ====================
  const getCurrentSite = () => sites.find(s => s.id === currentSiteId);

  const calculateSiteMetrics = (site) => {
    const spent = site.materials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0) +
                  site.contractors.reduce((sum, c) => sum + c.paid, 0);
    const remaining = site.budget - spent;
    const percentSpent = (spent / site.budget * 100).toFixed(1);
    
    return { spent, remaining, percentSpent };
  };

  const calculateAllSitesMetrics = () => {
    const totalBudget = sites.reduce((sum, s) => sum + s.budget, 0);
    const totalSpent = sites.reduce((sum, s) => {
      const metrics = calculateSiteMetrics(s);
      return sum + metrics.spent;
    }, 0);
    const totalRemaining = totalBudget - totalSpent;
    const avgSpent = (totalSpent / totalBudget * 100).toFixed(1);
    
    return { totalBudget, totalSpent, totalRemaining, avgSpent };
  };

  const getAllMaterials = () => {
    return sites.flatMap(site => 
      site.materials.map(m => ({ ...m, siteId: site.id, siteName: site.name }))
    );
  };

  const getAllContractors = () => {
    return sites.flatMap(site =>
      site.contractors.map(c => ({ ...c, siteId: site.id, siteName: site.name }))
    );
  };

  // ==================== ADD/DELETE FUNCTIONS ====================
  const addSite = () => {
    if (newSite.name && newSite.location && newSite.budget) {
      const site = {
        id: Date.now(),
        ...newSite,
        budget: parseFloat(newSite.budget),
        status: 'Planning',
        materials: [],
        contractors: []
      };
      setSites([...sites, site]);
      setCurrentSiteId(site.id);
      setNewSite({ name: '', location: '', budget: '', startDate: '' });
    }
  };

  const addMaterialToSite = () => {
    if (newMaterial.name && newMaterial.quantity && newMaterial.unitCost) {
      const currentSite = getCurrentSite();
      const updatedSites = sites.map(s => {
        if (s.id === currentSiteId) {
          return {
            ...s,
            materials: [...s.materials, {
              id: `m${Date.now()}`,
              ...newMaterial,
              quantity: parseFloat(newMaterial.quantity),
              unitCost: parseFloat(newMaterial.unitCost)
            }]
          };
        }
        return s;
      });
      setSites(updatedSites);
      setNewMaterial({ name: '', quantity: '', unit: '', unitCost: '', supplier: '', deliveryDate: '' });
    }
  };

  const addContractorToSite = () => {
    if (newContractor.name && newContractor.scope && newContractor.boqTotal) {
      const updatedSites = sites.map(s => {
        if (s.id === currentSiteId) {
          return {
            ...s,
            contractors: [...s.contractors, {
              id: `c${Date.now()}`,
              ...newContractor,
              boqTotal: parseFloat(newContractor.boqTotal),
              paid: 0,
              boqItems: 0
            }]
          };
        }
        return s;
      });
      setSites(updatedSites);
      setNewContractor({ name: '', scope: '', boqTotal: '', status: 'Pending' });
    }
  };

  const deleteMaterial = (materialId) => {
    const updatedSites = sites.map(s => {
      if (s.id === currentSiteId) {
        return {
          ...s,
          materials: s.materials.filter(m => m.id !== materialId)
        };
      }
      return s;
    });
    setSites(updatedSites);
  };

  const deleteContractor = (contractorId) => {
    const updatedSites = sites.map(s => {
      if (s.id === currentSiteId) {
        return {
          ...s,
          contractors: s.contractors.filter(c => c.id !== contractorId)
        };
      }
      return s;
    });
    setSites(updatedSites);
  };

  const deleteSite = (siteId) => {
    const newSites = sites.filter(s => s.id !== siteId);
    setSites(newSites);
    if (currentSiteId === siteId && newSites.length > 0) {
      setCurrentSiteId(newSites[0].id);
    }
  };

  // ==================== AI FEATURES ====================
  const getFinancialContext = () => {
    const site = getCurrentSite();
    const metrics = calculateSiteMetrics(site);
    const allMetrics = calculateAllSitesMetrics();
    
    return `
CURRENT SITE: ${site?.name || 'N/A'}
Budget: $${site?.budget?.toLocaleString() || 0}
Spent: $${metrics.spent?.toLocaleString() || 0}
Remaining: $${metrics.remaining?.toLocaleString() || 0}
% Spent: ${metrics.percentSpent || 0}%
Status: ${site?.status || 'N/A'}

MATERIALS (${site?.materials?.length || 0} items):
${site?.materials?.map(m => `- ${m.name}: ${m.quantity} ${m.unit} @ $${m.unitCost}/unit = $${(m.quantity * m.unitCost).toLocaleString()}`).join('\n') || 'None'}

CONTRACTORS (${site?.contractors?.length || 0} active):
${site?.contractors?.map(c => `- ${c.name}: ${c.scope} | Quote: $${c.boqTotal?.toLocaleString()} | Paid: $${c.paid?.toLocaleString()}`).join('\n') || 'None'}

ALL SITES SUMMARY:
Total Budget: $${allMetrics.totalBudget?.toLocaleString()}
Total Spent: $${allMetrics.totalSpent?.toLocaleString()}
Overall % Spent: ${allMetrics.avgSpent}%
    `;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const financialContext = getFinancialContext();
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system: `You are an expert construction project financial advisor. Analyze budgets, flag risks, recommend cost savings, and provide actionable insights. Be direct and quantify recommendations.\n\nProject Data:\n${financialContext}`,
          messages: messages.filter(m => m.role !== 'system').concat([{ role: 'user', content: userMessage }])
        })
      });

      const data = await response.json();
      const assistantMessage = data.content[0]?.text || 'Unable to process request.';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== EXPORT FUNCTIONS ====================
  const exportToExcel = () => {
    const site = getCurrentSite();
    const metrics = calculateSiteMetrics(site);
    const allMetrics = calculateAllSitesMetrics();

    let csv = `CONSTRUCTION FINANCE REPORT\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
    
    csv += `SITE: ${site.name}\n`;
    csv += `Budget,${site.budget}\nSpent,${metrics.spent}\nRemaining,${metrics.remaining}\n% Spent,${metrics.percentSpent}%\n\n`;

    csv += `MATERIALS\nName,Quantity,Unit,Unit Cost,Total\n`;
    site.materials.forEach(m => {
      csv += `${m.name},${m.quantity},${m.unit},${m.unitCost},${m.quantity * m.unitCost}\n`;
    });

    csv += `\nCONTRACTORS\nName,Scope,BOQ Total,Paid,Status\n`;
    site.contractors.forEach(c => {
      csv += `${c.name},${c.scope},${c.boqTotal},${c.paid},${c.status}\n`;
    });

    csv += `\n\nALL SITES SUMMARY\nTotal Budget,${allMetrics.totalBudget}\nTotal Spent,${allMetrics.totalSpent}\nTotal Remaining,${allMetrics.totalRemaining}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `construction_finance_${Date.now()}.csv`;
    a.click();
  };

  const generatePDFReport = () => {
    const site = getCurrentSite();
    const metrics = calculateSiteMetrics(site);
    const allMetrics = calculateAllSitesMetrics();

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial; margin: 40px; color: #333; }
          h1 { color: #d97706; border-bottom: 3px solid #d97706; }
          h2 { color: #7c3aed; margin-top: 30px; }
          .metric { display: inline-block; width: 22%; margin: 1%; padding: 15px; background: #f3f4f6; border-radius: 5px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #d97706; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #7c3aed; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>🏗️ Construction Finance Report</h1>
        <p>Site: <strong>${site.name}</strong> | Generated: ${new Date().toLocaleDateString()}</p>
        
        <h2>Budget Summary</h2>
        <div class="metric">
          <div class="metric-value">$${site.budget.toLocaleString()}</div>
          <div>Total Budget</div>
        </div>
        <div class="metric">
          <div class="metric-value">$${metrics.spent.toLocaleString()}</div>
          <div>Spent (${metrics.percentSpent}%)</div>
        </div>
        <div class="metric">
          <div class="metric-value">$${metrics.remaining.toLocaleString()}</div>
          <div>Remaining</div>
        </div>

        ${metrics.percentSpent > 80 ? `<div class="warning">⚠️ Budget Alert: ${metrics.percentSpent}% spent. Monitor spending closely.</div>` : ''}

        <h2>Materials</h2>
        <table>
          <tr><th>Description</th><th>Quantity</th><th>Unit Cost</th><th>Total</th><th>Supplier</th></tr>
          ${site.materials.map(m => `<tr><td>${m.name}</td><td>${m.quantity}</td><td>$${m.unitCost}</td><td>$${(m.quantity * m.unitCost).toLocaleString()}</td><td>${m.supplier || 'N/A'}</td></tr>`).join('')}
        </table>

        <h2>Contractors & BOQ</h2>
        <table>
          <tr><th>Contractor</th><th>Scope</th><th>BOQ Amount</th><th>Paid</th><th>Balance</th><th>Status</th></tr>
          ${site.contractors.map(c => `<tr><td>${c.name}</td><td>${c.scope}</td><td>$${c.boqTotal?.toLocaleString()}</td><td>$${c.paid?.toLocaleString()}</td><td>$${(c.boqTotal - c.paid)?.toLocaleString()}</td><td>${c.status}</td></tr>`).join('')}
        </table>

        <h2>All Sites Overview</h2>
        <table>
          <tr><th>Metric</th><th>Amount</th></tr>
          <tr><td>Total Budget (All Sites)</td><td>$${allMetrics.totalBudget.toLocaleString()}</td></tr>
          <tr><td>Total Spent</td><td>$${allMetrics.totalSpent.toLocaleString()}</td></tr>
          <tr><td>Total Remaining</td><td>$${allMetrics.totalRemaining.toLocaleString()}</td></tr>
          <tr><td>Overall % Spent</td><td>${allMetrics.avgSpent}%</td></tr>
        </table>
      </body>
      </html>
    `;

    const newWindow = window.open('', '', 'width=900,height=700');
    newWindow.document.write(reportHTML);
    newWindow.print();
  };

  // ==================== RENDER ====================
  const site = getCurrentSite();
  const metrics = site ? calculateSiteMetrics(site) : {};
  const allMetrics = calculateAllSitesMetrics();

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #d97706 0%, #7c3aed 100%)', color: 'white', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🏗️ Construction Finance Manager
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Manage sites, materials, contractors, budgets & AI-powered financial insights</p>
      </div>

      {/* MAIN CONTAINER */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 100px)' }}>
        {/* SIDEBAR - SITE SELECTOR */}
        <div style={{ width: '250px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '20px', overflowY: 'auto', boxShadow: '2px 0 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Home size={18} /> Projects
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {sites.map(s => (
              <div
                key={s.id}
                onClick={() => setCurrentSiteId(s.id)}
                style={{
                  padding: '12px',
                  background: currentSiteId === s.id ? '#fef3c7' : '#f3f4f6',
                  border: `2px solid ${currentSiteId === s.id ? '#d97706' : 'transparent'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937' }}>{s.name}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{s.location}</div>
                <div style={{ fontSize: '11px', color: '#d97706', fontWeight: '600', marginTop: '4px' }}>Budget: ${(s.budget/1000).toFixed(0)}k</div>
              </div>
            ))}
          </div>

          {/* Add Site Form */}
          <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#1f2937' }}>New Project</h4>
            <input
              placeholder="Site Name"
              value={newSite.name}
              onChange={(e) => setNewSite({...newSite, name: e.target.value})}
              style={{ width: '100%', padding: '6px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }}
            />
            <input
              placeholder="Location"
              value={newSite.location}
              onChange={(e) => setNewSite({...newSite, location: e.target.value})}
              style={{ width: '100%', padding: '6px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }}
            />
            <input
              placeholder="Budget ($)"
              type="number"
              value={newSite.budget}
              onChange={(e) => setNewSite({...newSite, budget: e.target.value})}
              style={{ width: '100%', padding: '6px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }}
            />
            <input
              placeholder="Start Date"
              type="date"
              value={newSite.startDate}
              onChange={(e) => setNewSite({...newSite, startDate: e.target.value})}
              style={{ width: '100%', padding: '6px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }}
            />
            <button
              onClick={addSite}
              style={{
                width: '100%',
                padding: '8px',
                background: '#d97706',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '11px'
              }}
            >
              <Plus size={14} style={{ display: 'inline', marginRight: '4px' }} /> Add Project
            </button>
          </div>

          {/* Summary Stats */}
          <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '6px', fontSize: '12px' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#92400e' }}>📊 All Sites</p>
            <p style={{ margin: '5px 0', color: '#78350f' }}>Budget: ${(allMetrics.totalBudget/1000).toFixed(0)}k</p>
            <p style={{ margin: '5px 0', color: '#78350f' }}>Spent: ${(allMetrics.totalSpent/1000).toFixed(0)}k</p>
            <p style={{ margin: '5px 0', color: '#92400e', fontWeight: '600' }}>{allMetrics.avgSpent}% Utilization</p>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* NAV TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: 'white', overflowX: 'auto' }}>
            {[
              { id: 'overview', label: '📊 Overview', icon: BarChart3 },
              { id: 'materials', label: '📦 Materials', icon: Package },
              { id: 'contractors', label: '👷 Contractors', icon: Users },
              { id: 'financials', label: '💰 Financials', icon: DollarSign },
              { id: 'ai', label: '🤖 AI Advisor', icon: MessageCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '15px 20px',
                  border: 'none',
                  background: activeTab === tab.id ? 'white' : '#f9fafb',
                  borderBottom: activeTab === tab.id ? '3px solid #d97706' : 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  color: activeTab === tab.id ? '#d97706' : '#6b7280',
                  whiteSpace: 'nowrap',
                  fontSize: '14px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div style={{ flex: 1, overflow: 'auto', padding: '25px', background: '#f9fafb' }}>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && site && (
              <div>
                <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Map size={24} /> {site.name}
                </h2>

                {/* Key Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Budget</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>${(site.budget/1000).toFixed(0)}k</div>
                  </div>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Spent</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed' }}>${(metrics.spent/1000).toFixed(0)}k</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>{metrics.percentSpent}% utilized</div>
                  </div>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Remaining</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>${(metrics.remaining/1000).toFixed(0)}k</div>
                  </div>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Status</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{site.status}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#1f2937' }}>Budget Utilization</div>
                  <div style={{ height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(metrics.percentSpent, 100)}%`,
                        background: metrics.percentSpent > 90 ? '#dc2626' : metrics.percentSpent > 75 ? '#f59e0b' : '#10b981',
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                    {metrics.percentSpent > 90 && '⚠️ Critical: Over 90% spent'}
                    {metrics.percentSpent > 75 && metrics.percentSpent <= 90 && '⚠️ Warning: Over 75% spent'}
                    {metrics.percentSpent <= 75 && '✅ On track'}
                  </div>
                </div>

                {/* Quick Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  <div style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>📦 Materials</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{site.materials.length} items</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                      Total: ${site.materials.reduce((s, m) => s + (m.quantity * m.unitCost), 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>👷 Contractors</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{site.contractors.length} active</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                      Total BOQ: ${site.contractors.reduce((s, c) => s + (c.boqTotal || 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MATERIALS TAB */}
            {activeTab === 'materials' && site && (
              <div>
                <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Materials & Supplies</h2>

                {/* Add Material Form */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#7c3aed', fontSize: '14px' }}>+ Add Material</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    <input placeholder="Material Name" value={newMaterial.name} onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                    <input placeholder="Quantity" type="number" value={newMaterial.quantity} onChange={(e) => setNewMaterial({...newMaterial, quantity: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                    <input placeholder="Unit (m³, ton, etc)" value={newMaterial.unit} onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                    <input placeholder="Unit Cost ($)" type="number" value={newMaterial.unitCost} onChange={(e) => setNewMaterial({...newMaterial, unitCost: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                    <input placeholder="Supplier" value={newMaterial.supplier} onChange={(e) => setNewMaterial({...newMaterial, supplier: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                    <input placeholder="Delivery Date" type="date" value={newMaterial.deliveryDate} onChange={(e) => setNewMaterial({...newMaterial, deliveryDate: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                    <button onClick={addMaterialToSite} style={{ padding: '8px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                      <Plus size={16} style={{ display: 'inline', marginRight: '4px' }} /> Add
                    </button>
                  </div>
                </div>

                {/* Materials Table */}
                <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Material</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Qty</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Unit</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Unit Cost</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Total</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Supplier</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {site.materials.map(m => (
                        <tr key={m.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px' }}>{m.name}</td>
                          <td style={{ padding: '12px' }}>{m.quantity}</td>
                          <td style={{ padding: '12px' }}>{m.unit}</td>
                          <td style={{ padding: '12px' }}>${m.unitCost}</td>
                          <td style={{ padding: '12px', fontWeight: '600', color: '#7c3aed' }}>${(m.quantity * m.unitCost).toLocaleString()}</td>
                          <td style={{ padding: '12px', fontSize: '12px' }}>{m.supplier || '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button onClick={() => deleteMaterial(m.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {site.materials.length === 0 && <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>No materials added yet</div>}
                </div>
              </div>
            )}

            {/* CONTRACTORS TAB */}
            {activeTab === 'contractors' && site && (
              <div>
                <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Contractors & BOQ</h2>

                {/* Add Contractor Form */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#7c3aed', fontSize: '14px' }}>+ Hire Contractor</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    <input placeholder="Contractor Name" value={newContractor.name} onChange={(e) => setNewContractor({...newContractor, name: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                    <input placeholder="Scope of Work" value={newContractor.scope} onChange={(e) => setNewContractor({...newContractor, scope: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                    <input placeholder="BOQ Total ($)" type="number" value={newContractor.boqTotal} onChange={(e) => setNewContractor({...newContractor, boqTotal: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                    <select value={newContractor.status} onChange={(e) => setNewContractor({...newContractor, status: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}>
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                    <button onClick={addContractorToSite} style={{ padding: '8px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                      <Plus size={16} style={{ display: 'inline', marginRight: '4px' }} /> Add
                    </button>
                  </div>
                </div>

                {/* Contractors Table */}
                <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Contractor</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Scope</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>BOQ Total</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Paid</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Balance</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {site.contractors.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px' }}>{c.name}</td>
                          <td style={{ padding: '12px' }}>{c.scope}</td>
                          <td style={{ padding: '12px', fontWeight: '600', color: '#7c3aed' }}>${c.boqTotal?.toLocaleString()}</td>
                          <td style={{ padding: '12px', color: '#10b981' }}>${c.paid?.toLocaleString()}</td>
                          <td style={{ padding: '12px', color: '#d97706' }}>${(c.boqTotal - c.paid)?.toLocaleString()}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: c.status === 'Completed' ? '#d1fae5' : c.status === 'In Progress' ? '#fef3c7' : '#f3f4f6', color: c.status === 'Completed' ? '#065f46' : c.status === 'In Progress' ? '#92400e' : '#374151', padding: '3px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600' }}>
                              {c.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button onClick={() => deleteContractor(c.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {site.contractors.length === 0 && <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>No contractors assigned yet</div>}
                </div>
              </div>
            )}

            {/* FINANCIALS TAB */}
            {activeTab === 'financials' && (
              <div>
                <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Financial Dashboard</h2>

                {/* All Sites Summary */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#7c3aed', fontSize: '16px' }}>All Projects Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                    <div style={{ padding: '15px', background: '#f3f4f6', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Total Budget</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>${(allMetrics.totalBudget/1000).toFixed(0)}k</div>
                    </div>
                    <div style={{ padding: '15px', background: '#fef3c7', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '5px' }}>Total Spent</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>${(allMetrics.totalSpent/1000).toFixed(0)}k</div>
                    </div>
                    <div style={{ padding: '15px', background: '#e0f2fe', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#0c4a6e', marginBottom: '5px' }}>Total Remaining</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0369a1' }}>${(allMetrics.totalRemaining/1000).toFixed(0)}k</div>
                    </div>
                    <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '5px' }}>% Spent</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{allMetrics.avgSpent}%</div>
                    </div>
                  </div>
                </div>

                {/* Site Breakdown */}
                <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: 0, color: '#1f2937', fontSize: '16px' }}>Cost Breakdown by Project</h3>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Project</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Budget</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Spent</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Remaining</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>% Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map(s => {
                        const m = calculateSiteMetrics(s);
                        return (
                          <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{s.name}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>${(s.budget/1000).toFixed(0)}k</td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#d97706', fontWeight: '600' }}>${(m.spent/1000).toFixed(0)}k</td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#059669' }}>${(m.remaining/1000).toFixed(0)}k</td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: m.percentSpent > 75 ? '#d97706' : '#059669' }}>{m.percentSpent}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Export Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                  <button
                    onClick={exportToExcel}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Download size={18} /> Download Excel
                  </button>
                  <button
                    onClick={generatePDFReport}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <FileText size={18} /> Generate PDF
                  </button>
                </div>
              </div>
            )}

            {/* AI ADVISOR TAB */}
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h2 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>🤖 AI Financial Advisor</h2>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 15px 0' }}>
                  Get instant analysis on budgets, cost optimization, risks, and recommendations. AI learns from all your project data.
                </p>

                {/* Chat */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  background: 'white',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  {messages.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: msg.role === 'user' ? '#d97706' : '#f3f4f6',
                        color: msg.role === 'user' ? 'white' : '#1f2937',
                        lineHeight: '1.5',
                        fontSize: '13px'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div style={{ color: '#6b7280', fontSize: '13px' }}>🤔 Analyzing your financials...</div>}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about budget risks, cost savings, payment schedules..."
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !input.trim()}
                    style={{
                      padding: '10px 16px',
                      background: loading || !input.trim() ? '#d1d5db' : '#d97706',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading || !input.trim() ? 'default' : 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Send size={16} /> Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstructionFinanceApp;
