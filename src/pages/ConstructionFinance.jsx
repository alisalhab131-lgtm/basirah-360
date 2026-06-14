import React, { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Plus, Send, FileText, Home, Tag, X, Check, DollarSign, TrendingUp, AlertCircle, BarChart2, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const DEFAULT_CATEGORIES = ['Concrete & Masonry','Steel & Metal','Timber & Wood','Electrical','Plumbing','Finishes','Earthworks','Equipment','Safety'];
const PRESET_CONTRACTORS = ['Al Bayan Contracting','Gulf Build Co.','Al Masa Engineering','Horizon Contractors','Delta Civil Works','Apex Construction','Nile Infrastructure','Pinnacle Builders','Cornerstone Group','Landmark Civil'];
const CONTRACTOR_SCOPES = ['Foundation Work','Structural Works','Concrete Works','MEP Works','Finishing Works','Earthworks & Grading','Steel Fabrication','Roofing','Painting & Coating','Flooring','Landscaping','Site Clearance'];
const COLORS = ['#d97706','#7c3aed','#0369a1','#059669','#dc2626','#db2777','#ea580c','#65a30d','#0891b2'];

// ✅ ERROR BOUNDARY COMPONENT
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#fee2e2', borderRadius: '10px', margin: '20px' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>⚠️ Something went wrong</h2>
          <p style={{ color: '#991b1b', marginBottom: '10px' }}>{this.state.error?.toString()}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    } catch (e) {
      console.error('Error loading sites:', e);
      return [];
    }
  });

  const [currentSiteId, setCurrentSiteId] = useState(() => sites[0]?.id || null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const [deleteSiteConfirm, setDeleteSiteConfirm] = useState(null);

  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Welcome to Construction Finance AI.' }]);
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

  useEffect(() => {
    if (sites.length > 0 && !currentSiteId) {
      setCurrentSiteId(sites[0].id);
    }
  }, [sites, currentSiteId]);

  useEffect(() => { 
    try {
      localStorage.setItem('constructionSites', JSON.stringify(sites)); 
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [sites]);
  
  useEffect(() => { 
    try {
      localStorage.setItem('cfCategories', JSON.stringify(categories)); 
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [categories]);
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getCurrentSite = () => {
    console.log('getCurrentSite called, currentSiteId:', currentSiteId);
    const site = sites.find(s => s.id === currentSiteId);
    console.log('Found site:', site);
    return site;
  };

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
    return { totalBudget, totalSpent, totalRemaining: totalBudget - totalSpent, pct: totalBudget ? (totalSpent / totalBudget * 100).toFixed(1) : '0.0', totalBOQ, totalPaid, totalRetention, totalBalance: totalBOQ - totalPaid };
  };

  const handlePaymentLinkClick = (contractorId) => {
    console.log('Payment link clicked for contractor:', contractorId);
    try {
      setSelectedContractorId(contractorId);
      setActiveTab('payments');
    } catch (error) {
      console.error('Payment link error:', error);
    }
  };

  const addSite = () => {
    if (!newSite.name || !newSite.budget) return;
    const s = { id: Date.now(), ...newSite, budget: parseFloat(newSite.budget), status: 'Planning', materials: [], contractors: [] };
    setSites([...sites, s]); 
    setCurrentSiteId(s.id); 
    setNewSite({ name: '', location: '', budget: '', startDate: '' });
  };

  const deleteSite = (id) => {
    const rem = sites.filter(s => s.id !== id); 
    setSites(rem);
    if (currentSiteId === id) setCurrentSiteId(rem[0]?.id || null);
    setDeleteSiteConfirm(null);
    setSelectedContractorId(null);
  };

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.quantity || !newMaterial.unitCost) return;
    setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, materials: [...(s.materials||[]), { id: `m${Date.now()}`, ...newMaterial, quantity: parseFloat(newMaterial.quantity), unitCost: parseFloat(newMaterial.unitCost), totalQty: parseFloat(newMaterial.totalQty || newMaterial.quantity) }] }));
    setNewMaterial(emptyMat);
  };

  const addContractor = () => {
    const name = contractorNameMode === 'new' ? customContractorName : newContractor.name;
    const qty = parseFloat(newContractor.quantity) || 0;
    const ppu = parseFloat(newContractor.pricePerUnit) || 0;
    if (!name || !newContractor.scope || !qty || !ppu) return;
    setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, contractors: [...(s.contractors||[]), { id: `c${Date.now()}`, ...newContractor, name, quantity: qty, pricePerUnit: ppu, boqTotal: qty * ppu, paid: parseFloat(newContractor.paid) || 0, retention: parseFloat(newContractor.retention) || 0, payments: [] }] }));
    setNewContractor(emptyCon); 
    setCustomContractorName(''); 
    setContractorNameMode('preset');
  };

  const addPayment = (contractorId) => {
    console.log('addPayment called for:', contractorId, 'with data:', newPayment);
    try {
      if (!newPayment.date || !newPayment.amount) {
        alert('Please enter date and amount');
        return;
      }
      const amt = parseFloat(newPayment.amount);
      setSites(sites.map(s => {
        if (s.id !== currentSiteId) return s;
        return { 
          ...s, 
          contractors: (s.contractors||[]).map(c => {
            if (c.id !== contractorId) return c;
            const payments = [...(c.payments || []), { id: `p${Date.now()}`, ...newPayment, amount: amt }];
            const paid = payments.reduce((t, p) => t + (parseFloat(p?.amount)||0), 0);
            console.log('Updated contractor:', { ...c, payments, paid });
            return { ...c, payments, paid };
          })
        };
      }));
      setNewPayment(emptyPayment);
      alert('Payment added successfully!');
    } catch (error) {
      console.error('Add payment error:', error);
      alert('Error adding payment: ' + error.message);
    }
  };

  const deletePayment = (contractorId, paymentId) => {
    console.log('deletePayment called:', contractorId, paymentId);
    try {
      if (!confirm('Delete this payment?')) return;
      setSites(sites.map(s => {
        if (s.id !== currentSiteId) return s;
        return { 
          ...s, 
          contractors: (s.contractors||[]).map(c => {
            if (c.id !== contractorId) return c;
            const payments = (c.payments || []).filter(p => p.id !== paymentId);
            const paid = payments.reduce((t, p) => t + (parseFloat(p?.amount)||0), 0);
            return { ...c, payments, paid };
          })
        };
      }));
    } catch (error) {
      console.error('Delete payment error:', error);
      alert('Error deleting payment: ' + error.message);
    }
  };

  const deleteMaterial = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, materials: (s.materials||[]).filter(m => m.id !== id) }));
  const deleteContractor = id => {
    setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, contractors: (s.contractors||[]).filter(c => c.id !== id) }));
    if (selectedContractorId === id) setSelectedContractorId(null);
  };

  const addCategory = () => { 
    const t = newCategoryInput.trim(); 
    if (t && !categories.includes(t)) setCategories([...categories, t]); 
    setNewCategoryInput(''); 
    setShowAddCategory(false); 
  };

  const removeCategory = (cat) => setCategories(categories.filter(c => c !== cat));

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input; 
    setInput(''); 
    setMessages(p => [...p, { role: 'user', content: msg }]); 
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const site = getCurrentSite();
      let response = "Based on your data: ";
      
      if (site) {
        const metrics = calcMetrics(site);
        response += `${site.name} - Budget: $${site.budget.toLocaleString()}, Spent: $${metrics.spent.toLocaleString()} (${metrics.pct}%)`;
      } else {
        response = "Please select a project.";
      }
      
      setMessages(p => [...p, { role: 'assistant', content: response }]);
    } catch (e) { 
      setMessages(p => [...p, { role: 'assistant', content: `Error: ${e.message}` }]); 
    } finally { 
      setLoading(false); 
    }
  };

  const exportPDF = () => alert('PDF export - check browser console');
  const exportCSV = () => alert('CSV export - check browser console');

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
  
  // ✅ SUPER SAFE CONTRACTOR SELECTION
  const selectedContractor = (() => {
    console.log('Calculating selectedContractor, selectedContractorId:', selectedContractorId);
    if (!site) {
      console.log('No site');
      return null;
    }
    if (!selectedContractorId) {
      console.log('No selectedContractorId');
      return null;
    }
    if (!Array.isArray(site.contractors)) {
      console.log('Contractors is not an array');
      return null;
    }
    const contractor = site.contractors.find(c => c && c.id === selectedContractorId);
    console.log('Found contractor:', contractor);
    
    // Ensure payments array exists
    if (contractor && !Array.isArray(contractor.payments)) {
      contractor.payments = [];
    }
    
    return contractor;
  })();

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
    { id: 'payments', label: '💳 Payments' },
    { id: 'contractors', label: '👷 Contractors' },
    { id: 'materials', label: '📦 Materials' },
  ];

  console.log('Render - activeTab:', activeTab, 'site:', !!site, 'selectedContractor:', !!selectedContractor);

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg,#d97706 0%,#7c3aed 100%)', color: 'white', padding: '22px 28px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '800' }}>🏗️ Construction Finance Manager</h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '13px' }}>Debugging Mode - Check Console (F12)</p>
        </div>

        <div style={{ display: 'flex', minHeight: 'calc(100vh - 82px)' }}>
          {/* SIDEBAR */}
          <div style={{ width: '230px', minWidth: '230px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '16px', overflowY: 'auto' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#d97706', marginBottom: '10px' }}>PROJECTS</div>

            {sites.map(s => {
              const m = calcMetrics(s);
              return (
                <div key={s.id} style={{ marginBottom: '8px' }}>
                  <div onClick={() => setCurrentSiteId(s.id)} style={{ padding: '10px', background: currentSiteId===s.id?'#fef3c7':'#f9fafb', borderRadius: '8px', cursor: 'pointer' }}>
                    <div style={{ fontWeight: '700', fontSize: '12px' }}>{s.name}</div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>${((s.budget||0)/1000).toFixed(0)}k</div>
                  </div>
                </div>
              );
            })}

            {site && Array.isArray(site.contractors) && site.contractors.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#7c3aed', marginBottom: '8px' }}>PAYMENTS</div>
                {site.contractors.map(c => (
                  <div key={c.id} onClick={() => handlePaymentLinkClick(c.id)} style={{ padding: '8px', background: '#f9fafb', borderRadius: '6px', cursor: 'pointer', marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600' }}>{c.name}</div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>{Array.isArray(c.payments) ? c.payments.length : 0} payments</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MAIN CONTENT */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '13px 18px', border: 'none', background: 'none', borderBottom: activeTab===t.id?'3px solid #d97706':'3px solid transparent', cursor: 'pointer', fontWeight: activeTab===t.id?'700':'400', fontSize: '13px' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>

              {!site && (
                <div style={{ background: 'white', borderRadius: '12px', padding: '60px 40px', textAlign: 'center' }}>
                  <AlertCircle size={48} color="#d97706" style={{ marginBottom: '16px' }} />
                  <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>No Site Selected</h2>
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>Select a project from the sidebar</p>
                </div>
              )}

              {/* DASHBOARD */}
              {activeTab === 'dashboard' && site && (
                <div>
                  <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>{site.name}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
                    <KpiCard label="Budget" value={`$${site.budget.toLocaleString()}`} color="#d97706" />
                    <KpiCard label="Spent" value={`$${metrics.spent?.toLocaleString()}`} color="#dc2626" />
                    <KpiCard label="Contractors" value={(site.contractors||[]).length} color="#7c3aed" />
                    <KpiCard label="Materials" value={(site.materials||[]).length} color="#059669" />
                  </div>
                </div>
              )}

              {/* ✅✅✅ PAYMENTS TAB - SUPER SIMPLIFIED ✅✅✅ */}
              {activeTab === 'payments' && site && (
                <ErrorBoundary>
                  <div>
                    <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>💳 Contractor Payments</h2>

                    {Array.isArray(site.contractors) && site.contractors.length > 0 ? (
                      <>
                        {/* Contractor Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                          {site.contractors.map(c => c && c.id ? (
                            <button 
                              key={c.id} 
                              onClick={() => {
                                console.log('Clicking contractor:', c.id);
                                setSelectedContractorId(c.id);
                              }} 
                              style={{ 
                                padding: '10px 16px', 
                                borderRadius: '8px', 
                                border: `2px solid ${selectedContractorId===c.id?'#7c3aed':'#ddd'}`, 
                                background: selectedContractorId===c.id?'#ede9fe':'white', 
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}>
                              {c.name || 'Unknown'}
                              <span style={{ marginLeft: '8px', color: '#999', fontSize: '12px' }}>
                                ({Array.isArray(c.payments) ? c.payments.length : 0})
                              </span>
                            </button>
                          ) : null)}
                        </div>

                        {/* Selected Contractor Details */}
                        {selectedContractor ? (
                          <div style={{ background: 'white', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
                              {selectedContractor.name} - {selectedContractor.scope}
                            </h3>
                            
                            {/* KPIs */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
                              <KpiCard label="BOQ" value={`$${(selectedContractor.boqTotal||0).toLocaleString()}`} color="#7c3aed"/>
                              <KpiCard label="Paid" value={`$${(selectedContractor.paid||0).toLocaleString()}`} color="#059669"/>
                              <KpiCard label="Balance" value={`$${((selectedContractor.boqTotal||0)-(selectedContractor.paid||0)).toLocaleString()}`} color="#d97706"/>
                              <KpiCard label="Payments" value={Array.isArray(selectedContractor.payments) ? selectedContractor.payments.length : 0} color="#0369a1"/>
                            </div>

                            {/* Add Payment Form */}
                            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                              <div style={{ fontWeight: '700', marginBottom: '12px', color: '#7c3aed' }}>+ Add New Payment</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                <div>
                                  <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>Date *</label>
                                  <input type="date" value={newPayment.date} onChange={e=>setNewPayment({...newPayment,date:e.target.value})} style={inp}/>
                                </div>
                                <div>
                                  <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>Amount ($) *</label>
                                  <input type="number" value={newPayment.amount} onChange={e=>setNewPayment({...newPayment,amount:e.target.value})} style={inp}/>
                                </div>
                                <div>
                                  <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>Reference</label>
                                  <input value={newPayment.reference} onChange={e=>setNewPayment({...newPayment,reference:e.target.value})} style={inp} placeholder="INV-001"/>
                                </div>
                              </div>
                              <button 
                                onClick={() => addPayment(selectedContractor.id)} 
                                disabled={!newPayment.date || !newPayment.amount}
                                style={{...btn(newPayment.date && newPayment.amount ? '#7c3aed' : '#ddd'), cursor: newPayment.date && newPayment.amount ? 'pointer' : 'not-allowed' }}>
                                <Plus size={14}/> Add Payment
                              </button>
                            </div>

                            {/* Payment History */}
                            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '700', fontSize: '14px' }}>
                                Payment History ({Array.isArray(selectedContractor.payments) ? selectedContractor.payments.length : 0})
                              </div>
                              
                              {Array.isArray(selectedContractor.payments) && selectedContractor.payments.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr>
                                      {['#','Date','Amount','Reference','Action'].map(h=><th key={h} style={TH}>{h}</th>)}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedContractor.payments.map((p,i) => (
                                      <tr key={p.id||i} style={{ background: i%2===0?'white':'#fafafa' }}>
                                        <td style={TD}>{i+1}</td>
                                        <td style={{...TD,fontWeight:'600'}}>{p.date || '—'}</td>
                                        <td style={{...TD,fontWeight:'800',color:'#059669'}}>${(parseFloat(p.amount)||0).toLocaleString()}</td>
                                        <td style={TD}>{p.reference||'—'}</td>
                                        <td style={TD}>
                                          <button onClick={() => deletePayment(selectedContractor.id, p.id)} style={btn('#dc2626')}>
                                            <Trash2 size={13}/> Delete
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                  No payments yet. Add one above.
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div style={{ background: 'white', padding: '60px', textAlign: 'center', borderRadius: '10px' }}>
                            <CreditCard size={48} color="#ccc" style={{ marginBottom: '12px' }}/>
                            <p style={{ color: '#666', fontSize: '16px' }}>Select a contractor above</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ background: 'white', padding: '60px', textAlign: 'center', borderRadius: '10px' }}>
                        <AlertCircle size={48} color="#d97706" style={{ marginBottom: '12px' }}/>
                        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No Contractors</h3>
                        <p style={{ color: '#666' }}>Add contractors first in the Contractors tab</p>
                        <button onClick={() => setActiveTab('contractors')} style={{...btn('#d97706'), marginTop: '16px', margin: '16px auto 0' }}>
                          Go to Contractors
                        </button>
                      </div>
                    )}
                  </div>
                </ErrorBoundary>
              )}

              {/* CONTRACTORS TAB */}
              {activeTab === 'contractors' && site && (
                <div>
                  <h2>Contractors</h2>
                  <p>Add contractors tab content from full code</p>
                </div>
              )}

              {/* MATERIALS TAB */}
              {activeTab === 'materials' && site && (
                <div>
                  <h2>Materials</h2>
                  <p>Add materials tab content from full code</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ConstructionFinanceApp;