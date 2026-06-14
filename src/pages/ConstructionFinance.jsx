import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Download, Trash2, Plus, Send, FileText, DollarSign, Home, Users, 
  Package, Map, MessageCircle, Tag, X, Edit2, Check, TrendingUp, 
  AlertTriangle, Layers, Briefcase, Clock, ArrowUpRight, ArrowDownLeft, Shield, Globe, Landmark
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

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

const INITIAL_SITES = [
  {
    id: 1,
    name: 'Downtown Office Complex',
    location: 'Downtown Core',
    status: 'In Progress',
    startDate: '2024-01-15',
    budget: 750000,
    projectedRevenue: 980000,
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
      { id: 'b1', type: 'Subcontractor Invoice', partner: 'Al Bayan Contracting', costCode: '03-000 Concrete & Masonry', amount: 40000, retentionWithheld: 4000, status: 'Approved', date: '2024-02-28' }
    ],
    payments: [
      { id: 'p1', date: '2024-02-15', type: 'Contractor', reference: 'Al Bayan Contracting', amount: 45000, method: 'Bank Transfer', invoice: 'INV-001', status: 'Paid', notes: 'Phase 1 milestone' },
      { id: 'p2', date: '2024-03-01', type: 'Material', reference: 'BuildCo Supply', amount: 37500, method: 'Bank Transfer', invoice: 'PO-001', status: 'Paid', notes: 'Concrete batch 1' }
    ],
    ownerPayments: [
      { id: 'op1', date: '2024-02-20', amount: 300000, method: 'Bank Transfer', reference: 'Milestone 1 Receipt', notes: 'Initial mobilization and foundation clear' },
      { id: 'op2', date: '2024-04-10', amount: 150000, method: 'Bank Transfer', reference: 'Milestone 2 Receipt', notes: 'Substructure progress payment' }
    ]
  },
  {
    id: 2,
    name: 'Al-Nakhil Residential Villa',
    location: 'North District Complex',
    status: 'Planning',
    startDate: '2024-05-10',
    budget: 320000,
    projectedRevenue: 410000,
    materials: [],
    contractors: [],
    changeOrders: [],
    billings: [],
    payments: [],
    ownerPayments: [
      { id: 'op3', date: '2024-05-15', amount: 80000, method: 'Cheque', reference: 'Downpayment', notes: 'Contract signing advance' }
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
    const saved = localStorage.getItem('constructionSitesERP_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(s => ({
        ...s,
        payments: s.payments || [],
        ownerPayments: s.ownerPayments || [],
        contractors: s.contractors?.map(c => ({ ...c, boqTotal: (parseFloat(c.quantity) * parseFloat(c.pricePerUnit)) || c.boqTotal })) || []
      }));
    }
    return INITIAL_SITES;
  });

  // Global Dashboard state indicator: can be 'global' or a specific project ID number
  const [currentSiteId, setCurrentSiteId] = useState('global');
  const [activeTab, setActiveTab] = useState('overview');

  // Inline BOQ Editing Transient State
  const [editingContractorId, setEditingContractorId] = useState(null);
  const [editBoqQty, setEditBoqQty] = useState('');
  const [editBoqRate, setEditBoqRate] = useState('');

  // AI Assistant Setup
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Digiations 360 Active Core Quant Model online. You can ask me to evaluate project variations, value for money metrics, client collection rates, or calculate contractor retention bounds across single or multi-project rollups.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Form Inputs
  const [newSite, setNewSite] = useState({ name: '', location: '', budget: '', projectedRevenue: '', startDate: '' });
  const [newMaterial, setNewMaterial] = useState({ name: '', category: '', quantity: '', unit: '', unitCost: '', totalQty: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' });
  const [newContractor, setNewContractor] = useState({ name: '', scope: '', costCode: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '10', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' });
  const [newChangeOrder, setNewChangeOrder] = useState({ title: '', type: 'Owner', contractId: '', costCode: '', amount: '', status: 'Pending', date: '', description: '' });
  const [newBilling, setNewBilling] = useState({ type: 'Subcontractor Invoice', partner: '', costCode: '', amount: '', retentionWithheld: '', status: 'Pending', date: '' });
  const [newPayment, setNewPayment] = useState({ date: '', type: 'Contractor', reference: '', amount: '', method: 'Bank Transfer', invoice: '', status: 'Pending', notes: '' });
  const [newOwnerPayment, setNewOwnerPayment] = useState({ date: '', amount: '', method: 'Bank Transfer', reference: '', notes: '' });
  const [newCodeInput, setNewCodeInput] = useState({ code: '', name: '' });

  const [contractorNameMode, setContractorNameMode] = useState('preset');
  const [customContractorName, setCustomContractorName] = useState('');

  // Auto Persistence Hook
  useEffect(() => { localStorage.setItem('constructionSitesERP_v2', JSON.stringify(sites)); }, [sites]);
  useEffect(() => { localStorage.setItem('cfCostCodes', JSON.stringify(costCodes)); }, [costCodes]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ==================== CORE ERP METRIC CALCULATORS ====================
  const getCurrentSite = () => sites.find(s => s.id === currentSiteId);

  const calcDetailedMetrics = (site) => {
    if (!site) return {
      origBudget: 0, approvedOwnerCO: 0, revisedBudget: 0, committed: 0, uncommitted: 0, 
      actualCost: 0, etc: 0, eac: 0, variance: 0, pctUtilized: '0.0', subPaid: 0, 
      subRetention: 0, balanceDue: 0, revisedRevenue: 0, projectedGrossProfit: 0, 
      profitMarginPct: '0.0', cashPaidOut: 0, subBOQTotal: 0, contractorCompletionRate: 0,
      totalOwnerReceived: 0, remainingToCollect: 0, netCashFlow: 0, collectionRatePct: '0.0'
    };

    const origBudget = site.budget || 0;
    const baseRevenue = site.projectedRevenue || (origBudget * 1.15);

    const cos = site.changeOrders || [];
    const approvedOwnerCO = cos.filter(c => c.type === 'Owner' && c.status === 'Approved').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const approvedSubCO = cos.filter(c => c.type === 'Subcontractor' && c.status === 'Approved').reduce((s, c) => s + parseFloat(c.amount || 0), 0);

    const revisedBudget = origBudget + approvedOwnerCO;
    const revisedRevenue = baseRevenue + approvedOwnerCO;

    const matActualCosts = site.materials?.reduce((s, m) => s + (parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0)), 0) || 0;
    const matCommittedCosts = site.materials?.reduce((s, m) => s + (parseFloat(m.totalQty || m.quantity || 0) * parseFloat(m.unitCost || 0)), 0) || 0;

    const subBOQTotal = site.contractors?.reduce((s, c) => s + (parseFloat(c.quantity || 0) * parseFloat(c.pricePerUnit || 0)), 0) || 0;
    const totalCommitted = subBOQTotal + matCommittedCosts + approvedSubCO;

    const subPaid = site.contractors?.reduce((s, c) => s + parseFloat(c.paid || 0), 0) || 0;
    const subRetention = site.contractors?.reduce((s, c) => s + (((parseFloat(c.quantity || 0) * parseFloat(c.pricePerUnit || 0)) * parseFloat(c.retention || 0)) / 100), 0) || 0;

    const actualCost = matActualCosts + subPaid;
    const uncommittedBudget = Math.max(0, revisedBudget - totalCommitted);
    const etc = (totalCommitted - subPaid) + uncommittedBudget;
    const eac = actualCost + etc;
    const variance = revisedBudget - eac;
    const pctUtilized = revisedBudget ? ((actualCost / revisedBudget) * 100).toFixed(1) : '0.0';

    // Owner cash inflows setup ("Value for money received")
    const totalOwnerReceived = site.ownerPayments?.reduce((s, p) => s + parseFloat(p.amount || 0), 0) || 0;
    const remainingToCollect = Math.max(0, revisedRevenue - totalOwnerReceived);
    const collectionRatePct = revisedRevenue ? ((totalOwnerReceived / revisedRevenue) * 100).toFixed(1) : '0.0';

    const projectedGrossProfit = revisedRevenue - eac;
    const profitMarginPct = revisedRevenue ? ((projectedGrossProfit / revisedRevenue) * 100).toFixed(1) : '0.0';

    const payments = site.payments || [];
    const cashPaidOut = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const netCashFlow = totalOwnerReceived - cashPaidOut;

    const completedContractors = (site.contractors || []).filter(c => c.status === 'Completed').length;
    const contractorCompletionRate = site.contractors?.length ? Math.round((completedContractors / site.contractors.length) * 100) : 0;

    return {
      origBudget, approvedOwnerCO, revisedBudget, committed: totalCommitted, uncommitted: uncommittedBudget,
      actualCost, etc, eac, variance, pctUtilized, approvedSubCO, subPaid, subRetention,
      balanceDue: Math.max(0, totalCommitted - subPaid), revisedRevenue, projectedGrossProfit, profitMarginPct,
      cashPaidOut, subBOQTotal, contractorCompletionRate, totalOwnerReceived, remainingToCollect, netCashFlow, collectionRatePct
    };
  };

  // Aggregated global multi-project corporate parameters calculation
  const globalRollup = useMemo(() => {
    let budget = 0, spent = 0, revenue = 0, eac = 0, ownerReceived = 0, cashOut = 0, committed = 0;
    sites.forEach(s => {
      const m = calcDetailedMetrics(s);
      budget += m.revisedBudget;
      spent += m.actualCost;
      revenue += m.revisedRevenue;
      eac += m.eac;
      ownerReceived += m.totalOwnerReceived;
      cashOut += m.cashPaidOut;
      committed += m.committed;
    });
    return {
      budget, spent, revenue, eac, ownerReceived, cashOut, committed,
      variance: budget - eac,
      netCashFlow: ownerReceived - cashOut,
      collectRemaining: Math.max(0, revenue - ownerReceived),
      spentPct: budget ? ((spent / budget) * 100).toFixed(1) : '0.0',
      collectionPct: revenue ? ((ownerReceived / revenue) * 100).toFixed(1) : '0.0'
    };
  }, [sites]);

  // Global distribution maps for charts
  const globalProjectsChartData = useMemo(() => {
    return sites.map(s => {
      const m = calcDetailedMetrics(s);
      return {
        name: s.name.length > 18 ? s.name.substring(0, 16) + '..' : s.name,
        'Revised Cost Budget': m.revisedBudget,
        'Cash Incurred (Spent)': m.actualCost,
        'Contract Revenue': m.revisedRevenue,
        'Owner Money Received': m.totalOwnerReceived
      };
    });
  }, [sites]);

  // ==================== STATE MUTATIONS & HANDLERS ====================
  const addSite = () => {
    if (!newSite.name || !newSite.budget) return;
    const s = {
      id: Date.now(),
      name: newSite.name,
      location: newSite.location || 'Unassigned District',
      status: 'Planning',
      startDate: newSite.startDate || new Date().toISOString().split('T')[0],
      budget: parseFloat(newSite.budget),
      projectedRevenue: parseFloat(newSite.projectedRevenue) || parseFloat(newSite.budget) * 1.15,
      materials: [], contractors: [], changeOrders: [], billings: [], payments: [], ownerPayments: []
    };
    setSites([...sites, s]);
    setCurrentSiteId(s.id);
    setNewSite({ name: '', location: '', budget: '', projectedRevenue: '', startDate: '' });
  };

  const deleteSite = (id, e) => {
    e.stopPropagation(); // Avoid switching project target upon button click
    if (window.confirm('CRITICAL AUDIT ACTION: Are you sure you want to completely purge this project hub, including all BOQs, Owner claims, and financial records?')) {
      const updated = sites.filter(s => s.id !== id);
      setSites(updated);
      if (currentSiteId === id || updated.length === 0) {
        setCurrentSiteId('global');
      }
    }
  };

  const startEditingBoq = (con) => {
    setEditingContractorId(con.id);
    setEditBoqQty(con.quantity.toString());
    setEditBoqRate(con.pricePerUnit.toString());
  };

  const saveBoqEdits = (conId) => {
    const qty = parseFloat(editBoqQty);
    const rate = parseFloat(editBoqRate);
    if (isNaN(qty) || isNaN(rate)) return;

    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      return {
        ...s,
        contractors: s.contractors.map(c => {
          if (c.id !== conId) return c;
          return {
            ...c,
            quantity: qty,
            pricePerUnit: rate,
            boqTotal: qty * rate
          };
        })
      };
    }));
    setEditingContractorId(null);
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

  const addOwnerPayment = () => {
    if (!newOwnerPayment.amount || !newOwnerPayment.date) return;
    const op = {
      id: `op-${Date.now()}`,
      date: newOwnerPayment.date,
      amount: parseFloat(newOwnerPayment.amount),
      method: newOwnerPayment.method,
      reference: newOwnerPayment.reference || 'Progress Installment',
      notes: newOwnerPayment.notes || ''
    };
    setSites(sites.map(s => s.id !== currentSiteId ? s : {
      ...s,
      ownerPayments: [...(s.ownerPayments || []), op]
    }));
    setNewOwnerPayment({ date: '', amount: '', method: 'Bank Transfer', reference: '', notes: '' });
  };

  const deleteOwnerPayment = (id) => {
    setSites(sites.map(s => s.id !== currentSiteId ? s : {
      ...s,
      ownerPayments: (s.ownerPayments || []).filter(item => item.id !== id)
    }));
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

  // ==================== COMPREHENSIVE REVENUE & COST AUDIT REPORT DOWNLOAD ====================
  const executeCSVDownload = () => {
    let raw = `DIGIATIONS 360 - ENTERPRISE CORE REPORT\nGenerated on: ${new Date().toLocaleDateString()}\n\n`;

    if (currentSiteId === 'global') {
      raw += `GLOBAL EXECUTIVE MULTI-PROJECT ROLLUP SUMMARY\n`;
      raw += `Total Corporate Cost Budget Target,$${globalRollup.budget}\n`;
      raw += `Total Accrued Site Outflows (Spent),$${globalRollup.spent}\n`;
      raw += `Total Corporate Prime Revenue Value,$${globalRollup.revenue}\n`;
      raw += `Total Value Received From Owners,$${globalRollup.ownerReceived}\n`;
      raw += `Net Multi-Project Cash Position,$${globalRollup.netCashFlow}\n`;
      raw += `Remaining Revenue Pipeline to Collect,$${globalRollup.collectRemaining}\n\n`;

      raw += `PROJECT HUB SPECIFIC REGISTER\n`;
      raw += `Project Name,Location,Status,Target Cost Budget,Contract Revenue Value,Total Inflow Collected,Total Outflow Paid\n`;
      sites.forEach(s => {
        const sm = calcDetailedMetrics(s);
        raw += `"${s.name}","${s.location}",${s.status},$${sm.revisedBudget},$${sm.revisedRevenue},$${sm.totalOwnerReceived},$${sm.cashPaidOut}\n`;
      });
    } else {
      const site = getCurrentSite();
      const metrics = calcDetailedMetrics(site);
      raw += `INDIVIDUAL PROJECT ACCOUNT AUDIT - ${site.name.toUpperCase()}\n`;
      raw += `Geographic Site Location,${site.location}\n`;
      raw += `Project Lifecycle Phase,${site.status}\n\n`;
      raw += `FINANCIAL KPI COEFFICIENTS\n`;
      raw += `Original Baseline Budget,$${metrics.origBudget}\n`;
      raw += `Approved Change Orders,$${metrics.approvedOwnerCO}\n`;
      raw += `Revised Cost Ceiling Target,$${metrics.revisedBudget}\n`;
      raw += `Total Contract Value (Revenue Ceiling),$${metrics.revisedRevenue}\n`;
      raw += `Value Received From Owner (Inflow),$${metrics.totalOwnerReceived}\n`;
      raw += `Remaining to Collect From Owner,$${metrics.remainingToCollect}\n`;
      raw += `Job Cash Paid Out To Date (Outflow),$${metrics.cashPaidOut}\n`;
      raw += `Net Project Cash Position,$${metrics.netCashFlow}\n`;
      raw += `Calculated EAC Value,$${metrics.eac}\n`;
      raw += `Project Variance Index,$${metrics.variance}\n\n`;

      raw += `CONTRACTOR COMMITMENTS & BOQ INDEX\n`;
      raw += `Contractor Name,Scope,Cost Code Alignment,Quantity,Price Per Unit,BOQ Total Value,Amount Paid,Retention Held\n`;
      (site.contractors || []).forEach(c => {
        raw += `"${c.name}","${c.scope}","${c.costCode || 'Uncoded'}",${c.quantity},${c.pricePerUnit},$${c.boqTotal},$${c.paid},${c.retention}%\n`;
      });

      raw += `\nOWNER CASH INFLOWS LEDGER (VALUE FOR MONEY RECEIVED)\n`;
      raw += `Receipt Date,Reference Title,Payment Method,Received Amount,Notes\n`;
      (site.ownerPayments || []).forEach(p => {
        raw += `${p.date},"${p.reference}",${p.method},$${p.amount},"${p.notes}"\n`;
      });

      raw += `\nCASH DISBURSEMENT OUTFLOW LOG (MATERIAL & CONTRACTORS)\n`;
      raw += `Payment Date,Type,Reference Beneficiary,Disbursed Amount,Method,Invoice,Status\n`;
      (site.payments || []).forEach(p => {
        raw += `${p.date},${p.type},"${p.reference}",$${p.amount},${p.method},${p.invoice || ''},${p.status}\n`;
      });
    }

    const blob = new Blob([raw], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = currentSiteId === 'global' ? `Global_Enterprise_Rollup_Report.csv` : `Project_Report_${getCurrentSite().name.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  // ==================== LIVE PROCORE-COMPLIANT AI CONTEXT MODELING ====================
  const buildAISystemContext = () => {
    if (currentSiteId === 'global') {
      return `
        You are an elite enterprise CFO and construction risk manager at Digiations 360 (رقمنة الرقمية).
        You are looking at a GLOBAL roll-up dashboard of ALL projects.
        - Total Cross-Project Cost Budget Target: $${globalRollup.budget.toLocaleString()}
        - Combined Capital Committed: $${globalRollup.committed.toLocaleString()}
        - Combined Job Actual Cost Paid Out: $${globalRollup.spent.toLocaleString()}
        - Combined Contract Revenue Value: $${globalRollup.revenue.toLocaleString()}
        - Combined Owner Cash Value Received: $${globalRollup.ownerReceived.toLocaleString()}
        - Net Cross-Project Cash Flow position: $${globalRollup.netCashFlow.toLocaleString()}
        - Global Outstanding Funds to Collect: $${globalRollup.collectRemaining.toLocaleString()}
        Provide multi-site financial strategic advice based on data points.
      `;
    }
    const activeProject = getCurrentSite();
    const data = calcDetailedMetrics(activeProject);
    return `
      You are the Principal AI Quant Advisor at Digiations 360 (رقمنة الرقمية).
      PROJECT TARGET PROFILE: "${activeProject?.name}"
      - Cost Budget Target (Revised): $${data.revisedBudget.toLocaleString()}
      - Prime Contract Revenue Value: $${data.revisedRevenue.toLocaleString()}
      - Value for Money Received from Owner: $${data.totalOwnerReceived.toLocaleString()} (${data.collectionRatePct}% Collection Rate)
      - Cash Capital Disbursed Outflow: $${data.cashPaidOut.toLocaleString()}
      - Net Liquid Projects Position: $${data.netCashFlow.toLocaleString()}
      - Total Subcontract BOQ Commitments: $${data.subBOQTotal.toLocaleString()}
      - Outstanding Funds Remaining to Collect from Owner: $${data.remainingToCollect.toLocaleString()}
      - Live EAC Index: $${data.eac.toLocaleString()} with Variance Status: $${data.variance.toLocaleString()}
      Analyze individual project matrices accurately and quantitatively.
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
      setMessages(p => [...p, { role: 'assistant', content: resData.content[0]?.text || 'Parsing anomaly detected.' }]);
    } catch (err) {
      setMessages(p => [...p, { role: 'assistant', content: `Pipeline Interruption: ${err.message}` }]);
    } finally { setLoading(false); }
  };

  // ==================== RENDERING SUB-COMPONENTS ====================
  const activeProjectInstance = getCurrentSite();
  const metrics = calcDetailedMetrics(activeProjectInstance);

  const ERP_TH = { padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4b5563', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' };
  const ERP_TD = { padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', borderBottom: '1px solid #e5e7eb', color: '#1f2937' };
  const inputStyle = { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', width: '100%', outline: 'none', background: '#fff' };
  const flexBtn = (bgColor, textColor = '#fff') => ({ padding: '10px 16px', background: bgColor, color: textColor, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' });

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* DIGIATIONS 360 ENTERPRISE HEADER BANNER */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #f59e0b' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={28} style={{ color: '#f59e0b' }} /> Digiations 360 Core ERP <span style={{ fontSize: '12px', background: '#334155', padding: '4px 8px', borderRadius: '4px', color: '#cbd5e1' }}>رقمنة الرقمية</span>
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '13px' }}>Variable BOQ Quantities · Owner Revenue Inflows · Dynamic Multi-Project Rollups · Forecast Intelligence Models</p>
        </div>
        <button onClick={executeCSVDownload} style={flexBtn('#f59e0b', '#0f172a')}>
          <Download size={16} /> Download Comprehensive Report (CSV)
        </button>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 88px)' }}>
        
        {/* SIDE NAV CENTER PANEL */}
        <div style={{ width: '310px', background: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div 
            onClick={() => { setCurrentSiteId('global'); setActiveTab('overview'); }}
            style={{ 
              padding: '14px', 
              background: currentSiteId === 'global' ? '#eff6ff' : '#f8fafc', 
              border: `1px solid ${currentSiteId === 'global' ? '#bfdbfe' : '#e2e8f0'}`, 
              borderRadius: '8px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontWeight: '700',
              color: currentSiteId === 'global' ? '#1e40af' : '#334155'
            }}
          >
            <Globe size={20} style={{ color: currentSiteId === 'global' ? '#2563eb' : '#64748b' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px' }}>GLOBAL CORE CONTROL</div>
              <div style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>{sites.length} Active Project Hubs</div>
            </div>
          </div>

          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '10px' }}>
            Operational Project List
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, maxHeight: '380px' }}>
            {sites.map(s => {
              const sMetrics = calcDetailedMetrics(s);
              const isActive = currentSiteId === s.id;
              return (
                <div 
                  key={s.id} 
                  onClick={() => setCurrentSiteId(s.id)} 
                  style={{ 
                    padding: '12px 14px', 
                    background: isActive ? '#f8fafc' : 'transparent', 
                    border: `1px solid ${isActive ? '#cbd5e1' : 'transparent'}`, 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    position: 'relative',
                    transition: 'all 0.15s'
                  }}
                >
                  {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', background: '#f59e0b', borderRadius: '0 4px 4px 0' }} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', maxWidth: '80%' }}>{s.name}</div>
                    <button 
                      onClick={(e) => deleteSite(s.id, e)} 
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                      title="Purge Project"
                    >
                      <Trash2 size={14} className="hover:text-red-500" />
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{s.location}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', fontWeight: '600' }}>
                    <span style={{ color: '#2563eb' }}>Rev: ${(sMetrics.revisedRevenue / 1000).toFixed(0)}k</span>
                    <span style={{ color: '#16a34a' }}>Inflow: {sMetrics.collectionRatePct}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SPAWN NEW HUB CENTER FORM */}
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

        {/* MAIN DATA WORKSPACE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          
          {/* NAVIGATION TABS STRUCTURE */}
          <div style={{ display: 'flex', background: '#ffffff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', padding: '0 16px' }}>
            {currentSiteId === 'global' ? (
              [{ id: 'overview', label: '🌐 Global Corporate Dashboard' }]
            ) : (
              [
                { id: 'overview', label: '📊 Executive Analytics' },
                { id: 'commitments', label: '👷 BOQ Commitments (Editable)' },
                { id: 'owner-inflow', label: '🏛️ Owner Value Receipts' },
                { id: 'payments', label: '💳 Capital Outflows' },
                { id: 'wbs', label: '🗂️ Cost Codes & WBS' },
                { id: 'changeorders', label: '🔄 Change Control' },
                { id: 'materials', label: '📦 Material Manifests' },
                { id: 'ai', label: '🤖 Core AI Quant Advisor' },
              ]
            ).map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                style={{ 
                  padding: '16px 20px', 
                  border: 'none', 
                  background: 'none', 
                  borderBottom: activeTab === tab.id ? '3px solid #f59e0b' : '3px solid transparent', 
                  color: activeTab === tab.id ? '#0f172a' : '#64748b', 
                  fontWeight: activeTab === tab.id ? '700' : '500', 
                  fontSize: '13px', 
                  cursor: 'pointer', 
                  whiteSpace: 'nowrap' 
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            
            {/* ==================== SCREEN A: GLOBAL CORPORATE ROLLUP VIEW ==================== */}
            {currentSiteId === 'global' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* GLOBAL METRIC ROW CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
                  <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Combined Revenue Portfolio</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', color: '#1e293b' }}>${globalRollup.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Sum of all contract values</div>
                  </div>
                  <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #16a34a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Value Money Received (Owner)</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', color: '#16a34a' }}>${globalRollup.ownerReceived.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', marginTop: '4px' }}>{globalRollup.collectionPct}% Portfolio Collected</div>
                  </div>
                  <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #dc2626', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Combined Outflows Disbursed</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', color: '#ef4444' }}>${globalRollup.cashOut.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>${globalRollup.spent.toLocaleString()} Incurred Actuals</div>
                  </div>
                  <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Net Cash Flow Balance</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', color: globalRollup.netCashFlow >= 0 ? '#16a34a' : '#dc2626' }}>
                      ${globalRollup.netCashFlow.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Inflows minus payments disbursed</div>
                  </div>
                </div>

                {/* GRAPH SECTION - COMPREHENSIVE MULTI-PROJECT MATRIX */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: '#0f172a' }}>📊 Enterprise-Wide Project Financial Comparison Matrix</div>
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={globalProjectsChartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="Revised Cost Budget" fill="#94a3b8" />
                        <Bar dataKey="Cash Incurred (Spent)" fill="#ef4444" />
                        <Bar dataKey="Contract Revenue" fill="#3b82f6" />
                        <Bar dataKey="Owner Money Received" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* PROJECT ROLLUP MATRIX TABLE */}
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px', fontWeight: '700', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Corporate Rollup Data Ledger</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={ERP_TH}>Project Identity</th>
                        <th style={ERP_TH}>Location</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Cost Budget</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Revenue value</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Money Received</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Capital Outflows</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Outstanding Collect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map(s => {
                        const sm = calcDetailedMetrics(s);
                        return (
                          <tr key={s.id}>
                            <td style={{ ...ERP_TD, fontWeight: '700' }}>{s.name}</td>
                            <td style={ERP_TD}>{s.location}</td>
                            <td style={{ ...ERP_TD, textAlign: 'right' }}>${sm.revisedBudget.toLocaleString()}</td>
                            <td style={{ ...ERP_TD, textAlign: 'right', color: '#2563eb' }}>${sm.revisedRevenue.toLocaleString()}</td>
                            <td style={{ ...ERP_TD, textAlign: 'right', color: '#16a34a', fontWeight: '700' }}>${sm.totalOwnerReceived.toLocaleString()}</td>
                            <td style={{ ...ERP_TD, textAlign: 'right', color: '#ef4444' }}>${sm.cashPaidOut.toLocaleString()}</td>
                            <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '600' }}>${sm.remainingToCollect.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* ==================== SCREEN B: INDIVIDUAL PROJECT VIEW ==================== */}
            {currentSiteId !== 'global' && activeProjectInstance && (
              <>
                {/* TAB 1: EXECUTIVE ANALYTICS */}
                {activeTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* METRIC COEFFICIENT BLOCK */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Contract Revenue Value</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>${metrics.revisedRevenue.toLocaleString()}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Owner Value Target Ceiling</div>
                      </div>
                      <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Money Received (Owner)</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>${metrics.totalOwnerReceived.toLocaleString()}</div>
                        <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', marginTop: '2px' }}>{metrics.collectionRatePct}% Collected Rate</div>
                      </div>
                      <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Outstanding to Collect</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>${metrics.remainingToCollect.toLocaleString()}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Remaining billing threshold</div>
                      </div>
                      <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Net Cash Balance</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: metrics.netCashFlow >= 0 ? '#16a34a' : '#dc2626', marginTop: '4px' }}>
                          ${metrics.netCashFlow.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Liquid cash in center</div>
                      </div>
                    </div>

                    {/* INTERMEDIARY LINE GRAPH CHART CONTROL */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>📈 Cash Position Allocation Profile</div>
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                          <BarChart data={[
                            { name: 'Baseline Cost Budget', Amount: metrics.revisedBudget },
                            { name: 'Total Commitments', Amount: metrics.committed },
                            { name: 'Disbursed Outflows', Amount: metrics.cashPaidOut },
                            { name: 'Inflows Received', Amount: metrics.totalOwnerReceived },
                          ]}>
                            <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                            <YAxis fontSize={11} stroke="#64748b" />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Bar dataKey="Amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* GENERAL CORE METRICS BREAKDOWN CARD LIST */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                      <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#4b5563' }}>Cost Performance Index</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                          <span>Cost Budget Ceiling:</span><span style={{ fontWeight: '700' }}>${metrics.revisedBudget.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                          <span>EAC Forecast Vector:</span><span style={{ fontWeight: '700' }}>${metrics.eac.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: metrics.variance >= 0 ? '#16a34a' : '#dc2626' }}>
                          <span>Projected Variance (CV):</span><span style={{ fontWeight: '700' }}>${metrics.variance.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#4b5563' }}>Profitability Margins</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                          <span>Expected Gross Profit:</span><span style={{ fontWeight: '700', color: '#0891b2' }}>${metrics.projectedGrossProfit.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span>Net Margin Percentage:</span><span style={{ fontWeight: '700', color: '#0891b2' }}>{metrics.profitMarginPct}%</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 2: BOQ COMMITMENTS (EDITABLE SECTOR) */}
                {activeTab === 'commitments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* ADD SUBCONTRACT FRAMEWORK FORM */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>+ Bind New Contractor Framework Structure</div>
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
                        <input placeholder="BOQ Rate per Unit ($)" type="number" value={newContractor.pricePerUnit} onChange={e => setNewContractor({...newContractor, pricePerUnit: e.target.value})} style={inputStyle} />
                        <input placeholder="BOQ Target Quantity" type="number" value={newContractor.quantity} onChange={e => setNewContractor({...newContractor, quantity: e.target.value})} style={inputStyle} />
                        <input placeholder="Retention Withheld (%)" type="number" value={newContractor.retention} onChange={e => setNewContractor({...newContractor, retention: e.target.value})} style={inputStyle} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={addContractor} style={flexBtn('#2563eb')}><Plus size={15} /> Bind Commitments Matrix</button>
                      </div>
                    </div>

                    {/* COMMITMENT BOQ EDITABLE DATA REGISTER TABLE */}
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={ERP_TH}>Contractor & Scope</th>
                            <th style={ERP_TH}>Cost Code</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Quantity</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Price / Unit Rate</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Total BOQ Target</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Paid (Ledger)</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Retention</th>
                            <th style={{ ...ERP_TH, textAlign: 'center' }}>BOQ Quantity Controls</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeProjectInstance.contractors || []).map((c, idx) => {
                            const isEditing = editingContractorId === c.id;
                            const currentBoqSum = parseFloat(c.quantity) * parseFloat(c.pricePerUnit);
                            const retentionVal = (currentBoqSum * parseFloat(c.retention || 0)) / 100;
                            return (
                              <tr key={c.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={ERP_TD}>
                                  <div style={{ fontWeight: '700' }}>{c.name}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{c.scope}</div>
                                </td>
                                <td style={ERP_TD}><span style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{c.costCode || 'Uncoded'}</span></td>
                                
                                {/* Quantity Edit Fields Toggle */}
                                <td style={{ ...ERP_TD, textAlign: 'right' }}>
                                  {isEditing ? (
                                    <input type="number" value={editBoqQty} onChange={e => setEditBoqQty(e.target.value)} style={{ ...inputStyle, width: '70px', padding: '4px', textAlign: 'right' }} />
                                  ) : (
                                    c.quantity
                                  )} <span style={{ fontSize: '11px', color: '#64748b' }}>{c.unit}</span>
                                </td>
                                
                                {/* Unit Rate Edit Fields Toggle */}
                                <td style={{ ...ERP_TD, textAlign: 'right' }}>
                                  {isEditing ? (
                                    <input type="number" value={editBoqRate} onChange={e => setEditBoqRate(e.target.value)} style={{ ...inputStyle, width: '90px', padding: '4px', textAlign: 'right' }} />
                                  ) : (
                                    `$${parseFloat(c.pricePerUnit).toLocaleString()}`
                                  )}
                                </td>

                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700' }}>
                                  ${currentBoqSum.toLocaleString()}
                                </td>
                                <td style={{ ...ERP_TD, textAlign: 'right', color: '#16a34a' }}>${parseFloat(c.paid || 0).toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', color: '#e59866' }}>${retentionVal.toLocaleString()} ({c.retention}%)</td>
                                
                                <td style={{ ...ERP_TD, textAlign: 'center' }}>
                                  {isEditing ? (
                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                      <button onClick={() => saveBoqEdits(c.id)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                                        <Check size={14} />
                                      </button>
                                      <button onClick={() => setEditingContractorId(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                      <button onClick={() => startEditingBoq(c)} style={{ background: '#f3f4f6', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                        <Edit2 size={12} /> Adjust BOQ
                                      </button>
                                      <button onClick={() => deleteContractor(c.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                {/* TAB 3: OWNER VALUE RECEIPTS LOG ("VALUE FOR MONEY RECEIVED") */}
                {activeTab === 'owner-inflow' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Landmark size={18} style={{ color: '#16a34a' }} /> Track Capital Money Received From Project Owner
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#4b5563' }}>Date of Receipt</label>
                          <input type="date" value={newOwnerPayment.date} onChange={e => setNewOwnerPayment({...newOwnerPayment, date: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#4b5563' }}>Inflow Amount Received ($)</label>
                          <input type="number" placeholder="e.g. 50000" value={newOwnerPayment.amount} onChange={e => setNewOwnerPayment({...newOwnerPayment, amount: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#4b5563' }}>Payment Instrument Mode</label>
                          <select value={newOwnerPayment.method} onChange={e => setNewOwnerPayment({...newOwnerPayment, method: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }}>
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#4b5563' }}>Reference / Milestone Tag</label>
                          <input placeholder="e.g. Stage 2 Slab Complete" value={newOwnerPayment.reference} onChange={e => setNewOwnerPayment({...newOwnerPayment, reference: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }} />
                        </div>
                      </div>
                      <input placeholder="Internal accounting log notes or verification details..." value={newOwnerPayment.notes} onChange={e => setNewOwnerPayment({...newOwnerPayment, notes: e.target.value})} style={inputStyle} />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={addOwnerPayment} style={flexBtn('#16a34a')}><Plus size={15} /> Commit Capital Receipt</button>
                      </div>
                    </div>

                    {/* OWNER INFLOW RECEIPTS LEDGER TABLE */}
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <div style={{ padding: '16px', fontWeight: '700', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Historical Cash Receipts Ledger</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={ERP_TH}>Date Verified</th>
                            <th style={ERP_TH}>Reference Allocation Tag</th>
                            <th style={ERP_TH}>Payment Method</th>
                            <th style={ERP_TH}>Notes</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Amount Credited</th>
                            <th style={{ ...ERP_TH, textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(!activeProjectInstance.ownerPayments || activeProjectInstance.ownerPayments.length === 0) && (
                            <tr><td colSpan="6" style={{ ...ERP_TD, textAlign: 'center', color: '#94a3b8' }}>No owner payments received or logged yet. Add entry above.</td></tr>
                          )}
                          {(activeProjectInstance.ownerPayments || []).map(op => (
                            <tr key={op.id}>
                              <td style={ERP_TD}>{op.date}</td>
                              <td style={{ ...ERP_TD, fontWeight: '700' }}>{op.reference}</td>
                              <td style={ERP_TD}>{op.method}</td>
                              <td style={{ ...ERP_TD, color: '#64748b', fontSize: '12px' }}>{op.notes || '—'}</td>
                              <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>${parseFloat(op.amount).toLocaleString()}</td>
                              <td style={{ ...ERP_TD, textAlign: 'center' }}>
                                <button onClick={() => deleteOwnerPayment(op.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                {/* TAB 4: DISBURSEMENT OUTFLOW PAYMENTS */}
                {activeTab === 'payments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* ADD OUTFLOW LEDGER ENTRY FORM */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>+ Record Outflow Disbursement Payment</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                        <input type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} style={inputStyle} />
                        <select value={newPayment.type} onChange={e => setNewPayment({...newPayment, type: e.target.value, reference: ''})} style={inputStyle}>
                          <option value="Contractor">Contractor Balance</option>
                          <option value="Material">Material Logistics PO</option>
                          <option value="Other">Other Operational Overheads</option>
                        </select>
                        
                        {/* Dynamic Reference Options mapping */}
                        <select value={newPayment.reference} onChange={e => setNewPayment({...newPayment, reference: e.target.value})} style={inputStyle}>
                          <option value="">-- Choose Target Entity --</option>
                          {newPayment.type === 'Contractor' ? (
                            (activeProjectInstance.contractors || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                          ) : (
                            [...new Set([...PRESET_SUPPLIERS, ...(activeProjectInstance.materials || []).map(m => m.supplier)])].map(s => <option key={s} value={s}>{s}</option>)
                          )}
                        </select>

                        <input placeholder="Disbursed Amount ($)" type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} style={inputStyle} />
                        <select value={newPayment.status} onChange={e => setNewPayment({...newPayment, status: e.target.value})} style={inputStyle}>
                          <option value="Pending">Pending Clearance</option>
                          <option value="Paid">Cleared / Paid</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={addPayment} style={flexBtn('#0f172a')}><Plus size={15} /> Log Outflow Ledger</button>
                      </div>
                    </div>

                    {/* DISBURSEMENT LOG OUTFLOW TABLE VIEW */}
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={ERP_TH}>Date Logged</th>
                            <th style={ERP_TH}>Category</th>
                            <th style={ERP_TH}>Beneficiary Vendor Reference</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Amount Outflow</th>
                            <th style={ERP_TH}>Instrument Clearance Status</th>
                            <th style={{ ...ERP_TH, textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeProjectInstance.payments || []).map((p, i) => (
                            <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={ERP_TD}>{p.date}</td>
                              <td style={ERP_TD}>
                                <span style={{ fontSize: '11px', background: p.type === 'Contractor' ? '#dbeafe' : '#ede9fe', color: p.type === 'Contractor' ? '#1e40af' : '#5b21b6', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                                  {p.type}
                                </span>
                              </td>
                              <td style={{ ...ERP_TD, fontWeight: '600' }}>{p.reference}</td>
                              <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700', color: '#ef4444' }}>${parseFloat(p.amount).toLocaleString()}</td>
                              <td style={ERP_TD}>
                                <select value={p.status} onChange={e => updatePaymentStatus(p.id, e.target.value)} style={{ ...inputStyle, padding: '4px', fontSize: '12px', width: 'auto' }}>
                                  <option value="Pending">Pending Clearance</option>
                                  <option value="Paid">Cleared / Paid</option>
                                </select>
                              </td>
                              <td style={{ ...ERP_TD, textAlign: 'center' }}>
                                <button onClick={() => deletePayment(p.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                {/* TAB 5: COST CODES & WBS MATRIX ALIGNMENT */}
                {activeTab === 'wbs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Committed Contracts Value</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>JTD Material Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {costCodes.map((cc, idx) => {
                            const combinedLabel = `${cc.code} ${cc.name}`;
                            const matchMats = activeProjectInstance.materials?.filter(m => m.category === combinedLabel) || [];
                            const matchSubs = activeProjectInstance.contractors?.filter(c => c.costCode === combinedLabel) || [];
                            const matCost = matchMats.reduce((s, m) => s + (m.quantity * m.unitCost), 0);
                            const subCost = matchSubs.reduce((s, c) => s + (c.quantity * c.pricePerUnit), 0);
                            return (
                              <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={{ ...ERP_TD, fontWeight: '700' }}>{cc.code} {cc.name}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right' }}>${subCost.toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right' }}>${matCost.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 6: CHANGE ORDERS MANAGEMENT */}
                {activeTab === 'changeorders' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>+ Log Variation Change Request Order</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                        <input placeholder="Variation Title" value={newChangeOrder.title} onChange={e => setNewChangeOrder({...newChangeOrder, title: e.target.value})} style={inputStyle} />
                        <select value={newChangeOrder.type} onChange={e => setNewChangeOrder({...newChangeOrder, type: e.target.value})} style={inputStyle}>
                          <option value="Owner">Owner (Inflow Adjustment)</option>
                          <option value="Subcontractor">Subcontractor (Outflow Obligation)</option>
                        </select>
                        <input placeholder="Variation Impact Cost ($)" type="number" value={newChangeOrder.amount} onChange={e => setNewChangeOrder({...newChangeOrder, amount: e.target.value})} style={inputStyle} />
                        <button onClick={addChangeOrder} style={flexBtn('#e59866')}><Plus size={15} /> Inject Order</button>
                      </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={ERP_TH}>Variation / Scope Modification</th>
                            <th style={ERP_TH}>Tier Level Type</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Amount Vector</th>
                            <th style={ERP_TH}>Status Approval Index</th>
                            <th style={{ ...ERP_TH, textAlign: 'center' }}>Purge</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeProjectInstance.changeOrders || []).map((co, idx) => (
                            <tr key={co.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={{ ...ERP_TD, fontWeight: '700' }}>{co.title}</td>
                              <td style={ERP_TD}>{co.type} Variation</td>
                              <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700' }}>${parseFloat(co.amount).toLocaleString()}</td>
                              <td style={ERP_TD}>
                                <select value={co.status} onChange={e => updateChangeOrderStatus(co.id, e.target.value)} style={{ ...inputStyle, padding: '4px', fontSize: '12px' }}>
                                  <option value="Pending">Pending Audit</option>
                                  <option value="Approved">Approved / Authorized</option>
                                  <option value="Rejected">Rejected Void</option>
                                </select>
                              </td>
                              <td style={{ ...ERP_TD, textAlign: 'center' }}>
                                <button onClick={() => deleteChangeOrder(co.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 7: MATERIAL LOGS MANIFEST */}
                {activeTab === 'materials' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                        <input placeholder="Material Name" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} style={inputStyle} />
                        <input placeholder="Quantity Received" type="number" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial, quantity: e.target.value})} style={inputStyle} />
                        <input placeholder="Price per Unit Rate" type="number" value={newMaterial.unitCost} onChange={e => setNewMaterial({...newMaterial, unitCost: e.target.value})} style={inputStyle} />
                        <input placeholder="Supplier Entity" value={newMaterial.supplier} onChange={e => setNewMaterial({...newMaterial, supplier: e.target.value})} style={inputStyle} />
                        <button onClick={addMaterial} style={flexBtn('#7c3aed')}><Plus size={15} /> Log Manifest</button>
                      </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={ERP_TH}>Material Resource Description</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Quantity</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Unit Cost</th>
                            <th style={{ ...ERP_TH, textAlign: 'right' }}>Total JTD Ext</th>
                            <th style={{ ...ERP_TH, textAlign: 'center' }}>Purge</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeProjectInstance.materials || []).map((m, idx) => (
                            <tr key={m.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={{ ...ERP_TD, fontWeight: '700' }}>{m.name}</td>
                              <td style={{ ...ERP_TD, textAlign: 'right' }}>{m.quantity}</td>
                              <td style={{ ...ERP_TD, textAlign: 'right' }}>${parseFloat(m.unitCost).toLocaleString()}</td>
                              <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700' }}>${(parseFloat(m.quantity) * parseFloat(m.unitCost)).toLocaleString()}</td>
                              <td style={{ ...ERP_TD, textAlign: 'center' }}>
                                <button onClick={() => deleteMaterial(m.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 8: PROCORE-COMPLIANT LIVE QUANT AI CO-PILOT PANEL */}
                {activeTab === 'ai' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '520px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ background: '#0f172a', color: '#fff', padding: '14px 20px', fontSize: '13px', fontWeight: '700' }}>
                      🤖 Live Cost Matrix Engine Context Verification Vector Model
                    </div>
                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', background: msg.role === 'user' ? '#f59e0b' : '#ffffff', color: msg.role === 'user' ? '#fff' : '#334155', border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {loading && <div style={{ fontSize: '12px', color: '#64748b' }}>🤔 Evaluating revised BOQ indices vs historical collection variance bounds...</div>}
                      <div ref={messagesEndRef} />
                    </div>
                    <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', background: '#fff' }}>
                      <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendAIRequest()} placeholder="Ask: What is our net project liquidity status? Are owner payments matching variation ceilings?" style={inputStyle} disabled={loading} />
                      <button onClick={handleSendAIRequest} disabled={loading || !input.trim()} style={flexBtn(loading || !input.trim() ? '#94a3b8' : '#0f172a')}>
                        <Send size={15} /> Calculate Vector
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