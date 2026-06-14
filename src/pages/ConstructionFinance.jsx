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

  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Welcome to Construction Finance AI. Ask about budgets, risks, cost savings, or contractor performance.' }]);
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
    return { totalBudget, totalSpent, totalRemaining: totalBudget - totalSpent, pct: totalBudget ? (totalSpent / totalBudget * 100).toFixed(1) : '0.0', totalBOQ, totalPaid, totalRetention, totalBalance: totalBOQ - totalPaid };
  };

  // ✅ FIXED: Payment link handler
  const handlePaymentLinkClick = (contractorId) => {
    setSelectedContractorId(contractorId);
    setActiveTab('payments');
  };

  // ── MUTATIONS ──
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
    if (!newPayment.date || !newPayment.amount) return;
    const amt = parseFloat(newPayment.amount);
    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      return { ...s, contractors: (s.contractors||[]).map(c => {
        if (c.id !== contractorId) return c;
        const payments = [...(c.payments || []), { id: `p${Date.now()}`, ...newPayment, amount: amt }];
        const paid = payments.reduce((t, p) => t + (parseFloat(p?.amount)||0), 0);
        return { ...c, payments, paid };
      })};
    }));
    setNewPayment(emptyPayment);
  };

  const deletePayment = (contractorId, paymentId) => {
    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      return { ...s, contractors: (s.contractors||[]).map(c => {
        if (c.id !== contractorId) return c;
        const payments = (c.payments || []).filter(p => p.id !== paymentId);
        const paid = payments.reduce((t, p) => t + (parseFloat(p?.amount)||0), 0);
        return { ...c, payments, paid };
      })};
    }));
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

  // ── AI ──
  const getContext = () => {
    const site = getCurrentSite(); 
    const m = calcMetrics(site);
    return `SITE: ${site?.name} | Budget: $${site?.budget?.toLocaleString()} | Spent: $${m.spent.toLocaleString()} | Remaining: $${m.remaining.toLocaleString()} | ${m.pct}% utilized\nMATERIALS: ${site?.materials?.map(x => `${x.name} ${x.quantity}${x.unit}@$${x.unitCost}`).join(', ')}\nCONTRACTORS: ${site?.contractors?.map(x => `${x.name}:${x.scope} BOQ$${x.boqTotal?.toLocaleString()} Paid$${x.paid?.toLocaleString()} Balance$${((x.boqTotal||0)-(x.paid||0)).toLocaleString()}`).join(', ')}`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input; 
    setInput(''); 
    setMessages(p => [...p, { role: 'user', content: msg }]); 
    setLoading(true);
    
    try {
      // Simple AI simulation
      await new Promise(resolve => setTimeout(resolve, 800));
      const site = getCurrentSite();
      let response = "Based on your project data: ";
      
      if (site) {
        const metrics = calcMetrics(site);
        if (msg.toLowerCase().includes('budget') || msg.toLowerCase().includes('cost')) {
          response += `${site.name} has spent $${metrics.spent.toLocaleString()} (${metrics.pct}%) of $${site.budget.toLocaleString()} budget. `;
          if (parseFloat(metrics.pct) > 80) {
            response += "⚠️ WARNING: Budget utilization exceeds 80%. Review remaining expenses carefully.";
          } else {
            response += "✅ Budget is on track.";
          }
        } else if (msg.toLowerCase().includes('payment') || msg.toLowerCase().includes('contractor')) {
          response += `You have ${site.contractors?.length||0} contractors. Total outstanding balance: $${metrics.conBalance.toLocaleString()}.`;
        } else if (msg.toLowerCase().includes('risk')) {
          response += `Risk Analysis: Budget ${metrics.pct}% utilized. ${parseFloat(metrics.pct)>75?'HIGH RISK - approaching budget limit':'LOW RISK - sufficient budget remaining'}.`;
        } else {
          response += `Project has ${site.materials?.length||0} materials and ${site.contractors?.length||0} contractors. Total spent: $${metrics.spent.toLocaleString()}.`;
        }
      } else {
        response = "Please select a project site to analyze.";
      }
      
      setMessages(p => [...p, { role: 'assistant', content: response }]);
    } catch (e) { 
      setMessages(p => [...p, { role: 'assistant', content: `Error: ${e.message}` }]); 
    } finally { 
      setLoading(false); 
    }
  };

  // ── PDF EXPORT ──
  const exportPDF = () => {
    const site = getCurrentSite(); 
    if (!site) return;
    const m = calcMetrics(site);

    const contractorRows = (site.contractors||[]).map((c, i) => {
      const retAmt = (c.boqTotal||0)*(c.retention||0)/100;
      const bal = (c.boqTotal||0)-(c.paid||0);
      const pctPaid = c.boqTotal ? ((c.paid||0)/c.boqTotal*100).toFixed(1) : '0';
      const paymentRows = (c.payments||[]).map((p,pi) => `<tr style="background:${pi%2===0?'#f9fafb':'white'}"><td>${pi+1}</td><td>${p.date}</td><td>$${p.amount.toLocaleString()}</td><td>${p.reference||'—'}</td><td>${p.method||'—'}</td><td>${p.description||'—'}</td></tr>`).join('');
      return `<tr style="background:${i%2===0?'white':'#f9fafb'}">
        <td>${i+1}</td><td><strong>${c.name}</strong></td><td>${c.scope}</td><td>${c.unit||'—'}</td>
        <td>$${(c.pricePerUnit||0).toLocaleString()}</td><td>${(c.quantity||0).toLocaleString()}</td>
        <td style="color:#7c3aed;font-weight:700">$${(c.boqTotal||0).toLocaleString()}</td>
        <td style="color:#059669;font-weight:700">$${(c.paid||0).toLocaleString()}</td>
        <td>${c.retention?c.retention+'%':'—'}</td>
        <td style="color:#0369a1">${c.retention?'$'+retAmt.toLocaleString():'—'}</td>
        <td style="color:${bal>0?'#d97706':'#059669'};font-weight:700">$${bal.toLocaleString()}</td>
        <td>${pctPaid}%</td>
        <td>${c.status}</td><td>${c.startDate||'—'}</td><td>${c.endDate||'—'}</td>
      </tr>
      ${(c.payments||[]).length>0?`<tr><td colspan="15" style="padding:0"><div style="margin:0 10px 10px;background:#f0f9ff;border-radius:6px;padding:8px"><strong style="font-size:11px;color:#0369a1">Payment History (${c.payments.length} payments)</strong><table style="width:100%;margin-top:6px;font-size:10px"><tr style="background:#0369a1;color:white"><th style="padding:4px 8px">#</th><th style="padding:4px 8px">Date</th><th style="padding:4px 8px">Amount</th><th style="padding:4px 8px">Reference</th><th style="padding:4px 8px">Method</th><th style="padding:4px 8px">Description</th></tr>${paymentRows}</table></div></td></tr>`:''}`;
    }).join('');

    const matRows = (site.materials||[]).map((mat,i) => `<tr style="background:${i%2===0?'white':'#f9fafb'}"><td>${i+1}</td><td><strong>${mat.name}</strong></td><td>${mat.category||'—'}</td><td>${mat.quantity.toLocaleString()}</td><td>${mat.totalQty?mat.totalQty.toLocaleString():'—'}</td><td>${mat.unit||'—'}</td><td>$${mat.unitCost.toLocaleString()}</td><td style="color:#7c3aed;font-weight:700">$${(mat.quantity*mat.unitCost).toLocaleString()}</td><td>${mat.supplier||'—'}</td><td>${mat.deliveryDate||'—'}</td><td>${mat.condition||'—'}</td><td>${mat.notes||'—'}</td></tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Finance Report — ${site.name}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11px;color:#1f2937;background:white}.header{background:linear-gradient(135deg,#d97706,#7c3aed);color:white;padding:22px 28px}.header h1{font-size:20px;margin-bottom:4px}.header p{font-size:12px;opacity:.85}.content{padding:22px 28px}.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}.kpi{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px}.kpi-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}.kpi-value{font-size:18px;font-weight:800}.section-title{font-size:13px;font-weight:700;color:#1f2937;margin:20px 0 10px;padding-bottom:6px;border-bottom:2px solid #d97706}table{width:100%;border-collapse:collapse;margin-bottom:8px}thead th{background:#1f2937;color:white;padding:6px 8px;font-size:9px;text-align:left;white-space:nowrap}tbody td{padding:5px 8px;font-size:10px;border-bottom:1px solid #f0f0f0;vertical-align:middle}tfoot td{padding:6px 8px;font-size:10px;font-weight:800;background:#fef3c7;color:#92400e}.footer{margin-top:20px;font-size:9px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:8px;display:flex;justify-content:space-between}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head>
    <body>
    <div class="header"><h1>🏗️ Construction Finance Report</h1><p>${site.name} | ${site.location||''} | Generated: ${new Date().toLocaleDateString()}</p></div>
    <div class="content">
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Total Budget</div><div class="kpi-value" style="color:#d97706">$${site.budget.toLocaleString()}</div></div>
      <div class="kpi"><div class="kpi-label">Total Spent</div><div class="kpi-value" style="color:#dc2626">$${m.spent.toLocaleString()}</div><div style="font-size:9px;color:#6b7280">${m.pct}% of budget</div></div>
      <div class="kpi"><div class="kpi-label">Remaining Budget</div><div class="kpi-value" style="color:#059669">$${m.remaining.toLocaleString()}</div></div>
      <div class="kpi"><div class="kpi-label">BOQ Total</div><div class="kpi-value" style="color:#7c3aed">$${m.boqTotal.toLocaleString()}</div></div>
    </div>
    <div class="section-title">👷 Contractors BOQ & Payment History (${site.contractors?.length||0})</div>
    <table><thead><tr><th>#</th><th>Contractor</th><th>Scope</th><th>Unit</th><th>Price/Unit</th><th>Qty</th><th>BOQ Total</th><th>Paid</th><th>Ret%</th><th>Ret Amt</th><th>Balance</th><th>Progress</th><th>Status</th><th>Start</th><th>End</th></tr></thead>
    <tbody>${contractorRows}</tbody></table>
    <div class="section-title">📦 Materials & Supplies (${site.materials?.length||0})</div>
    <table><thead><tr><th>#</th><th>Material</th><th>Category</th><th>Qty Received</th><th>Total Ordered</th><th>Unit</th><th>Price/Unit</th><th>Total Cost</th><th>Supplier</th><th>Delivery</th><th>Condition</th><th>Notes</th></tr></thead>
    <tbody>${matRows}</tbody></table>
    <div class="footer"><span>🏗️ Construction Finance Manager</span><span>Status: ${site.status||'In Progress'}</span></div>
    </div>
    <script>window.onload=function(){setTimeout(()=>{window.print();},400);}<\/script>
    </body></html>`;

    const w = window.open('', '_blank'); 
    w.document.write(html); 
    w.document.close();
  };

  const exportCSV = () => {
    const site = getCurrentSite(); 
    if (!site) return;
    const m = calcMetrics(site);
    let csv = `CONSTRUCTION FINANCE REPORT\nSite: ${site.name}\nBudget,$${site.budget}\nSpent,$${m.spent}\nRemaining,$${m.remaining}\n\n`;
    csv += `MATERIALS\nName,Category,Qty,Unit,Price,Total,Supplier\n`;
    (site.materials||[]).forEach(x => { csv += `${x.name},${x.category},${x.quantity},${x.unit},${x.unitCost},${x.quantity*x.unitCost},${x.supplier||''}\n`; });
    csv += `\nCONTRACTORS\nName,Scope,BOQ,Paid,Balance\n`;
    (site.contractors||[]).forEach(x => { csv += `${x.name},${x.scope},${x.boqTotal},${x.paid},${x.boqTotal-x.paid}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `finance_${site.name}_${Date.now()}.csv`; 
    a.click();
  };

  // ── STYLES & DATA ──
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
  const selectedContractor = site?.contractors?.find(c => c.id === selectedContractorId);

  const contractorChartData = site?.contractors?.map(c => ({ 
    name: c.name && c.name.length > 12 ? c.name.substring(0,12)+'…' : c.name || 'Unknown', 
    'BOQ Total': parseFloat(c.boqTotal) || 0, 
    'Paid': parseFloat(c.paid) || 0, 
    'Balance': (parseFloat(c.boqTotal) || 0) - (parseFloat(c.paid) || 0) 
  })) || [];

  const materialChartData = site?.materials?.map(m => ({ 
    name: m.name || 'Unknown', 
    value: (parseFloat(m.quantity) || 0) * (parseFloat(m.unitCost) || 0)
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
                  <div style={{ fontSize: '10px', color: '#d97706', fontWeight: '600', marginTop: 2 }}>${((s.budget||0)/1000).toFixed(0)}k · {m.pct}% used</div>
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

          {/* ✅ PAYMENT LINKS */}
          {site && (site.contractors||[]).length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}><CreditCard size={12} style={{ verticalAlign: 'middle', marginRight: 4 }}/> Contractor Payments</div>
              {(site.contractors||[]).map(c => {
                const bal = (c.boqTotal||0) - (c.paid||0);
                const pct = c.boqTotal ? ((c.paid||0)/c.boqTotal*100).toFixed(0) : 0;
                return (
                  <div key={c.id} onClick={() => handlePaymentLinkClick(c.id)} style={{ padding: '8px 10px', background: selectedContractorId===c.id&&activeTab==='payments'?'#ede9fe':'#f9fafb', borderRadius: '6px', cursor: 'pointer', marginBottom: '6px', border: `1px solid ${selectedContractorId===c.id&&activeTab==='payments'?'#7c3aed':'transparent'}` }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937' }}>{c.name.split(' ').slice(0,2).join(' ')}</div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>{c.scope}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                      <span style={{ fontSize: '10px', color: '#059669', fontWeight: '600' }}>${(c.paid||0).toLocaleString()} paid</span>
                      <span style={{ fontSize: '10px', color: '#d97706', fontWeight: '600' }}>{pct}%</span>
                    </div>
                    <ProgressBar pct={pct} color="#7c3aed" />
                  </div>
                );
              })}
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

            {/* ══════════════ DASHBOARD ══════════════ */}
            {activeTab === 'dashboard' && site && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>{site.name} — Dashboard</h2>
                  <button onClick={() => setDeleteSiteConfirm(site.id)} style={{...btn('#fee2e2','#dc2626'), border:'1px solid #fca5a5', fontSize:'12px'}}><Trash2 size={13}/> Delete Site</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px', marginBottom: '20px' }}>
                  <KpiCard label="Total Budget" value={`$${site.budget.toLocaleString()}`} color="#d97706" icon={<DollarSign size={20}/>} />
                  <KpiCard label="Total Spent" value={`$${metrics.spent?.toLocaleString()}`} sub={`${metrics.pct}% of budget`} color={parseFloat(metrics.pct)>80?'#dc2626':'#374151'} icon={<TrendingUp size={20}/>} />
                  <KpiCard label="Remaining" value={`$${metrics.remaining?.toLocaleString()}`} color="#059669" icon={<ArrowDownRight size={20}/>} />
                  <KpiCard label="BOQ Total" value={`$${metrics.boqTotal?.toLocaleString()}`} color="#7c3aed" />
                  <KpiCard label="Contractor Paid" value={`$${metrics.conPaid?.toLocaleString()}`} color="#059669" icon={<CreditCard size={20}/>} />
                  <KpiCard label="Contractor Balance" value={`$${metrics.conBalance?.toLocaleString()}`} color="#d97706" sub="Outstanding to pay" />
                  <KpiCard label="Retention Held" value={`$${metrics.retentionTotal?.toLocaleString()}`} color="#0369a1" />
                  <KpiCard label="Materials Spend" value={`$${metrics.matSpent?.toLocaleString()}`} color="#7c3aed" />
                </div>

                <div style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    <span>Budget Utilization</span><span>{metrics.pct}%</span>
                  </div>
                  <ProgressBar pct={metrics.pct} />
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                    {metrics.pct > 90 ? '🔴 Critical — over 90% spent' : metrics.pct > 75 ? '🟡 Warning — over 75% spent' : '🟢 On track'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#374151', marginBottom: '12px' }}>👷 Contractor BOQ vs Paid</div>
                    {contractorChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={contractorChartData} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="BOQ Total" fill="#7c3aed" radius={[3,3,0,0]} />
                          <Bar dataKey="Paid" fill="#059669" radius={[3,3,0,0]} />
                          <Bar dataKey="Balance" fill="#d97706" radius={[3,3,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '13px' }}>No contractor data</div>}
                  </div>

                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#374151', marginBottom: '12px' }}>📦 Material Cost Breakdown</div>
                    {materialChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={materialChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                            {materialChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '13px' }}>No material data</div>}
                  </div>
                </div>

                <div style={{ background: 'white', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '18px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#374151', marginBottom: '12px' }}>💳 Contractor Payment Progress</div>
                  {(site.contractors||[]).length > 0 ? (site.contractors||[]).map(c => {
                    const pct = c.boqTotal ? ((c.paid||0)/c.boqTotal*100).toFixed(1) : 0;
                    const balance = (c.boqTotal||0) - (c.paid||0);
                    return (
                      <div key={c.id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div>
                            <span style={{ fontWeight: '600', fontSize: '13px' }}>{c.name}</span>
                            <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '8px' }}>{c.scope}</span>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '12px' }}>
                            <span style={{ color: '#059669', fontWeight: '700' }}>${(c.paid||0).toLocaleString()} paid</span>
                            <span style={{ color: '#9ca3af', margin: '0 6px' }}>/</span>
                            <span style={{ color: '#7c3aed' }}>${(c.boqTotal||0).toLocaleString()} BOQ</span>
                          </div>
                        </div>
                        <ProgressBar pct={pct} color="#7c3aed" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#9ca3af' }}>
                          <span>{pct}% paid · {(c.payments||[]).length} payment(s)</span>
                          <span style={{ color: '#d97706' }}>Balance: ${balance.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  }) : <div style={{ color: '#9ca3af', fontSize: '13px' }}>No contractors added yet</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'white', padding: '14px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontWeight: '700', marginBottom: '10px', color: '#7c3aed', fontSize: '13px' }}>📦 Materials ({(site.materials||[]).length})</div>
                    {(site.materials||[]).map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span>{m.name} <span style={{ color: '#9ca3af' }}>({m.quantity}{m.unit})</span></span>
                        <span style={{ fontWeight: '700', color: '#7c3aed' }}>${(m.quantity*m.unitCost).toLocaleString()}</span>
                      </div>
                    ))}
                    {(site.materials||[]).length === 0 && <div style={{ color: '#9ca3af', fontSize: '12px' }}>None added</div>}
                  </div>
                  <div style={{ background: 'white', padding: '14px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontWeight: '700', marginBottom: '10px', color: '#d97706', fontSize: '13px' }}>👷 Contractors ({(site.contractors||[]).length})</div>
                    {(site.contractors||[]).map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span>{c.name}</span>
                        <span style={{ fontWeight: '700', color: '#d97706' }}>${(c.boqTotal||0).toLocaleString()}</span>
                      </div>
                    ))}
                    {(site.contractors||[]).length === 0 && <div style={{ color: '#9ca3af', fontSize: '12px' }}>None added</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ MATERIALS ══════════════ */}
            {activeTab === 'materials' && site && (
              <div>
                <h2 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '18px' }}>Materials & Supplies</h2>
                <div style={{ background: 'white', padding: '18px', borderRadius: '10px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontWeight: '700', color: '#7c3aed', marginBottom: '12px', fontSize: '13px' }}>+ Add Material</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Name *</div><input placeholder="e.g. Concrete" value={newMaterial.name} onChange={e=>setNewMaterial({...newMaterial,name:e.target.value})} style={inp}/></div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>Category * <button onClick={()=>setShowAddCategory(!showAddCategory)} style={{ background:'none',border:'none',cursor:'pointer',color:'#7c3aed',fontSize:'11px',padding:0,fontWeight:'600' }}>{showAddCategory?'Cancel':'+ New'}</button></div>
                      {showAddCategory ? <div style={{ display:'flex',gap:'4px' }}><input placeholder="New category" value={newCategoryInput} onChange={e=>setNewCategoryInput(e.target.value)} style={{...inp,flex:1}}/><button onClick={addCategory} style={{...btn('#7c3aed'),padding:'8px 10px'}}><Check size={13}/></button></div>
                      : <select value={newMaterial.category} onChange={e=>setNewMaterial({...newMaterial,category:e.target.value})} style={inp}><option value="">Select</option>{categories.map(c=><option key={c}>{c}</option>)}</select>}
                    </div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Qty Received *</div><input type="number" placeholder="250" value={newMaterial.quantity} onChange={e=>setNewMaterial({...newMaterial,quantity:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Total Ordered</div><input type="number" placeholder="300" value={newMaterial.totalQty} onChange={e=>setNewMaterial({...newMaterial,totalQty:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Unit</div><input placeholder="m³, ton" value={newMaterial.unit} onChange={e=>setNewMaterial({...newMaterial,unit:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Price / Unit ($) *</div><input type="number" placeholder="150" value={newMaterial.unitCost} onChange={e=>setNewMaterial({...newMaterial,unitCost:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Supplier</div><input placeholder="Supplier" value={newMaterial.supplier} onChange={e=>setNewMaterial({...newMaterial,supplier:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Delivery Date</div><input type="date" value={newMaterial.deliveryDate} onChange={e=>setNewMaterial({...newMaterial,deliveryDate:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Condition</div><select value={newMaterial.condition} onChange={e=>setNewMaterial({...newMaterial,condition:e.target.value})} style={inp}><option>Good</option><option>Acceptable</option><option>Damaged</option></select></div>
                    <div><div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Notes</div><input placeholder="Grade, spec" value={newMaterial.notes} onChange={e=>setNewMaterial({...newMaterial,notes:e.target.value})} style={inp}/></div>
                  </div>
                  {newMaterial.quantity && newMaterial.unitCost && <div style={{ marginTop: '10px', padding: '8px 12px', background: '#e0e7ff', borderRadius: '6px', fontSize: '13px', color: '#3730a3', fontWeight: '600' }}>Preview: ${(parseFloat(newMaterial.quantity||0)*parseFloat(newMaterial.unitCost||0)).toLocaleString()}</div>}
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}><button onClick={addMaterial} style={btn('#7c3aed')}><Plus size={14}/> Add Material</button></div>
                </div>

                <div style={{ background: 'white', padding: '12px 16px', borderRadius: '10px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}><Tag size={12} style={{ verticalAlign: 'middle', marginRight: 4 }}/> Categories
                    <button onClick={()=>setShowAddCategory(!showAddCategory)} style={{ marginLeft:'8px', background:'#7c3aed', color:'white', border:'none', borderRadius:'4px', padding:'2px 7px', fontSize:'10px', cursor:'pointer', fontWeight:'600' }}>+ Add</button></div>
                  {showAddCategory && <div style={{ display:'flex', gap:'6px', marginBottom:'8px' }}><input placeholder="New category" value={newCategoryInput} onChange={e=>setNewCategoryInput(e.target.value)} style={{...inp,maxWidth:'240px'}}/><button onClick={addCategory} style={btn('#7c3aed')}>Add</button><button onClick={()=>{setShowAddCategory(false);setNewCategoryInput('');}} style={btn('#6b7280')}>Cancel</button></div>}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>{categories.map(cat=><div key={cat} style={{ display:'flex', alignItems:'center', gap:'4px', background:'#e0e7ff', color:'#3730a3', padding:'3px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{cat}<button onClick={()=>removeCategory(cat)} style={{ background:'none',border:'none',cursor:'pointer',color:'#7c3aed',padding:0,display:'flex' }}><X size={11}/></button></div>)}</div>
                </div>

                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'12px' }}>
                  {['All',...categories].map(cat=><button key={cat} onClick={()=>setMaterialCategoryFilter(cat)} style={{ padding:'4px 10px', borderRadius:'20px', border:`1px solid ${materialCategoryFilter===cat?'#7c3aed':'#ddd'}`, background:materialCategoryFilter===cat?'#7c3aed':'white', color:materialCategoryFilter===cat?'white':'#374151', fontSize:'11px', cursor:'pointer', fontWeight:materialCategoryFilter===cat?'700':'400' }}>{cat}{cat!=='All'&&` (${(site.materials||[]).filter(m=>m.category===cat).length})`}</button>)}
                </div>

                <div style={{ background: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                    <thead><tr>
                      {['#','Material Name','Category','Qty Received','Total Ordered','Unit','Price / Unit','Total Cost','Supplier','Delivery','Condition','Notes','Action'].map(h=><th key={h} style={TH}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {filteredMats.map((m,i) => (
                        <tr key={m.id} style={{ background: i%2===0?'white':'#fafafa' }}>
                          <td style={{...TD,color:'#9ca3af'}}>{i+1}</td>
                          <td style={{...TD,fontWeight:'700',whiteSpace:'nowrap'}}>{m.name}</td>
                          <td style={TD}><span style={{ background:'#e0e7ff',color:'#3730a3',padding:'2px 7px',borderRadius:'12px',fontSize:'11px',fontWeight:'600',whiteSpace:'nowrap' }}>{m.category||'—'}</span></td>
                          <td style={{...TD,fontWeight:'600'}}>{m.quantity.toLocaleString()}</td>
                          <td style={TD}>{m.totalQty?m.totalQty.toLocaleString():'—'}</td>
                          <td style={TD}>{m.unit||'—'}</td>
                          <td style={TD}>${m.unitCost.toLocaleString()}{m.unit?` / ${m.unit}`:''}</td>
                          <td style={{...TD,fontWeight:'800',color:'#7c3aed'}}>${(m.quantity*m.unitCost).toLocaleString()}</td>
                          <td style={{...TD,whiteSpace:'nowrap'}}>{m.supplier||'—'}</td>
                          <td style={{...TD,whiteSpace:'nowrap'}}>{m.deliveryDate||'—'}</td>
                          <td style={TD}><span style={{ background:m.condition==='Good'?'#d1fae5':m.condition==='Damaged'?'#fee2e2':'#fef3c7', color:m.condition==='Good'?'#065f46':m.condition==='Damaged'?'#991b1b':'#92400e', padding:'2px 7px',borderRadius:'12px',fontSize:'11px',fontWeight:'600' }}>{m.condition||'—'}</span></td>
                          <td style={{...TD,color:'#6b7280',minWidth:'130px',wordBreak:'break-word',whiteSpace:'normal'}}>{m.notes||'—'}</td>
                          <td style={{...TD,textAlign:'center'}}><button onClick={()=>deleteMaterial(m.id)} style={btn('#ef4444')}><Trash2 size={13}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                    {filteredMats.length > 0 && <tfoot><tr style={{ background:'#fef9c3' }}>
                      <td colSpan={3} style={{...TD,fontWeight:'800',color:'#92400e'}}>TOTAL ({filteredMats.length})</td>
                      <td style={{...TD,fontWeight:'800'}}>{filteredMats.reduce((s,m)=>s+m.quantity,0).toLocaleString()}</td>
                      <td style={{...TD,fontWeight:'800'}}>{filteredMats.reduce((s,m)=>s+(m.totalQty||0),0).toLocaleString()}</td>
                      <td colSpan={2}/>
                      <td style={{...TD,fontWeight:'800',color:'#7c3aed'}}>${filteredMats.reduce((s,m)=>s+m.quantity*m.unitCost,0).toLocaleString()}</td>
                      <td colSpan={5}/>
                    </tr></tfoot>}
                  </table>
                  {filteredMats.length===0 && <div style={{ padding:'28px',textAlign:'center',color:'#9ca3af' }}>No materials found</div>}
                </div>
              </div>
            )}

            {/* ══════════════ CONTRACTORS BOQ ══════════════ */}
            {activeTab === 'contractors' && site && (
              <div>
                <h2 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '18px' }}>Contractors & BOQ</h2>
                <div style={{ background: 'white', padding: '18px', borderRadius: '10px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontWeight: '700', color: '#d97706', marginBottom: '12px', fontSize: '13px' }}>+ Add Contractor</div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>CONTRACTOR NAME *</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <button onClick={()=>setContractorNameMode('preset')} style={{...btn(contractorNameMode==='preset'?'#d97706':'#f3f4f6',contractorNameMode==='preset'?'white':'#374151'),fontSize:'12px'}}>Select from List</button>
                      <button onClick={()=>{setContractorNameMode('new');setNewContractor({...newContractor,name:''}); }} style={{...btn(contractorNameMode==='new'?'#d97706':'#f3f4f6',contractorNameMode==='new'?'white':'#374151'),fontSize:'12px'}}><Plus size={12}/> New Contractor</button>
                    </div>
                    {contractorNameMode==='preset' ? (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                        {PRESET_CONTRACTORS.map(name=><button key={name} onClick={()=>setNewContractor({...newContractor,name})} style={{ padding:'5px 10px', borderRadius:'20px', border:`1.5px solid ${newContractor.name===name?'#d97706':'#e5e7eb'}`, background:newContractor.name===name?'#fef3c7':'white', color:newContractor.name===name?'#92400e':'#374151', fontSize:'12px', cursor:'pointer', fontWeight:newContractor.name===name?'700':'400' }}>{newContractor.name===name?'✓ ':''}{name}</button>)}
                      </div>
                    ) : <input placeholder="Type contractor name" value={customContractorName} onChange={e=>setCustomContractorName(e.target.value)} style={{...inp,maxWidth:'340px'}}/>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                    <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Scope *</div>
                      <select value={newContractor.scope} onChange={e=>setNewContractor({...newContractor,scope:e.target.value})} style={inp}><option value="">Select</option>{CONTRACTOR_SCOPES.map(s=><option key={s}>{s}</option>)}</select>
                    </div>
                    <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Unit</div><input placeholder="m², m³" value={newContractor.unit} onChange={e=>setNewContractor({...newContractor,unit:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Price / Unit ($) *</div><input type="number" placeholder="400" value={newContractor.pricePerUnit} onChange={e=>setNewContractor({...newContractor,pricePerUnit:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Quantity *</div><input type="number" placeholder="300" value={newContractor.quantity} onChange={e=>setNewContractor({...newContractor,quantity:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Retention (%)</div><input type="number" placeholder="10" value={newContractor.retention} onChange={e=>setNewContractor({...newContractor,retention:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Start Date</div><input type="date" value={newContractor.startDate} onChange={e=>setNewContractor({...newContractor,startDate:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>End Date</div><input type="date" value={newContractor.endDate} onChange={e=>setNewContractor({...newContractor,endDate:e.target.value})} style={inp}/></div>
                    <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Status</div><select value={newContractor.status} onChange={e=>setNewContractor({...newContractor,status:e.target.value})} style={inp}><option>Pending</option><option>In Progress</option><option>Completed</option></select></div>
                    <div><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Contact</div><input placeholder="+966 50 000" value={newContractor.contact} onChange={e=>setNewContractor({...newContractor,contact:e.target.value})} style={inp}/></div>
                    <div style={{ gridColumn:'span 2' }}><div style={{ fontSize:'11px',color:'#6b7280',marginBottom:'4px' }}>Notes</div><input placeholder="Payment terms, milestones" value={newContractor.notes} onChange={e=>setNewContractor({...newContractor,notes:e.target.value})} style={inp}/></div>
                  </div>
                  {boqPreview > 0 && <div style={{ marginTop:'10px', padding:'10px 14px', background:'#fef3c7', borderRadius:'6px', fontSize:'13px', color:'#92400e', fontWeight:'700' }}>BOQ Total: ${boqPreview.toLocaleString()}</div>}
                  <div style={{ marginTop:'12px', display:'flex', justifyContent:'flex-end' }}><button onClick={addContractor} style={btn('#d97706')}><Plus size={14}/> Add to BOQ</button></div>
                </div>

                <div style={{ background: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                    <thead><tr>
                      {['#','Contractor','Scope','Unit','Price/Unit','Qty','BOQ Total','Paid','Balance','% Paid','Ret%','Ret Amt','Start','End','Status','Payments','Action'].map(h=><th key={h} style={TH}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {(site.contractors||[]).map((c,i) => {
                        const retAmt = (c.boqTotal||0)*(c.retention||0)/100;
                        const balance = (c.boqTotal||0)-(c.paid||0);
                        const pct = c.boqTotal ? ((c.paid||0)/c.boqTotal*100).toFixed(1) : 0;
                        return (
                          <tr key={c.id} style={{ background: i%2===0?'white':'#fafafa' }}>
                            <td style={{...TD,color:'#9ca3af'}}>{i+1}</td>
                            <td style={{...TD,fontWeight:'700',whiteSpace:'nowrap'}}>{c.name}</td>
                            <td style={{...TD,whiteSpace:'nowrap'}}>{c.scope}</td>
                            <td style={TD}>{c.unit||'—'}</td>
                            <td style={TD}>{c.pricePerUnit?`$${c.pricePerUnit.toLocaleString()}`:'—'}</td>
                            <td style={{...TD,fontWeight:'600'}}>{c.quantity?c.quantity.toLocaleString():'—'}</td>
                            <td style={{...TD,fontWeight:'800',color:'#7c3aed'}}>${(c.boqTotal||0).toLocaleString()}</td>
                            <td style={{...TD,fontWeight:'700',color:'#059669'}}>${(c.paid||0).toLocaleString()}</td>
                            <td style={{...TD,fontWeight:'800',color:balance>0?'#d97706':'#059669'}}>${balance.toLocaleString()}</td>
                            <td style={TD}>
                              <div style={{ fontSize:'11px',marginBottom:'3px',color:'#374151' }}>{pct}%</div>
                              <ProgressBar pct={pct} color="#7c3aed"/>
                            </td>
                            <td style={TD}>{c.retention?`${c.retention}%`:'—'}</td>
                            <td style={{...TD,color:'#0369a1',fontWeight:'600'}}>{c.retention?`$${retAmt.toLocaleString()}`:'—'}</td>
                            <td style={{...TD,whiteSpace:'nowrap'}}>{c.startDate||'—'}</td>
                            <td style={{...TD,whiteSpace:'nowrap'}}>{c.endDate||'—'}</td>
                            <td style={TD}>{statusBadge(c.status)}</td>
                            <td style={TD}>
                              <button onClick={()=>handlePaymentLinkClick(c.id)} style={{...btn('#ede9fe','#7c3aed'),fontSize:'11px',padding:'5px 10px'}}><CreditCard size={12}/> {(c.payments||[]).length}</button>
                            </td>
                            <td style={{...TD,textAlign:'center'}}><button onClick={()=>deleteContractor(c.id)} style={btn('#ef4444')}><Trash2 size={13}/></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {(site.contractors||[]).length > 0 && <tfoot><tr style={{ background:'#fef9c3' }}>
                      <td colSpan={6} style={{...TD,fontWeight:'800',color:'#92400e'}}>TOTAL ({(site.contractors||[]).length})</td>
                      <td style={{...TD,fontWeight:'800',color:'#7c3aed'}}>${(site.contractors||[]).reduce((s,c)=>s+(c.boqTotal||0),0).toLocaleString()}</td>
                      <td style={{...TD,fontWeight:'800',color:'#059669'}}>${(site.contractors||[]).reduce((s,c)=>s+(c.paid||0),0).toLocaleString()}</td>
                      <td style={{...TD,fontWeight:'800',color:'#d97706'}}>${(site.contractors||[]).reduce((s,c)=>s+((c.boqTotal||0)-(c.paid||0)),0).toLocaleString()}</td>
                      <td colSpan={8}/>
                    </tr></tfoot>}
                  </table>
                  {(site.contractors||[]).length===0 && <div style={{ padding:'28px',textAlign:'center',color:'#9ca3af' }}>No contractors added</div>}
                </div>
              </div>
            )}

            {/* ══════════════ PAYMENTS ══════════════ */}
            {activeTab === 'payments' && site && (
              <div>
                <h2 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '18px' }}>💳 Contractor Payments</h2>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {(site.contractors||[]).map(c => (
                    <button key={c.id} onClick={()=>setSelectedContractorId(c.id)} style={{ padding: '8px 14px', borderRadius: '8px', border: `2px solid ${selectedContractorId===c.id?'#7c3aed':'#e5e7eb'}`, background: selectedContractorId===c.id?'#ede9fe':'white', color: selectedContractorId===c.id?'#7c3aed':'#374151', cursor: 'pointer', fontWeight: selectedContractorId===c.id?'700':'400', fontSize: '13px' }}>
                      {c.name}
                      <span style={{ marginLeft: '8px', fontSize: '11px', color: '#9ca3af' }}>{(c.payments||[]).length} pmts</span>
                    </button>
                  ))}
                  {(site.contractors||[]).length===0 && <div style={{ color:'#9ca3af',fontSize:'13px' }}>No contractors. Add them in the Contractors BOQ tab first.</div>}
                </div>

                {selectedContractor && (
                  <div>
                    <div style={{ background: 'white', borderRadius: '10px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '12px', color: '#1f2937' }}>{selectedContractor.name} — {selectedContractor.scope}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '12px' }}>
                        <KpiCard label="BOQ Total" value={`$${(selectedContractor.boqTotal||0).toLocaleString()}`} color="#7c3aed"/>
                        <KpiCard label="Total Paid" value={`$${(selectedContractor.paid||0).toLocaleString()}`} color="#059669"/>
                        <KpiCard label="Balance Due" value={`$${((selectedContractor.boqTotal||0)-(selectedContractor.paid||0)).toLocaleString()}`} color="#d97706"/>
                        <KpiCard label="Payments Made" value={(selectedContractor.payments||[]).length} color="#0369a1"/>
                        <KpiCard label="Retention %" value={selectedContractor.retention?`${selectedContractor.retention}%`:'—'} color="#374151"/>
                        <KpiCard label="Retention Held" value={selectedContractor.retention?`$${((selectedContractor.boqTotal||0)*(selectedContractor.retention||0)/100).toLocaleString()}`:'—'} color="#0369a1"/>
                      </div>
                      <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#374151', fontWeight: '600' }}>
                        <span>Payment Progress</span>
                        <span>{selectedContractor.boqTotal?((selectedContractor.paid||0)/selectedContractor.boqTotal*100).toFixed(1):0}%</span>
                      </div>
                      <ProgressBar pct={selectedContractor.boqTotal?((selectedContractor.paid||0)/selectedContractor.boqTotal*100).toFixed(1):0} color="#7c3aed"/>
                    </div>

                    {(selectedContractor.payments||[]).length > 0 && (
                      <div style={{ background: 'white', borderRadius: '10px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#374151', marginBottom: '12px' }}>Payment Timeline</div>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={(selectedContractor.payments||[]).map((p,i) => ({ name: p.date, amount: p.amount, ref: p.reference||`P${i+1}` }))} margin={{ top:4, right:8, left:0, bottom:20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end"/>
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                            <Tooltip formatter={v=>`$${v.toLocaleString()}`}/>
                            <Bar dataKey="amount" fill="#7c3aed" radius={[3,3,0,0]} name="Payment Amount"/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

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
                        <div style={{ marginTop:'10px', padding:'8px 12px', background:'#ede9fe', borderRadius:'6px', fontSize:'13px', color:'#5b21b6', fontWeight:'600', display:'flex', gap:'20px', flexWrap:'wrap' }}>
                          <span>Payment: ${parseFloat(newPayment.amount||0).toLocaleString()}</span>
                          <span>New Total Paid: ${((selectedContractor.paid||0)+parseFloat(newPayment.amount||0)).toLocaleString()}</span>
                          <span>Remaining After: ${((selectedContractor.boqTotal||0)-(selectedContractor.paid||0)-parseFloat(newPayment.amount||0)).toLocaleString()}</span>
                        </div>
                      )}
                      <div style={{ marginTop:'12px', display:'flex', justifyContent:'flex-end' }}><button onClick={()=>addPayment(selectedContractor.id)} style={btn('#7c3aed')}><Plus size={14}/> Log Payment</button></div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '700', fontSize: '13px', color: '#374151' }}>
                        Payment History — {selectedContractor.name} ({(selectedContractor.payments||[]).length} records)
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead><tr>
                          {['#','Date','Amount','Running Total','Reference','Method','Description','Action'].map(h=><th key={h} style={TH}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {(selectedContractor.payments||[]).map((p,i) => {
                            const runningTotal = (selectedContractor.payments||[]).slice(0,i+1).reduce((s,x)=>s+x.amount,0);
                            return (
                              <tr key={p.id} style={{ background: i%2===0?'white':'#fafafa' }}>
                                <td style={{...TD,color:'#9ca3af'}}>{i+1}</td>
                                <td style={{...TD,whiteSpace:'nowrap',fontWeight:'600'}}>{p.date}</td>
                                <td style={{...TD,fontWeight:'800',color:'#059669'}}>${p.amount.toLocaleString()}</td>
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
                          <td style={{...TD,fontWeight:'800',color:'#059669'}}>${(selectedContractor.paid||0).toLocaleString()}</td>
                          <td colSpan={5}/>
                        </tr></tfoot>}
                      </table>
                      {(selectedContractor.payments||[]).length===0 && <div style={{ padding:'28px',textAlign:'center',color:'#9ca3af',fontSize:'13px' }}>No payments logged yet. Use the form above to record a payment.</div>}
                    </div>
                  </div>
                )}
                {!selectedContractor && (site.contractors||[]).length > 0 && (
                  <div style={{ background:'white',borderRadius:'10px',padding:'40px',textAlign:'center',color:'#9ca3af',boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
                    <CreditCard size={40} style={{ marginBottom:'12px',opacity:0.3 }}/>
                    <div style={{ fontSize:'15px',fontWeight:'600' }}>Select a contractor above to view and log payments</div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════ FINANCIALS ══════════════ */}
            {activeTab === 'financials' && (
              <div>
                <h2 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '18px' }}>Financial Dashboard — All Sites</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '20px' }}>
                  <KpiCard label="Total Budget" value={`$${(allM.totalBudget/1000).toFixed(0)}k`} color="#1f2937"/>
                  <KpiCard label="Total Spent" value={`$${(allM.totalSpent/1000).toFixed(0)}k`} sub={`${allM.pct}% of budget`} color="#d97706"/>
                  <KpiCard label="Remaining" value={`$${(allM.totalRemaining/1000).toFixed(0)}k`} color="#059669"/>
                  <KpiCard label="Total BOQ" value={`$${(allM.totalBOQ/1000).toFixed(0)}k`} color="#7c3aed"/>
                  <KpiCard label="Total Paid (Contractors)" value={`$${(allM.totalPaid/1000).toFixed(0)}k`} color="#059669"/>
                  <KpiCard label="Contractor Balance" value={`$${(allM.totalBalance/1000).toFixed(0)}k`} color="#d97706"/>
                  <KpiCard label="Total Retention" value={`$${(allM.totalRetention/1000).toFixed(0)}k`} color="#0369a1"/>
                  <KpiCard label="Sites" value={sites.length} color="#374151"/>
                </div>

                <div style={{ background: 'white', borderRadius: '10px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#374151', marginBottom: '12px' }}>Budget vs Spent vs BOQ by Site</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={globalChartData} margin={{ top:4, right:8, left:0, bottom:20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end"/>
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                      <Tooltip formatter={v=>`$${v.toLocaleString()}`}/>
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }}/>
                      <Bar dataKey="Budget" fill="#d97706" radius={[3,3,0,0]}/>
                      <Bar dataKey="Spent" fill="#dc2626" radius={[3,3,0,0]}/>
                      <Bar dataKey="BOQ" fill="#7c3aed" radius={[3,3,0,0]}/>
                      <Bar dataKey="Paid" fill="#059669" radius={[3,3,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', fontWeight: '700', color: '#1f2937', fontSize: '13px' }}>Cost Breakdown by Project</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                      <thead><tr>{['Project','Budget','Materials','BOQ Total','Contractor Paid','BOQ Balance','Total Spent','Remaining','% Used'].map(h=><th key={h} style={{...TH,textAlign:h==='Project'?'left':'right'}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {sites.map((s,i) => {
                          const m = calcMetrics(s);
                          return <tr key={s.id} style={{ background: i%2===0?'white':'#fafafa' }}>
                            <td style={{...TD,fontWeight:'700'}}>{s.name}</td>
                            <td style={{...TD,textAlign:'right'}}>${s.budget.toLocaleString()}</td>
                            <td style={{...TD,textAlign:'right',color:'#7c3aed'}}>${m.matSpent.toLocaleString()}</td>
                            <td style={{...TD,textAlign:'right',color:'#7c3aed',fontWeight:'700'}}>${m.boqTotal.toLocaleString()}</td>
                            <td style={{...TD,textAlign:'right',color:'#059669',fontWeight:'700'}}>${m.conPaid.toLocaleString()}</td>
                            <td style={{...TD,textAlign:'right',color:'#d97706',fontWeight:'700'}}>${m.conBalance.toLocaleString()}</td>
                            <td style={{...TD,textAlign:'right',fontWeight:'700',color:'#d97706'}}>${m.spent.toLocaleString()}</td>
                            <td style={{...TD,textAlign:'right',color:'#059669'}}>${m.remaining.toLocaleString()}</td>
                            <td style={{...TD,textAlign:'right',fontWeight:'700',color:parseFloat(m.pct)>75?'#d97706':'#059669'}}>{m.pct}%</td>
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={exportPDF} style={{...btn('#7c3aed'),flex:1,justifyContent:'center'}}><FileText size={15}/> Export PDF Report</button>
                  <button onClick={exportCSV} style={{...btn('#059669'),flex:1,justifyContent:'center'}}><Download size={15}/> Download CSV</button>
                </div>
              </div>
            )}

            {/* ══════════════ AI ══════════════ */}
            {activeTab === 'ai' && (
              <div style={{ display:'flex', flexDirection:'column' }}>
                <h2 style={{ margin:'0 0 6px', color:'#1f2937', fontSize:'18px' }}>🤖 AI Financial Advisor</h2>
                <p style={{ color:'#6b7280', fontSize:'13px', margin:'0 0 12px' }}>Ask about budget risks, cost savings, payment schedules, or contractor performance.</p>
                <div style={{ overflowY:'auto', background:'white', borderRadius:'10px', padding:'16px', marginBottom:'12px', display:'flex', flexDirection:'column', gap:'10px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', minHeight:'300px', maxHeight:'450px' }}>
                  {messages.map((msg,idx) => (
                    <div key={idx} style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start' }}>
                      <div style={{ maxWidth:'72%', padding:'11px 14px', borderRadius:'10px', background:msg.role==='user'?'#d97706':'#f3f4f6', color:msg.role==='user'?'white':'#1f2937', lineHeight:'1.6', fontSize:'13px' }}>{msg.content}</div>
                    </div>
                  ))}
                  {loading && <div style={{ color:'#9ca3af', fontSize:'13px' }}>🤔 Analyzing your project data...</div>}
                  <div ref={messagesEndRef}/>
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <input value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleSend()} placeholder="Ask about risks, savings, contractor payments..." style={{...inp,flex:1}} disabled={loading}/>
                  <button onClick={handleSend} disabled={loading||!input.trim()} style={btn(loading||!input.trim()?'#d1d5db':'#d97706')}><Send size={14}/> Send</button>
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