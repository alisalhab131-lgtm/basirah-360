import React, { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Plus, Send, FileText, Home, Tag, X, Check, Edit2, Save } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Concrete & Masonry',
  'Steel & Metal',
  'Timber & Wood',
  'Electrical',
  'Plumbing',
  'Finishes',
  'Earthworks',
  'Equipment',
  'Safety',
];

const PRESET_CONTRACTORS = [
  'Al Bayan Contracting',
  'Gulf Build Co.',
  'Al Masa Engineering',
  'Horizon Contractors',
  'Delta Civil Works',
  'Apex Construction',
  'Nile Infrastructure',
  'Pinnacle Builders',
  'Cornerstone Group',
  'Landmark Civil',
];

const CONTRACTOR_SCOPES = [
  'Foundation Work',
  'Structural Works',
  'Concrete Works',
  'MEP Works',
  'Finishing Works',
  'Earthworks & Grading',
  'Steel Fabrication',
  'Roofing',
  'Painting & Coating',
  'Flooring',
  'Landscaping',
  'Site Clearance',
];

const ConstructionFinanceApp = () => {

  // ==================== STATE ====================
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('cfCategories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const [sites, setSites] = useState(() => {
    const saved = localStorage.getItem('constructionSites');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        name: 'Downtown Office Complex',
        location: 'Downtown',
        ownerName: 'Global Investments LLC',
        amountReceived: 100000,
        status: 'In Progress',
        startDate: '2024-01-15',
        budget: 500000,
        materials: [
          { id: 'm1', name: 'Concrete', category: 'Concrete & Masonry', quantity: 250, unit: 'm³', unitCost: 150, totalQty: 250, supplier: 'BuildCo Supply', deliveryDate: '2024-02-01', condition: 'Good', notes: 'Ready-mix' },
          { id: 'm2', name: 'Steel Rebar', category: 'Steel & Metal', quantity: 50, unit: 'ton', unitCost: 800, totalQty: 50, supplier: 'Steel Ltd', deliveryDate: '2024-02-05', condition: 'Good', notes: 'Grade 60' },
        ],
        contractors: [
          { id: 'c1', name: 'Al Bayan Contracting', scope: 'Foundation Work', unit: 'm²', pricePerUnit: 400, quantity: 300, boqTotal: 120000, paid: 60000, retention: 10, startDate: '2024-01-20', endDate: '2024-04-20', status: 'In Progress', contact: '+966 50 000 0001', notes: 'Phase 1 complete' },
        ]
      }
    ];
  });

  const [currentSiteId, setCurrentSiteId] = useState(sites[0]?.id || null);
  const [activeTab, setActiveTab] = useState('overview');

  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to Construction Finance AI. Ask about budgets, risks, cost savings, or contractor performance.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Site form
  const [newSite, setNewSite] = useState({ name: '', location: '', ownerName: '', amountReceived: '', budget: '', startDate: '' });

  // Material form
  const emptyMat = { name: '', category: '', quantity: '', unit: '', unitCost: '', totalQty: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' };
  const [newMaterial, setNewMaterial] = useState(emptyMat);
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('All');

  // Contractor form
  const emptyCon = { name: '', scope: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' };
  const [newContractor, setNewContractor] = useState(emptyCon);
  const [contractorNameMode, setContractorNameMode] = useState('preset'); 
  const [customContractorName, setCustomContractorName] = useState('');

  // Editing state for Overview Tab
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({ budget: '', amountReceived: '', ownerName: '' });

  // Persist
  useEffect(() => { localStorage.setItem('constructionSites', JSON.stringify(sites)); }, [sites]);
  useEffect(() => { localStorage.setItem('cfCategories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Sync edit form when switching sites
  useEffect(() => {
    const site = sites.find(s => s.id === currentSiteId);
    if (site) {
      setEditFormData({ budget: site.budget, amountReceived: site.amountReceived || 0, ownerName: site.ownerName || '' });
      setEditMode(false);
    }
  }, [currentSiteId, sites]);

  // ==================== HELPERS ====================
  const getCurrentSite = () => sites.find(s => s.id === currentSiteId);

  const calcMetrics = (site) => {
    if (!site) return { matSpent: 0, conPaid: 0, spent: 0, remaining: 0, pct: '0.0', received: 0 };
    const matSpent = site.materials.reduce((s, m) => s + m.quantity * m.unitCost, 0);
    const conPaid  = site.contractors.reduce((s, c) => s + (c.paid || 0), 0);
    const spent    = matSpent + conPaid;
    const remaining = site.budget - spent;
    const pct = site.budget ? (spent / site.budget * 100).toFixed(1) : '0.0';
    const received = parseFloat(site.amountReceived) || 0;
    return { matSpent, conPaid, spent, remaining, pct, received };
  };

  const calcAll = () => {
    const totalBudget  = sites.reduce((s, x) => s + parseFloat(x.budget || 0), 0);
    const totalSpent   = sites.reduce((s, x) => s + calcMetrics(x).spent, 0);
    const totalReceived = sites.reduce((s, x) => s + parseFloat(x.amountReceived || 0), 0);
    return { 
      totalBudget, 
      totalSpent, 
      totalRemaining: totalBudget - totalSpent, 
      totalReceived,
      cashFlow: totalReceived - totalSpent,
      pct: totalBudget ? (totalSpent / totalBudget * 100).toFixed(1) : '0.0' 
    };
  };

  // ==================== MUTATIONS ====================
  const addSite = () => {
    if (!newSite.name || !newSite.budget) return;
    const s = { 
      id: Date.now(), 
      ...newSite, 
      budget: parseFloat(newSite.budget), 
      amountReceived: parseFloat(newSite.amountReceived) || 0,
      status: 'Planning', 
      materials: [], 
      contractors: [] 
    };
    setSites([...sites, s]);
    setCurrentSiteId(s.id);
    setNewSite({ name: '', location: '', ownerName: '', amountReceived: '', budget: '', startDate: '' });
  };

  const deleteSite = (id) => {
    if (window.confirm('Are you sure you want to delete this project and all its data?')) {
      const newSites = sites.filter(s => s.id !== id);
      setSites(newSites);
      if (currentSiteId === id) {
        setCurrentSiteId(newSites.length > 0 ? newSites[0].id : null);
      }
    }
  };

  const saveSiteEdits = () => {
    setSites(sites.map(s => s.id === currentSiteId ? { 
      ...s, 
      budget: parseFloat(editFormData.budget) || 0,
      amountReceived: parseFloat(editFormData.amountReceived) || 0,
      ownerName: editFormData.ownerName
    } : s));
    setEditMode(false);
  };

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.quantity || !newMaterial.unitCost) return;
    setSites(sites.map(s => s.id !== currentSiteId ? s : {
      ...s, materials: [...s.materials, {
        id: `m${Date.now()}`,
        ...newMaterial,
        quantity: parseFloat(newMaterial.quantity),
        unitCost: parseFloat(newMaterial.unitCost),
        totalQty: parseFloat(newMaterial.totalQty || newMaterial.quantity),
      }]
    }));
    setNewMaterial(emptyMat);
  };

  const addContractor = () => {
    const name = contractorNameMode === 'new' ? customContractorName : newContractor.name;
    const qty = parseFloat(newContractor.quantity) || 0;
    const ppu = parseFloat(newContractor.pricePerUnit) || 0;
    if (!name || !newContractor.scope || !qty || !ppu) return;
    setSites(sites.map(s => s.id !== currentSiteId ? s : {
      ...s, contractors: [...s.contractors, {
        id: `c${Date.now()}`,
        ...newContractor,
        name,
        quantity: qty,
        pricePerUnit: ppu,
        boqTotal: qty * ppu,
        paid: parseFloat(newContractor.paid) || 0,
        retention: parseFloat(newContractor.retention) || 0,
      }]
    }));
    setNewContractor(emptyCon);
    setCustomContractorName('');
    setContractorNameMode('preset');
  };

  const deleteMaterial   = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, materials:   s.materials.filter(m => m.id !== id) }));
  const deleteContractor = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, contractors: s.contractors.filter(c => c.id !== id) }));

  const addCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed && !categories.includes(trimmed)) setCategories([...categories, trimmed]);
    setNewCategoryInput('');
    setShowAddCategory(false);
  };

  const removeCategory = (cat) => setCategories(categories.filter(c => c !== cat));

  // ==================== AI ====================
  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input; setInput('');
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const site = getCurrentSite();
      const m = calcMetrics(site);
      const ctx = `SITE: ${site?.name} | Budget: $${site?.budget} | Spent: $${m.spent} | Received: $${m.received}`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 600,
          system: `You are a construction financial advisor. Be direct.\n\nData:\n${ctx}`,
          messages: messages.filter(x => x.role !== 'system').concat([{ role: 'user', content: msg }])
        })
      });
      const data = await res.json();
      setMessages(p => [...p, { role: 'assistant', content: data.content[0]?.text || 'Error.' }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally { setLoading(false); }
  };

  // ==================== EXPORTS (SINGLE SITE) ====================
  const exportSiteCSV = () => {
    const site = getCurrentSite();
    if (!site) return;
    const m = calcMetrics(site);
    let csv = `CONSTRUCTION FINANCE REPORT\nSite: ${site.name}\nOwner: ${site.ownerName||''}\nReceived,$${m.received}\nBudget,$${site.budget}\nSpent,$${m.spent}\nRemaining Budget,$${m.remaining}\n\n`;
    csv += `MATERIALS\nName,Category,Qty Received,Total Qty,Unit,Price/Unit,Total Cost,Supplier,Delivery,Condition,Notes\n`;
    site.materials.forEach(x => { csv += `${x.name},${x.category},${x.quantity},${x.totalQty},${x.unit},${x.unitCost},${x.quantity*x.unitCost},${x.supplier||''},${x.deliveryDate||''},${x.condition||''},${x.notes||''}\n`; });
    csv += `\nCONTRACTORS BOQ\nName,Scope,Unit,Price/Unit,Quantity,BOQ Total,Paid,Retention%,Balance,Start,End,Status,Contact,Notes\n`;
    site.contractors.forEach(x => { csv += `${x.name},${x.scope},${x.unit},${x.pricePerUnit},${x.quantity},${x.boqTotal},${x.paid},${x.retention}%,${x.boqTotal-x.paid},${x.startDate||''},${x.endDate||''},${x.status},${x.contact||''},${x.notes||''}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `site_report_${site.name}_${Date.now()}.csv`; a.click();
  };

  const exportSitePDF = () => {
    const site = getCurrentSite();
    if (!site) return;
    const m = calcMetrics(site);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Site Report - ${site.name}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 30px; color: #1f2937; line-height: 1.5; }
            h1 { color: #d97706; margin-bottom: 5px; }
            h2 { color: #374151; font-size: 18px; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;}
            .summary-box { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; text-align: left; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .total-row td { font-weight: bold; background-color: #fef9c3; }
          </style>
        </head>
        <body>
          <h1>Site Report: ${site.name}</h1>
          <div class="summary-box">
            <p><strong>Owner Name:</strong> ${site.ownerName || 'N/A'}</p>
            <p><strong>Total Received:</strong> $${m.received.toLocaleString()}</p>
            <p><strong>Total Budget:</strong> $${site.budget.toLocaleString()}</p>
            <p><strong>Total Spent:</strong> $${m.spent.toLocaleString()} (${m.pct}% of budget)</p>
            <p><strong>Remaining Budget:</strong> $${m.remaining.toLocaleString()}</p>
          </div>
          <h2>Materials</h2>
          <table><tr><th>Name</th><th>Qty</th><th>Total Cost</th></tr>${site.materials.map(mat => `<tr><td>${mat.name}</td><td>${mat.quantity}</td><td>$${(mat.quantity * mat.unitCost).toLocaleString()}</td></tr>`).join('')}</table>
          <h2>Contractors</h2>
          <table><tr><th>Name</th><th>BOQ Total</th><th>Paid</th><th>Balance</th></tr>${site.contractors.map(c => `<tr><td>${c.name}</td><td>$${(c.boqTotal || 0).toLocaleString()}</td><td>$${(c.paid || 0).toLocaleString()}</td><td>$${((c.boqTotal || 0) - (c.paid || 0)).toLocaleString()}</td></tr>`).join('')}</table>
          <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 250); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ==================== EXPORTS (GLOBAL) ====================
  const exportGlobalCSV = () => {
    let csv = `GLOBAL FINANCIAL DASHBOARD\nProject,Owner,Amount Received,Budget,Spent,Remaining Budget,% Used\n`;
    sites.forEach(s => {
      const m = calcMetrics(s);
      csv += `${s.name},${s.ownerName||''},${s.amountReceived||0},${s.budget},${m.spent},${m.remaining},${m.pct}%\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `global_dashboard_${Date.now()}.csv`; a.click();
  };

  const exportGlobalPDF = () => {
    const allM = calcAll();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Global Financial Dashboard</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 30px; color: #1f2937; line-height: 1.5; }
            h1 { color: #7c3aed; margin-bottom: 5px; }
            .summary-box { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; text-align: left; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; }
            th { background-color: #f3f4f6; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Global Financial Dashboard</h1>
          <div class="summary-box">
            <p><strong>Total Projects:</strong> ${sites.length}</p>
            <p><strong>Total Received (All Owners):</strong> $${allM.totalReceived.toLocaleString()}</p>
            <p><strong>Total Global Budget:</strong> $${allM.totalBudget.toLocaleString()}</p>
            <p><strong>Total Global Spent:</strong> $${allM.totalSpent.toLocaleString()}</p>
            <p><strong>Overall Cash Flow (Received - Spent):</strong> $${allM.cashFlow.toLocaleString()}</p>
          </div>
          <table>
            <tr><th>Project</th><th>Owner</th><th>Received</th><th>Budget</th><th>Spent</th><th>Remaining</th></tr>
            ${sites.map(s => {
              const m = calcMetrics(s);
              return `<tr><td>${s.name}</td><td>${s.ownerName||'-'}</td><td>$${(s.amountReceived||0).toLocaleString()}</td><td>$${s.budget.toLocaleString()}</td><td>$${m.spent.toLocaleString()}</td><td>$${m.remaining.toLocaleString()}</td></tr>`;
            }).join('')}
          </table>
          <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 250); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };


  // ==================== STYLES ====================
  const site = getCurrentSite();
  const metrics = site ? calcMetrics(site) : {};
  const allM = calcAll();

  const TH = { padding: '11px 14px', textAlign: 'left', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap', color: '#374151', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' };
  const TD = { padding: '11px 14px', verticalAlign: 'middle', fontSize: '13px', borderBottom: '1px solid #f0f0f0', color: '#1f2937' };
  const inp = { padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', width: '100%', boxSizing: 'border-box' };
  const btn = (bg, fg = 'white') => ({ padding: '8px 14px', background: bg, color: fg, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' });

  const statusBadge = (s) => {
    const map = { Completed: ['#d1fae5','#065f46'], 'In Progress': ['#fef3c7','#92400e'], Pending: ['#f3f4f6','#374151'] };
    const [bg, col] = map[s] || map.Pending;
    return <span style={{ background: bg, color: col, padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>{s}</span>;
  };

  const filteredMats = site?.materials.filter(m => materialCategoryFilter === 'All' || m.category === materialCategoryFilter) || [];
  const boqPreview = parseFloat(newContractor.pricePerUnit || 0) * parseFloat(newContractor.quantity || 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #d97706 0%, #7c3aed 100%)', color: 'white', padding: '28px 32px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px' }}>🏗️ Construction Finance Manager</h1>
        <p style={{ margin: 0, opacity: 0.85, fontSize: '14px' }}>Sites · Materials · Contractors BOQ · Financial Dashboards</p>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 90px)' }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width: '250px', minWidth: '250px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '18px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            <Home size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Projects
          </div>

          {sites.map(s => {
            const m = calcMetrics(s);
            return (
              <div key={s.id} onClick={() => setCurrentSiteId(s.id)} style={{ padding: '10px', background: currentSiteId === s.id ? '#fef3c7' : '#f9fafb', border: `2px solid ${currentSiteId === s.id ? '#d97706' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1f2937' }}>{s.name}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{s.ownerName || s.location}</div>
                <div style={{ fontSize: '11px', color: '#d97706', fontWeight: '600', marginTop: 3 }}>
                  ${(s.budget / 1000).toFixed(0)}k · {m.pct}% used
                </div>
              </div>
            );
          })}

          <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>+ New Project</div>
            <input placeholder="Project Name" value={newSite.name} onChange={e => setNewSite({...newSite,name:e.target.value})} style={{ ...inp, marginBottom: '6px', fontSize: '12px' }} />
            <input placeholder="Owner Name" value={newSite.ownerName} onChange={e => setNewSite({...newSite,ownerName:e.target.value})} style={{ ...inp, marginBottom: '6px', fontSize: '12px' }} />
            <input placeholder="Location" value={newSite.location} onChange={e => setNewSite({...newSite,location:e.target.value})} style={{ ...inp, marginBottom: '6px', fontSize: '12px' }} />
            <input placeholder="Amount Received ($)" type="number" value={newSite.amountReceived} onChange={e => setNewSite({...newSite,amountReceived:e.target.value})} style={{ ...inp, marginBottom: '6px', fontSize: '12px' }} />
            <input placeholder="Total Budget ($)" type="number" value={newSite.budget} onChange={e => setNewSite({...newSite,budget:e.target.value})} style={{ ...inp, marginBottom: '6px', fontSize: '12px' }} />
            <input type="date" value={newSite.startDate} onChange={e => setNewSite({...newSite,startDate:e.target.value})} style={{ ...inp, marginBottom: '8px', fontSize: '12px' }} />
            <button onClick={addSite} style={{ ...btn('#d97706'), width: '100%', justifyContent: 'center', fontSize: '12px' }}>
              <Plus size={14} /> Add Project
            </button>
          </div>
        </div>

        {/* ── MAIN AREA ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* TABS */}
          <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
            {[
              { id: 'overview',     label: '📊 Overview' },
              { id: 'materials',    label: '📦 Materials' },
              { id: 'contractors',  label: '👷 Contractors BOQ' },
              { id: 'financials',   label: '🌍 Global Dashboard' },
              { id: 'ai',           label: '🤖 AI Advisor' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '14px 20px', border: 'none', background: 'none', borderBottom: activeTab === t.id ? '3px solid #d97706' : '3px solid transparent', cursor: 'pointer', fontWeight: activeTab === t.id ? '700' : '400', color: activeTab === t.id ? '#d97706' : '#6b7280', whiteSpace: 'nowrap', fontSize: '14px' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>

            {/* ═══════════ OVERVIEW ═══════════ */}
            {activeTab === 'overview' && site && (
              <div>
                {/* Header Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <h2 style={{ margin: 0, color: '#1f2937', fontSize: '24px' }}>{site.name}</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={exportSiteCSV} style={btn('#059669')}><Download size={14} /> CSV Report</button>
                    <button onClick={exportSitePDF} style={btn('#dc2626')}><FileText size={14} /> PDF Report</button>
                    <button onClick={() => deleteSite(site.id)} style={btn('#ef4444')}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>

                {/* Primary Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px', marginBottom: '20px' }}>
                  
                  {/* Edit Form Area */}
                  <div style={{ background: 'white', padding: '18px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Project Funding Details</span>
                      {!editMode ? (
                        <button onClick={() => setEditMode(true)} style={{ background: 'none', border: 'none', color: '#d97706', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><Edit2 size={14}/> Edit Details</button>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={saveSiteEdits} style={btn('#10b981')}><Save size={14}/> Save</button>
                          <button onClick={() => { setEditMode(false); setEditFormData({ budget: site.budget, amountReceived: site.amountReceived||0, ownerName: site.ownerName||'' }); }} style={btn('#6b7280')}>Cancel</button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>OWNER / CLIENT NAME</div>
                        {editMode ? <input value={editFormData.ownerName} onChange={e => setEditFormData({...editFormData, ownerName: e.target.value})} style={inp} /> : <div style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937' }}>{site.ownerName || '—'}</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>TOTAL BUDGET</div>
                        {editMode ? <input type="number" value={editFormData.budget} onChange={e => setEditFormData({...editFormData, budget: e.target.value})} style={inp} /> : <div style={{ fontSize: '20px', fontWeight: '800', color: '#d97706' }}>${site.budget.toLocaleString()}</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>MONEY RECEIVED FROM OWNER</div>
                        {editMode ? <input type="number" value={editFormData.amountReceived} onChange={e => setEditFormData({...editFormData, amountReceived: e.target.value})} style={inp} /> : <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>${metrics.received.toLocaleString()}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Standard Metric Cards */}
                  {[
                    { l: 'Material Spend',       v: `$${metrics.matSpent?.toLocaleString()}`,     c: '#7c3aed' },
                    { l: 'Contractor Payments',  v: `$${metrics.conPaid?.toLocaleString()}`,      c: '#0369a1' },
                    { l: 'Total Spent',          v: `$${metrics.spent?.toLocaleString()}`,        c: '#dc2626' },
                    { l: 'Remaining Budget',     v: `$${metrics.remaining?.toLocaleString()}`,    c: '#059669' },
                    { l: 'Current Cash Flow (Rec - Spent)', v: `$${(metrics.received - metrics.spent).toLocaleString()}`, c: (metrics.received - metrics.spent) < 0 ? '#dc2626' : '#059669' },
                  ].map(card => (
                    <div key={card.l} style={{ background: 'white', padding: '18px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{card.l}</div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: card.c }}>{card.v}</div>
                    </div>
                  ))}
                </div>

                {/* Budget bar */}
                <div style={{ background: 'white', padding: '18px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    <span>Budget Utilization</span><span>{metrics.pct}%</span>
                  </div>
                  <div style={{ height: '14px', background: '#e5e7eb', borderRadius: '7px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(metrics.pct, 100)}%`, background: metrics.pct > 90 ? '#dc2626' : metrics.pct > 75 ? '#f59e0b' : '#10b981', transition: 'width 0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ MATERIALS ═══════════ */}
            {/* Same as before... (omitted to save space, assuming unchanged except for dark text logic which is already in the main constants) */}
            {activeTab === 'materials' && site && (
              <div>
                <h2 style={{ margin: '0 0 18px', color: '#1f2937', fontSize: '20px' }}>Materials & Supplies</h2>

                {/* Add Material Form */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontWeight: '700', color: '#7c3aed', marginBottom: '14px', fontSize: '14px' }}>+ Add Material</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Material Name *</div>
                      <input placeholder="e.g. Concrete, Rebar" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial,name:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        Category *
                        <button onClick={() => setShowAddCategory(!showAddCategory)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: '11px', padding: 0, fontWeight: '600' }}>
                          {showAddCategory ? 'Cancel' : '+ New'}
                        </button>
                      </div>
                      {showAddCategory ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input placeholder="New category name" value={newCategoryInput} onChange={e => setNewCategoryInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addCategory()} style={{ ...inp, flex: 1 }} />
                          <button onClick={addCategory} style={{ ...btn('#7c3aed'), padding: '8px 10px' }}><Check size={14} /></button>
                        </div>
                      ) : (
                        <select value={newMaterial.category} onChange={e => setNewMaterial({...newMaterial,category:e.target.value})} style={inp}>
                          <option value="">Select category</option>
                          {categories.map(c => <option key={c}>{c}</option>)}
                        </select>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Qty Received *</div>
                      <input placeholder="e.g. 250" type="number" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial,quantity:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Total Ordered Qty</div>
                      <input placeholder="e.g. 300" type="number" value={newMaterial.totalQty} onChange={e => setNewMaterial({...newMaterial,totalQty:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Unit</div>
                      <input placeholder="m³, ton, bag, pcs" value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial,unit:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Price per Unit ($) *</div>
                      <input placeholder="e.g. 150" type="number" value={newMaterial.unitCost} onChange={e => setNewMaterial({...newMaterial,unitCost:e.target.value})} style={inp} />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={addMaterial} style={btn('#7c3aed')}><Plus size={15} /> Add Material</button>
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: '10px', overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={TH}>Material Name</th><th style={TH}>Category</th><th style={TH}>Qty</th><th style={TH}>Unit Price</th><th style={TH}>Total Cost</th><th style={{ ...TH, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMats.map((m, i) => (
                        <tr key={m.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ ...TD, fontWeight: '700' }}>{m.name}</td>
                          <td style={TD}><span style={{ background: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{m.category || '—'}</span></td>
                          <td style={TD}>{m.quantity} {m.unit}</td>
                          <td style={TD}>${m.unitCost.toLocaleString()}</td>
                          <td style={{ ...TD, fontWeight: '800', color: '#7c3aed' }}>${(m.quantity * m.unitCost).toLocaleString()}</td>
                          <td style={{ ...TD, textAlign: 'center' }}><button onClick={() => deleteMaterial(m.id)} style={btn('#ef4444')}><Trash2 size={13} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════ CONTRACTORS BOQ ═══════════ */}
            {activeTab === 'contractors' && site && (
              <div>
                <h2 style={{ margin: '0 0 18px', color: '#1f2937', fontSize: '20px' }}>Contractors & BOQ</h2>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontWeight: '700', color: '#d97706', marginBottom: '14px', fontSize: '14px' }}>+ Add Contractor</div>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>CONTRACTOR NAME *</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <button onClick={() => setContractorNameMode('preset')} style={{ ...btn(contractorNameMode === 'preset' ? '#d97706' : '#f3f4f6', contractorNameMode === 'preset' ? 'white' : '#374151'), fontSize: '12px' }}>Select from List</button>
                      <button onClick={() => { setContractorNameMode('new'); setNewContractor({...newContractor, name: ''}); }} style={{ ...btn(contractorNameMode === 'new' ? '#d97706' : '#f3f4f6', contractorNameMode === 'new' ? 'white' : '#374151'), fontSize: '12px' }}><Plus size={13} /> Add New Contractor</button>
                    </div>
                    {contractorNameMode === 'preset' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {PRESET_CONTRACTORS.map(name => (
                          <button key={name} onClick={() => setNewContractor({...newContractor, name})} style={{ padding: '6px 12px', borderRadius: '20px', border: `1.5px solid ${newContractor.name === name ? '#d97706' : '#e5e7eb'}`, background: newContractor.name === name ? '#fef3c7' : 'white', color: newContractor.name === name ? '#92400e' : '#374151', fontSize: '12px', cursor: 'pointer', fontWeight: newContractor.name === name ? '700' : '400' }}>
                            {newContractor.name === name ? '✓ ' : ''}{name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input placeholder="Type new contractor name" value={customContractorName} onChange={e => setCustomContractorName(e.target.value)} style={{ ...inp, maxWidth: '360px' }} />
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Scope of Work *</div>
                      <select value={newContractor.scope} onChange={e => setNewContractor({...newContractor,scope:e.target.value})} style={inp}>
                        <option value="">Select scope</option>
                        {CONTRACTOR_SCOPES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Unit</div><input placeholder="m², lump sum" value={newContractor.unit} onChange={e => setNewContractor({...newContractor,unit:e.target.value})} style={inp} /></div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Price/Unit ($) *</div><input type="number" value={newContractor.pricePerUnit} onChange={e => setNewContractor({...newContractor,pricePerUnit:e.target.value})} style={inp} /></div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Total Qty *</div><input type="number" value={newContractor.quantity} onChange={e => setNewContractor({...newContractor,quantity:e.target.value})} style={inp} /></div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Amount Paid ($)</div><input type="number" value={newContractor.paid} onChange={e => setNewContractor({...newContractor,paid:e.target.value})} style={inp} /></div>
                  </div>
                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={addContractor} style={btn('#d97706')}><Plus size={15} /> Add to BOQ</button>
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: '10px', overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={TH}>Contractor</th><th style={TH}>Scope</th><th style={TH}>BOQ Total</th><th style={TH}>Amount Paid</th><th style={TH}>Balance Due</th><th style={{ ...TH, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {site.contractors.map((c, i) => (
                        <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ ...TD, fontWeight: '700' }}>{c.name}</td>
                          <td style={TD}>{c.scope}</td>
                          <td style={{ ...TD, fontWeight: '800', color: '#7c3aed' }}>${(c.boqTotal || 0).toLocaleString()}</td>
                          <td style={{ ...TD, fontWeight: '700', color: '#059669' }}>${(c.paid || 0).toLocaleString()}</td>
                          <td style={{ ...TD, fontWeight: '800', color: ((c.boqTotal||0)-(c.paid||0)) > 0 ? '#d97706' : '#059669' }}>${((c.boqTotal||0)-(c.paid||0)).toLocaleString()}</td>
                          <td style={{ ...TD, textAlign: 'center' }}><button onClick={() => deleteContractor(c.id)} style={btn('#ef4444')}><Trash2 size={13} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════ GLOBAL FINANCIAL DASHBOARD ═══════════ */}
            {activeTab === 'financials' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, color: '#1f2937', fontSize: '24px' }}>🌍 Global Financial Dashboard</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={exportGlobalCSV} style={btn('#059669')}><Download size={14} /> Global CSV</button>
                    <button onClick={exportGlobalPDF} style={btn('#dc2626')}><FileText size={14} /> Global PDF</button>
                  </div>
                </div>

                {/* Global Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { l: 'Total Received (All Owners)', v: `$${allM.totalReceived.toLocaleString()}`, bg: '#ecfdf5', c: '#059669' },
                    { l: 'Total Global Budget', v: `$${allM.totalBudget.toLocaleString()}`, bg: '#f3f4f6', c: '#1f2937' },
                    { l: 'Total Global Spent', v: `$${allM.totalSpent.toLocaleString()}`, bg: '#fef2f2', c: '#dc2626' },
                    { l: 'Global Cash Flow (Rec - Spent)', v: `$${allM.cashFlow.toLocaleString()}`, bg: allM.cashFlow < 0 ? '#fef2f2' : '#f0fdf4', c: allM.cashFlow < 0 ? '#dc2626' : '#16a34a' },
                  ].map(card => (
                    <div key={card.l} style={{ padding: '20px', background: card.bg, borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase' }}>{card.l}</div>
                      <div style={{ fontSize: '26px', fontWeight: '800', color: card.c }}>{card.v}</div>
                    </div>
                  ))}
                </div>

                {/* Global Table */}
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: '700', color: '#1f2937', fontSize: '16px' }}>All Projects Breakdown</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        {['Project Name', 'Owner', 'Received Funding', 'Total Budget', 'Total Spent', 'Remaining Budget', '% Used'].map(h => (
                          <th key={h} style={{ ...TH, textAlign: h === 'Project Name' || h === 'Owner' ? 'left' : 'right' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((s, i) => {
                        const m = calcMetrics(s);
                        return (
                          <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                            <td style={{ ...TD, fontWeight: '700' }}>{s.name}</td>
                            <td style={{ ...TD }}>{s.ownerName || '—'}</td>
                            <td style={{ ...TD, textAlign: 'right', fontWeight: '700', color: '#059669' }}>${m.received.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right' }}>${s.budget.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', fontWeight: '700', color: '#dc2626' }}>${m.spent.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', color: '#0369a1' }}>${m.remaining.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', fontWeight: '700', color: m.pct > 75 ? '#d97706' : '#059669' }}>{m.pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#fef9c3' }}>
                        <td colSpan={2} style={{ ...TD, fontWeight: '800', color: '#92400e' }}>GLOBAL TOTALS</td>
                        <td style={{ ...TD, textAlign: 'right', fontWeight: '800', color: '#059669' }}>${allM.totalReceived.toLocaleString()}</td>
                        <td style={{ ...TD, textAlign: 'right', fontWeight: '800' }}>${allM.totalBudget.toLocaleString()}</td>
                        <td style={{ ...TD, textAlign: 'right', fontWeight: '800', color: '#dc2626' }}>${allM.totalSpent.toLocaleString()}</td>
                        <td style={{ ...TD, textAlign: 'right', fontWeight: '800', color: '#0369a1' }}>${allM.totalRemaining.toLocaleString()}</td>
                        <td style={{ ...TD, textAlign: 'right', fontWeight: '800' }}>{allM.pct}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════ AI ADVISOR ═══════════ */}
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ margin: '0 0 6px', color: '#1f2937', fontSize: '20px' }}>🤖 AI Financial Advisor</h2>
                <div style={{ overflowY: 'auto', background: 'white', borderRadius: '10px', padding: '16px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', minHeight: '320px', maxHeight: '480px' }}>
                  {messages.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '72%', padding: '12px 14px', borderRadius: '10px', background: msg.role === 'user' ? '#d97706' : '#f3f4f6', color: msg.role === 'user' ? 'white' : '#1f2937', lineHeight: '1.6', fontSize: '13px' }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div style={{ color: '#9ca3af', fontSize: '13px' }}>🤔 Analyzing your project data...</div>}
                  <div ref={messagesEndRef} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Ask about risks, savings, contractor payments..." style={{ ...inp, flex: 1 }} disabled={loading} />
                  <button onClick={handleSend} disabled={loading || !input.trim()} style={btn(loading || !input.trim() ? '#d1d5db' : '#d97706')}>
                    <Send size={15} /> Send
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