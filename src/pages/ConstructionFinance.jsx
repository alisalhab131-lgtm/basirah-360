cat > /mnt/user-data/outputs/ConstructionFinanceApp.jsx << 'ENDOFFILE'
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Download, Trash2, Plus, Send, FileText, DollarSign, Home, Users, 
  Package, Map, MessageCircle, Tag, X, Edit2, Check, TrendingUp, 
  AlertTriangle, Layers, Briefcase, Clock, ArrowUpRight, ArrowDownLeft, Shield 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

const PRESET_SUPPLIERS = [
  'BuildCo Supply',
  'Steel Ltd',
  'Gulf Materials',
  'AlSafwa Trading',
  'Delta Supplies',
];

const PAYMENT_METHODS = ['Bank Transfer', 'Cheque', 'Cash', 'Letter of Credit'];

const CONTRACTOR_SCOPES = [
  'Foundation Work',
  'Structural Works',
  'Concrete Works',
  'MEP Works',
  'Finishing Works',
  'Earthworks & Grading',
  'Steel Fabrication',
];

const INITIAL_SITES = [
  {
    id: 1,
    name: 'Downtown Office Complex',
    location: 'Downtown Core',
    status: 'In Progress',
    startDate: '2024-01-15',
    budget: 750000,
    projectedRevenue: 880000,
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
    ],
    payments: [
      { id: 'p1', date: '2024-02-15', type: 'Contractor', reference: 'Al Bayan Contracting', amount: 45000, method: 'Bank Transfer', invoice: 'INV-001', status: 'Paid', notes: 'Phase 1 milestone' },
      { id: 'p2', date: '2024-03-01', type: 'Material', reference: 'BuildCo Supply', amount: 37500, method: 'Bank Transfer', invoice: 'PO-001', status: 'Paid', notes: 'Concrete batch 1' },
      { id: 'p3', date: '2024-03-10', type: 'Contractor', reference: 'Al Masa Engineering', amount: 15000, method: 'Cheque', invoice: 'INV-002', status: 'Paid', notes: 'MEP rough-in advance' },
    ]
  }
];

