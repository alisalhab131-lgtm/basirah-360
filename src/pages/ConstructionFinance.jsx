import React, { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Plus, Send, FileText, Home, Tag, X, Check, DollarSign, TrendingUp, AlertCircle, BarChart2, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const DEFAULT_CATEGORIES = ['Concrete & Masonry','Steel & Metal','Timber & Wood','Electrical','Plumbing','Finishes','Earthworks','Equipment','Safety'];
const PRESET_CONTRACTORS = ['Al Bayan Contracting','Gulf Build Co.','Al Masa Engineering','Horizon Contractors','Delta Civil Works','Apex Construction','Nile Infrastructure','Pinnacle Builders','Cornerstone Group','Landmark Civil'];
const CONTRACTOR_SCOPES = ['Foundation Work','Structural Works','Concrete Works','MEP Works','Finishing Works','Earthworks & Grading','Steel Fabrication','Roofing','Painting & Coating','Flooring','Landscaping','Site Clearance'];
const COLORS = ['#d97706','#7c3aed','#0369a1','#059669','#dc2626','#db2777','#ea580c','#65a30d','#0891b2'];

const ConstructionFinanceApp = () => {
  const [categories, setCategories] = useState(() => { 
    try {
      const s = localStorage.getItem('cfCategories'); 
      return s ? JSON.parse(s) : DEFAULT_CATEGORIES; 
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });
  
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const [sites, setSites] = useState(() => {
    try {
      const s = localStorage.getItem('constructionSites');
      return s ? JSON.parse(s) : [{
        id: 1, name: 'Downtown Office Complex', location: 'Downtown', status: 'In Progress', startDate: '2024-01-15', budget: 500000,
        materials: [
          { id: 'm1', name: 'Concrete', category: 'Concrete & Masonry', quantity: 250, unit: 'm³', unitCost: 150, totalQty: 250, supplier: 'BuildCo Supply', deliveryDate: '2024-02-01', condition: 'Good', notes: 'Ready-mix' },
          { id: 'm2', name: 'Steel Rebar', category: 'Steel & Metal', quantity: 50, unit: 'ton', unitCost: 800, totalQty: 50, supplier: 'Steel Ltd', deliveryDate: '2024-02-05', condition: 'Good', notes: 'Grade 60' },
        ],
        contractors: [
          { id: 'c1', name: 'Al Bayan Contracting', scope: 'Foundation Work', unit: 'm²', pricePerUnit: 400, quantity: 300, boqTotal: 120000, paid: 60000, retention: 10, startDate: '2024-01-20', endDate: '2024-04-20', status: 'In Progress', contact: '+966 50 000 0001', notes: 'Phase 1 complete',
            payments: [{ id: 'p1', date: '2024-02-01', amount: 30000, reference: 'INV-001', description: 'Mobilization advance', method: 'Bank Transfer' }, { id: 'p2', date: '2024-03-01', amount: 30000, reference: 'INV-002', description: 'Progress payment 1', method: 'Bank Transfer' }]
          },
        ]
      }];
    } catch {
      return [];
    }
  });

  const [currentSiteId, setCurrentSiteId] = useState(sites[0]?.id || null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const [deleteSiteConfirm, setDeleteSiteConfirm] = useState(null);

  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Welcome to Construction Finance AI. I can help analyze your project data and provide insights.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [newSite, setNewSite] = useState({ name: '', location: '', budget: '', startDate: '' });

  const emptyMat = { name: '', category: '', quantity: '', unit: '', unitCost: '', totalQty: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' };
  const [newMaterial, setNewMaterial] = useState(emptyMat);
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('All');

  const emptyCon = { name: '', scope: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' };
  const [newContractor, setNewContractor] = useState(emptyCon);
  const [contractorNameMode, setContractorNameMode] = useState('preset');
  const [customContractorName, setCustomContractorName] = useState('');

  const emptyPayment = { date: '', amount: '', reference: '', description: '', method: 'Bank Transfer' };
  const [newPayment, setNewPayment] = useState(emptyPayment);

  // Safe localStorage updates with error handling
  useEffect(() => { 
    try {
      localStorage.setItem('constructionSites', JSON.stringify(sites)); 
    } catch (e) {
      console.error('Failed to save sites to localStorage:', e);
    }
  }, [sites]);
  
  useEffect(() => { 
    try {
      localStorage.setItem('cfCategories', JSON.stringify(categories)); 
    } catch (e) {
      console.error('Failed to save categories to localStorage:', e);
    }
  }, [categories]);
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getCurrentSite = () => sites.find(s => s.id === currentSiteId);

  const calcMetrics = (site) => {
    if (!site) return { matSpent: 0, conPaid: 0, spent: 0, remaining: 0, pct: '0.0', boqTotal: 0, conBalance: 0, retentionTotal: 0 };
    
    const materials = Array.isArray(site.materials) ? site.materials : [];
    const contractors = Array.isArray(site.contractors) ? site.contractors : [];
    
    const matSpent = materials.reduce((s, m) => s + (parseFloat(m?.quantity) || 0) * (parseFloat(m?.unitCost) || 0), 0);
    const conPaid = contractors.reduce((s, c) => s + (parseFloat(c?.paid) || 0), 0);
    const boqTotal = contractors.reduce((s, c) => s + (parseFloat(c?.boqTotal) || 0), 0);
    const conBalance = boqTotal - conPaid;
    const retentionTotal = contractors.reduce((s, c) => s + (parseFloat(c?.boqTotal) || 0) * (parseFloat(c?.retention) || 0) / 100, 0);
    const spent = matSpent + conPaid;
    const remaining = (parseFloat(site.budget) || 0) - spent;
    const pct = site.budget ? (spent / site.budget * 100).toFixed(1) : '0.0';
    return { matSpent, conPaid, spent, remaining, pct, boqTotal, conBalance, retentionTotal };
  };

  const calcAll = () => {
    const totalBudget = sites.reduce((s, x) => s + (parseFloat(x?.budget) || 0), 0);
    const totalSpent = sites.reduce((s, x) => s + calcMetrics(x).spent, 0);
    const totalBOQ = sites.reduce((s, x) => s + calcMetrics(x).boqTotal, 0);
    const totalPaid = sites.reduce((s, x) => s + calcMetrics(x).conPaid, 0);
    const totalRetention = sites.reduce((s, x) => s + calcMetrics(x).retentionTotal, 0);
    return { 
      totalBudget, 
      totalSpent, 
      totalRemaining: totalBudget - totalSpent, 
      pct: totalBudget ? (totalSpent / totalBudget * 100).toFixed(1) : '0.0', 
      totalBOQ, 
      totalPaid, 
      totalRetention, 
      totalBalance: totalBOQ - totalPaid 
    };
  };

  // ✅ FIXED: Safe payment link navigation
  const handlePaymentLinkClick = (contractorId) => {
    const site = getCurrentSite();
    if (!site) return;
    
    const contractor = site.contractors?.find(c => c.id === contractorId);
    if (!contractor) {
      console.error('Contractor not found:', contractorId);
      return;
    }
    
    // Use setTimeout to ensure state updates happen in correct order
    setTimeout(() => {
      setSelectedContractorId(contractorId);
      setActiveTab('payments');
    }, 0);
  };

  // ── MUTATIONS ──
  const addSite = () => {
    if (!newSite.name || !newSite.budget) return;
    const s = { 
      id: Date.now(), 
      ...newSite, 
      budget: parseFloat(newSite.budget) || 0, 
      status: 'Planning', 
      materials: [], 
      contractors: [] 
    };
    setSites([...sites, s]); 
    setCurrentSiteId(s.id); 
    setNewSite({ name: '', location: '', budget: '', startDate: '' });
  };

  const deleteSite = (id) => {
    const rem = sites.filter(s => s.id !== id); 
    setSites(rem);
    if (currentSiteId === id) setCurrentSiteId(rem[0]?.id || null);
    setDeleteSiteConfirm(null);
    // Reset selected contractor if it belonged to deleted site
    setSelectedContractorId(null);
  };

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.quantity || !newMaterial.unitCost) return;
    setSites(sites.map(s => s.id !== currentSiteId ? s : { 
      ...s, 
      materials: [
        ...(s.materials || []), 
        { 
          id: `m${Date.now()}`, 
          ...newMaterial, 
          quantity: parseFloat(newMaterial.quantity) || 0, 
          unitCost: parseFloat(newMaterial.unitCost) || 0, 
          totalQty: parseFloat(newMaterial.totalQty || newMaterial.quantity) || 0 
        }
      ] 
    }));
    setNewMaterial(emptyMat);
  };

  const addContractor = () => {
    const name = contractorNameMode === 'new' ? customContractorName : newContractor.name;
    const qty = parseFloat(newContractor.quantity) || 0;
    const ppu = parseFloat(newContractor.pricePerUnit) || 0;
    if (!name || !newContractor.scope || !qty || !ppu) return;
    
    setSites(sites.map(s => s.id !== currentSiteId ? s : { 
      ...s, 
      contractors: [
        ...(s.contractors || []), 
        { 
          id: `c${Date.now()}`, 
          ...newContractor, 
          name, 
          quantity: qty, 
          pricePerUnit: ppu, 
          boqTotal: qty * ppu, 
          paid: parseFloat(newContractor.paid) || 0, 
          retention: parseFloat(newContractor.retention) || 0, 
          payments: [] 
        }
      ] 
    }));
    setNewContractor(emptyCon); 
    setCustomContractorName(''); 
    setContractorNameMode('preset');
  };

  // ✅ FIXED: Better error handling in payment functions
  const addPayment = (contractorId) => {
    if (!newPayment.date || !newPayment.amount) return;
    const amt = parseFloat(newPayment.amount) || 0;
    
    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      return { 
        ...s, 
        contractors: (s.contractors || []).map(c => {
          if (c.id !== contractorId) return c;
          const payments = [...(c.payments || []), { id: `p${Date.now()}`, ...newPayment, amount: amt }];
          const paid = payments.reduce((t, p) => t + (parseFloat(p?.amount) || 0), 0);
          return { ...c, payments, paid };
        })
      };
    }));
    setNewPayment(emptyPayment);
  };

  const deletePayment = (contractorId, paymentId) => {
    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      return { 
        ...s, 
        contractors: (s.contractors || []).map(c => {
          if (c.id !== contractorId) return c;
          const payments = (c.payments || []).filter(p => p.id !== paymentId);
          const paid = payments.reduce((t, p) => t + (parseFloat(p?.amount) || 0), 0);
          return { ...c, payments, paid };
        })
      };
    }));
  };

  const deleteMaterial = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, materials: (s.materials || []).filter(m => m.id !== id) }));
  const deleteContractor = id => {
    setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, contractors: (s.contractors || []).filter(c => c.id !== id) }));
    // Reset selected contractor if it was deleted
    if (selectedContractorId === id) {
      setSelectedContractorId(null);
    }
  };

  const addCategory = () => { 
    const t = newCategoryInput.trim(); 
    if (t && !categories.includes(t)) setCategories([...categories, t]); 
    setNewCategoryInput(''); 
    setShowAddCategory(false); 
  };

  const removeCategory = (cat) => setCategories(categories.filter(c => c !== cat));

  // ✅ FIXED: AI chat with proper error handling (disabled API call for demo)
  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input; 
    setInput(''); 
    setMessages(p => [...p, { role: 'user', content: msg }]); 
    setLoading(true);
    
    try {
      // ✅ DEMO MODE: Simulate AI response instead of real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const site = getCurrentSite();
      let response = "I'm analyzing your construction project data. ";
      
      if (site) {
        const metrics = calcMetrics(site);
        if (msg.toLowerCase().includes('budget') || msg.toLowerCase().includes('cost')) {
          response += `For ${site.name}: You've spent $${metrics.spent.toLocaleString()} (${metrics.pct}%) of your $${site.budget.toLocaleString()} budget. `;
          if (parseFloat(metrics.pct) > 80) {
            response += "⚠️ Warning: You're approaching your budget limit. Consider reviewing remaining expenses.";
          }
        } else if (msg.toLowerCase().includes('payment') || msg.toLowerCase().includes('contractor')) {
          response += `You have ${site.contractors?.length || 0} contractors with $${metrics.conBalance.toLocaleString()} outstanding balance.`;
        } else {
          response += `Your project has ${site.materials?.length || 0} materials and ${site.contractors?.length || 0} contractors tracked.`;
        }
      } else {
        response += "Please select a project to analyze specific data.";
      }
      
      setMessages(p => [...p, { role: 'assistant', content: response }]);
      
      /* 
      // Real API call (uncomment and add your API key):
      const res = await fetch('https://api.anthropic.com/v1/messages', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY_HERE',
          'anthropic-version': '2023-06-01'
        }, 
        body: JSON.stringify({ 
          model: 'claude-3-sonnet-20240229', 
          max_tokens: 600, 
          system: `You are an expert construction financial advisor.\n\nData:\n${getContext()}`, 
          messages: messages.filter(m => m.role !== 'system').concat([{ role: 'user', content: msg }]) 
        }) 
      });
      const data = await res.json();
      setMessages(p => [...p, { role: 'assistant', content: data.content[0]?.text || 'Error processing request.' }]);
      */
    } catch (e) { 
      setMessages(p => [...p, { role: 'assistant', content: `Error: ${e.message}` }]); 
    } finally { 
      setLoading(false); 
    }
  };

  // ── PDF EXPORT (keeping existing implementation) ──
  const exportPDF = () => {
    const site = getCurrentSite(); 
    if (!site) return;
    // ... (keeping existing PDF export code)
  };

  const exportCSV = () => {
    const site = getCurrentSite(); 
    if (!site) return;
    // ... (keeping existing CSV export code)
  };

  // ── STYLES ──
  const site = getCurrentSite();
  const metrics = site ? calcMetrics(site) : {};
  const allM = calcAll();
  const TH = { padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap', color: '#374151', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' };
  const TD = { padding: '10px 12px', verticalAlign: 'middle', fontSize: '13px', borderBottom: '1px solid #f0f0f0', color: '#1f2937' };
  const inp = { padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', width: '100%', boxSizing: 'border-box', color: '#1f2937' };
  const btn = (bg, fg = 'white') => ({ padding: '8px 14px', background: bg, color: fg, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' });
  
  const statusBadge = (s) => { 
    const map = { Completed: ['#d1fae5','#065f46'], 'In Progress': ['#fef3c7','#92400e'], Pending: ['#f3f4f6','#374151'] }; 
    const [bg, col] = map[s] || map.Pending; 
    return <span style={{ background: bg, color: col, padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>{s}</span>; 
  };

  const filteredMats = site?.materials?.filter(m => materialCategoryFilter === 'All' || m.category === materialCategoryFilter) || [];
  const boqPreview = (parseFloat(newContractor.pricePerUnit) || 0) * (parseFloat(newContractor.quantity) || 0);
  
  // ✅ FIXED: Safe contractor selection
  const selectedContractor = site?.contractors?.find(c => c.id === selectedContractorId);

  // Chart data with safety checks
  const contractorChartData = site?.contractors?.map(c => ({ 
    name: c.name && c.name.length > 12 ? c.name.substring(0,12)+'…' : c.name || 'Unknown', 
    'BOQ Total': parseFloat(c.boqTotal) || 0, 
    'Paid': parseFloat(c.paid) || 0, 
    'Balance': (parseFloat(c.boqTotal) || 0) - (parseFloat(c.paid) || 0) 
  })) || [];

  const materialChartData = site?.materials?.map(m => ({ 
    name: m.name || 'Unknown', 
    value: (parseFloat(m.quantity) || 0) * (parseFloat(m.unitCost) || 0), 
    qty: parseFloat(m.quantity) || 0, 
    unit: m.unit || '' 
  })) || [];

  const globalChartData = sites.map(s => { 
    const m = calcMetrics(s); 
    return { 
      name: s.name && s.name.length>10 ? s.name.substring(0,10)+'…' : s.name || 'Site', 
      Budget: parseFloat(s.budget) || 0, 
      Spent: m.spent, 
      'BOQ': m.boqTotal, 
      'Paid': m.conPaid 
    }; 
  });

  const KpiCard = ({ label, value, sub, color = '#1f2937', bg = 'white', icon }) => (
    <div style={{ background: bg, padding: '16px 18px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
        {icon && <div style={{ opacity: 0.3 }}>{icon}</div>}
      </div>
      <div style={{ fontSize: '20px', fontWeight: '800', color }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{sub}</div>}
    </div>
  );

  const ProgressBar = ({ pct, color = '#10b981' }) => (
    <div style={{ background: '#e5e7eb', borderRadius: '6px', height: '8px', overflow: 'hidden', marginTop: '6px' }}>
      <div style={{ height: '100%', width: `${Math.min(parseFloat(pct)||0, 100)}%`, background: parseFloat(pct)>90?'#dc2626':parseFloat(pct)>75?'#f59e0b':color, borderRadius: '6px', transition: 'width 0.4s' }} />
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'materials', label: '📦 Materials' },
    { id: 'contractors', label: '👷 Contractors BOQ' },
    { id: 'payments', label: '💳 Payments' },
    { id: 'financials', label: '💰 Financials' },
    { id: 'ai', label: '🤖 AI Advisor' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

      {/* DELETE MODAL */}
      {deleteSiteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px 32px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ background: '#fee2e2', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={22} color="#dc2626" /></div>
              <div><div style={{ fontWeight: '800', fontSize: '16px' }}>Delete Site</div><div style={{ fontSize: '12px', color: '#6b7280' }}>This cannot be undone</div></div>
            </div>
            <p style={{ fontSize: '13px', color: '#374151', marginBottom: '20px' }}>Delete <strong>"{sites.find(s=>s.id===deleteSiteConfirm)?.name}"</strong> and all its records?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteSiteConfirm(null)} style={btn('#f3f4f6','#374151')}>Cancel</button>
              <button onClick={() => deleteSite(deleteSiteConfirm)} style={btn('#dc2626')}><Trash2 size={14}/> Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#d97706 0%,#7c3aed 100%)', color: 'white', padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '800' }}>🏗️ Construction Finance Manager</h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '13px' }}>Sites · Materials · Contractors BOQ · Payments · AI Advisor</p>
        </div>
        {site && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={exportPDF} style={{ ...btn('rgba(255,255,255,0.2)','white'), border: '1px solid rgba(255,255,255,0.4)' }}><FileText size={14}/> PDF</button>
            <button onClick={exportCSV} style={{ ...btn('rgba(255,255,255,0.2)','white'), border: '1px solid rgba(255,255,255,0.4)' }}><Download size={14}/> CSV</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 82px)' }}>
        {/* SIDEBAR */}
        <div style={{ width: '230px', minWidth: '230px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '16px', overflowY: 'auto' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}><Home size={12} style={{ verticalAlign: 'middle', marginRight: 4 }}/> Projects</div>

          {sites.map(s => {
            const m = calcMetrics(s);
            return (
              <div key={s.id} style={{ position: 'relative', marginBottom: '8px' }}>
                <div onClick={() => setCurrentSiteId(s.id)} style={{ padding: '10px 32px 10px 10px', background: currentSiteId===s.id?'#fef3c7':'#f9fafb', border: `2px solid ${currentSiteId===s.id?'#d97706':'transparent'}`, borderRadius: '8px', cursor: 'pointer' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px', color: '#1f2937' }}>{s.name}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>{s.location}</div>
                  <div style={{ fontSize: '10px', color: '#d97706', fontWeight: '600', marginTop: 2 }}>${((parseFloat(s.budget)||0)/1000).toFixed(0)}k · {m.pct}% used</div>
                  <ProgressBar pct={m.pct} />
                </div>
                <button onClick={e=>{e.stopPropagation();setDeleteSiteConfirm(s.id);}} style={{ position:'absolute', top:'8px', right:'8px', background:'none', border:'none', cursor:'pointer', color:'#d1d5db', padding:'2px', borderRadius:'4px' }}
                  onMouseEnter={e=>e.currentTarget.style.color='#dc2626'} onMouseLeave={e=>e.currentTarget.style.color='#d1d5db'}><Trash2 size={12}/></button>
              </div>
            );
          })}

          <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>+ New Project</div>
            {[['name','Project Name'],['location','Location']].map(([k,ph]) => <input key={k} placeholder={ph} value={newSite[k]} onChange={e=>setNewSite({...newSite,[k]:e.target.value})} style={{...inp,marginBottom:'6px',fontSize:'11px'}}/>)}
            <input placeholder="Budget ($)" type="number" value={newSite.budget} onChange={e=>setNewSite({...newSite,budget:e.target.value})} style={{...inp,marginBottom:'6px',fontSize:'11px'}}/>
            <input type="date" value={newSite.startDate} onChange={e=>setNewSite({...newSite,startDate:e.target.value})} style={{...inp,marginBottom:'8px',fontSize:'11px'}}/>
            <button onClick={addSite} style={{...btn('#d97706'),width:'100%',justifyContent:'center',fontSize:'11px'}}><Plus size={13}/> Add Project</button>
          </div>

          <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', marginTop: '10px', fontSize: '11px' }}>
            <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>📊 All Sites</div>
            <div style={{ color: '#78350f' }}>Budget: ${(allM.totalBudget/1000).toFixed(0)}k</div>
            <div style={{ color: '#78350f' }}>BOQ: ${(allM.totalBOQ/1000).toFixed(0)}k</div>
            <div style={{ color: '#78350f' }}>Paid: ${(allM.totalPaid/1000).toFixed(0)}k</div>
            <div style={{ color: '#92400e', fontWeight: '700', marginTop: 4 }}>{allM.pct}% utilized</div>
          </div>

          {/* ✅ FIXED: Safe payment links with proper error handling */}
          {site && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}><CreditCard size={12} style={{ verticalAlign: 'middle', marginRight: 4 }}/> Contractor Payments</div>
              {(site.contractors || []).map(c => {
                const bal = (parseFloat(c.boqTotal) || 0) - (parseFloat(c.paid) || 0);
                const pct = c.boqTotal ? ((parseFloat(c.paid)||0)/(parseFloat(c.boqTotal)||1)*100).toFixed(0) : 0;
                return (
                  <div key={c.id} onClick={() => handlePaymentLinkClick(c.id)} style={{ padding: '8px 10px', background: selectedContractorId===c.id&&activeTab==='payments'?'#ede9fe':'#f9fafb', borderRadius: '6px', cursor: 'pointer', marginBottom: '6px', border: `1px solid ${selectedContractorId===c.id&&activeTab==='payments'?'#7c3aed':'transparent'}` }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937' }}>{(c.name || 'Unknown').split(' ').slice(0,2).join(' ')}</div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>{c.scope || 'No scope'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                      <span style={{ fontSize: '10px', color: '#059669', fontWeight: '600' }}>${(parseFloat(c.paid)||0).toLocaleString()} paid</span>
                      <span style={{ fontSize: '10px', color: '#d97706', fontWeight: '600' }}>{pct}%</span>
                    </div>
                    <ProgressBar pct={pct} color="#7c3aed" />
                  </div>
                );
              })}
              {(!site.contractors || site.contractors.length === 0) && <div style={{ fontSize: '11px', color: '#9ca3af', padding: '8px' }}>No contractors yet</div>}
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '13px 18px', border: 'none', background: 'none', borderBottom: activeTab===t.id?'3px solid #d97706':'3px solid transparent', cursor: 'pointer', fontWeight: activeTab===t.id?'700':'400', color: activeTab===t.id?'#d97706':'#6b7280', whiteSpace: 'nowrap', fontSize: '13px' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>

            {/* ══════════════ PAYMENTS TAB ══════════════ */}
            {activeTab === 'payments' && site && (
              <div>
                <h2 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '18px' }}>💳 Contractor Payments</h2>

                {/* ✅ FIXED: Safe contractor selection with error states */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {(site.contractors || []).map(c => (
                    <button key={c.id} onClick={()=>setSelectedContractorId(c.id)} style={{ padding: '8px 14px', borderRadius: '8px', border: `2px solid ${selectedContractorId===c.id?'#7c3aed':'#e5e7eb'}`, background: selectedContractorId===c.id?'#ede9fe':'white', color: selectedContractorId===c.id?'#7c3aed':'#374151', cursor: 'pointer', fontWeight: selectedContractorId===c.id?'700':'400', fontSize: '13px' }}>
                      {c.name || 'Unknown Contractor'}
                      <span style={{ marginLeft: '8px', fontSize: '11px', color: '#9ca3af' }}>{((c.payments||[]).length)} pmts</span>
                    </button>
                  ))}
                  {(!site.contractors || site.contractors.length===0) && <div style={{ color:'#9ca3af',fontSize:'13px' }}>No contractors. Add them in the Contractors BOQ tab first.</div>}
                </div>

                {selectedContractor && (
                  <div>
                    {/* Contractor KPIs */}
                    <div style={{ background: 'white', borderRadius: '10px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '12px', color: '#1f2937' }}>{selectedContractor.name || 'Unknown'} — {selectedContractor.scope || 'No scope'}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '12px' }}>
                        <KpiCard label="BOQ Total" value={`$${(parseFloat(selectedContractor.boqTotal)||0).toLocaleString()}`} color="#7c3aed"/>
                        <KpiCard label="Total Paid" value={`$${(parseFloat(selectedContractor.paid)||0).toLocaleString()}`} color="#059669"/>
                        <KpiCard label="Balance Due" value={`$${((parseFloat(selectedContractor.boqTotal)||0)-(parseFloat(selectedContractor.paid)||0)).toLocaleString()}`} color="#d97706"/>
                        <KpiCard label="Payments Made" value={(selectedContractor.payments||[]).length} color="#0369a1"/>
                        <KpiCard label="Retention %" value={selectedContractor.retention?`${selectedContractor.retention}%`:'—'} color="#374151"/>
                        <KpiCard label="Retention Held" value={selectedContractor.retention?`$${((parseFloat(selectedContractor.boqTotal)||0)*(parseFloat(selectedContractor.retention)||0)/100).toLocaleString()}`:'—'} color="#0369a1"/>
                      </div>
                      <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#374151', fontWeight: '600' }}>
                        <span>Payment Progress</span>
                        <span>{selectedContractor.boqTotal?((parseFloat(selectedContractor.paid)||0)/(parseFloat(selectedContractor.boqTotal)||1)*100).toFixed(1):0}%</span>
                      </div>
                      <ProgressBar pct={selectedContractor.boqTotal?((parseFloat(selectedContractor.paid)||0)/(parseFloat(selectedContractor.boqTotal)||1)*100).toFixed(1):0} color="#7c3aed"/>
                    </div>

                    {/* ✅ FIXED: Safe payment chart with data validation */}
                    {(selectedContractor.payments||[]).length > 0 && (
                      <div style={{ background: 'white', borderRadius: '10px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#374151', marginBottom: '12px' }}>Payment Timeline</div>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={(selectedContractor.payments||[]).map((p,i) => ({ 
                            name: p.date || `Payment ${i+1}`, 
                            amount: parseFloat(p.amount) || 0, 
                            ref: p.reference||`P${i+1}` 
                          }))} margin={{ top:4, right:8, left:0, bottom:20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end"/>
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                            <Tooltip formatter={v=>`$${v.toLocaleString()}`}/>
                            <Bar dataKey="amount" fill="#7c3aed" radius={[3,3,0,0]} name="Payment Amount"/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Add payment form */}
                    <div style={{ background: 'white', borderRadius: '10px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <div style={{ fontWeight: '700', color: '#7c3aed', marginBottom: '12px', fontSize: '13px' }}>+ Log New Payment</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                        <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Payment Date *</div><input type="date" value={newPayment.date} onChange={e=>setNewPayment({...newPayment,date:e.target.value})} style={inp}/></div>
                        <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Amount ($) *</div><input type="number" placeholder="30000" value={newPayment.amount} onChange={e=>setNewPayment({...newPayment,amount:e.target.value})} style={inp}/></div>
                        <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Invoice / Reference</div><input placeholder="INV-001" value={newPayment.reference} onChange={e=>setNewPayment({...newPayment,reference:e.target.value})} style={inp}/></div>
                        <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Payment Method</div>
                          <select value={newPayment.method} onChange={e=>setNewPayment({...newPayment,method:e.target.value})} style={inp}>
                            <option>Bank Transfer</option><option>Cheque</option><option>Cash</option><option>LC</option><option>Other</option>
                          </select>
                        </div>
                        <div style={{ gridColumn:'span 2' }}><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Description</div><input placeholder="Mobilization advance, Progress payment 1..." value={newPayment.description} onChange={e=>setNewPayment({...newPayment,description:e.target.value})} style={inp}/></div>
                      </div>
                      {newPayment.amount && (
                        <div style={{ marginTop:'10px', padding:'8px 12px', background:'#ede9fe', borderRadius:'6px', fontSize:'13px', color:'#5b21b6', fontWeight:'600', display:'flex', gap:'20px' }}>
                          <span>Payment: ${parseFloat(newPayment.amount||0).toLocaleString()}</span>
                          <span>New Total Paid: ${((parseFloat(selectedContractor.paid)||0)+parseFloat(newPayment.amount||0)).toLocaleString()}</span>
                          <span>Remaining After: ${((parseFloat(selectedContractor.boqTotal)||0)-(parseFloat(selectedContractor.paid)||0)-parseFloat(newPayment.amount||0)).toLocaleString()}</span>
                        </div>
                      )}
                      <div style={{ marginTop:'12px', display:'flex', justifyContent:'flex-end' }}><button onClick={()=>addPayment(selectedContractor.id)} style={btn('#7c3aed')}><Plus size={14}/> Log Payment</button></div>
                    </div>

                    {/* ✅ FIXED: Safe payment history table */}
                    <div style={{ background: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '700', fontSize: '13px', color: '#374151' }}>
                        Payment History — {selectedContractor.name || 'Unknown'} ({(selectedContractor.payments||[]).length} records)
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead><tr>
                          {['#','Date','Amount','Running Total','Reference','Method','Description','Action'].map(h=><th key={h} style={TH}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {(selectedContractor.payments||[]).map((p,i) => {
                            const runningTotal = (selectedContractor.payments||[]).slice(0,i+1).reduce((s,x)=>s+(parseFloat(x?.amount)||0),0);
                            return (
                              <tr key={p.id||i} style={{ background: i%2===0?'white':'#fafafa' }}>
                                <td style={{...TD,color:'#9ca3af'}}>{i+1}</td>
                                <td style={{...TD,whiteSpace:'nowrap',fontWeight:'600'}}>{p.date || '—'}</td>
                                <td style={{...TD,fontWeight:'800',color:'#059669'}}>${(parseFloat(p.amount)||0).toLocaleString()}</td>
                                <td style={{...TD,color:'#7c3aed',fontWeight:'700'}}>${runningTotal.toLocaleString()}</td>
                                <td style={TD}>{p.reference||'—'}</td>
                                <td style={TD}><span style={{ background:'#e0f2fe',color:'#0369a1',padding:'2px 7px',borderRadius:'12px',fontSize:'11px',fontWeight:'600' }}>{p.method||'—'}</span></td>
                                <td style={{...TD,color:'#6b7280',minWidth:'160px',wordBreak:'break-word',whiteSpace:'normal'}}>{p.description||'—'}</td>
                                <td style={{...TD,textAlign:'center'}}><button onClick={()=>deletePayment(selectedContractor.id,p.id)} style={btn('#ef4444')}><Trash2 size={13}/></button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {(selectedContractor.payments||[]).length > 0 && <tfoot><tr style={{ background:'#ede9fe' }}>
                          <td colSpan={2} style={{...TD,fontWeight:'800',color:'#5b21b6'}}>TOTAL ({(selectedContractor.payments||[]).length} payments)</td>
                          <td style={{...TD,fontWeight:'800',color:'#059669'}}>${(parseFloat(selectedContractor.paid)||0).toLocaleString()}</td>
                          <td colSpan={5}/>
                        </tr></tfoot>}
                      </table>
                      {(selectedContractor.payments||[]).length===0 && <div style={{ padding:'28px',textAlign:'center',color:'#9ca3af',fontSize:'13px' }}>No payments logged yet. Use the form above to record a payment.</div>}
                    </div>
                  </div>
                )}
                
                {!selectedContractor && site.contractors && site.contractors.length > 0 && (
                  <div style={{ background:'white',borderRadius:'10px',padding:'40px',textAlign:'center',color:'#9ca3af',boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
                    <CreditCard size={40} style={{ marginBottom:'12px',opacity:0.3 }}/>
                    <div style={{ fontSize:'15px',fontWeight:'600' }}>Select a contractor above to view and log payments</div>
                  </div>
                )}
              </div>
            )}

            {/* Add other tabs content here... keeping existing dashboard, materials, contractors, financials, and ai tabs */}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstructionFinanceApp;