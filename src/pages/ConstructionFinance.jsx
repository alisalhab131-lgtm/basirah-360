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
  const [newSite, setNewSite] = useState({ name: '', location: '', budget: '', startDate: '' });

  // Material form
  const emptyMat = { name: '', category: '', quantity: '', unit: '', unitCost: '', totalQty: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' };
  const [newMaterial, setNewMaterial] = useState(emptyMat);
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('All');

  // Contractor form
  const emptyCon = { name: '', scope: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' };
  const [newContractor, setNewContractor] = useState(emptyCon);
  const [showPresetContractors, setShowPresetContractors] = useState(false);
  const [contractorNameMode, setContractorNameMode] = useState('preset'); // 'preset' | 'new'
  const [customContractorName, setCustomContractorName] = useState('');

  // Persist
  useEffect(() => { localStorage.setItem('constructionSites', JSON.stringify(sites)); }, [sites]);
  useEffect(() => { localStorage.setItem('cfCategories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ==================== HELPERS ====================
  const getCurrentSite = () => sites.find(s => s.id === currentSiteId);

  const calcMetrics = (site) => {
    const matSpent = site.materials.reduce((s, m) => s + m.quantity * m.unitCost, 0);
    const conPaid  = site.contractors.reduce((s, c) => s + (c.paid || 0), 0);
    const spent    = matSpent + conPaid;
    const remaining = site.budget - spent;
    const pct = site.budget ? (spent / site.budget * 100).toFixed(1) : '0.0';
    return { matSpent, conPaid, spent, remaining, pct };
  };

  const calcAll = () => {
    const totalBudget  = sites.reduce((s, x) => s + x.budget, 0);
    const totalSpent   = sites.reduce((s, x) => s + calcMetrics(x).spent, 0);
    return { totalBudget, totalSpent, totalRemaining: totalBudget - totalSpent, pct: totalBudget ? (totalSpent / totalBudget * 100).toFixed(1) : '0.0' };
  };

  // ==================== MUTATIONS ====================
  const addSite = () => {
    if (!newSite.name || !newSite.budget) return;
    const s = { id: Date.now(), ...newSite, budget: parseFloat(newSite.budget), status: 'Planning', materials: [], contractors: [] };
    setSites([...sites, s]);
    setCurrentSiteId(s.id);
    setNewSite({ name: '', location: '', budget: '', startDate: '' });
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
SITE: ${site?.name} | Budget: $${site?.budget?.toLocaleString()} | Spent: $${m.spent.toLocaleString()} | Remaining: $${m.remaining.toLocaleString()} | ${m.pct}% utilized
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
          system: `You are an expert construction financial advisor. Be direct, quantify recommendations.\n\nData:\n${getContext()}`,
          messages: messages.filter(m => m.role !== 'system').concat([{ role: 'user', content: msg }])
        })
      });
      const data = await res.json();
      setMessages(p => [...p, { role: 'assistant', content: data.content[0]?.text || 'Error.' }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally { setLoading(false); }
  };

  // ==================== EXPORT ====================
  const exportCSV = () => {
    const site = getCurrentSite();
    const m = calcMetrics(site);
    let csv = `CONSTRUCTION FINANCE REPORT\nSite: ${site.name}\nBudget,$${site.budget}\nSpent,$${m.spent}\nRemaining,$${m.remaining}\n\n`;
    csv += `MATERIALS\nName,Category,Qty Received,Total Qty,Unit,Price/Unit,Total Cost,Supplier,Delivery,Condition,Notes\n`;
    site.materials.forEach(x => {
      csv += `${x.name},${x.category},${x.quantity},${x.totalQty},${x.unit},${x.unitCost},${x.quantity*x.unitCost},${x.supplier||''},${x.deliveryDate||''},${x.condition||''},${x.notes||''}\n`;
    });
    csv += `\nCONTRACTORS BOQ\nName,Scope,Unit,Price/Unit,Quantity,BOQ Total,Paid,Retention%,Balance,Start,End,Status,Contact,Notes\n`;
    site.contractors.forEach(x => {
      csv += `${x.name},${x.scope},${x.unit},${x.pricePerUnit},${x.quantity},${x.boqTotal},${x.paid},${x.retention}%,${x.boqTotal-x.paid},${x.startDate||''},${x.endDate||''},${x.status},${x.contact||''},${x.notes||''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `finance_${site.name}_${Date.now()}.csv`; a.click();
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
      <div style={{ background: 'linear-gradient(135deg, #d97706 0%, #7c3aed 100%)', color: 'white', padding: '28px 32px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px' }}>🏗️ Construction Finance Manager</h1>
        <p style={{ margin: 0, opacity: 0.85, fontSize: '14px' }}>Sites · Materials · Contractors BOQ · AI Advisor</p>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 90px)' }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width: '240px', minWidth: '240px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '18px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            <Home size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Projects
          </div>

          {sites.map(s => {
            const m = calcMetrics(s);
            return (
              <div key={s.id} onClick={() => setCurrentSiteId(s.id)} style={{ padding: '10px', background: currentSiteId === s.id ? '#fef3c7' : '#f9fafb', border: `2px solid ${currentSiteId === s.id ? '#d97706' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1f2937' }}>{s.name}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{s.location}</div>
                <div style={{ fontSize: '11px', color: '#d97706', fontWeight: '600', marginTop: 3 }}>
                  ${(s.budget / 1000).toFixed(0)}k · {m.pct}% used
                </div>
              </div>
            );
          })}

          <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>+ New Project</div>
            {[['name','Project Name'],['location','Location']].map(([k,ph]) => (
              <input key={k} placeholder={ph} value={newSite[k]} onChange={e => setNewSite({...newSite,[k]:e.target.value})} style={{ ...inp, marginBottom: '6px', fontSize: '12px' }} />
            ))}
            <input placeholder="Budget ($)" type="number" value={newSite.budget} onChange={e => setNewSite({...newSite,budget:e.target.value})} style={{ ...inp, marginBottom: '6px', fontSize: '12px' }} />
            <input type="date" value={newSite.startDate} onChange={e => setNewSite({...newSite,startDate:e.target.value})} style={{ ...inp, marginBottom: '8px', fontSize: '12px' }} />
            <button onClick={addSite} style={{ ...btn('#d97706'), width: '100%', justifyContent: 'center', fontSize: '12px' }}>
              <Plus size={14} /> Add Project
            </button>
          </div>

          <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', marginTop: '12px', fontSize: '12px' }}>
            <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>📊 All Sites</div>
            <div style={{ color: '#78350f' }}>Budget: ${(allM.totalBudget/1000).toFixed(0)}k</div>
            <div style={{ color: '#78350f' }}>Spent: ${(allM.totalSpent/1000).toFixed(0)}k</div>
            <div style={{ color: '#92400e', fontWeight: '700' }}>{allM.pct}% utilized</div>
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
              { id: 'financials',   label: '💰 Financials' },
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
                <h2 style={{ margin: '0 0 20px', color: '#1f2937', fontSize: '20px' }}>{site.name} — Overview</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { l: 'Total Budget',        v: `$${site.budget.toLocaleString()}`,          c: '#d97706' },
                    { l: 'Material Spend',       v: `$${metrics.matSpent?.toLocaleString()}`,     c: '#7c3aed' },
                    { l: 'Contractor Payments',  v: `$${metrics.conPaid?.toLocaleString()}`,      c: '#0369a1' },
                    { l: 'Total Spent',          v: `$${metrics.spent?.toLocaleString()}`,        c: '#dc2626' },
                    { l: 'Remaining',            v: `$${metrics.remaining?.toLocaleString()}`,    c: '#059669' },
                    { l: '% Utilized',           v: `${metrics.pct}%`,                            c: parseFloat(metrics.pct) > 80 ? '#dc2626' : '#d97706' },
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
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                    {metrics.pct > 90 ? '🔴 Critical — over 90% spent' : metrics.pct > 75 ? '🟡 Warning — over 75% spent' : '🟢 On track'}
                  </div>
                </div>

                {/* Quick tables */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontWeight: '700', marginBottom: '10px', color: '#7c3aed' }}>📦 Materials ({site.materials.length})</div>
                    {site.materials.slice(0,5).map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span>{m.name} <span style={{ color: '#9ca3af' }}>({m.category})</span></span>
                        <span style={{ fontWeight: '600', color: '#7c3aed' }}>${(m.quantity * m.unitCost).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontWeight: '700', marginBottom: '10px', color: '#d97706' }}>👷 Contractors ({site.contractors.length})</div>
                    {site.contractors.slice(0,5).map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span>{c.name}</span>
                        <span style={{ fontWeight: '600', color: '#d97706' }}>${c.boqTotal?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ MATERIALS ═══════════ */}
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

                    {/* Category with custom add */}
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
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Supplier</div>
                      <input placeholder="Supplier name" value={newMaterial.supplier} onChange={e => setNewMaterial({...newMaterial,supplier:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Delivery Date</div>
                      <input type="date" value={newMaterial.deliveryDate} onChange={e => setNewMaterial({...newMaterial,deliveryDate:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Condition</div>
                      <select value={newMaterial.condition} onChange={e => setNewMaterial({...newMaterial,condition:e.target.value})} style={inp}>
                        <option>Good</option><option>Acceptable</option><option>Damaged</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Notes</div>
                      <input placeholder="Grade, spec, remarks" value={newMaterial.notes} onChange={e => setNewMaterial({...newMaterial,notes:e.target.value})} style={inp} />
                    </div>
                  </div>

                  {newMaterial.quantity && newMaterial.unitCost && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: '#e0e7ff', borderRadius: '6px', fontSize: '13px', color: '#3730a3', fontWeight: '600' }}>
                      Total Cost Preview: ${(parseFloat(newMaterial.quantity||0) * parseFloat(newMaterial.unitCost||0)).toLocaleString()}
                    </div>
                  )}

                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={addMaterial} style={btn('#7c3aed')}>
                      <Plus size={15} /> Add Material
                    </button>
                  </div>
                </div>

                {/* Manage Categories */}
                <div style={{ background: 'white', padding: '14px 18px', borderRadius: '10px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>
                    <Tag size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Categories
                    <button onClick={() => setShowAddCategory(!showAddCategory)} style={{ marginLeft: '10px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>+ Add</button>
                  </div>
                  {showAddCategory && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                      <input placeholder="New category name" value={newCategoryInput} onChange={e => setNewCategoryInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addCategory()} style={{ ...inp, maxWidth: '280px' }} />
                      <button onClick={addCategory} style={btn('#7c3aed')}>Add</button>
                      <button onClick={() => { setShowAddCategory(false); setNewCategoryInput(''); }} style={btn('#6b7280')}>Cancel</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {categories.map(cat => (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {cat}
                        <button onClick={() => removeCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: 0, display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {['All', ...categories].map(cat => (
                    <button key={cat} onClick={() => setMaterialCategoryFilter(cat)} style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${materialCategoryFilter === cat ? '#7c3aed' : '#ddd'}`, background: materialCategoryFilter === cat ? '#7c3aed' : 'white', color: materialCategoryFilter === cat ? 'white' : '#374151', fontSize: '12px', cursor: 'pointer', fontWeight: materialCategoryFilter === cat ? '700' : '400' }}>
                      {cat}{cat !== 'All' && ` (${site.materials.filter(m => m.category === cat).length})`}
                    </button>
                  ))}
                </div>

                {/* Materials Table */}
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={TH}>#</th>
                        <th style={TH}>Material Name</th>
                        <th style={TH}>Category</th>
                        <th style={TH}>Qty Received</th>
                        <th style={TH}>Total Ordered</th>
                        <th style={TH}>Unit</th>
                        <th style={TH}>Price / Unit</th>
                        <th style={TH}>Total Cost</th>
                        <th style={TH}>Supplier</th>
                        <th style={TH}>Delivery Date</th>
                        <th style={TH}>Condition</th>
                        <th style={TH}>Notes</th>
                        <th style={{ ...TH, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMats.map((m, i) => (
                        <tr key={m.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ ...TD, color: '#9ca3af' }}>{i + 1}</td>
                          <td style={{ ...TD, fontWeight: '700' }}>{m.name}</td>
                          <td style={TD}><span style={{ background: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>{m.category || '—'}</span></td>
                          <td style={{ ...TD, fontWeight: '600' }}>{m.quantity.toLocaleString()}</td>
                          <td style={TD}>{m.totalQty ? m.totalQty.toLocaleString() : '—'}</td>
                          <td style={TD}>{m.unit || '—'}</td>
                          <td style={TD}>{m.unit ? `$${m.unitCost.toLocaleString()} / ${m.unit}` : `$${m.unitCost.toLocaleString()}`}</td>
                          <td style={{ ...TD, fontWeight: '800', color: '#7c3aed' }}>${(m.quantity * m.unitCost).toLocaleString()}</td>
                          <td style={TD}>{m.supplier || '—'}</td>
                          <td style={TD}>{m.deliveryDate || '—'}</td>
                          <td style={TD}>
                            <span style={{ background: m.condition === 'Good' ? '#d1fae5' : m.condition === 'Damaged' ? '#fee2e2' : '#fef3c7', color: m.condition === 'Good' ? '#065f46' : m.condition === 'Damaged' ? '#991b1b' : '#92400e', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{m.condition || '—'}</span>
                          </td>
                          <td style={{ ...TD, color: '#6b7280', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.notes || '—'}</td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            <button onClick={() => deleteMaterial(m.id)} style={btn('#ef4444')}><Trash2 size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {filteredMats.length > 0 && (
                      <tfoot>
                        <tr style={{ background: '#fef9c3' }}>
                          <td colSpan={3} style={{ ...TD, fontWeight: '800', color: '#92400e' }}>TOTAL ({filteredMats.length} items)</td>
                          <td style={{ ...TD, fontWeight: '800' }}>{filteredMats.reduce((s, m) => s + m.quantity, 0).toLocaleString()}</td>
                          <td style={{ ...TD, fontWeight: '800' }}>{filteredMats.reduce((s, m) => s + (m.totalQty || 0), 0).toLocaleString()}</td>
                          <td colSpan={2} />
                          <td style={{ ...TD, fontWeight: '800', color: '#7c3aed', fontSize: '14px' }}>${filteredMats.reduce((s, m) => s + m.quantity * m.unitCost, 0).toLocaleString()}</td>
                          <td colSpan={5} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  {filteredMats.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No materials found</div>}
                </div>
              </div>
            )}

            {/* ═══════════ CONTRACTORS BOQ ═══════════ */}
            {activeTab === 'contractors' && site && (
              <div>
                <h2 style={{ margin: '0 0 18px', color: '#1f2937', fontSize: '20px' }}>Contractors & BOQ</h2>

                {/* Add Contractor Form */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontWeight: '700', color: '#d97706', marginBottom: '14px', fontSize: '14px' }}>+ Add Contractor</div>

                  {/* Contractor Name — Preset or New */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>CONTRACTOR NAME *</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <button onClick={() => setContractorNameMode('preset')} style={{ ...btn(contractorNameMode === 'preset' ? '#d97706' : '#f3f4f6', contractorNameMode === 'preset' ? 'white' : '#374151'), fontSize: '12px' }}>
                        Select from List
                      </button>
                      <button onClick={() => { setContractorNameMode('new'); setNewContractor({...newContractor, name: ''}); }} style={{ ...btn(contractorNameMode === 'new' ? '#d97706' : '#f3f4f6', contractorNameMode === 'new' ? 'white' : '#374151'), fontSize: '12px' }}>
                        <Plus size={13} /> Add New Contractor
                      </button>
                    </div>

                    {contractorNameMode === 'preset' ? (
                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {PRESET_CONTRACTORS.map(name => (
                            <button key={name} onClick={() => setNewContractor({...newContractor, name})} style={{ padding: '6px 12px', borderRadius: '20px', border: `1.5px solid ${newContractor.name === name ? '#d97706' : '#e5e7eb'}`, background: newContractor.name === name ? '#fef3c7' : 'white', color: newContractor.name === name ? '#92400e' : '#374151', fontSize: '12px', cursor: 'pointer', fontWeight: newContractor.name === name ? '700' : '400' }}>
                              {newContractor.name === name ? '✓ ' : ''}{name}
                            </button>
                          ))}
                        </div>
                        {newContractor.name && <div style={{ marginTop: '8px', fontSize: '13px', color: '#92400e', fontWeight: '600' }}>Selected: {newContractor.name}</div>}
                      </div>
                    ) : (
                      <input placeholder="Type new contractor name" value={customContractorName} onChange={e => setCustomContractorName(e.target.value)} style={{ ...inp, maxWidth: '360px' }} />
                    )}
                  </div>

                  {/* Rest of BOQ fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Scope of Work *</div>
                      <select value={newContractor.scope} onChange={e => setNewContractor({...newContractor,scope:e.target.value})} style={inp}>
                        <option value="">Select scope</option>
                        {CONTRACTOR_SCOPES.map(s => <option key={s}>{s}</option>)}
                        <option value="__custom__">Other (type below)</option>
                      </select>
                      {newContractor.scope === '__custom__' && (
                        <input placeholder="Custom scope" style={{ ...inp, marginTop: '6px' }} onChange={e => setNewContractor({...newContractor, scope: e.target.value === '__custom__' ? '' : e.target.value})} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Unit of Measure</div>
                      <input placeholder="m², m³, lump sum, hr" value={newContractor.unit} onChange={e => setNewContractor({...newContractor,unit:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Price per Unit ($) *</div>
                      <input type="number" placeholder="e.g. 400" value={newContractor.pricePerUnit} onChange={e => setNewContractor({...newContractor,pricePerUnit:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Total Quantity *</div>
                      <input type="number" placeholder="e.g. 300" value={newContractor.quantity} onChange={e => setNewContractor({...newContractor,quantity:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Amount Paid ($)</div>
                      <input type="number" placeholder="0" value={newContractor.paid} onChange={e => setNewContractor({...newContractor,paid:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Retention (%)</div>
                      <input type="number" placeholder="e.g. 10" value={newContractor.retention} onChange={e => setNewContractor({...newContractor,retention:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Start Date</div>
                      <input type="date" value={newContractor.startDate} onChange={e => setNewContractor({...newContractor,startDate:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>End Date</div>
                      <input type="date" value={newContractor.endDate} onChange={e => setNewContractor({...newContractor,endDate:e.target.value})} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
                      <select value={newContractor.status} onChange={e => setNewContractor({...newContractor,status:e.target.value})} style={inp}>
                        <option>Pending</option><option>In Progress</option><option>Completed</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Contact</div>
                      <input placeholder="+966 50 000 0000" value={newContractor.contact} onChange={e => setNewContractor({...newContractor,contact:e.target.value})} style={inp} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Notes</div>
                      <input placeholder="Payment terms, milestones, remarks" value={newContractor.notes} onChange={e => setNewContractor({...newContractor,notes:e.target.value})} style={inp} />
                    </div>
                  </div>

                  {boqPreview > 0 && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fef3c7', borderRadius: '6px', fontSize: '13px', color: '#92400e', fontWeight: '700', display: 'flex', gap: '24px' }}>
                      <span>BOQ Total: ${boqPreview.toLocaleString()}</span>
                      {newContractor.paid && <span>Paid: ${parseFloat(newContractor.paid||0).toLocaleString()}</span>}
                      {newContractor.paid && <span>Balance: ${(boqPreview - parseFloat(newContractor.paid||0)).toLocaleString()}</span>}
                      {newContractor.retention && <span>Retention: ${(boqPreview * parseFloat(newContractor.retention||0) / 100).toLocaleString()}</span>}
                    </div>
                  )}

                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={addContractor} style={btn('#d97706')}>
                      <Plus size={15} /> Add to BOQ
                    </button>
                  </div>
                </div>

                {/* Contractors Table */}
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={TH}>#</th>
                        <th style={TH}>Contractor Name</th>
                        <th style={TH}>Scope of Work</th>
                        <th style={TH}>Unit</th>
                        <th style={TH}>Price / Unit</th>
                        <th style={TH}>Total Qty</th>
                        <th style={TH}>BOQ Total</th>
                        <th style={TH}>Amount Paid</th>
                        <th style={TH}>Retention %</th>
                        <th style={TH}>Retention Amt</th>
                        <th style={TH}>Balance Due</th>
                        <th style={TH}>Start Date</th>
                        <th style={TH}>End Date</th>
                        <th style={TH}>Status</th>
                        <th style={TH}>Contact</th>
                        <th style={TH}>Notes</th>
                        <th style={{ ...TH, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {site.contractors.map((c, i) => {
                        const retAmt = (c.boqTotal || 0) * (c.retention || 0) / 100;
                        const balance = (c.boqTotal || 0) - (c.paid || 0);
                        return (
                          <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                            <td style={{ ...TD, color: '#9ca3af' }}>{i + 1}</td>
                            <td style={{ ...TD, fontWeight: '700', whiteSpace: 'nowrap' }}>{c.name}</td>
                            <td style={TD}>{c.scope}</td>
                            <td style={TD}>{c.unit || '—'}</td>
                            <td style={TD}>{c.pricePerUnit ? `$${c.pricePerUnit.toLocaleString()} / ${c.unit || 'unit'}` : '—'}</td>
                            <td style={{ ...TD, fontWeight: '600' }}>{c.quantity ? c.quantity.toLocaleString() : '—'}</td>
                            <td style={{ ...TD, fontWeight: '800', color: '#7c3aed' }}>${(c.boqTotal || 0).toLocaleString()}</td>
                            <td style={{ ...TD, fontWeight: '700', color: '#059669' }}>${(c.paid || 0).toLocaleString()}</td>
                            <td style={TD}>{c.retention ? `${c.retention}%` : '—'}</td>
                            <td style={{ ...TD, color: '#0369a1', fontWeight: '600' }}>{c.retention ? `$${retAmt.toLocaleString()}` : '—'}</td>
                            <td style={{ ...TD, fontWeight: '800', color: balance > 0 ? '#d97706' : '#059669' }}>${balance.toLocaleString()}</td>
                            <td style={TD}>{c.startDate || '—'}</td>
                            <td style={TD}>{c.endDate || '—'}</td>
                            <td style={TD}>{statusBadge(c.status)}</td>
                            <td style={{ ...TD, color: '#6b7280' }}>{c.contact || '—'}</td>
                            <td style={{ ...TD, color: '#6b7280', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notes || '—'}</td>
                            <td style={{ ...TD, textAlign: 'center' }}>
                              <button onClick={() => deleteContractor(c.id)} style={btn('#ef4444')}><Trash2 size={13} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {site.contractors.length > 0 && (
                      <tfoot>
                        <tr style={{ background: '#fef9c3' }}>
                          <td colSpan={6} style={{ ...TD, fontWeight: '800', color: '#92400e' }}>TOTAL ({site.contractors.length} contractors)</td>
                          <td style={{ ...TD, fontWeight: '800', color: '#7c3aed', fontSize: '14px' }}>${site.contractors.reduce((s,c)=>s+(c.boqTotal||0),0).toLocaleString()}</td>
                          <td style={{ ...TD, fontWeight: '800', color: '#059669' }}>${site.contractors.reduce((s,c)=>s+(c.paid||0),0).toLocaleString()}</td>
                          <td />
                          <td style={{ ...TD, fontWeight: '800', color: '#0369a1' }}>${site.contractors.reduce((s,c)=>s+(c.boqTotal||0)*(c.retention||0)/100,0).toLocaleString()}</td>
                          <td style={{ ...TD, fontWeight: '800', color: '#d97706' }}>${site.contractors.reduce((s,c)=>s+((c.boqTotal||0)-(c.paid||0)),0).toLocaleString()}</td>
                          <td colSpan={6} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  {site.contractors.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No contractors added yet</div>}
                </div>
              </div>
            )}

            {/* ═══════════ FINANCIALS ═══════════ */}
            {activeTab === 'financials' && (
              <div>
                <h2 style={{ margin: '0 0 18px', color: '#1f2937', fontSize: '20px' }}>Financial Dashboard</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { l: 'Total Budget', v: `$${(allM.totalBudget/1000).toFixed(0)}k`, bg: '#f3f4f6', c: '#1f2937' },
                    { l: 'Total Spent', v: `$${(allM.totalSpent/1000).toFixed(0)}k`, bg: '#fef3c7', c: '#d97706' },
                    { l: 'Total Remaining', v: `$${(allM.totalRemaining/1000).toFixed(0)}k`, bg: '#e0f2fe', c: '#0369a1' },
                    { l: '% Spent', v: `${allM.pct}%`, bg: '#f0fdf4', c: '#16a34a' },
                  ].map(card => (
                    <div key={card.l} style={{ padding: '16px', background: card.bg, borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>{card.l}</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: card.c }}>{card.v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: '700', color: '#1f2937' }}>Cost Breakdown by Project</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        {['Project', 'Budget', 'Materials', 'Contractor Paid', 'Total Spent', 'Remaining', '% Used'].map(h => (
                          <th key={h} style={{ ...TH, textAlign: h === 'Project' ? 'left' : 'right' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((s, i) => {
                        const m = calcMetrics(s);
                        return (
                          <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                            <td style={{ ...TD, fontWeight: '700' }}>{s.name}</td>
                            <td style={{ ...TD, textAlign: 'right' }}>${s.budget.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', color: '#7c3aed' }}>${m.matSpent.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', color: '#0369a1' }}>${m.conPaid.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', fontWeight: '700', color: '#d97706' }}>${m.spent.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', color: '#059669' }}>${m.remaining.toLocaleString()}</td>
                            <td style={{ ...TD, textAlign: 'right', fontWeight: '700', color: m.pct > 75 ? '#d97706' : '#059669' }}>{m.pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button onClick={exportCSV} style={{ ...btn('#059669'), flex: 1, justifyContent: 'center' }}>
                    <Download size={16} /> Download CSV / Excel
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════ AI ADVISOR ═══════════ */}
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ margin: '0 0 6px', color: '#1f2937', fontSize: '20px' }}>🤖 AI Financial Advisor</h2>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 14px' }}>Ask about budget risks, cost savings, payment schedules, or contractor performance.</p>
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