const ConstructionFinanceApp = () => {
  // ==================== STATE MANAGEMENT ====================
  const [costCodes, setCostCodes] = useState(() => {
    const saved = localStorage.getItem('cfCostCodes');
    return saved ? JSON.parse(saved) : DEFAULT_COST_CODES;
  });

  const [sites, setSites] = useState(() => {
    const saved = localStorage.getItem('constructionSitesERP');
    if (saved) {
      // Migrate old data: add payments array if missing
      const parsed = JSON.parse(saved);
      return parsed.map(s => ({ ...s, payments: s.payments || [] }));
    }
    return INITIAL_SITES;
  });

  const [currentSiteId, setCurrentSiteId] = useState(sites[0]?.id || null);
  const [activeTab, setActiveTab] = useState('overview');

  // AI Assistant
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'System Initialized. I now have full context: BOQ data, payment history, retention pools, and EAC vectors. Ask me about cash flow, retention held, contractor payment status, or any financial exposure.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Entry Form States
  const [newSite, setNewSite] = useState({ name: '', location: '', budget: '', projectedRevenue: '', startDate: '' });
  const [newMaterial, setNewMaterial] = useState({ name: '', category: '', quantity: '', unit: '', unitCost: '', totalQty: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' });
  const [newContractor, setNewContractor] = useState({ name: '', scope: '', costCode: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '10', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' });
  const [newChangeOrder, setNewChangeOrder] = useState({ title: '', type: 'Owner', contractId: '', costCode: '', amount: '', status: 'Pending', date: '', description: '' });
  const [newBilling, setNewBilling] = useState({ type: 'Subcontractor Invoice', partner: '', costCode: '', amount: '', retentionWithheld: '', status: 'Pending', date: '' });
  const [newPayment, setNewPayment] = useState({ date: '', type: 'Contractor', reference: '', amount: '', method: 'Bank Transfer', invoice: '', status: 'Pending', notes: '' });
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
      grossProfit: 0, profitMarginPct: '0.0', revenueRealized: 0, ownerRetentionHeld: 0,
      cashPaidOut: 0, subBOQTotal: 0, contractorCompletionRate: 0
    };

    const origBudget = site.budget || 0;
    const baseRevenue = site.projectedRevenue || (origBudget * 1.15);

    const cos = site.changeOrders || [];
    const approvedOwnerCO = cos.filter(c => c.type === 'Owner' && c.status === 'Approved').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const pendingOwnerCO = cos.filter(c => c.type === 'Owner' && c.status === 'Pending').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const approvedSubCO = cos.filter(c => c.type === 'Subcontractor' && c.status === 'Approved').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const pendingSubCO = cos.filter(c => c.type === 'Subcontractor' && c.status === 'Pending').reduce((s, c) => s + parseFloat(c.amount || 0), 0);

    const revisedBudget = origBudget + approvedOwnerCO;
    const revisedRevenue = baseRevenue + approvedOwnerCO;

    const matActualCosts = site.materials?.reduce((s, m) => s + (parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0)), 0) || 0;
    const matCommittedCosts = site.materials?.reduce((s, m) => s + (parseFloat(m.totalQty || m.quantity || 0) * parseFloat(m.unitCost || 0)), 0) || 0;

    const subBOQTotal = site.contractors?.reduce((s, c) => s + parseFloat(c.boqTotal || 0), 0) || 0;
    const totalCommitted = subBOQTotal + matCommittedCosts + approvedSubCO;

    const subPaid = site.contractors?.reduce((s, c) => s + parseFloat(c.paid || 0), 0) || 0;
    const subRetention = site.contractors?.reduce((s, c) => s + ((parseFloat(c.boqTotal || 0) * parseFloat(c.retention || 0)) / 100), 0) || 0;

    const actualCost = matActualCosts + subPaid;

    const uncommittedBudget = Math.max(0, revisedBudget - totalCommitted);
    const etc = (totalCommitted - subPaid) + uncommittedBudget;
    const eac = actualCost + etc;

    const variance = revisedBudget - eac;
    const pctUtilized = revisedBudget ? ((actualCost / revisedBudget) * 100).toFixed(1) : '0.0';

    const ownerBillings = site.billings?.filter(b => b.type === 'Owner Claim' && b.status === 'Paid') || [];
    const revenueRealized = ownerBillings.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
    const ownerRetentionHeld = ownerBillings.reduce((s, b) => s + parseFloat(b.retentionWithheld || 0), 0);

    const projectedGrossProfit = revisedRevenue - eac;
    const profitMarginPct = revisedRevenue ? ((projectedGrossProfit / revisedRevenue) * 100).toFixed(1) : '0.0';

    // Payment ledger metrics
    const payments = site.payments || [];
    const cashPaidOut = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    // Contractor completion rate
    const completedContractors = (site.contractors || []).filter(c => c.status === 'Completed').length;
    const contractorCompletionRate = site.contractors?.length
      ? Math.round((completedContractors / site.contractors.length) * 100)
      : 0;

    return {
      origBudget, approvedOwnerCO, pendingOwnerCO, revisedBudget,
      committed: totalCommitted, uncommitted: uncommittedBudget, actualCost,
      etc, eac, variance, pctUtilized, approvedSubCO, pendingSubCO,
      subPaid, subRetention, balanceDue: Math.max(0, totalCommitted - subPaid),
      revisedRevenue, projectedGrossProfit, profitMarginPct, revenueRealized, ownerRetentionHeld,
      cashPaidOut, subBOQTotal, contractorCompletionRate
    };
  };

  const calcGlobalRollup = () => {
    let globalBudget = 0, globalSpent = 0, globalRevenue = 0, globalEAC = 0;
    sites.forEach(s => {
      const m = calcDetailedMetrics(s);
      globalBudget += m.revisedBudget;
      globalSpent += m.actualCost;
      globalRevenue += m.revisedRevenue;
      globalEAC += m.eac;
    });
    return {
      globalBudget, globalSpent, globalRevenue, globalEAC,
      globalVariance: globalBudget - globalEAC,
      pct: globalBudget ? ((globalSpent / globalBudget) * 100).toFixed(1) : '0.0'
    };
  };

  // ==================== PAYMENT CHART HELPERS ====================
  const getMonthlyPaymentData = (site) => {
    const payments = (site?.payments || []).filter(p => p.status === 'Paid');
    const byMonth = {};
    payments.forEach(p => {
      const m = p.date ? p.date.substring(0, 7) : 'Unknown';
      if (!byMonth[m]) byMonth[m] = { month: m, Contractor: 0, Material: 0, Other: 0 };
      byMonth[m][p.type] = (byMonth[m][p.type] || 0) + parseFloat(p.amount || 0);
    });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  };

  const getContractorPaymentStatus = (site) => {
    return (site?.contractors || []).map(c => {
      const ret = parseFloat(c.boqTotal || 0) * parseFloat(c.retention || 0) / 100;
      const paid = parseFloat(c.paid || 0);
      const outstanding = Math.max(0, parseFloat(c.boqTotal || 0) - paid);
      return {
        name: c.name.split(' ').slice(0, 2).join(' '),
        paid,
        retention: ret,
        outstanding
      };
    });
  };

  // ==================== STATE MUTATIONS ====================
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
      materials: [], contractors: [], changeOrders: [], billings: [], payments: []
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
    const calculatedRetention = newBilling.retentionWithheld ? parseFloat(newBilling.retentionWithheld) : (amt * 0.1);
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

  const addPayment = () => {
    if (!newPayment.reference || !newPayment.amount || !newPayment.date) return;
    const payment = {
      id: `pay-${Date.now()}`,
      ...newPayment,
      amount: parseFloat(newPayment.amount)
    };
    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      let contractors = s.contractors;
      // Auto-update contractor paid amount when a Contractor payment is marked Paid
      if (payment.type === 'Contractor' && payment.status === 'Paid') {
        contractors = contractors.map(c =>
          c.name === payment.reference
            ? { ...c, paid: Math.min(parseFloat(c.boqTotal || 0), parseFloat(c.paid || 0) + payment.amount) }
            : c
        );
      }
      return { ...s, payments: [...(s.payments || []), payment], contractors };
    }));
    setNewPayment({ date: '', type: 'Contractor', reference: '', amount: '', method: 'Bank Transfer', invoice: '', status: 'Pending', notes: '' });
  };

  const updatePaymentStatus = (payId, newStatus) => {
    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      const payment = (s.payments || []).find(p => p.id === payId);
      let contractors = s.contractors;
      // Auto-update BOQ paid when status changes to Paid
      if (payment && payment.type === 'Contractor' && newStatus === 'Paid' && payment.status !== 'Paid') {
        contractors = contractors.map(c =>
          c.name === payment.reference
            ? { ...c, paid: Math.min(parseFloat(c.boqTotal || 0), parseFloat(c.paid || 0) + parseFloat(payment.amount || 0)) }
            : c
        );
      }
      return {
        ...s,
        payments: s.payments.map(p => p.id === payId ? { ...p, status: newStatus } : p),
        contractors
      };
    }));
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
  const deletePayment = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, payments: (s.payments || []).filter(p => p.id !== id) }));

  const updateChangeOrderStatus = (coId, newStatus) => {
    setSites(sites.map(s => s.id !== currentSiteId ? s : {
      ...s,
      changeOrders: s.changeOrders.map(co => co.id === coId ? { ...co, status: newStatus } : co)
    }));
  };

  // ==================== AI CONTEXT ====================
  const buildAISystemContext = () => {
    const activeProject = getCurrentSite();
    const data = calcDetailedMetrics(activeProject);
    const payments = activeProject?.payments || [];
    const paidPayments = payments.filter(p => p.status === 'Paid');
    const cashPaidOut = paidPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const contractorPayments = paidPayments.filter(p => p.type === 'Contractor').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const materialPayments = paidPayments.filter(p => p.type === 'Material').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const contractorSummary = (activeProject?.contractors || [])
      .map(c => `  - ${c.name}: BOQ $${parseFloat(c.boqTotal||0).toLocaleString()}, Paid $${parseFloat(c.paid||0).toLocaleString()}, Retention ${c.retention}%, Status: ${c.status}`)
      .join('\n');

    return `
      You are an elite, Sage-300 & Procore compliant Construction Financial Principal Advisor. 
      Analyze the current live project space accurately. Provide strict numerical, highly quantitative risk feedback.
      
      PROJECT PROFILE: "${activeProject?.name}"
      --------------------------------------------------
      - Base Original Budget Target: $${data.origBudget.toLocaleString()}
      - Approved Owner Adjustments (OCO): $${data.approvedOwnerCO.toLocaleString()}
      - Revised Target Commitment Ceiling: $${data.revisedBudget.toLocaleString()}
      - BOQ Total (Subcontracts): $${data.subBOQTotal.toLocaleString()}
      - Prime Contract Projected Revenue Pipeline: $${data.revisedRevenue.toLocaleString()}
      
      LIVE ACCRUAL INDEX METRICS:
      - Absolute Obligations Committed (Subcontracts + POs): $${data.committed.toLocaleString()}
      - JTD Cash Burn (Actual Cost Incurred): $${data.actualCost.toLocaleString()}
      - Estimate to Complete (ETC Forecast Window): $${data.etc.toLocaleString()}
      - Dynamic Estimate at Completion (EAC Value): $${data.eac.toLocaleString()}
      - Cost Variance Index: $${data.variance >= 0 ? 'SAVINGS' : 'OVERRUN'} of $${Math.abs(data.variance).toLocaleString()}
      - Current Estimated Profit Margin Vector: $${data.projectedGrossProfit.toLocaleString()} (${data.profitMarginPct}%)
      
      PAYMENT LEDGER SUMMARY:
      - Total Cash Paid Out (from ledger): $${cashPaidOut.toLocaleString()}
      - Contractor Payments Disbursed: $${contractorPayments.toLocaleString()}
      - Material Payments Disbursed: $${materialPayments.toLocaleString()}
      - Pending Payments (not yet paid): $${pendingPayments.toLocaleString()}
      - Total Payment Records: ${payments.length}
      
      RETENTION POOLS:
      - Sub-Retention Withheld: $${data.subRetention.toLocaleString()}
      - Client-Held Retention: $${data.ownerRetentionHeld.toLocaleString()}
      
      CONTRACTOR STATUS:
${contractorSummary}
      - Contractor Completion Rate: ${data.contractorCompletionRate}%
      
      BREAKDOWN MATRICES:
      - Material Supplier Log Size: ${activeProject?.materials?.length || 0} entries.
      - Committed Contractor Base Count: ${activeProject?.contractors?.length || 0} entities.
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
      setMessages(p => [...p, { role: 'assistant', content: resData.content[0]?.text || 'System parsing error.' }]);
    } catch (err) {
      setMessages(p => [...p, { role: 'assistant', content: `Pipeline Interruption: ${err.message}` }]);
    } finally { setLoading(false); }
  };

  // ==================== EXPORT ====================
  const executeCSVDownload = () => {
    const site = getCurrentSite();
    const metrics = calcDetailedMetrics(site);
    let raw = `COMPREHENSIVE FINANCIAL ERP REPORT - ${site.name.toUpperCase()}\n`;
    raw += `METRIC,VALUE\nOriginal Budget,$${metrics.origBudget}\nApproved Adjustments,$${metrics.approvedOwnerCO}\nRevised Cost Ceiling,$${metrics.revisedBudget}\nBOQ Total,$${metrics.subBOQTotal}\nCash Paid Out (Ledger),$${metrics.cashPaidOut}\nJob Actual Cost To Date,$${metrics.actualCost}\nEstimate At Completion (EAC),$${metrics.eac}\nForecasted Cost Variance,$${metrics.variance}\nRetention Held (Sub),$${metrics.subRetention}\nProjected Profit Margin,%${metrics.profitMarginPct}\n\n`;

    raw += `PAYMENTS LEDGER\nDate,Type,Reference,Amount,Method,Invoice,Status\n`;
    (site.payments || []).forEach(p => {
      raw += `${p.date},${p.type},"${p.reference}",$${p.amount},${p.method},${p.invoice || ''},${p.status}\n`;
    });

    raw += `\nCOST BREAKDOWN BY DIVISIONS (WBS)\nCode Name,Committed,JTD Actual\n`;
    costCodes.forEach(cc => {
      const codeLabel = `${cc.code} ${cc.name}`;
      const codeMatCost = site.materials.filter(m => m.category === codeLabel).reduce((s, m) => s + (m.quantity * m.unitCost), 0);
      const codeSubCost = site.contractors.filter(c => c.costCode === codeLabel).reduce((s, c) => s + c.boqTotal, 0);
      const codeActual = site.contractors.filter(c => c.costCode === codeLabel).reduce((s, c) => s + c.paid, 0) + codeMatCost;
      raw += `"${codeLabel}",$${codeMatCost + codeSubCost},$${codeActual}\n`;
    });

    const blob = new Blob([raw], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ERP_Finance_Rollup_${site.name.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  // ==================== RENDER HELPERS ====================
  const activeProjectInstance = getCurrentSite();
  const metrics = calcDetailedMetrics(activeProjectInstance);
  const rollup = calcGlobalRollup();

  const ERP_TH = { padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4b5563', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' };
  const ERP_TD = { padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', borderBottom: '1px solid #e5e7eb', color: '#1f2937' };
  const inputStyle = { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', width: '100%', outline: 'none', background: '#fff' };
  const flexBtn = (bgColor, textColor = '#fff') => ({ padding: '10px 16px', background: bgColor, color: textColor, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' });

  const renderBadge = (status) => {
    const scheme = { Approved: ['#d1fae5', '#065f46'], Completed: ['#d1fae5', '#065f46'], Paid: ['#d1fae5', '#065f46'], 'In Progress': ['#fef3c7', '#92400e'], Pending: ['#fee2e2', '#991b1b'] };
    const [bg, fg] = scheme[status] || ['#f3f4f6', '#374151'];
    return <span style={{ background: bg, color: fg, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>{status}</span>;
  };

  const getPaymentReferenceOptions = () => {
    const contractors = (activeProjectInstance?.contractors || []).map(c => c.name);
    const suppliers = [...new Set([...PRESET_SUPPLIERS, ...(activeProjectInstance?.materials || []).map(m => m.supplier).filter(Boolean)])];
    return { contractors: [...new Set(contractors)], suppliers };
  };

  const refOpts = getPaymentReferenceOptions();
  const monthlyPaymentData = getMonthlyPaymentData(activeProjectInstance);
  const contractorPayStatus = getContractorPaymentStatus(activeProjectInstance);
  const recentPayments = (activeProjectInstance?.payments || []).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* GLOBAL ENTERPRISE TOP BANNER */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #f59e0b' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={28} style={{ color: '#f59e0b' }} /> Digiations 360 Core ERP <span style={{ fontSize: '12px', background: '#334155', padding: '4px 8px', borderRadius: '4px', color: '#cbd5e1' }}>رقمنة الرقمية</span>
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '13px' }}>Enterprise Commercial Controls · WBS Cost Codes · Change Management · Payments · Cost-To-Complete Forecasting</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Cross-Project Cash Outflow</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>${rollup.globalSpent.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 88px)' }}>

        {/* LEFT NAV PANEL */}
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

        {/* MAIN WORKSPACE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* NAVIGATION TABS */}
          <div style={{ display: 'flex', background: '#ffffff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', padding: '0 16px' }}>
            {[
              { id: 'overview', label: '📊 Executive Analytics' },
              { id: 'payments', label: '💳 Payments' },
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={executeCSVDownload} style={flexBtn('#16a34a')}><Download size={15} /> Export CSV</button>
                        <button onClick={() => deleteSite(activeProjectInstance.id)} style={flexBtn('#ef4444')}><Trash2 size={16} /> Wreck Center</button>
                      </div>
                    </div>

                    {/* KPI CARDS — now includes Payments, BOQ, Retention, Completion */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      {[
                        { label: 'BOQ Total', value: `$${metrics.subBOQTotal.toLocaleString()}`, color: '#0f172a' },
                        { label: 'Cash Paid Out', value: `$${metrics.cashPaidOut.toLocaleString()}`, color: '#2563eb', desc: 'from payment ledger' },
                        { label: 'Retention Held (Sub)', value: `$${metrics.subRetention.toLocaleString()}`, color: '#d97706' },
                        { label: 'Outstanding Balance', value: `$${metrics.balanceDue.toLocaleString()}`, color: '#ef4444' },
                        { label: 'Revised Cost Ceiling', value: `$${metrics.revisedBudget.toLocaleString()}`, color: '#475569' },
                        { label: 'Estimate At Completion (EAC)', value: `$${metrics.eac.toLocaleString()}`, color: '#7c3aed' },
                        {
                          label: 'Cost Variance (CV)',
                          value: `$${metrics.variance.toLocaleString()}`,
                          color: metrics.variance >= 0 ? '#16a34a' : '#dc2626',
                          desc: metrics.variance >= 0 ? 'Under target ceiling' : 'Accruing cost slippage'
                        },
                        { label: 'Projected Net Margin', value: `$${metrics.projectedGrossProfit.toLocaleString()} (${metrics.profitMarginPct}%)`, color: '#0891b2' },
                        {
                          label: 'Contractor Completion Rate',
                          value: `${metrics.contractorCompletionRate}%`,
                          color: metrics.contractorCompletionRate === 100 ? '#16a34a' : '#f59e0b',
                          desc: `${(activeProjectInstance.contractors || []).filter(c => c.status === 'Completed').length} of ${(activeProjectInstance.contractors || []).length} completed`
                        },
                      ].map((card, idx) => (
                        <div key={idx} style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>{card.label}</div>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: card.color }}>{card.value}</div>
                          {card.desc && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{card.desc}</div>}
                        </div>
                      ))}
                    </div>

                    {/* BUDGET UTILIZATION BAR */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                        <span>Accrued JTD Cost vs Target Ceiling Ratio</span>
                        <span>{metrics.pctUtilized}% Expended</span>
                      </div>
                      <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(parseFloat(metrics.pctUtilized), 100)}%`, background: parseFloat(metrics.pctUtilized) > 90 ? '#ef4444' : '#f59e0b', transition: 'width 0.3s' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* COMMITMENTS */}
                      <div style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', marginBottom: '12px' }}>Committed vs Uncommitted</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Absolute Binding Commitments:</span><span style={{ fontWeight: '700' }}>${metrics.committed.toLocaleString()}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Uncommitted Fluid Reserves:</span><span style={{ fontWeight: '700', color: '#16a34a' }}>${metrics.uncommitted.toLocaleString()}</span></div>
                        </div>
                      </div>

                      {/* RETENTION POOLS */}
                      <div style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', marginBottom: '12px' }}>Retention Accounting Pools</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Withheld from Subcontractors:</span><span style={{ fontWeight: '700', color: '#2563eb' }}>${metrics.subRetention.toLocaleString()}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Withheld by Client/Owner:</span><span style={{ fontWeight: '700', color: '#7c3aed' }}>${metrics.ownerRetentionHeld.toLocaleString()}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* RECENT PAYMENTS PREVIEW */}
                    <div style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Recent Payments</div>
                        <button onClick={() => setActiveTab('payments')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>View All Payments →</button>
                      </div>
                      {recentPayments.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '13px' }}>No payments recorded yet. Go to the Payments tab to add one.</div>
                      ) : recentPayments.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{p.reference}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{p.date} · {p.type} · {p.method}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>${parseFloat(p.amount).toLocaleString()}</span>
                            {renderBadge(p.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ==================== VIEW 2: PAYMENTS TAB ==================== */}
                {activeTab === 'payments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Payment Ledger</h2>

                    {/* ENTRY FORM */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#2563eb' }}>+ Record New Payment</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563' }}>Date</label>
                          <input type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563' }}>Type</label>
                          <select value={newPayment.type} onChange={e => setNewPayment({...newPayment, type: e.target.value, reference: ''})} style={{ ...inputStyle, marginTop: '4px' }}>
                            <option value="Contractor">Contractor</option>
                            <option value="Material">Material</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563' }}>Reference</label>
                          {newPayment.type === 'Contractor' ? (
                            <select value={newPayment.reference} onChange={e => setNewPayment({...newPayment, reference: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }}>
                              <option value="">-- Select Contractor --</option>
                              {refOpts.contractors.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          ) : newPayment.type === 'Material' ? (
                            <select value={newPayment.reference} onChange={e => setNewPayment({...newPayment, reference: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }}>
                              <option value="">-- Select Supplier --</option>
                              {refOpts.suppliers.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          ) : (
                            <input placeholder="Reference name" value={newPayment.reference} onChange={e => setNewPayment({...newPayment, reference: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }} />
                          )}
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563' }}>Amount ($)</label>
                          <input type="number" placeholder="0.00" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563' }}>Method</label>
                          <select value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }}>
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563' }}>Invoice #</label>
                          <input placeholder="INV-XXX" value={newPayment.invoice} onChange={e => setNewPayment({...newPayment, invoice: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563' }}>Status</label>
                          <select value={newPayment.status} onChange={e => setNewPayment({...newPayment, status: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }}>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </div>
                        <button onClick={addPayment} style={{ ...flexBtn('#2563eb'), marginTop: '18px' }}><Plus size={15} /> Record Payment</button>
                      </div>
                    </div>

                    {/* MONTHLY PAYMENT FLOW CHART */}
                    {monthlyPaymentData.length > 0 && (
                      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', marginBottom: '16px' }}>Monthly Payment Flow</div>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={monthlyPaymentData} margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={v => `$${parseFloat(v).toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="Contractor" fill="#2563eb" stackId="a" />
                            <Bar dataKey="Material" fill="#7c3aed" stackId="a" />
                            <Bar dataKey="Other" fill="#d97706" stackId="a" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* CONTRACTOR PAYMENT STATUS CHART */}
                    {contractorPayStatus.length > 0 && (
                      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', marginBottom: '16px' }}>Contractor Payment Status vs BOQ</div>
                        <ResponsiveContainer width="100%" height={Math.max(180, contractorPayStatus.length * 55)}>
                          <BarChart data={contractorPayStatus} layout="vertical" margin={{ top: 0, right: 16, left: 90, bottom: 0 }}>
                            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                            <Tooltip formatter={v => `$${parseFloat(v).toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="paid" name="Paid" fill="#16a34a" stackId="b" />
                            <Bar dataKey="retention" name="Retention Held" fill="#d97706" stackId="b" />
                            <Bar dataKey="outstanding" name="Outstanding" fill="#ef4444" stackId="b" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* PAYMENT LEDGER TABLE */}
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={ERP_TH}>Date</th>
                            <th style={ERP_TH}>Type</th>
                            <th style={ERP_TH}>Reference</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Amount</th>
                            <th style={ERP_TH}>Method</th>
                            <th style={ERP_TH}>Invoice</th>
                            <th style={ERP_TH}>BOQ Link</th>
                            <th style={ERP_TH}>Status</th>
                            <th style={{ ...ERP_TH, textAlign: 'center' }}>Purge</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeProjectInstance.payments || []).length === 0 && (
                            <tr><td colSpan="9" style={{ ...ERP_TD, textAlign: 'center', color: '#94a3b8' }}>No payments recorded. Add one above.</td></tr>
                          )}
                          {(activeProjectInstance.payments || []).map((p, i) => {
                            const matchedContractor = p.type === 'Contractor'
                              ? (activeProjectInstance.contractors || []).find(c => c.name === p.reference)
                              : null;
                            const boqPct = matchedContractor
                              ? Math.round((parseFloat(p.amount) / parseFloat(matchedContractor.boqTotal)) * 100)
                              : null;
                            return (
                              <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={ERP_TD}>{p.date}</td>
                                <td style={ERP_TD}>
                                  <span style={{ fontSize: '11px', background: p.type === 'Contractor' ? '#dbeafe' : p.type === 'Material' ? '#ede9fe' : '#fef3c7', color: p.type === 'Contractor' ? '#1e40af' : p.type === 'Material' ? '#5b21b6' : '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                                    {p.type}
                                  </span>
                                </td>
                                <td style={{ ...ERP_TD, fontWeight: '600' }}>{p.reference}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700' }}>${parseFloat(p.amount).toLocaleString()}</td>
                                <td style={{ ...ERP_TD, color: '#64748b' }}>{p.method}</td>
                                <td style={{ ...ERP_TD, fontSize: '12px', color: '#64748b' }}>{p.invoice || '—'}</td>
                                <td style={ERP_TD}>
                                  {boqPct !== null ? (
                                    <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>{boqPct}% of BOQ</span>
                                  ) : <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>}
                                </td>
                                <td style={ERP_TD}>
                                  <select
                                    value={p.status}
                                    onChange={e => updatePaymentStatus(p.id, e.target.value)}
                                    style={{ ...inputStyle, padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                  </select>
                                </td>
                                <td style={{ ...ERP_TD, textAlign: 'center' }}>
                                  <button onClick={() => deletePayment(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ==================== VIEW 3: WBS & DIVISION COST CODES ==================== */}
                {activeTab === 'wbs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Work Breakdown Structure (WBS) Matrix</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Division ledger mappings aligned with standard industrial construction cost centers.</p>
                      </div>
                      <button onClick={executeCSVDownload} style={flexBtn('#16a34a')}><Download size={15} /> Export Master Sheet</button>
                    </div>
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
                            const matchMats = activeProjectInstance.materials?.filter(m => m.category === combinedLabel) || [];
                            const matchSubs = activeProjectInstance.contractors?.filter(c => c.costCode === combinedLabel) || [];
                            const allocation = activeProjectInstance.budget / costCodes.length;
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

                {/* ==================== VIEW 4: COMMITMENTS & CONTRACTOR BOQ ==================== */}
                {activeTab === 'commitments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Subcontract Commitment Control & BOQs</h2>
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
                        <select value={newContractor.status} onChange={e => setNewContractor({...newContractor, status: e.target.value})} style={inputStyle}>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={addContractor} style={flexBtn('#2563eb')}><Plus size={15} /> Commit Subcontract to Ledger</button>
                      </div>
                    </div>
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

                {/* ==================== VIEW 5: CHANGE MANAGEMENT & CONTROL ==================== */}
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
                        <input type="date" value={newChangeOrder.date} onChange={e => setNewChangeOrder({...newChangeOrder, date: e.target.value})} style={inputStyle} />
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

                {/* ==================== VIEW 6: PROGRESS BILLINGS & INVOICING HUB ==================== */}
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
                        <input type="date" value={newBilling.date} onChange={e => setNewBilling({...newBilling, date: e.target.value})} style={inputStyle} />
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
                            <th style={ERP_TH}>Date</th>
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
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{b.costCode || '—'}</div>
                                </td>
                                <td style={ERP_TD}>
                                  <span style={{ fontSize: '12px', fontWeight: '600', color: b.type === 'Owner Claim' ? '#16a34a' : '#2563eb' }}>{b.type}</span>
                                </td>
                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700' }}>${parseFloat(b.amount).toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', color: '#ef4444' }}>-${parseFloat(b.retentionWithheld || 0).toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '800', color: b.type === 'Owner Claim' ? '#16a34a' : '#0f172a' }}>${netLiquidatedValue.toLocaleString()}</td>
                                <td style={{ ...ERP_TD, color: '#64748b' }}>{b.date || '—'}</td>
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

                {/* ==================== VIEW 7: INVENTORY LOGS & MATERIAL TRACKING ==================== */}
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

                {/* ==================== VIEW 8: COMPREHENSIVE QUANT AI FINANCIAL ADVISOR ==================== */}
                {activeTab === 'ai' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '520px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', background: '#0f172a', color: '#fff', borderBottom: '2px solid #f59e0b' }}>
                      <div style={{ fontWeight: '800', fontSize: '15px' }}>🏗️ Procore-AI Financial Compliance Deep Interface</div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Context: BOQ · Payment History · Retention Pools · EAC · Change Orders · Contractor Status</span>
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
                      <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendAIRequest()} placeholder="Ask: how much retention am I holding? Which contractors are underpaid vs BOQ?" style={inputStyle} disabled={loading} />
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
ENDOFFILE
echo "Done"
