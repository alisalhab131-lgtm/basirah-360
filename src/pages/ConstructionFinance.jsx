import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Trash2, Plus, Send, FileText, DollarSign, Home, Users, 
  Package, Map, MessageCircle, Tag, X, Edit2, Check, TrendingUp, 
  AlertTriangle, Layers, Briefcase, Clock, ArrowUpRight, ArrowDownLeft, Shield 
} from 'lucide-react';

const DEFAULT_COST_CODES = [
  { code: '01-000', name: 'General Requirements / Project Management' },
  { code: '02-000', name: 'Earthworks & Site Clearance' },
  { code: '03-000', name: 'Concrete & Masonry' },
  { code: '05-000', name: 'Steel & Structural Metal' },
  { code: '06-000', name: 'Timber & Wood Framing' },
  { code: '22-000', name: 'Plumbing & Drainage' },
  { code: '26-000', name: 'Electrical & Systems' },
  { code: '09-000', name: 'Finishes & Acrylic Coatings' },
  { code: '12-000', name: 'Safety Equipment & Logistics' },
];

const PRESET_CONTRACTORS = [
  'Al Bayan Contracting',
  'Gulf Build Co.',
  'Al Masa Engineering',
  'Horizon Contractors',
  'Delta Civil Works',
  'Apex Construction',
  'Nile Infrastructure',
];

const CONTRACTOR_SCOPES = [
  'Foundation Work',
  'Structural Works',
  'Concrete Works',
  'MEP Works',
  'Finishing Works',
  'Earthworks & Grading',
  'Steel Fabrication',
];

