import React, { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Plus, Send, FileText, DollarSign, Home, Users, Package, Map, MessageCircle, Tag, X, Edit2, Check } from 'lucide-react';

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
        status: 'In Progress',
        startDate: '2024-01-15',
        budget: 500000,
        totalReceivedFromOwner: 350000, // Restored feature tracking
        ownerPaymentsLog: [
          { id: 'p1', amount: 350000, date: '2024-01-16', notes: 'Initial mobilization advance' }
        ],
        materials: [
          { id: 'm1', name: 'Concrete', category: 'Concrete & Masonry', quantity: 250, unit: 'm³', unitCost: 150, totalQty: 250, supplier: 'BuildCo Supply', deliveryDate: '2024-02-01', condition: 'Good', notes: 'Ready-mix' },
          { id: 'm2', name: 'Steel Rebar', category: 'Steel & Metal', quantity: 50, unit: 'ton', unitCost: 800, totalQty: 75, supplier: 'Steel Ltd', deliveryDate: '2024-02-05', condition: 'Good', notes: 'Grade 60' },
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
    { role: 'assistant', content: 'Welcome to Construction Finance AI. Ask about budgets, owner financing coverage, material burn rates, or contractor commitment gaps.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Site form
  const [newSite, setNewSite] = useState({ name: '', location: '', budget: '', startDate: '', initialReceived: '' });

  // Material form
  const emptyMat = { name: '', category: '', quantity: '', unit: '', unitCost: '', totalQty: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' };
  const [newMaterial, setNewMaterial] = useState(emptyMat);
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('All');

  // Contractor form
  const emptyCon = { name: '', scope: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' };
  const [newContractor, setNewContractor] = useState(emptyCon);
  const [contractorNameMode, setContractorNameMode] = useState('preset'); // 'preset' | 'new'
  const [customContractorName, setCustomContractorName] = useState('');

  // Owner Payment form (Fix payment error inputs)
  const [ownerPayAmount, setOwnerPayAmount] = useState('');
  const [ownerPayDate, setOwnerPayDate] = useState('');
  const [ownerPayNotes, setOwnerPayNotes] = useState('');

  // Persist
  useEffect(() => { localStorage.setItem('constructionSites', JSON.stringify(sites)); }, [sites]);
  useEffect(() => { localStorage.setItem('cfCategories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ==================== HELPERS & ADVANCED KPIs ====================
  const getCurrentSite = () => sites.find(s => s.id === currentSiteId);

  const calcMetrics = (site) => {
    if (!site) return { matSpent: 0, conPaid: 0, conTotal: 0, spent: 0, remaining: 0, pct: '0.0', ownerReceived: 0, fundingCoverage: '0.0', commitmentGap: 0, boqBurnRate: '0.0' };
    
    const matSpent   = site.materials.reduce((s, m) => s + (parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0)), 0);
    const conPaid    = site.contractors.reduce((s, c) => s + (parseFloat(c.paid) || 0), 0);
    const conTotal   = site.contractors.reduce((s, c) => s + (parseFloat(c.boqTotal) || 0), 0);
    
    const spent      = matSpent + conPaid;
    const remaining  = parseFloat(site.budget || 0) - spent;
    const pct        = site.budget ? ((spent / site.budget) * 100).toFixed(1) : '0.0';
    
    // New Owner Metrics
    const ownerReceived  = parseFloat(site.totalReceivedFromOwner || 0);
    const fundingCoverage = site.budget ? ((ownerReceived / site.budget) * 100).toFixed(1) : '0.0';
    const commitmentGap   = conTotal - ownerReceived;

    // Material Burn Rate KPI
    const totalOrderedQty  = site.materials.reduce((s, m) => s + (parseFloat(m.totalQty) || parseFloat(m.quantity) || 0), 0);
    const totalReceivedQty = site.materials.reduce((s, m) => s + (parseFloat(m.quantity) || 0), 0);
    const boqBurnRate      = totalOrderedQty ? ((totalReceivedQty / totalOrderedQty) * 100).toFixed(1) : '0.0';

    return { matSpent, conPaid, conTotal, spent, remaining, pct, ownerReceived, fundingCoverage, commitmentGap, boqBurnRate };
  };

  const calcAll = () => {
    const totalBudget   = sites.reduce((s, x) => s + parseFloat(x.budget || 0), 0);
    const totalSpent    = sites.reduce((s, x) => s + calcMetrics(x).spent, 0);
    const totalReceived = sites.reduce((s, x) => s + parseFloat(x.totalReceivedFromOwner || 0), 0);
    return { 
      totalBudget, 
      totalSpent, 
      totalRemaining: totalBudget - totalSpent, 
      totalReceived,
      pct: totalBudget ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0.0' 
    };
  };

  // ==================== MUTATIONS ====================
  const addSite = () => {
    if (!newSite.name || !newSite.budget) return;
    const budgetVal = parseFloat(newSite.budget);
    const receivedVal = parseFloat(newSite.initialReceived) || 0;
    
    const s = { 
      id: Date.now(), 
      name: newSite.name,
      location: newSite.location,
      budget: budgetVal, 
      status: 'Planning', 
      startDate: newSite.startDate || new Date().toISOString().split('T')[0],
      totalReceivedFromOwner: receivedVal,
      ownerPaymentsLog: receivedVal > 0 ? [{ id: `p-${Date.now()}`, amount: receivedVal, date: new Date().toISOString().split('T')[0], notes: 'Initial setup fund' }] : [],
      materials: [], 
      contractors: [] 
    };
    
    setSites([...sites, s]);
    setCurrentSiteId(s.id);
    setNewSite({ name: '', location: '', budget: '', startDate: '', initialReceived: '' });
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

  // Fixed Payment Error Mutation (Owner Cash Influx)
  const addOwnerPayment = () => {
    const amount = parseFloat(ownerPayAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please check payment amount entry.");
      return;
    }

    setSites(sites.map(s => s.id !== currentSiteId ? s : {
      ...s,
      totalReceivedFromOwner: (parseFloat(s.totalReceivedFromOwner) || 0) + amount,
      ownerPaymentsLog: [
        ...(s.ownerPaymentsLog || []),
        {
          id: `p${Date.now()}`,
          amount: amount,
          date: ownerPayDate || new Date().toISOString().split('T')[0],
          notes: ownerPayNotes || 'Progress installment payment'
        }
      ]
    }));

    // Clear Form State
    setOwnerPayAmount('');
    setOwnerPayDate('');
    setOwnerPayNotes('');
  };

  const deleteMaterial   = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, materials:   s.materials.filter(m => m.id !== id) }));
  const deleteContractor = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, contractors: s.contractors.filter(c => c.id !== id) }));
  
  const deleteOwnerPayment = id => setSites(sites.map(s => {
    if (s.id !== currentSiteId) return s;
    const logToRemove = s.ownerPaymentsLog.find(p => p.id === id);
    const removedAmt = logToRemove ? parseFloat(logToRemove.amount || 0) : 0;
    return {
      ...s,
      totalReceivedFromOwner: Math.max(0, (parseFloat(s.totalReceivedFromOwner) || 0) - removedAmt),
      ownerPaymentsLog: s.ownerPaymentsLog.filter(p => p.id !== id)
    };
  }));

  const addCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
    }
    setNewCategoryInput('');
    setShowAddCategory(false);
  };

  const removeCategory = (cat) => setCategories(categories.filter(c => c !== cat));

  // ==================== AI ====================
  const getContext = () => {
    const site = getCurrentSite();
    const m = calcMetrics(site);
    return `
SITE: ${site?.name} | Budget: $${site?.budget?.toLocaleString()} | Total Received From Owner: $${m.ownerReceived.toLocaleString()} | Funding Coverage: ${m.fundingCoverage}% | Spent: $${m.spent.toLocaleString()} | Remaining Balance: $${m.remaining.toLocaleString()}
MATERIALS (${site?.materials.length}): ${site?.materials.map(x => `${x.name}(${x.category}) ${x.quantity}${x.unit}@$${x.unitCost}=$${(x.quantity*x.unitCost).toLocaleString()}`).join(', ')}
CONTRACTORS (${site?.contractors.length}): ${site?.contractors.map(x => `${x.name}:${x.scope} BOQ$${x.boqTotal?.toLocaleString()} Paid$${x.paid?.toLocaleString()}`).join(', ')}
    `;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input; setInput('');
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 600,
          system: `You are an expert construction financial advisor. Directly evaluate budgets, contractor gaps, material BOQ usage flags, and cash funding status.\n\nData:\n${getContext()}`,
          messages: messages.filter(m => m.role !== 'system').concat([{ role: 'user', content: msg }])
        })
      });
      const data = await res.json();
      setMessages(p => [...p, { role: 'assistant', content: data.content[0]?.text || 'Error rendering analytical response.' }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: `Error parsing feedback: ${e.message}` }]);
    } finally { setLoading(false); }
  };

  // ==================== EXPORT ====================
  const exportCSV = () => {
    const site = getCurrentSite();
    const m = calcMetrics(site);
    let csv = `CONSTRUCTION FINANCE REPORT\nSite: ${site.name}\nBudget,$${site.budget}\nTotal Received From Owner,$${m.ownerReceived}\nFunding Coverage,${m.fundingCoverage}%\nSpent,$${m.spent}\nRemaining,$${m.remaining}\n\n`;
    csv += `OWNER FUNDING REVENUE STREAM\nPayment ID,Amount Received,Date Recorded,Notes\n`;
    (site.ownerPaymentsLog || []).forEach(p => {
      csv += `${p.id},${p.amount},${p.date},${p.notes || ''}\n`;
    });
    csv += `\nMATERIALS BOQ\nName,Category,Qty Received,Total Ordered Qty,Unit,Price/Unit,Total Cost,Supplier,Delivery,Condition,Notes\n`;
    site.materials.forEach(x => {
      csv += `${x.name},${x.category},${x.quantity},${x.totalQty},${x.unit},${x.unitCost},${x.quantity*x.unitCost},${x.supplier||''},${x.deliveryDate||''},${x.condition||''},${x.notes||''}\n`;
    });
    csv += `\nCONTRACTORS ALLOCATION\nName,Scope,Unit,Price/Unit,Quantity,BOQ Total,Paid,Retention%,Balance Due,Start,End,Status,Contact,Notes\n`;
    site.contractors.forEach(x => {
      csv += `${x.name},${x.scope},${x.unit},${x.pricePerUnit},${x.quantity},${x.boqTotal},${x.paid},${x.retention}%,${x.boqTotal-x.paid},${x.startDate||''},${x.endDate||''},${x.status},${x.contact||''},${x.notes||''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `finance_ledger_${site.name}_${Date.now()}.csv`; a.click();
  };

  // ==================== STYLES ====================
  const site = getCurrentSite();
  const metrics = site ? calcMetrics(site) : {};
  const allM = calcAll();

  const TH = { padding: '11px 14px', textAlign: 'left', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap', color: '#374151', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' };
  const TD = { padding: '11px 14px', verticalAlign: 'middle', fontSize: '13px', borderBottom: '1px solid #f0f0f0' };
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
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)', color: 'white', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>🏗️ Basirah 360 Enterprise</h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '13px' }}>Add Projects · Materials BOQ Tracking · Contractor Ledgers · Owner Payments Revenue Matrix</p>
        </div>
        {site && (
          <button onClick={exportCSV} style={btn('#059669')}>
            <Download size={15} /> Full Audit Export
          </button>
        )}
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 86px)' }}>

        {/* ── LEFT SIDEBAR (ADD PROJECT PANEL) ── */}
        <div style={{ width: '260px', minWidth: '260px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '18px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
            <Home size={14} style={{ marginRight: 6 }} /> Active Construction Profiles
          </div>

          {sites.map(s => {
            const m = calcMetrics(s);
            return (
              <div key={s.id} onClick={() => setCurrentSiteId(s.id)} style={{ padding: '12px', background: currentSiteId === s.id ? '#eff6ff' : '#f9fafb', border: `2px solid ${currentSiteId === s.id ? '#1e3a8a' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.2s' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1f2937' }}>{s.name}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{s.location || 'No Location Assigned'}</div>
                <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>${(s.budget / 1000).toFixed(0)}k Budget</span>
                  <span style={{ color: '#059669' }}>{m.fundingCoverage}% Funded</span>
                </div>
              </div>
            );
          })}

          {/* ADD PROJECT FORM SECTION */}
          <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '8px', marginTop: '16px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#1f2937' }}>+ Add New Project</div>
            <input placeholder="Project / Site Name *" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} style={{ ...inp, marginBottom: '6px', fontSize: '12px' }} />
            <input placeholder="Geographic Location" value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} style={{ ...inp, marginBottom: '6px', fontSize: '12px' }} />
            <input placeholder="Total Contract Budget ($) *" type="number" value={newSite.budget} onChange={e => setNewSite({...newSite, budget: e.target.value})} style={{ ...inp, marginBottom: '6px', fontSize: '12px' }} />
            <input placeholder="Initial Money Received ($)" type="number" value={newSite.initialReceived} onChange={e => setNewSite({...newSite, initialReceived: e.target.value})} style={{ ...inp, marginBottom: '6px', fontSize: '12px' }} />
            <input type="date" value={newSite.startDate} onChange={e => setNewSite({...newSite, startDate: e.target.value})} style={{ ...inp, marginBottom: '8px', fontSize: '12px' }} />
            
            <button onClick={addSite} style={{ ...btn('#1e3a8a'), width: '100%', justifyContent: 'center', fontSize: '12px' }}>
              <Plus size={14} /> Provision Project
            </button>
          </div>

          {/* ENTERPRISE MULTI-SITE KPI BLOCK */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginTop: '14px', fontSize: '12px' }}>
            <div style={{ fontWeight: '700', color: '#334155', marginBottom: '6px' }}>📊 Portfolio Aggregations</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>Total Portfolio Vol:</span> <strong>${(allM.totalBudget/1000).toFixed(0)}k</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>Aggregate Influx:</span> <strong style={{ color: '#059669' }}>${(allM.totalReceived/1000).toFixed(0)}k</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Capital Outlays:</span> <strong style={{ color: '#dc2626' }}>${(allM.totalSpent/1000).toFixed(0)}k</strong></div>
            <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#7c3aed', width: `${allM.pct}%` }}></div>
            </div>
          </div>
        </div>

        {/* ── MAIN WORKSPACE ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* APP NAVIGATION WORKSPACE TABS */}
          <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
            {[
              { id: 'overview',     label: '📊 Metrics Engine' },
              { id: 'materials',    label: '📦 Materials BOQ Ledger' },
              { id: 'contractors',  label: '👷 Subcontractor Agreements' },
              { id: 'financials',   label: '💰 Owner Revenue & Payouts' },
              { id: 'ai',           label: '🤖 AI Risk Advisory' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '14px 20px', border: 'none', background: 'none', borderBottom: activeTab === t.id ? '3px solid #1e3a8a' : '3px solid transparent', cursor: 'pointer', fontWeight: activeTab === t.id ? '700' : '400', color: activeTab === t.id ? '#1e3a8a' : '#6b7280', whiteSpace: 'nowrap', fontSize: '13px' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>

            {/* ═══════════ OVERVIEW / METRICS ENGINE ═══════════ */}
            {activeTab === 'overview' && site && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, color: '#1f2937', fontSize: '20px', fontWeight: '800' }}>{site.name} Control Panel</h2>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Kickoff Date: <strong>{site.startDate}</strong></span>
                </div>

                {/* ADVANCED KPI METRIC GRID CARD DESIGN */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { l: 'Total Authorized Budget',  v: `$${site.budget.toLocaleString()}`,           c: '#1f2937', subtitle: 'Target Contract Cost Value' },
                    { l: 'Owner Cash Received',      v: `$${metrics.ownerReceived.toLocaleString()}`,  c: '#059669', subtitle: `Funding Level: ${metrics.fundingCoverage}%` },
                    { l: 'Contractor Commitment Gap',v: `$${metrics.commitmentGap.toLocaleString()}`,  c: metrics.commitmentGap > 0 ? '#b45309' : '#059669', subtitle: 'Agreements vs Owner Deposits' },
                    { l: 'Material Line Expenditure',v: `$${metrics.matSpent?.toLocaleString()}`,      c: '#7c3aed', subtitle: `BOQ Burn Rate: ${metrics.boqBurnRate}%` },
                    { l: 'Contractor Drawn Payouts', v: `$${metrics.conPaid?.toLocaleString()}`,       c: '#2563eb', subtitle: 'Certified Progress Draws' },
                    { l: 'Aggregated Job Spend',     v: `$${metrics.spent?.toLocaleString()}`,         c: '#dc2626', subtitle: `Total Cash Outlay Efficiency: ${metrics.pct}%` },
                  ].map((card, idx) => (
                    <div key={idx} style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.3px', marginBottom: '4px' }}>{card.l}</div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: card.c, letterSpacing: '-0.5px' }}>{card.v}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{card.subtitle}</div>
                    </div>
                  ))}
                </div>

                {/* LINEAR COST EXPANSION ACCURACY VISUAL BARS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'white', padding: '18px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '700' }}>
                      <span>Contract Liquidity Coverage (Owner Cash Paid vs Total Budget)</span><span>{metrics.fundingCoverage}%</span>
                    </div>
                    <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(parseFloat(metrics.fundingCoverage), 100)}%`, background: '#059669', transition: 'width 0.4s' }} />
                    </div>
                  </div>

                  <div style={{ background: 'white', padding: '18px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '700' }}>
                      <span>Wallet Influx Expenditure Footprint (Spent vs Money Received)</span>
                      <span>{(metrics.ownerReceived ? (metrics.spent / metrics.ownerReceived * 100).toFixed(0) : 0)}%</span>
                    </div>
                    <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(metrics.ownerReceived ? (metrics.spent / metrics.ownerReceived * 100) : 0, 100)}%`, background: '#dc2626', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                </div>

                {/* CONCURRENT METRICS QUICK PREVIEW LISTS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: '700', marginBottom: '10px', color: '#7c3aed', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📦 Materials BOQ Run</span>
                      <span>Total: ${metrics.matSpent.toLocaleString()}</span>
                    </div>
                    {site.materials.length === 0 ? <p style={{ fontSize: '12px', color: '#9ca3af' }}>No bill items specified.</p> : 
                      site.materials.slice(0, 4).map(m => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <span>{m.name} <span style={{ color: '#9ca3af' }}>({m.category})</span></span>
                          <span style={{ fontWeight: '600' }}>${(m.quantity * m.unitCost).toLocaleString()}</span>
                        </div>
                      ))
                    }
                  </div>
                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: '700', marginBottom: '10px', color: '#2563eb', display: 'flex', justifyContent: 'space-between' }}>
                      <span>👷 Subcontractor Liabilities</span>
                      <span>Committed: ${metrics.conTotal.toLocaleString()}</span>
                    </div>
                    {site.contractors.length === 0 ? <p style={{ fontSize: '12px', color: '#9ca3af' }}>No contractor lines linked.</p> : 
                      site.contractors.slice(0, 4).map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <span>{c.name} <span style={{ color: '#6b7280' }}>({c.scope})</span></span>
                          <span style={{ fontWeight: '600' }}>${c.boqTotal?.toLocaleString()}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ MATERIALS BOQ LEDGER ═══════════ */}
            {activeTab === 'materials' && site && (
              <div>
                <h2 style={{ margin: '0 0 14px', color: '#1f2937', fontSize: '18px', fontWeight: '800' }}>Bill of Quantities (BOQ) Materials Manifest</h2>

                {/* RESTORED ADD MATERIAL FORM LAYOUT */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '18px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: '700', color: '#7c3aed', marginBottom: '12px', fontSize: '14px' }}>+ Add Item Allocation Line</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Material Descriptor *</label>
                      <input placeholder="e.g. Portland Cement, Aggregates" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} style={inp} />
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#4b5563', marginBottom: '3px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Asset Category *</span>
                        <button onClick={() => setShowAddCategory(!showAddCategory)} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '11px', padding: 0, fontWeight: '700', cursor: 'pointer' }}>
                          {showAddCategory ? '[Select]' : '[+ New Custom]'}
                        </button>
                      </div>
                      {showAddCategory ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input placeholder="Category item" value={newCategoryInput} onChange={e => setNewCategoryInput(e.target.value)} style={{ ...inp, flex: 1 }} />
                          <button onClick={addCategory} style={{ ...btn('#7c3aed'), padding: '8px' }}><Check size={14} /></button>
                        </div>
                      ) : (
                        <select value={newMaterial.category} onChange={e => setNewMaterial({...newMaterial, category: e.target.value})} style={inp}>
                          <option value="">Choose allocation</option>
                          {categories.map(c => <option key={c}>{c}</option>)}
                        </select>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Qty Supplied Received *</label>
                      <input placeholder="250" type="number" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial, quantity: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Total Projected Contract Qty</label>
                      <input placeholder="300" type="number" value={newMaterial.totalQty} onChange={e => setNewMaterial({...newMaterial, totalQty: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Unit Profile</label>
                      <input placeholder="m³, Tons, Lineals" value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Base Unit Cost ($) *</label>
                      <input placeholder="150" type="number" value={newMaterial.unitCost} onChange={e => setNewMaterial({...newMaterial, unitCost: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Supplier / Node</label>
                      <input placeholder="Vendor Group" value={newMaterial.supplier} onChange={e => setNewMaterial({...newMaterial, supplier: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Delivery Slip Date</label>
                      <input type="date" value={newMaterial.deliveryDate} onChange={e => setNewMaterial({...newMaterial, deliveryDate: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Quality Intake State</label>
                      <select value={newMaterial.condition} onChange={e => setNewMaterial({...newMaterial, condition: e.target.value})} style={inp}>
                        <option>Good</option><option>Acceptable</option><option>Damaged Profile</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Tracking Remarks</label>
                      <input placeholder="Specs or compliance parameters" value={newMaterial.notes} onChange={e => setNewMaterial({...newMaterial, notes: e.target.value})} style={inp} />
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#4338ca' }}>
                      {newMaterial.quantity && newMaterial.unitCost && `Calculated Cost: $${(parseFloat(newMaterial.quantity) * parseFloat(newMaterial.unitCost)).toLocaleString()}`}
                    </div>
                    <button onClick={addMaterial} style={btn('#7c3aed')}>
                      <Plus size={14} /> Commit Material Line
                    </button>
                  </div>
                </div>

                {/* FILTER CONTROLS */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
                  <button onClick={() => setMaterialCategoryFilter('All')} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd', background: materialCategoryFilter === 'All' ? '#7c3aed' : 'white', color: materialCategoryFilter === 'All' ? 'white' : '#374151', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    All Items ({site.materials.length})
                  </button>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setMaterialCategoryFilter(cat)} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd', background: materialCategoryFilter === cat ? '#7c3aed' : 'white', color: materialCategoryFilter === cat ? 'white' : '#374151', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {cat} ({site.materials.filter(m => m.category === cat).length})
                    </button>
                  ))}
                </div>

                {/* MATERIALS DETAIL ARCHIVE */}
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'auto', border: '1px solid #e5e7eb' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={TH}>#</th>
                        <th style={TH}>Material Description</th>
                        <th style={TH}>Category Classification</th>
                        <th style={TH}>Intake Volume</th>
                        <th style={TH}>Total Ordered Pool</th>
                        <th style={TH}>Unit</th>
                        <th style={TH}>Unit Cost Rate</th>
                        <th style={TH}>Evaluated Spent</th>
                        <th style={TH}>Supplier Entity</th>
                        <th style={TH}>Condition Status</th>
                        <th style={TH}>Notes Log</th>
                        <th style={{ ...TH, textAlign: 'center' }}>Purge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMats.map((m, i) => (
                        <tr key={m.id} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ ...TD, color: '#9ca3af' }}>{i + 1}</td>
                          <td style={{ ...TD, fontWeight: '700' }}>{m.name}</td>
                          <td style={TD}><span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{m.category || 'Unclassed'}</span></td>
                          <td style={{ ...TD, fontWeight: '600' }}>{m.quantity.toLocaleString()}</td>
                          <td style={TD}>{m.totalQty ? m.totalQty.toLocaleString() : '—'}</td>
                          <td style={TD}>{m.unit || '—'}</td>
                          <td style={TD}>${m.unitCost.toLocaleString()}</td>
                          <td style={{ ...TD, fontWeight: '800', color: '#7c3aed' }}>${(m.quantity * m.unitCost).toLocaleString()}</td>
                          <td style={TD}>{m.supplier || '—'}</td>
                          <td style={TD}>{statusBadge(m.condition === 'Good' ? 'Completed' : m.condition === 'Damaged Profile' ? 'Pending' : 'In Progress')}</td>
                          <td style={TD}>{m.notes || '—'}</td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            <button onClick={() => deleteMaterial(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════ SUBCONTRACTOR AGREEMENTS ═══════════ */}
            {activeTab === 'contractors' && site && (
              <div>
                <h2 style={{ margin: '0 0 14px', color: '#1f2937', fontSize: '18px', fontWeight: '800' }}>Subcontractor Commitments & Performance Ledger</h2>

                {/* RESTORED ADD CONTRACTOR FORM PANEL */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '18px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: '700', color: '#2563eb', marginBottom: '12px', fontSize: '14px' }}>+ Enroll New Contractor Agreement Scope</div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Vendor Assignment Model *</label>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <button onClick={() => setContractorNameMode('preset')} style={{ ...btn(contractorNameMode === 'preset' ? '#2563eb' : '#f3f4f6', contractorNameMode === 'preset' ? 'white' : '#374151'), padding: '6px 12px', fontSize: '12px' }}>
                        Select Corporate Presets
                      </button>
                      <button onClick={() => setContractorNameMode('new')} style={{ ...btn(contractorNameMode === 'new' ? '#2563eb' : '#f3f4f6', contractorNameMode === 'new' ? 'white' : '#374151'), padding: '6px 12px', fontSize: '12px' }}>
                        Register Custom Business Entity
                      </button>
                    </div>

                    {contractorNameMode === 'preset' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {PRESET_CONTRACTORS.map(n => (
                          <button key={n} onClick={() => setNewContractor({...newContractor, name: n})} style={{ padding: '4px 10px', borderRadius: '6px', border: `1.5px solid ${newContractor.name === n ? '#2563eb' : '#e5e7eb'}`, background: newContractor.name === n ? '#eff6ff' : 'white', fontSize: '12px', cursor: 'pointer' }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input placeholder="Legal Entity Corporate Trade Name *" value={customContractorName} onChange={e => setCustomContractorName(e.target.value)} style={{ ...inp, maxWidth: '400px' }} />
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563' }}>Functional Scope Work *</label>
                      <select value={newContractor.scope} onChange={e => setNewContractor({...newContractor, scope: e.target.value})} style={inp}>
                        <option value="">Select operational scope</option>
                        {CONTRACTOR_SCOPES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563' }}>Unit Basis</label>
                      <input placeholder="Lump sum, m², Metric" value={newContractor.unit} onChange={e => setNewContractor({...newContractor, unit: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563' }}>Rate Per Unit ($) *</label>
                      <input type="number" placeholder="Rate" value={newContractor.pricePerUnit} onChange={e => setNewContractor({...newContractor, pricePerUnit: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563' }}>Contract Scope Qty *</label>
                      <input type="number" placeholder="Volume" value={newContractor.quantity} onChange={e => setNewContractor({...newContractor, quantity: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563' }}>Disbursed Draws Paid ($)</label>
                      <input type="number" placeholder="0" value={newContractor.paid} onChange={e => setNewContractor({...newContractor, paid: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563' }}>Retention Safeguard (%)</label>
                      <input type="number" placeholder="10" value={newContractor.retention} onChange={e => setNewContractor({...newContractor, retention: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563' }}>Mobilization Date</label>
                      <input type="date" value={newContractor.startDate} onChange={e => setNewContractor({...newContractor, startDate: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563' }}>Release Target Date</label>
                      <input type="date" value={newContractor.endDate} onChange={e => setNewContractor({...newContractor, endDate: e.target.value})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563' }}>Milestone Status</label>
                      <select value={newContractor.status} onChange={e => setNewContractor({...newContractor, status: e.target.value})} style={inp}>
                        <option>Pending</option><option>In Progress</option><option>Completed</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4b5563' }}>Communications Contact</label>
                      <input placeholder="Phone / Channel" value={newContractor.contact} onChange={e => setNewContractor({...newContractor, contact: e.target.value})} style={inp} />
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
                      {boqPreview > 0 && `Evaluated Commitments Value: $${boqPreview.toLocaleString()}`}
                    </div>
                    <button onClick={addContractor} style={btn('#2563eb')}>
                      <Plus size={14} /> Link Scope Line
                    </button>
                  </div>
                </div>

                {/* CONTRACTORS ASSIGNMENTS DETAILS ARCHIVE */}
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'auto', border: '1px solid #e5e7eb' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={TH}>Vendor Legal Identity</th>
                        <th style={TH}>Assigned Functional Scope</th>
                        <th style={TH}>Contract Vol</th>
                        <th style={TH}>BOQ Target Commit</th>
                        <th style={TH}>Draws Disbursed</th>
                        <th style={TH}>Retention Held</th>
                        <th style={TH}>Outstanding Due Balance</th>
                        <th style={TH}>Status</th>
                        <th style={{ ...TH, textAlign: 'center' }}>Terminate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {site.contractors.map((c, i) => {
                        const balance = (parseFloat(c.boqTotal) || 0) - (parseFloat(c.paid) || 0);
                        return (
                          <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                            <td style={{ ...TD, fontWeight: '700' }}>{c.name}</td>
                            <td style={TD}>{c.scope}</td>
                            <td style={TD}>{c.quantity} {c.unit}</td>
                            <td style={{ ...TD, fontWeight: '700', color: '#1e3a8a' }}>${c.boqTotal?.toLocaleString()}</td>
                            <td style={{ ...TD, color: '#059669', fontWeight: '600' }}>${(c.paid || 0).toLocaleString()}</td>
                            <td style={TD}>{c.retention}%</td>
                            <td style={{ ...TD, fontWeight: '800', color: balance > 0 ? '#b45309' : '#059669' }}>${balance.toLocaleString()}</td>
                            <td style={TD}>{statusBadge(c.status)}</td>
                            <td style={{ ...TD, textAlign: 'center' }}>
                              <button onClick={() => deleteContractor(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════ OWNER REVENUE & PAYOUTS MATRIX ═══════════ */}
            {activeTab === 'financials' && site && (
              <div>
                <h2 style={{ margin: '0 0 14px', color: '#1f2937', fontSize: '18px', fontWeight: '800' }}>Owner Ledger (Money Received Matrix) & Job Profitability</h2>

                {/* EXPLICIT FIX FOR PAYMENT ENTRIES - ADD OWNER INFLUX FLOW */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '20px' }}>
                  
                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: '700', color: '#059669', marginBottom: '12px', fontSize: '14px' }}>$ Record Money Received From Owner</div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Amount Remitted ($) *</label>
                      <input type="number" placeholder="e.g. 50000" value={ownerPayAmount} onChange={e => setOwnerPayAmount(e.target.value)} style={inp} />
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Date Cleared</label>
                      <input type="date" value={ownerPayDate} onChange={e => setOwnerPayDate(e.target.value)} style={inp} />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Reference Remarks</label>
                      <input placeholder="Invoice ID, Milestone payment references" value={ownerPayNotes} onChange={e => setOwnerPayNotes(e.target.value)} style={inp} />
                    </div>

                    <button onClick={addOwnerPayment} style={{ ...btn('#059669'), width: '100%', justifyContent: 'center' }}>
                      Deposit Remittance Funds
                    </button>
                  </div>

                  {/* ITEMIZED REVENUE AUDIT LOG RECEIVED HISTORY */}
                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', overflowY: 'auto' }}>
                    <div style={{ fontWeight: '700', color: '#1e3a8a', marginBottom: '12px', fontSize: '14px' }}>Historical Verified Deposit Logs</div>
                    
                    {(!site.ownerPaymentsLog || site.ownerPaymentsLog.length === 0) ? (
                      <p style={{ textLabel: 'center', color: '#9ca3af', padding: '24px', fontSize: '13px' }}>No payment histories available.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', color: '#475569' }}>
                            <th style={{ padding: '6px', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '6px', textAlign: 'left' }}>Notes Reference</th>
                            <th style={{ padding: '6px', textAlign: 'right' }}>Amount Influx</th>
                            <th style={{ padding: '6px', textAlign: 'center' }}>Revoke</th>
                          </tr>
                        </thead>
                        <tbody>
                          {site.ownerPaymentsLog.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 6px' }}>{p.date}</td>
                              <td style={{ padding: '8px 6px', color: '#64748b' }}>{p.notes}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>${p.amount.toLocaleString()}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                <button onClick={() => deleteOwnerPayment(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={12} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* OVERALL CROSS SITE PERFORMANCE TRACK MATRIX */}
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <div style={{ padding: '14px 20px', background: '#f8fafc', fontWeight: '700', borderBottom: '1px solid #e5e7eb' }}>Cross-Project Budget Utilization vs Liquid Funding Matrices</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={TH}>Project Name Profile</th>
                        <th style={{ ...TH, textAlign: 'right' }}>Total Contract Value</th>
                        <th style={{ ...TH, textAlign: 'right' }}>Total Funds Cleared</th>
                        <th style={{ ...TH, textAlign: 'right' }}>Material Outlays</th>
                        <th style={{ ...TH, textAlign: 'right' }}>Subcontractor Payouts</th>
                        <th style={{ ...TH, textAlign: 'right' }}>Total Outflow Costs</th>
                        <th style={{ ...TH, textAlign: 'right' }}>Free Cash Reserves</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map(s => {
                        const m = calcMetrics(s);
                        const freeCash = m.ownerReceived - m.spent;
                        return (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ ...TD, fontWeight: '700' }}>{s.name}</td>
                            <td style={{ ...TD, textAlign: 'right' }}>${s.budget.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', color: '#059669', fontWeight: '600' }}>${m.ownerReceived.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', color: '#7c3aed' }}>${m.matSpent.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', color: '#2563eb' }}>${m.conPaid.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', fontWeight: '700', color: '#dc2626' }}>${m.spent.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', fontWeight: '700', color: freeCash >= 0 ? '#059669' : '#dc2626' }}>
                              ${freeCash.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════ AI ADVISOR PANELS ═══════════ */}
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ margin: '0 0 4px', color: '#1f2937', fontSize: '18px', fontWeight: '800' }}>🤖 AI Financial Risk Optimization Engine</h2>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 12px' }}>Real-time evaluation on asset burn values, contract retention boundaries, and working capital variances.</p>
                
                <div style={{ overflowY: 'auto', background: 'white', borderRadius: '10px', padding: '16px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #e5e7eb', minHeight: '340px', maxHeight: '460px' }}>
                  {messages.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: '10px', background: msg.role === 'user' ? '#1e3a8a' : '#f3f4f6', color: msg.role === 'user' ? 'white' : '#1f2937', lineHeight: '1.5', fontSize: '13px' }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>Evaluating structural balance constraints...</div>}
                  <div ref={messagesEndRef} />
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Request deep-dive risk diagnostics..." style={{ ...inp, flex: 1 }} disabled={loading} />
                  <button onClick={handleSend} disabled={loading || !input.trim()} style={btn(loading || !input.trim() ? '#d1d5db' : '#1e3a8a')}>
                    <Send size={14} /> Analyze
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