const ConstructionFinanceApp = () => {
  // ==================== STATE MANAGEMENT ====================
  const [costCodes, setCostCodes] = useState(() => {
    const saved = localStorage.getItem('cfCostCodes');
    return saved ? JSON.parse(saved) : DEFAULT_COST_CODES;
  });

  const [sites, setSites] = useState(() => {
    const saved = localStorage.getItem('constructionSitesERP');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        name: 'Downtown Office Complex',
        location: 'Downtown Core',
        status: 'In Progress',
        startDate: '2024-01-15',
        budget: 750000,
        projectedRevenue: 880000, // Client Prime Contract Value
        materials: [
          { id: 'm1', name: 'Ultra-High Performance Concrete', category: '03-000 Concrete & Masonry', quantity: 250, unit: 'm³', unitCost: 150, totalQty: 300, supplier: 'BuildCo Supply', deliveryDate: '2024-02-01', condition: 'Good', notes: 'Ready-mix batch' },
          { id: 'm2', name: 'Structural Grade Steel Rebar', category: '05-000 Steel & Structural Metal', quantity: 50, unit: 'ton', unitCost: 800, totalQty: 50, supplier: 'Steel Ltd', deliveryDate: '2024-02-05', condition: 'Good', notes: 'Grade 60 TMT' },
        ],
        contractors: [
          { id: 'c1', name: 'Al Bayan Contracting', scope: 'Foundation Work', costCode: '03-000 Concrete & Masonry', unit: 'm²', pricePerUnit: 400, quantity: 300, boqTotal: 120000, paid: 75000, retention: 10, startDate: '2024-01-20', endDate: '2024-04-20', status: 'In Progress', contact: '+966 50 000 0001', notes: 'Phase 1 substructure complete' },
          { id: 'c2', name: 'Al Masa Engineering', scope: 'MEP Works', costCode: '22-000 Plumbing & Drainage', unit: 'Lump Sum', pricePerUnit: 45000, quantity: 1, boqTotal: 45000, paid: 15000, retention: 5, startDate: '2024-03-01', endDate: '2024-08-15', status: 'In Progress', contact: '+966 50 000 0002', notes: 'Rough-ins ongoing' }
        ],
        changeOrders: [
          { id: 'co1', title: 'Subgrade Rock Excavation Overrun', type: 'Owner', costCode: '02-000 Earthworks & Site Clearance', amount: 35000, status: 'Approved', date: '2024-02-10', description: 'Encountered unexpected bedrock tier' },
          { id: 'co2', title: 'Additional Reinforcement Flange', type: 'Subcontractor', contractId: 'c1', costCode: '05-000 Steel & Structural Metal', amount: 12000, status: 'Pending', date: '2024-03-02', description: 'Structural engineer adjustment request' }
        ],
        billings: [
          { id: 'b1', type: 'Subcontractor Invoice', partner: 'Al Bayan Contracting', costCode: '03-000 Concrete & Masonry', amount: 40000, retentionWithheld: 4000, status: 'Approved', date: '2024-02-28' },
          { id: 'b2', type: 'Owner Claim', partner: 'Municipality Asset Corp', costCode: '01-000 General Requirements / Project Management', amount: 110000, retentionWithheld: 11000, status: 'Paid', date: '2024-03-05' }
        ]
      }
    ];
  });

  const [currentSiteId, setCurrentSiteId] = useState(sites[0]?.id || null);
  const [activeTab, setActiveTab] = useState('overview');

  // AI Assistant Communication State
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'System Initialized. Procore & Sage-compliant data pipelines active. I can analyze your Cost Codes, dynamic Earned Value indices, Estimate at Completion (EAC), Change Order exposure risk, or contract retention strategies.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Structural Entry Forms States
  const [newSite, setNewSite] = useState({ name: '', location: '', budget: '', projectedRevenue: '', startDate: '' });
  const [newMaterial, setNewMaterial] = useState({ name: '', category: '', quantity: '', unit: '', unitCost: '', totalQty: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' });
  const [newContractor, setNewContractor] = useState({ name: '', scope: '', costCode: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '10', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' });
  const [newChangeOrder, setNewChangeOrder] = useState({ title: '', type: 'Owner', contractId: '', costCode: '', amount: '', status: 'Pending', date: '', description: '' });
  const [newBilling, setNewBilling] = useState({ type: 'Subcontractor Invoice', partner: '', costCode: '', amount: '', retentionWithheld: '', status: 'Pending', date: '' });
  const [newCodeInput, setNewCodeInput] = useState({ code: '', name: '' });

  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('All');
  const [contractorNameMode, setContractorNameMode] = useState('preset'); 
  const [customContractorName, setCustomContractorName] = useState('');

  // Auto Persistence
  useEffect(() => { localStorage.setItem('constructionSitesERP', JSON.stringify(sites)); }, [sites]);
  useEffect(() => { localStorage.setItem('cfCostCodes', JSON.stringify(costCodes)); }, [costCodes]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ==================== CORE ERP METRIC CALCULATORS ====================
  const getCurrentSite = () => sites.find(s => s.id === currentSiteId) || sites[0];

  const calcDetailedMetrics = (site) => {
    if (!site) return {
      origBudget: 0, approvedOwnerCO: 0, pendingOwnerCO: 0, revisedBudget: 0,
      committed: 0, uncommitted: 0, actualCost: 0, etc: 0, eac: 0, variance: 0,
      pctUtilized: '0.0', approvedSubCO: 0, subPaid: 0, subRetention: 0, balanceDue: 0,
      grossProfit: 0, profitMarginPct: '0.0', revenueRealized: 0, ownerRetentionHeld: 0
    };

    const origBudget = site.budget || 0;
    const baseRevenue = site.projectedRevenue || (origBudget * 1.15); // Fallback markup

    // Parse Change Orders
    const cos = site.changeOrders || [];
    const approvedOwnerCO = cos.filter(c => c.type === 'Owner' && c.status === 'Approved').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const pendingOwnerCO = cos.filter(c => c.type === 'Owner' && c.status === 'Pending').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const approvedSubCO = cos.filter(c => c.type === 'Subcontractor' && c.status === 'Approved').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const pendingSubCO = cos.filter(c => c.type === 'Subcontractor' && c.status === 'Pending').reduce((s, c) => s + parseFloat(c.amount || 0), 0);

    const revisedBudget = origBudget + approvedOwnerCO;
    const revisedRevenue = baseRevenue + approvedOwnerCO;

    // Materials Calculations
    const matActualCosts = site.materials?.reduce((s, m) => s + (parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0)), 0) || 0;
    const matCommittedCosts = site.materials?.reduce((s, m) => s + (parseFloat(m.totalQty || m.quantity || 0) * parseFloat(m.unitCost || 0)), 0) || 0;

    // Subcontractor Commitments
    const subBaseCommitted = site.contractors?.reduce((s, c) => s + parseFloat(c.boqTotal || 0), 0) || 0;
    const totalCommitted = subBaseCommitted + matCommittedCosts + approvedSubCO;
    
    const subPaid = site.contractors?.reduce((s, c) => s + parseFloat(c.paid || 0), 0) || 0;
    const subRetention = site.contractors?.reduce((s, c) => s + ((parseFloat(c.boqTotal || 0) * parseFloat(c.retention || 0)) / 100), 0) || 0;

    // Actual Job-To-Date (JTD) Cost
    const actualCost = matActualCosts + subPaid;

    // Financial Forecasts (EAC / ETC)
    const uncommittedBudget = Math.max(0, revisedBudget - totalCommitted);
    const etc = (totalCommitted - subPaid) + uncommittedBudget; 
    const eac = actualCost + etc;
    
    const variance = revisedBudget - eac;
    const pctUtilized = revisedBudget ? ((actualCost / revisedBudget) * 100).toFixed(1) : '0.0';

    // Inflow Ledger Parse
    const ownerBillings = site.billings?.filter(b => b.type === 'Owner Claim' && b.status === 'Paid') || [];
    const revenueRealized = ownerBillings.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
    const ownerRetentionHeld = ownerBillings.reduce((s, b) => s + parseFloat(b.retentionWithheld || 0), 0);

    const projectedGrossProfit = revisedRevenue - eac;
    const profitMarginPct = revisedRevenue ? ((projectedGrossProfit / revisedRevenue) * 100).toFixed(1) : '0.0';

    return {
      origBudget, approvedOwnerCO, pendingOwnerCO, revisedBudget,
      committed: totalCommitted, uncommitted: uncommittedBudget, actualCost,
      etc, eac, variance, pctUtilized, approvedSubCO, pendingSubCO,
      subPaid, subRetention, balanceDue: Math.max(0, totalCommitted - subPaid),
      revisedRevenue, projectedGrossProfit, profitMarginPct, revenueRealized, ownerRetentionHeld
    };
  };

  const calcGlobalRollup = () => {
    let globalBudget = 0, globalSpent = 0, globalRevenue = 0, globalEAC = 0;
    sites.forEach(s => {
      const metrics = calcDetailedMetrics(s);
      globalBudget += metrics.revisedBudget;
      globalSpent += metrics.actualCost;
      globalRevenue += metrics.revisedRevenue;
      globalEAC += metrics.eac;
    });
    return {
      globalBudget, globalSpent, globalRevenue, globalEAC,
      globalVariance: globalBudget - globalEAC,
      pct: globalBudget ? ((globalSpent / globalBudget) * 100).toFixed(1) : '0.0'
    };
  };

  // ==================== STATE MUTATIONS / ACTIONS ====================
  const addSite = () => {
    if (!newSite.name || !newSite.budget) return;
    const s = {
      id: Date.now(),
      name: newSite.name,
      location: newSite.location || 'Unassigned Site',
      status: 'Planning',
      startDate: newSite.startDate || new Date().toISOString().split('T')[0],
      budget: parseFloat(newSite.budget),
      projectedRevenue: parseFloat(newSite.projectedRevenue) || parseFloat(newSite.budget) * 1.15,
      materials: [], contractors: [], changeOrders: [], billings: []
    };
    setSites([...sites, s]);
    setCurrentSiteId(s.id);
    setNewSite({ name: '', location: '', budget: '', projectedRevenue: '', startDate: '' });
  };

  const deleteSite = (id) => {
    if (window.confirm('CRITICAL WARN: This will wipe out all subcontracts, cost codes, and cash histories from this dashboard. Proceed?')) {
      const updated = sites.filter(s => s.id !== id);
      setSites(updated);
      if (currentSiteId === id) setCurrentSiteId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.quantity || !newMaterial.unitCost) return;
    setSites(sites.map(s => s.id !== currentSiteId ? s : {
      ...s,
      materials: [...s.materials, {
        id: `mat-${Date.now()}`,
        ...newMaterial,
        quantity: parseFloat(newMaterial.quantity),
        unitCost: parseFloat(newMaterial.unitCost),
        totalQty: parseFloat(newMaterial.totalQty || newMaterial.quantity),
      }]
    }));
    setNewMaterial({ name: '', category: '', quantity: '', unit: '', unitCost: '', totalQty: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' });
  };

  const addContractor = () => {
    const finalName = contractorNameMode === 'new' ? customContractorName : newContractor.name;
    const qty = parseFloat(newContractor.quantity) || 0;
    const ppu = parseFloat(newContractor.pricePerUnit) || 0;
    if (!finalName || !newContractor.scope || !qty || !ppu) return;

    setSites(sites.map(s => s.id !== currentSiteId ? s : {
      ...s,
      contractors: [...s.contractors, {
        id: `con-${Date.now()}`,
        ...newContractor,
        name: finalName,
        quantity: qty,
        pricePerUnit: ppu,
        boqTotal: qty * ppu,
        paid: parseFloat(newContractor.paid) || 0,
        retention: parseFloat(newContractor.retention || 0),
      }]
    }));
    setNewContractor({ name: '', scope: '', costCode: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '10', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' });
    setCustomContractorName('');
    setContractorNameMode('preset');
  };

  const addChangeOrder = () => {
    if (!newChangeOrder.title || !newChangeOrder.amount) return;
    setSites(sites.map(s => s.id !== currentSiteId ? s : {
      ...s,
      changeOrders: [...(s.changeOrders || []), {
        id: `co-${Date.now()}`,
        ...newChangeOrder,
        amount: parseFloat(newChangeOrder.amount)
      }]
    }));
    setNewChangeOrder({ title: '', type: 'Owner', contractId: '', costCode: '', amount: '', status: 'Pending', date: '', description: '' });
  };

  const addBilling = () => {
    if (!newBilling.partner || !newBilling.amount) return;
    const amt = parseFloat(newBilling.amount);
    const calculatedRetention = newBilling.retentionWithheld ? parseFloat(newBilling.retentionWithheld) : (amt * 0.1); // default 10%
    setSites(sites.map(s => s.id !== currentSiteId ? s : {
      ...s,
      billings: [...(s.billings || []), {
        id: `bill-${Date.now()}`,
        ...newBilling,
        amount: amt,
        retentionWithheld: calculatedRetention
      }]
    }));
    setNewBilling({ type: 'Subcontractor Invoice', partner: '', costCode: '', amount: '', retentionWithheld: '', status: 'Pending', date: '' });
  };

  const addCostCode = () => {
    if (newCodeInput.code && newCodeInput.name) {
      setCostCodes([...costCodes, newCodeInput]);
      setNewCodeInput({ code: '', name: '' });
    }
  };

  const deleteMaterial = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, materials: s.materials.filter(m => m.id !== id) }));
  const deleteContractor = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, contractors: s.contractors.filter(c => c.id !== id) }));
  const deleteChangeOrder = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, changeOrders: s.changeOrders.filter(co => co.id !== id) }));
  const deleteBilling = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, billings: s.billings.filter(b => b.id !== id) }));

  const updateChangeOrderStatus = (coId, newStatus) => {
    setSites(sites.map(s => s.id !== currentSiteId ? s : {
      ...s,
      changeOrders: s.changeOrders.map(co => co.id === coId ? { ...co, status: newStatus } : co)
    }));
  };

  // ==================== RESTRUCTURING THE DATA FOR INTUATIVE AI INTERACTION ====================
  const buildAISystemContext = () => {
    const activeProject = getCurrentSite();
    const data = calcDetailedMetrics(activeProject);
    return `
      You are an elite, Sage-300 & Procore compliant Construction Financial Principal Advisor. 
      Analyze the current live project space accurately. Provide strict numerical, highly quantitative risk feedback.
      
      PROJECT PROFILE: "${activeProject?.name}"
      --------------------------------------------------
      - Base Original Budget Target: $${data.origBudget.toLocaleString()}
      - Approved Owner Adjustments (OCO): $${data.approvedOwnerCO.toLocaleString()}
      - Revised Target Commitment Ceiling: $${data.revisedBudget.toLocaleString()}
      - Prime Contract Projected Revenue Pipeline: $${data.revisedRevenue.toLocaleString()}
      
      LIVE ACCRUAL INDEX METRICS:
      - Absolute Obligations Committed (Subcontracts + POs): $${data.committed.toLocaleString()}
      - JTD Cash Burn (Actual Cost Incurred): $${data.actualCost.toLocaleString()}
      - Estimate to Complete (ETC Forecast Window): $${data.etc.toLocaleString()}
      - Dynamic Estimate at Completion (EAC Value): $${data.eac.toLocaleString()}
      - Cost Variance Index (Overrun/Slippage Check): $${data.variance >= 0 ? 'SAVINGS' : 'OVERRUN'} of $${Math.abs(data.variance).toLocaleString()}
      - Current Estimated Profit Margin Vector: $${data.projectedGrossProfit.toLocaleString()} (${data.profitMarginPct}%)
      
      BREAKDOWN MATRICES:
      - Material Supplier Log Size: ${activeProject?.materials?.length || 0} entries.
      - Committed Contractor Base Count: ${activeProject?.contractors?.length || 0} entities.
      - Liquid Retention Pool Cash Bound: Sub-Retention: $${data.subRetention.toLocaleString()} | Client-Held-Retention: $${data.ownerRetentionHeld.toLocaleString()}
    `;
  };

  const handleSendAIRequest = async () => {
    if (!input.trim()) return;
    const currentPrompt = input; 
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: currentPrompt }]);
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', 
          max_tokens: 700,
          system: buildAISystemContext(),
          messages: messages.filter(m => m.role !== 'system').concat([{ role: 'user', content: currentPrompt }])
        })
      });
      const resData = await response.json();
      setMessages(p => [...p, { role: 'assistant', content: resData.content[0]?.text || 'System parsing error. Ensure downstream keys match.' }]);
    } catch (err) {
      setMessages(p => [...p, { role: 'assistant', content: `Local Integration Pipeline Interruption: ${err.message}` }]);
    } finally { setLoading(false); }
  };

  // ==================== EXPORT UTILITIES ====================
  const executeCSVDownload = () => {
    const site = getCurrentSite();
    const metrics = calcDetailedMetrics(site);
    let raw = `COMPREHENSIVE FINANCIAL ERP REPORT - ${site.name.toUpperCase()}\n`;
    raw += `METRIC,VALUE\nOriginal Budget,$${metrics.origBudget}\nApproved Adjustments,$${metrics.approvedOwnerCO}\nRevised Cost Ceiling,$${metrics.revisedBudget}\nJob Actual Cost To Date,$${metrics.actualCost}\nEstimate At Completion (EAC),$${metrics.eac}\nForecasted Cost Variance,$${metrics.variance}\nProjected Profit Margin,%${metrics.profitMarginPct}\n\n`;
    
    raw += `COST BREAKDOWN BY DIVISIONS (WBS)\nCode Name,Original Allocation,Forecasted EAC,Cost Slippage\n`;
    costCodes.forEach(cc => {
      const codeLabel = `${cc.code} ${cc.name}`;
      const codeMatCost = site.materials.filter(m => m.category === codeLabel).reduce((s, m) => s + (m.quantity * m.unitCost), 0);
      const codeSubCost = site.contractors.filter(c => c.costCode === codeLabel).reduce((s, c) => s + (c.boqTotal), 0);
      raw += `"${codeLabel}",$${(site.budget / costCodes.length).toFixed(0)},$${codeMatCost + codeSubCost},$--\n`;
    });

    const blob = new Blob([raw], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ERP_Finance_Rollup_${site.name.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  // ==================== INTERFACE ELEMENTS & INLINE STYLES ====================
  const activeProjectInstance = getCurrentSite();
  const metrics = calcDetailedMetrics(activeProjectInstance);
  const rollup = calcGlobalRollup();

  const ERP_TH = { padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4b5563', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' };
  const ERP_TD = { padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', borderBottom: '1px solid #e5e7eb', color: '#1f2937' };
  const inputStyle = { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', width: '100%', outline: 'none', background: '#fff' };
  const flexBtn = (bgColor, textColor = '#fff') => ({ padding: '10px 16px', background: bgColor, color: textColor, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' });

  const renderBadge = (status) => {
    const scheme = { Approved: ['#d1fae5', '#065f46'], Completed: ['#d1fae5', '#065f46'], 'In Progress': ['#fef3c7', '#92400e'], Pending: ['#fee2e2', '#991b1b'] };
    const [bg, fg] = scheme[status] || ['#f3f4f6', '#374151'];
    return <span style={{ background: bg, color: fg, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>{status}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* GLOBAL ENTERPRISE TOP BANNER */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #f59e0b' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={28} style={{ color: '#f59e0b' }} /> Digiations 360 Core ERP <span style={{ fontSize: '12px', background: '#334155', padding: '4px 8px', borderRadius: '4px', color: '#cbd5e1' }}>رقمنة الرقمية</span>
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '13px' }}>Enterprise Commercial Controls · WBS Cost Codes · Change Management · Cost-To-Complete Forecasting</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Cross-Project Cash Outflow</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>${rollup.globalSpent.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 88px)' }}>
        
        {/* LEFT NAV PANEL - SITES CONTROL WING */}
        <div style={{ width: '280px', background: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Cost Centers / Projects
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {sites.map(s => {
              const sMetrics = calcDetailedMetrics(s);
              const isActive = currentSiteId === s.id;
              return (
                <div key={s.id} onClick={() => setCurrentSiteId(s.id)} style={{ padding: '12px 14px', background: isActive ? '#f8fafc' : 'transparent', border: `1px solid ${isActive ? '#cbd5e1' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}>
                  {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', background: '#f59e0b', borderRadius: '0 4px 4px 0' }} />}
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.location}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', fontWeight: '600' }}>
                    <span style={{ color: '#0284c7' }}>Ceiling: ${(sMetrics.revisedBudget / 1000).toFixed(0)}k</span>
                    <span style={{ color: parseFloat(sMetrics.pctUtilized) > 85 ? '#ef4444' : '#10b981' }}>{sMetrics.pctUtilized}% spent</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PROJECT ACQUISITION MODULE */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '10px' }}>+ Initialize New Center</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input placeholder="Project / Client Name" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }} />
              <input placeholder="Geographic Location" value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }} />
              <input placeholder="Target Cost Budget ($)" type="number" value={newSite.budget} onChange={e => setNewSite({...newSite, budget: e.target.value})} style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }} />
              <input placeholder="Contract Revenue Value ($)" type="number" value={newSite.projectedRevenue} onChange={e => setNewSite({...newSite, projectedRevenue: e.target.value})} style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }} />
              <button onClick={addSite} style={{ ...flexBtn('#0f172a'), width: '100%', justifyContent: 'center', padding: '8px', fontSize: '12px' }}>Spawn Project Hub</button>
            </div>
          </div>
        </div>

        {/* MAIN WORKSPACE - NAVIGATION & VIEWPORT PANELS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          
          {/* HORIZONTAL ERP NAVIGATION WINGS */}
          <div style={{ display: 'flex', background: '#ffffff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', padding: '0 16px' }}>
            {[
              { id: 'overview', label: '📊 Executive Analytics' },
              { id: 'wbs', label: '🗂️ WBS & Cost Codes' },
              { id: 'commitments', label: '👷 Commitments & BOQ' },
              { id: 'changeorders', label: '🔄 Change Control' },
              { id: 'billings', label: '🧾 Progress Invoicing' },
              { id: 'materials', label: '📦 Inventory Logs' },
              { id: 'ai', label: '🤖 Core AI Quant Advisor' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '16px 20px', border: 'none', background: 'none', borderBottom: activeTab === tab.id ? '3px solid #f59e0b' : '3px solid transparent', color: activeTab === tab.id ? '#0f172a' : '#64748b', fontWeight: activeTab === tab.id ? '700' : '500', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {(!activeProjectInstance) ? <div style={{ color: '#64748b' }}>Initialize a project sequence to start tracking.</div> : (
              <>
                
                {/* ==================== VIEW 1: EXECUTIVE ANALYTICS ==================== */}
                {activeTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{activeProjectInstance.name} — Command Center</h2>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Real-time valuation analytics derived from live contract data structures.</span>
                      </div>
                      <button onClick={() => deleteSite(activeProjectInstance.id)} style={flexBtn('#ef4444')}><Trash2 size={16} /> Wreck Center</button>
                    </div>

                    {/* TOP ERP INDUSTRIAL KPI CARDS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      {[
                        { label: 'Original Cost Baseline', value: `$${metrics.origBudget.toLocaleString()}`, color: '#475569' },
                        { label: 'Revised Cost Ceiling', value: `$${metrics.revisedBudget.toLocaleString()}`, color: '#0f172a' },
                        { label: 'Job-To-Date (JTD) Accrual', value: `$${metrics.actualCost.toLocaleString()}`, color: '#2563eb' },
                        { label: 'Estimate At Completion (EAC)', value: `$${metrics.eac.toLocaleString()}`, color: '#7c3aed' },
                        { 
                          label: 'Cost Variance (CV)', 
                          value: `$${metrics.variance.toLocaleString()}`, 
                          color: metrics.variance >= 0 ? '#16a34a' : '#dc2626',
                          desc: metrics.variance >= 0 ? 'Under target ceiling' : 'Accruing cost slippage'
                        },
                        { label: 'Projected Net Margin', value: `$${metrics.projectedGrossProfit.toLocaleString()} (${metrics.profitMarginPct}%)`, color: '#0891b2' },
                      ].map((card, idx) => (
                        <div key={idx} style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>{card.label}</div>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: card.color }}>{card.value}</div>
                          {card.desc && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{card.desc}</div>}
                        </div>
                      ))}
                    </div>

                    {/* LINEAR COST GRAPH SEGMENT */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                        <span>accrued JTD cost vs target ceiling ratio</span>
                        <span>{metrics.pctUtilized}% Expended</span>
                      </div>
                      <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(parseFloat(metrics.pctUtilized), 100)}%`, background: parseFloat(metrics.pctUtilized) > 90 ? '#ef4444' : '#f59e0b', transition: 'width 0.3s' }} />
                      </div>
                    </div>

                    {/* QUICK LOOK BALANCES SPLIT MATRIX */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', marginBottom: '12px', display: 'flex', justify: 'space-between' }}>
                          <span>Committed Backlogs vs Uncommitted</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Absolute Binding Commitments:</span><span style={{ fontWeight: '700' }}>${metrics.committed.toLocaleString()}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Uncommitted Fluid Reserves:</span><span style={{ fontWeight: '700', color: '#16a34a' }}>${metrics.uncommitted.toLocaleString()}</span></div>
                        </div>
                      </div>

                      <div style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', marginBottom: '12px' }}>Retention Accounting Pools</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Withheld from Subcontractors:</span><span style={{ fontWeight: '700', color: '#2563eb' }}>${metrics.subRetention.toLocaleString()}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Withheld by Client/Owner:</span><span style={{ fontWeight: '700', color: '#7c3aed' }}>${metrics.ownerRetentionHeld.toLocaleString()}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== VIEW 2: WBS & DIVISION COST CODES ==================== */}
                {activeTab === 'wbs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Work Breakdown Structure (WBS) Matrix</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Division ledger mappings aligned with standard industrial construction cost centers.</p>
                      </div>
                      <button onClick={executeCSVDownload} style={flexBtn('#16a34a')}><Download size={15} /> Export Master Sheet</button>
                    </div>

                    {/* DIVISION INJECTOR */}
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                      <div style={{ flex: '0 0 120px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563' }}>CSI Div Code</label>
                        <input placeholder="e.g., 04-000" value={newCodeInput.code} onChange={e => setNewCodeInput({...newCodeInput, code: e.target.value})} style={inputStyle} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563' }}>Division Element Name</label>
                        <input placeholder="Masonry Assemblies, Finished Drywall, etc." value={newCodeInput.name} onChange={e => setNewCodeInput({...newCodeInput, name: e.target.value})} style={inputStyle} />
                      </div>
                      <button onClick={addCostCode} style={flexBtn('#0f172a')}><Plus size={15} /> Bind Code</button>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={ERP_TH}>Cost Code Alignment</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Target Budget Allocation</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Committed Contracts Value</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>JTD Material Cost</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Forecasted EAC Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {costCodes.map((cc, idx) => {
                            const combinedLabel = `${cc.code} ${cc.name}`;
                            // Accrual parsing
                            const matchMats = activeProjectInstance.materials?.filter(m => m.category === combinedLabel) || [];
                            const matchSubs = activeProjectInstance.contractors?.filter(c => c.costCode === combinedLabel) || [];
                            
                            const allocation = activeProjectInstance.budget / costCodes.length; // Theoretical even allocation split for mock display
                            const committedVal = matchSubs.reduce((s, c) => s + c.boqTotal, 0) + matchMats.reduce((s, m) => s + (m.totalQty * m.unitCost), 0);
                            const actualVal = matchSubs.reduce((s, c) => s + c.paid, 0) + matchMats.reduce((s, m) => s + (m.quantity * m.unitCost), 0);

                            return (
                              <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={{ ...ERP_TD, fontWeight: '700' }}>{cc.code} — {cc.name}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', color: '#475569' }}>${allocation.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '600' }}>${committedVal.toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', color: '#2563eb' }}>${actualVal.toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '800', color: committedVal > allocation ? '#dc2626' : '#16a34a' }}>
                                  ${committedVal.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ==================== VIEW 3: COMMITMENTS & CONTRACTOR BOQ ==================== */}
                {activeTab === 'commitments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Subcontract Commitment Control & BOQs</h2>

                    {/* ENTRY INTERFACE */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#2563eb' }}>+ Bind Binding Subcontract Framework</div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#4b5563' }}>Contractor Identity Selection</label>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            {contractorNameMode === 'preset' ? (
                              <select value={newContractor.name} onChange={e => setNewContractor({...newContractor, name: e.target.value})} style={inputStyle}>
                                <option value="">-- Choose Vendor --</option>
                                {PRESET_CONTRACTORS.map(v => <option key={v} value={v}>{v}</option>)}
                              </select>
                            ) : (
                              <input placeholder="Enter Vendor Name" value={customContractorName} onChange={e => setCustomContractorName(e.target.value)} style={inputStyle} />
                            )}
                            <button onClick={() => setContractorNameMode(contractorNameMode === 'preset' ? 'new' : 'preset')} style={{ ...flexBtn('#64748b'), padding: '10px' }}>Swap</button>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#4b5563' }}>Cost Code Alignment</label>
                          <select value={newContractor.costCode} onChange={e => setNewContractor({...newContractor, costCode: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }}>
                            <option value="">-- Select Code --</option>
                            {costCodes.map(c => <option key={c.code} value={`${c.code} ${c.name}`}>{c.code} {c.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                        <input placeholder="Scope / Deliverable" value={newContractor.scope} onChange={e => setNewContractor({...newContractor, scope: e.target.value})} style={inputStyle} />
                        <input placeholder="Unit (e.g. m², LS)" value={newContractor.unit} onChange={e => setNewContractor({...newContractor, unit: e.target.value})} style={inputStyle} />
                        <input placeholder="Rate / Unit Cost" type="number" value={newContractor.pricePerUnit} onChange={e => setNewContractor({...newContractor, pricePerUnit: e.target.value})} style={inputStyle} />
                        <input placeholder="Quantity Matrix" type="number" value={newContractor.quantity} onChange={e => setNewContractor({...newContractor, quantity: e.target.value})} style={inputStyle} />
                        <input placeholder="Retention Value (%)" type="number" value={newContractor.retention} onChange={e => setNewContractor({...newContractor, retention: e.target.value})} style={inputStyle} />
                        <input placeholder="Accrued Paid To Date" type="number" value={newContractor.paid} onChange={e => setNewContractor({...newContractor, paid: e.target.value})} style={inputStyle} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={addContractor} style={flexBtn('#2563eb')}><Plus size={15} /> Commit Subcontract to Ledger</button>
                      </div>
                    </div>

                    {/* DATA DISPLAY GRID */}
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={ERP_TH}>Subcontractor & Scope Mapping</th>
                            <th style={ERP_TH}>WBS Division</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Absolute Commitment</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Disbursed Cash</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Retention Isolation</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Remaining Balance Due</th>
                            <th style={ERP_TH}>Status</th>
                            <th style={{ ...ERP_TH, textAlign: 'center' }}>Purge</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeProjectInstance.contractors?.map((c, i) => {
                            const calculatedRetentionValue = (parseFloat(c.boqTotal || 0) * parseFloat(c.retention || 0)) / 100;
                            const balanceOutstanding = parseFloat(c.boqTotal || 0) - parseFloat(c.paid || 0);
                            return (
                              <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={ERP_TD}>
                                  <div style={{ fontWeight: '700' }}>{c.name}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{c.scope}</div>
                                </td>
                                <td style={ERP_TD}><span style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{c.costCode || 'Uncoded'}</span></td>
                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700' }}>${parseFloat(c.boqTotal || 0).toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', color: '#16a34a' }}>${parseFloat(c.paid || 0).toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', color: '#e59866' }}>${calculatedRetentionValue.toLocaleString()} ({c.retention}%)</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700', color: balanceOutstanding > 0 ? '#ef4444' : '#16a34a' }}>${balanceOutstanding.toLocaleString()}</td>
                                <td style={ERP_TD}>{renderBadge(c.status)}</td>
                                <td style={{ ...ERP_TD, textAlign: 'center' }}>
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

                {/* ==================== VIEW 4: CHANGE MANAGEMENT & CONTROL ==================== */}
                {activeTab === 'changeorders' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Change Order Log & Exposure Tracking</h2>

                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#7c3aed' }}>+ Issue Proactive Change Item Request (PCO)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ fontSize: '11px' }}>Adjustment Stream</label>
                          <select value={newChangeOrder.type} onChange={e => setNewChangeOrder({...newChangeOrder, type: e.target.value})} style={inputStyle}>
                            <option value="Owner">Owner Change Order (Revenue Shift)</option>
                            <option value="Subcontractor">Subcontractor Change Order (Expense Outflow)</option>
                          </select>
                        </div>
                        <input placeholder="Descriptive Item Title" value={newChangeOrder.title} onChange={e => setNewChangeOrder({...newChangeOrder, title: e.target.value})} style={inputStyle} />
                        <select value={newChangeOrder.costCode} onChange={e => setNewChangeOrder({...newChangeOrder, costCode: e.target.value})} style={inputStyle}>
                          <option value="">-- Targeted Division --</option>
                          {costCodes.map(cc => <option key={cc.code} value={`${cc.code} ${cc.name}`}>{cc.code} {cc.name}</option>)}
                        </select>
                        <input placeholder="Financial Variance Vol ($)" type="number" value={newChangeOrder.amount} onChange={e => setNewChangeOrder({...newChangeOrder, amount: e.target.value})} style={inputStyle} />
                        <button onClick={addChangeOrder} style={flexBtn('#7c3aed')}><Plus size={15} /> Log Shift</button>
                      </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={ERP_TH}>Change Item ID / Alignment</th>
                            <th style={ERP_TH}>Stream Vector</th>
                            <th style={ERP_TH}>WBS Code Allocation</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Amount Impact Valuation</th>
                            <th style={ERP_TH}>Approval State</th>
                            <th style={{ ...ERP_TH, textAlign: 'center' }}>Modify State</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeProjectInstance.changeOrders || []).map((co, idx) => (
                            <tr key={co.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={ERP_TD}>
                                <div style={{ fontWeight: '700' }}>{co.title}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>Logged on: {co.date || '—'}</div>
                              </td>
                              <td style={ERP_TD}><span style={{ fontWeight: '600', color: co.type === 'Owner' ? '#0284c7' : '#e67e22' }}>{co.type} Change</span></td>
                              <td style={ERP_TD}><span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px' }}>{co.costCode}</span></td>
                              <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700' }}>${parseFloat(co.amount).toLocaleString()}</td>
                              <td style={ERP_TD}>{renderBadge(co.status)}</td>
                              <td style={{ ...ERP_TD, textAlign: 'center', display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button onClick={() => updateChangeOrderStatus(co.id, 'Approved')} style={{ background: '#d1fae5', color: '#065f46', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>Approve</button>
                                <button onClick={() => deleteChangeOrder(co.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ==================== VIEW 5: PROGRESS BILLINGS & INVOICING HUB ==================== */}
                {activeTab === 'billings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Progress Application for Payment & Billings Ledger</h2>

                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#0891b2' }}>+ Process New Financial Draw Claim / Sub-Invoice</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ fontSize: '11px' }}>Instrument Classification</label>
                          <select value={newBilling.type} onChange={e => setNewBilling({...newBilling, type: e.target.value})} style={inputStyle}>
                            <option value="Subcontractor Invoice">Subcontractor Invoice (Outflow)</option>
                            <option value="Owner Claim">Owner Claim Draw (Inflow Revenue)</option>
                          </select>
                        </div>
                        <input placeholder="Entity/Partner Name" value={newBilling.partner} onChange={e => setNewBilling({...newBilling, partner: e.target.value})} style={inputStyle} />
                        <input placeholder="Gross Value claimed ($)" type="number" value={newBilling.amount} onChange={e => setNewBilling({...newBilling, amount: e.target.value})} style={inputStyle} />
                        <input placeholder="Retention Withheld ($)" type="number" value={newBilling.retentionWithheld} onChange={e => setNewBilling({...newBilling, retentionWithheld: e.target.value})} style={inputStyle} />
                        <button onClick={addBilling} style={flexBtn('#0891b2')}><Plus size={15} /> Record Billing</button>
                      </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={ERP_TH}>Transaction Partner / Instrument</th>
                            <th style={ERP_TH}>Classification Type</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Gross Valuation Stated</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Retention Deducted</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Net Liquidated Cash</th>
                            <th style={ERP_TH}>State Status</th>
                            <th style={{ ...ERP_TH, textAlign: 'center' }}>Purge</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeProjectInstance.billings || []).map((b, idx) => {
                            const netLiquidatedValue = parseFloat(b.amount) - parseFloat(b.retentionWithheld || 0);
                            return (
                              <tr key={b.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={ERP_TD}>
                                  <div style={{ fontWeight: '700' }}>{b.partner}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>Processed on context window timeline.</div>
                                </td>
                                <td style={ERP_TD}>
                                  <span style={{ fontSize: '12px', fontWeight: '600', color: b.type === 'Owner Claim' ? '#16a34a' : '#2563eb' }}>{b.type}</span>
                                </td>
                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700' }}>${parseFloat(b.amount).toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', color: '#ef4444' }}>-${parseFloat(b.retentionWithheld || 0).toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '800', color: b.type === 'Owner Claim' ? '#16a34a' : '#0f172a' }}>${netLiquidatedValue.toLocaleString()}</td>
                                <td style={ERP_TD}>
                                  <select value={b.status} onChange={e => {
                                    const updatedBillings = activeProjectInstance.billings.map(item => item.id === b.id ? { ...item, status: e.target.value } : item);
                                    setSites(sites.map(s => s.id === activeProjectInstance.id ? { ...s, billings: updatedBillings } : s));
                                  }} style={{ ...inputStyle, padding: '4px', fontSize: '12px' }}>
                                    <option value="Pending">Pending Validation</option>
                                    <option value="Approved">Approved / Certified</option>
                                    <option value="Paid">Disbursed / Paid</option>
                                  </select>
                                </td>
                                <td style={{ ...ERP_TD, textAlign: 'center' }}>
                                  <button onClick={() => deleteBilling(b.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ==================== VIEW 6: INVENTORY LOGS & MATERIAL TRACKING ==================== */}
                {activeTab === 'materials' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Material Resource Logistics & Delivery Logs</h2>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ fontWeight: '700', color: '#7c3aed', fontSize: '13px' }}>+ Log Site Resource Cargo Acquisition</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                        <input placeholder="Material Name (e.g. Concrete)" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} style={inputStyle} />
                        
                        <select value={newMaterial.category} onChange={e => setNewMaterial({...newMaterial, category: e.target.value})} style={inputStyle}>
                          <option value="">-- Cost Code Map --</option>
                          {costCodes.map(cc => <option key={cc.code} value={`${cc.code} ${cc.name}`}>{cc.code} {cc.name}</option>)}
                        </select>

                        <input placeholder="Qty Received To Date" type="number" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial, quantity: e.target.value})} style={inputStyle} />
                        <input placeholder="Total Purchase Commitment" type="number" value={newMaterial.totalQty} onChange={e => setNewMaterial({...newMaterial, totalQty: e.target.value})} style={inputStyle} />
                        <input placeholder="Unit Label (m³, ton)" value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} style={inputStyle} />
                        <input placeholder="Rate / Price Unit" type="number" value={newMaterial.unitCost} onChange={e => setNewMaterial({...newMaterial, unitCost: e.target.value})} style={inputStyle} />
                        <input placeholder="Supplier Entity" value={newMaterial.supplier} onChange={e => setNewMaterial({...newMaterial, supplier: e.target.value})} style={inputStyle} />
                        <select value={newMaterial.condition} onChange={e => setNewMaterial({...newMaterial, condition: e.target.value})} style={inputStyle}>
                          <option>Good</option><option>Acceptable</option><option>Damaged Tier Check</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={addMaterial} style={flexBtn('#7c3aed')}><Plus size={15} /> Log Material Manifest</button>
                      </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={ERP_TH}>Material Resource Description</th>
                            <th style={ERP_TH}>WBS Division Link</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Received Volume</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Total Binding Target</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Rate Cost Matrix</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Accrued Outflow</th>
                            <th style={ERP_TH}>Condition State</th>
                            <th style={{ ...ERP_TH, textAlign: 'center' }}>Purge</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeProjectInstance.materials?.map((m, i) => (
                            <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={{ ...ERP_TD, fontWeight: '700' }}>{m.name}</td>
                              <td style={ERP_TD}><span style={{ fontSize: '11px', background: '#e0e7ff', padding: '2px 6px' }}>{m.category}</span></td>
                              <td style={{ ...ERP_TD, textAlign: 'right' }}>{m.quantity} {m.unit}</td>
                              <td style={{ ...ERP_TD, textAlign: 'right' }}>{m.totalQty || m.quantity} {m.unit}</td>
                              <td style={{ ...ERP_TD, textAlign: 'right' }}>${m.unitCost} / {m.unit}</td>
                              <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700', color: '#7c3aed' }}>${(m.quantity * m.unitCost).toLocaleString()}</td>
                              <td style={ERP_TD}>{renderBadge(m.condition)}</td>
                              <td style={{ ...ERP_TD, textAlign: 'center' }}>
                                <button onClick={() => deleteMaterial(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ==================== VIEW 7: COMPREHENSIVE QUANT AI FINANCIAL ADVISOR ==================== */}
                {activeTab === 'ai' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '520px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', background: '#0f172a', color: '#fff', borderBottom: '2px solid #f59e0b' }}>
                      <div style={{ fontWeight: '800', fontSize: '15px' }}>🏗️ Procore-AI Financial Compliance Deep Interface</div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Dynamic analysis driven by current Estimate at Completion (EAC) vectors and active retention indices.</span>
                    </div>

                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
                      {messages.map((msg, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', background: msg.role === 'user' ? '#f59e0b' : '#ffffff', color: msg.role === 'user' ? '#fff' : '#334155', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0' }}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {loading && <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>🤔 Evaluating Work Breakdown Structure variance bounds...</div>}
                      <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', background: '#fff' }}>
                      <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendAIRequest()} placeholder="Query project financial overruns, EAC shifts, or material purchase margins..." style={inputStyle} disabled={loading} />
                      <button onClick={handleSendAIRequest} disabled={loading || !input.trim()} style={flexBtn(loading || !input.trim() ? '#94a3b8' : '#0f172a')}>
                        <Send size={15} /> Execute
                      </button>
                    </div>
                  </div>
                )}

              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ConstructionFinanceApp;