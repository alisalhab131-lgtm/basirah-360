import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Download, Trash2, Plus, Send, FileText, DollarSign, Home, Users, 
  Package, Map, MessageCircle, Tag, X, Edit2, Check, TrendingUp, 
  AlertTriangle, Layers, Briefcase, Clock, ArrowUpRight, ArrowDownLeft, Shield, Globe
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Global translation lookup matrix
const DICTIONARY = {
  en: {
    brand: "Digiations 360 Core ERP",
    company: "رقمنة الرقمية",
    subtitle: "Enterprise Commercial Controls · WBS Cost Codes · Change Management · Payments",
    crossSpent: "Cross-Project Outflow",
    activeCenters: "Active Cost Centers / Projects",
    ceiling: "Ceiling",
    spent: "spent",
    initCenter: "+ Initialize New Center",
    projName: "Project / Client Name",
    geoLoc: "Geographic Location",
    targetBudg: "Target Cost Budget ($)",
    contractRev: "Contract Revenue Value ($)",
    spawnBtn: "Spawn Project Hub",
    allProjects: "Global Dashboard Overview",
    totalBudget: "Total Combined Budget",
    totalRevenue: "Total Combined Revenue",
    totalSpent: "Total Combined Actual Costs",
    netCashFlow: "Net ERP Cash Flow Balance",
    tabs: {
      overview: "📊 Executive Analytics",
      payments: "💳 Payments",
      wbs: "🗂️ WBS & Cost Codes",
      commitments: "👷 Commitments & BOQ",
      changeorders: "🔄 Change Control",
      billings: "🧾 Progress Invoicing",
      materials: "📦 Inventory Logs",
      ai: "🤖 Core AI Quant Advisor"
    },
    cards: {
      revisedCeiling: "Revised Cost Ceiling",
      actualCost: "Job Actual Cost To Date",
      costVariance: "Cost Variance (CV)",
      projectedMargin: "Projected Net Margin",
      completionRate: "Contractor Completion Rate",
      ownerFunds: "Funds Received From Owner",
      netLiquidity: "Net Project Liquidity"
    },
    fields: {
      date: "Date",
      type: "Type",
      reference: "Reference Partner",
      amount: "Amount",
      method: "Method",
      invoice: "Invoice ID",
      boqLink: "BOQ Linkage",
      status: "State Status",
      actions: "Actions",
      scope: "Scope of Work",
      costCode: "WBS Cost Code",
      unit: "Unit",
      unitPrice: "Price / Unit",
      qty: "Quantity",
      boqTotal: "BOQ Total",
      paid: "Paid",
      retention: "Retention %",
      title: "Title / Description",
      category: "Category Division",
      supplier: "Supplier Entity",
      condition: "Condition Status",
      notes: "Technical Notes"
    },
    alerts: {
      underCeiling: "Under target ceiling",
      costSlippage: "Accruing cost slippage",
      noRecords: "No matching ledger entries found."
    }
  },
  ar: {
    brand: "رقمنة الرقمية - Digiations 360",
    company: "النظام المالي المركزي ERP",
    subtitle: "المراقب التجارية للمؤسسات · رموز تكلفة WBS · إدارة أوامر التغيير · التدفقات النقدية",
    crossSpent: "إجمالي التدفق النقدي الخارج",
    activeCenters: "مراكز التكلفة النشطة / المشاريع",
    ceiling: "السقف المالي",
    spent: "مستهلك",
    initCenter: "+ إنشاء مركز تكلفة جديد",
    projName: "اسم المشروع / العميل",
    geoLoc: "الموقع الجغرافي للموقع",
    targetBudg: "ميزانية التكلفة المستهدفة ($)",
    contractRev: "قيمة إيرادات العقد المتوقعة ($)",
    spawnBtn: "إطلاق محور المشروع",
    allProjects: "لوحة التحكم العالمية للمشاريع",
    totalBudget: "إجمالي الميزانيات المدمجة",
    totalRevenue: "إجمالي الإيرادات المدمجة",
    totalSpent: "إجمالي التكاليف الفعلية",
    netCashFlow: "صافي رصيد التدفق النقدي للشركة",
    tabs: {
      overview: "📊 التحليلات التنفيذية",
      payments: "💳 سجل المدفوعات",
      wbs: "🗂️ هيكل توزيع العمل WBS",
      commitments: "👷 الالتزامات وجداول الكميات BOQ",
      changeorders: "🔄 أوامر التغيير",
      billings: "🧾 فواتير ومطالبات الإنجاز",
      materials: "📦 سجلات المواد والمخزون",
      ai: "🤖 مستشار الذكاء الاصطناعي للمقاييس"
    },
    cards: {
      revisedCeiling: "سقف التكلفة المعدل",
      actualCost: "التكلفة الفعلية حتى الآن",
      costVariance: "انحراف التكلفة (CV)",
      projectedMargin: "هامش الربح الصافي المتوقع",
      completionRate: "معدل إنجاز المقاولين",
      ownerFunds: "المبالغ المستلمة من المالك",
      netLiquidity: "صافي سيولة المشروع الحالية"
    },
    fields: {
      date: "التاريخ",
      type: "النوع",
      reference: "الجهة / الشريك المرجعي",
      amount: "المبلغ",
      method: "طريقة الدفع",
      invoice: "رقم الفاتورة",
      boqLink: "الارتباط بـ BOQ",
      status: "حالة الاعتماد",
      actions: "العمليات",
      scope: "نطاق العمل",
      costCode: "رمز تكلفة WBS",
      unit: "الوحدة",
      unitPrice: "سعر الوحدة",
      qty: "الكمية",
      boqTotal: "إجمالي جدول الكميات",
      paid: "المدفوع",
      retention: "نسبة الاستقطاع الاحتياطي %",
      title: "العنوان / الوصف المعياري",
      category: "تقسيم القسم (Division)",
      supplier: "المورد / المنشأة الموردة",
      condition: "حالة الفحص والمطابقة",
      notes: "ملاحظات فنية وهندسية"
    },
    alerts: {
      underCeiling: "ضمن السقف المالي المستهدف",
      costSlippage: "تراكم تجاوزات وتكاليف إضافية",
      noRecords: "لا توجد سجلات قيود في هذا القسم حالياً."
    }
  }
};

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

const PRESET_CONTRACTORS = ['Al Bayan Contracting', 'Gulf Build Co.', 'Al Masa Engineering', 'Horizon Contractors'];
const PRESET_SUPPLIERS = ['BuildCo Supply', 'Steel Ltd', 'Gulf Materials', 'AlSafwa Trading'];
const PAYMENT_METHODS = ['Bank Transfer', 'Cheque', 'Cash', 'Letter of Credit'];

const INITIAL_SITES = [
  {
    id: 1,
    name: 'Downtown Office Complex',
    location: 'Riyadh Core',
    status: 'In Progress',
    startDate: '2024-01-15',
    budget: 750000,
    projectedRevenue: 980000,
    moneyReceivedFromOwner: 450000, // Value for money received from owner
    materials: [
      { id: 'm1', name: 'Ultra-High Performance Concrete', category: '03-000 Concrete & Masonry', quantity: 250, unit: 'm³', unitCost: 150, totalQty: 300, supplier: 'BuildCo Supply', deliveryDate: '2024-02-01', condition: 'Good', notes: 'Ready-mix batch' },
    ],
    contractors: [
      { id: 'c1', name: 'Al Bayan Contracting', scope: 'Foundation Work', costCode: '03-000 Concrete & Masonry', unit: 'm²', pricePerUnit: 400, quantity: 300, boqTotal: 120000, paid: 75000, retention: 10, startDate: '2024-01-20', endDate: '2024-04-20', status: 'In Progress', contact: '+966 50 000 0001', notes: 'Phase 1 substructure complete' }
    ],
    changeOrders: [
      { id: 'co1', title: 'Subgrade Rock Excavation Overrun', type: 'Owner', costCode: '02-000 Earthworks & Site Clearance', amount: 35000, status: 'Approved', date: '2024-02-10', description: 'Encountered unexpected bedrock tier' }
    ],
    billings: [
      { id: 'b1', type: 'Owner Claim', partner: 'Municipality Asset Corp', costCode: '01-000 General Requirements', amount: 110000, retentionWithheld: 11000, status: 'Paid', date: '2024-03-05' }
    ],
    payments: [
      { id: 'p1', date: '2024-02-15', type: 'Contractor', reference: 'Al Bayan Contracting', amount: 45000, method: 'Bank Transfer', invoice: 'INV-001', status: 'Paid', notes: 'Phase 1 milestone' }
    ]
  }
];

const ConstructionFinanceApp = () => {
  // ==================== STATE MANAGEMENT ====================
  const [lang, setLang] = useState('en'); // Translation switch state ('en' / 'ar')
  const [costCodes, setCostCodes] = useState(() => {
    const saved = localStorage.getItem('cfCostCodes_v2');
    return saved ? JSON.parse(saved) : DEFAULT_COST_CODES;
  });

  const [sites, setSites] = useState(() => {
    const saved = localStorage.getItem('constructionSitesERP_v2');
    return saved ? JSON.parse(saved) : INITIAL_SITES;
  });

  const [currentSiteId, setCurrentSiteId] = useState(sites[0]?.id || null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Inline editing state for BOQ Quantities
  const [editingContractorId, setEditingContractorId] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // AI Assistant Chat Logs
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'System Initialized. Active metrics synced across localized translation pipelines. Ask me about your real-time risk exposure, cost breakdown variance bounds, or retention calculations.' }
  ]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Form State Vectors
  const [newSite, setNewSite] = useState({ name: '', location: '', budget: '', projectedRevenue: '', moneyReceivedFromOwner: '', startDate: '' });
  const [newMaterial, setNewMaterial] = useState({ name: '', category: '', quantity: '', unit: '', unitCost: '', totalQty: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' });
  const [newContractor, setNewContractor] = useState({ name: '', scope: '', costCode: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '10', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' });
  const [newChangeOrder, setNewChangeOrder] = useState({ title: '', type: 'Owner', contractId: '', costCode: '', amount: '', status: 'Pending', date: '', description: '' });
  const [newBilling, setNewBilling] = useState({ type: 'Subcontractor Invoice', partner: '', costCode: '', amount: '', retentionWithheld: '', status: 'Pending', date: '' });
  const [newPayment, setNewPayment] = useState({ date: '', type: 'Contractor', reference: '', amount: '', method: 'Bank Transfer', invoice: '', status: 'Pending', notes: '' });
  const [newCodeInput, setNewCodeInput] = useState({ code: '', name: '' });

  // Auto Persistence Side Effects
  useEffect(() => { localStorage.setItem('constructionSitesERP_v2', JSON.stringify(sites)); }, [sites]);
  useEffect(() => { localStorage.setItem('cfCostCodes_v2', JSON.stringify(costCodes)); }, [costCodes]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Dynamic Text Multi-lingual Getter
  const t = useMemo(() => DICTIONARY[lang], [lang]);
  const isRtl = lang === 'ar';

  // ==================== METRIC CALCULATION ENGINES ====================
  const getCurrentSite = () => sites.find(s => s.id === currentSiteId) || sites[0];
  const activeProjectInstance = getCurrentSite();

  const calcDetailedMetrics = (site) => {
    if (!site) return {
      origBudget: 0, approvedOwnerCO: 0, revisedBudget: 0, committed: 0,
      actualCost: 0, etc: 0, eac: 0, variance: 0, pctUtilized: '0.0',
      revisedRevenue: 0, projectedGrossProfit: 0, profitMarginPct: '0.0',
      subRetention: 0, contractorCompletionRate: 0, moneyReceived: 0, netLiquidity: 0
    };

    const origBudget = parseFloat(site.budget || 0);
    const baseRevenue = parseFloat(site.projectedRevenue || origBudget * 1.15);
    const moneyReceived = parseFloat(site.moneyReceivedFromOwner || 0);

    const cos = site.changeOrders || [];
    const approvedOwnerCO = cos.filter(c => c.type === 'Owner' && c.status === 'Approved').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const approvedSubCO = cos.filter(c => c.type === 'Subcontractor' && c.status === 'Approved').reduce((s, c) => s + parseFloat(c.amount || 0), 0);

    const revisedBudget = origBudget + approvedOwnerCO;
    const revisedRevenue = baseRevenue + approvedOwnerCO;

    const matActualCosts = site.materials?.reduce((s, m) => s + (parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0)), 0) || 0;
    const subBOQTotal = site.contractors?.reduce((s, c) => s + parseFloat(c.boqTotal || 0), 0) || 0;
    
    const totalCommitted = subBOQTotal + matActualCosts + approvedSubCO;
    const subPaid = site.contractors?.reduce((s, c) => s + parseFloat(c.paid || 0), 0) || 0;
    const subRetention = site.contractors?.reduce((s, c) => s + ((parseFloat(c.boqTotal || 0) * parseFloat(c.retention || 0)) / 100), 0) || 0;

    const actualCost = matActualCosts + subPaid;
    const uncommittedBudget = Math.max(0, revisedBudget - totalCommitted);
    const etc = (totalCommitted - subPaid) + uncommittedBudget;
    const eac = actualCost + etc;
    const variance = revisedBudget - eac;
    
    const pctUtilized = revisedBudget ? ((actualCost / revisedBudget) * 100).toFixed(1) : '0.0';
    const projectedGrossProfit = revisedRevenue - eac;
    const profitMarginPct = revisedRevenue ? ((projectedGrossProfit / revisedRevenue) * 100).toFixed(1) : '0.0';
    
    const netLiquidity = moneyReceived - actualCost;

    const completedCount = (site.contractors || []).filter(c => c.status === 'Completed').length;
    const contractorCompletionRate = site.contractors?.length ? Math.round((completedCount / site.contractors.length) * 100) : 0;

    return {
      origBudget, approvedOwnerCO, revisedBudget, committed: totalCommitted,
      actualCost, etc, eac, variance, pctUtilized, revisedRevenue,
      projectedGrossProfit, profitMarginPct, subRetention, contractorCompletionRate,
      moneyReceived, netLiquidity
    };
  };

  const metrics = useMemo(() => calcDetailedMetrics(activeProjectInstance), [activeProjectInstance]);

  const globalRollup = useMemo(() => {
    let budget = 0, spent = 0, revenue = 0;
    sites.forEach(s => {
      const m = calcDetailedMetrics(s);
      budget += m.revisedBudget;
      spent += m.actualCost;
      revenue += m.revisedRevenue;
    });
    return { budget, spent, revenue, balance: revenue - spent };
  }, [sites]);

  // Chart Data formatters
  const monthlyPaymentData = useMemo(() => {
    if (!activeProjectInstance?.payments) return [];
    const hash = {};
    activeProjectInstance.payments.filter(p => p.status === 'Paid').forEach(p => {
      const month = p.date ? p.date.substring(0, 7) : '2026-06';
      if (!hash[month]) hash[month] = { month, Disbursed: 0 };
      hash[month].Disbursed += parseFloat(p.amount || 0);
    });
    return Object.values(hash).sort((a, b) => a.month.localeCompare(b.month));
  }, [activeProjectInstance]);

  // ==================== STATE MUTATION OPERATIONS ====================
  const handleCreateSite = () => {
    if (!newSite.name || !newSite.budget) return;
    const spawned = {
      id: Date.now(),
      name: newSite.name,
      location: newSite.location || 'Default Hub Site',
      status: 'In Progress',
      startDate: newSite.startDate || new Date().toISOString().split('T')[0],
      budget: parseFloat(newSite.budget),
      projectedRevenue: parseFloat(newSite.projectedRevenue) || parseFloat(newSite.budget) * 1.15,
      moneyReceivedFromOwner: parseFloat(newSite.moneyReceivedFromOwner) || 0,
      materials: [], contractors: [], changeOrders: [], billings: [], payments: []
    };
    setSites([...sites, spawned]);
    setCurrentSiteId(spawned.id);
    setNewSite({ name: '', location: '', budget: '', projectedRevenue: '', moneyReceivedFromOwner: '', startDate: '' });
  };

  const handleDeleteSite = (id) => {
    if (sites.length <= 1) return alert("System requires at least one initialized cost center workspace context.");
    if (confirm("Confirm structural deletion of this project data block?")) {
      const remaining = sites.filter(s => s.id !== id);
      setSites(remaining);
      setCurrentSiteId(remaining[0].id);
    }
  };

  const handleUpdateOwnerFunds = (val) => {
    setSites(sites.map(s => s.id === currentSiteId ? { ...s, moneyReceivedFromOwner: parseFloat(val) || 0 } : s));
  };

  const handleAddContractor = () => {
    if (!newContractor.name || !newContractor.quantity || !newContractor.pricePerUnit) return;
    const qty = parseFloat(newContractor.quantity);
    const rate = parseFloat(newContractor.pricePerUnit);
    const element = {
      id: `con-${Date.now()}`,
      ...newContractor,
      quantity: qty,
      pricePerUnit: rate,
      boqTotal: qty * rate,
      paid: parseFloat(newContractor.paid) || 0,
      retention: parseFloat(newContractor.retention) || 10
    };
    setSites(sites.map(s => s.id === currentSiteId ? { ...s, contractors: [...(s.contractors || []), element] } : s));
    setNewContractor({ name: '', scope: '', costCode: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '10', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' });
  };

  const startEditingContractor = (c) => {
    setEditingContractorId(c.id);
    setEditQty(c.quantity);
    setEditPrice(c.pricePerUnit);
  };

  const saveContractorBOQ = (id) => {
    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      return {
        ...s,
        contractors: (s.contractors || []).map(c => {
          if (c.id !== id) return c;
          const q = parseFloat(editQty) || 0;
          const p = parseFloat(editPrice) || 0;
          return { ...c, quantity: q, pricePerUnit: p, boqTotal: q * p };
        })
      };
    }));
    setEditingContractorId(null);
  };

  const handleAddPayment = () => {
    if (!newPayment.reference || !newPayment.amount || !newPayment.date) return;
    const record = {
      id: `pay-${Date.now()}`,
      ...newPayment,
      amount: parseFloat(newPayment.amount)
    };
    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      let refreshedContractors = s.contractors || [];
      if (record.type === 'Contractor' && record.status === 'Paid') {
        refreshedContractors = refreshedContractors.map(c => 
          c.name === record.reference ? { ...c, paid: Math.min(c.boqTotal, (c.paid || 0) + record.amount) } : c
        );
      }
      return { ...s, payments: [...(s.payments || []), record], contractors: refreshedContractors };
    }));
    setNewPayment({ date: '', type: 'Contractor', reference: '', amount: '', method: 'Bank Transfer', invoice: '', status: 'Pending', notes: '' });
  };

  const handleAddMaterial = () => {
    if (!newMaterial.name || !newMaterial.quantity || !newMaterial.unitCost) return;
    const item = {
      id: `mat-${Date.now()}`,
      ...newMaterial,
      quantity: parseFloat(newMaterial.quantity),
      unitCost: parseFloat(newMaterial.unitCost)
    };
    setSites(sites.map(s => s.id === currentSiteId ? { ...s, materials: [...(s.materials || []), item] } : s));
    setNewMaterial({ name: '', category: '', quantity: '', unit: '', unitCost: '', totalQty: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' });
  };

  const handleAddChangeOrder = () => {
    if (!newChangeOrder.title || !newChangeOrder.amount) return;
    const item = {
      id: `co-${Date.now()}`,
      ...newChangeOrder,
      amount: parseFloat(newChangeOrder.amount)
    };
    setSites(sites.map(s => s.id === currentSiteId ? { ...s, changeOrders: [...(s.changeOrders || []), item] } : s));
    setNewChangeOrder({ title: '', type: 'Owner', contractId: '', costCode: '', amount: '', status: 'Pending', date: '', description: '' });
  };

  const handleAddBilling = () => {
    if (!newBilling.partner || !newBilling.amount) return;
    const item = {
      id: `bill-${Date.now()}`,
      ...newBilling,
      amount: parseFloat(newBilling.amount),
      retentionWithheld: parseFloat(newBilling.retentionWithheld) || 0
    };
    setSites(sites.map(s => s.id === currentSiteId ? { ...s, billings: [...(s.billings || []), item] } : s));
    setNewBilling({ type: 'Subcontractor Invoice', partner: '', costCode: '', amount: '', retentionWithheld: '', status: 'Pending', date: '' });
  };

  const handleAddCostCode = () => {
    if (newCodeInput.code && newCodeInput.name) {
      setCostCodes([...costCodes, newCodeInput]);
      setNewCodeInput({ code: '', name: '' });
    }
  };

  // Automated Live Metrics AI Chat Engine Simulation
  const handleAIEngineExecution = () => {
    if (!input.trim()) return;
    const promptText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: promptText }]);
    setAiLoading(true);

    setTimeout(() => {
      let logicResponse = `Structural cost audit completed for project "${activeProjectInstance.name}". Current cost variance status yields a delta of $${metrics.variance.toLocaleString()}. `;
      if (promptText.toLowerCase().includes('retention')) {
        logicResponse += `Subcontractor retention pool currently stands at $${metrics.subRetention.toLocaleString()} withheld, with net actual job outlays at $${metrics.actualCost.toLocaleString()}.`;
      } else if (promptText.toLowerCase().includes('owner') || promptText.toLowerCase().includes('received')) {
        logicResponse += `Owner capital contribution logged is $${metrics.moneyReceived.toLocaleString()} vs cash burn rate, indicating an immediate net liquidity cushion of $${metrics.netLiquidity.toLocaleString()}.`;
      } else {
        logicResponse += `Project budget configuration holds an absolute committed footprint of $${metrics.committed.toLocaleString()} out of an allowable ceiling constraint of $${metrics.revisedBudget.toLocaleString()}. Procore standard forecast indices place ETC window requirements at $${metrics.etc.toLocaleString()}.`;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: logicResponse }]);
      setAiLoading(false);
    }, 750);
  };

  // CSV Report Generator Utility
  const triggerCSVDownload = () => {
    let rawStr = `Digiations 360 ERP Financial Rollup Report\nProject Workspace: ${activeProjectInstance.name}\n\n`;
    rawStr += `Metric Key,Value Row\n`;
    rawStr += `Original Contract Target,$${metrics.origBudget}\n`;
    rawStr += `Revised Cost Ceiling Ceiling,$${metrics.revisedBudget}\n`;
    rawStr += `Accrued Costs JTD,$${metrics.actualCost}\n`;
    rawStr += `Dynamic Forecast Variance,$${metrics.variance}\n`;
    rawStr += `Owner Received Funds Cashflow,$${metrics.moneyReceived}\n`;
    rawStr += `Net Operational Liquidity Pool,$${metrics.netLiquidity}\n`;
    
    const blob = new Blob([rawStr], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `ERP_Financial_Audit_${activeProjectInstance.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Shared UX Style Mapping Constants
  const ERP_TH = { padding: '12px 14px', textAlign: isRtl ? 'right' : 'left', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4b5563', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' };
  const ERP_TD = { padding: '12px 14px', verticalAlign: 'middle', fontSize: '13px', borderBottom: '1px solid #e5e7eb', color: '#1f2937', textAlign: isRtl ? 'right' : 'left' };
  const inputStyle = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', width: '100%', outline: 'none', background: '#fff', textAlign: isRtl ? 'right' : 'left' };
  const flexBtn = (bg, fg = '#fff') => ({ padding: '8px 14px', background: bg, color: fg, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' });

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, -apple-system, sans-serif', transition: 'direction 0.2s' }}>
      
      {/* GLOBAL ENTERPRISE NAV HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #f59e0b' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={24} style={{ color: '#f59e0b' }} /> {t.brand} 
            <span style={{ fontSize: '11px', background: '#334155', padding: '3px 8px', borderRadius: '4px', color: '#cbd5e1', fontWeight: '400' }}>{t.company}</span>
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '12px' }}>{t.subtitle}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Translation Toggle Option Controller */}
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} style={{ ...flexBtn('#334155'), border: '1px solid #475569' }}>
            <Globe size={16} style={{ color: '#f59e0b' }} />
            {lang === 'en' ? 'العربية (Arabic)' : 'English'}
          </button>
          
          <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>{t.crossSpent}</span>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b' }}>${globalRollup.spent.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* TWO-PANEL CORE SYSTEM WORKSPACE INTERFACE */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 72px)' }}>
        
        {/* LEFT NAV PANEL - PROJECT SELECTOR AND WORKSPACE DISCOVERY */}
        <div style={{ width: '300px', background: '#ffffff', borderRight: isRtl ? 'none' : '1px solid #e2e8f0', borderLeft: isRtl ? '1px solid #e2e8f0' : 'none', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t.activeCenters}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {/* Global Cross-Dashboard option toggle view */}
            <div onClick={() => setCurrentSiteId('global')} style={{ padding: '10px 12px', background: currentSiteId === 'global' ? '#f0fdf4' : 'transparent', border: `1px solid ${currentSiteId === 'global' ? '#bbf7d0' : 'transparent'}`, borderRadius: '6px', cursor: 'pointer' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#16a34a' }}>🌐 {t.allProjects}</div>
            </div>

            {sites.map(s => {
              const sMetrics = calcDetailedMetrics(s);
              const isActive = currentSiteId === s.id;
              return (
                <div key={s.id} onClick={() => setCurrentSiteId(s.id)} style={{ padding: '12px', background: isActive ? '#f8fafc' : 'transparent', border: `1px solid ${isActive ? '#cbd5e1' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', position: 'relative' }}>
                  {isActive && <div style={{ position: 'absolute', right: isRtl ? 0 : 'auto', left: isRtl ? 'auto' : 0, top: '20%', bottom: '20%', width: '4px', background: '#f59e0b', borderRadius: '4px' }} />}
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{s.location}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px' }}>
                    <span style={{ color: '#0284c7' }}>{t.ceiling}: ${(sMetrics.revisedBudget / 1000).toFixed(0)}k</span>
                    <span style={{ fontWeight: '600', color: parseFloat(sMetrics.pctUtilized) > 90 ? '#ef4444' : '#10b981' }}>{sMetrics.pctUtilized}% {t.spent}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ADD NEW PROJECT CENTER CONTROLS FORM PANEL */}
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>{t.initCenter}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input placeholder={t.projName} value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} style={{ ...inputStyle, padding: '4px 8px', fontSize: '12px' }} />
              <input placeholder={t.geoLoc} value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} style={{ ...inputStyle, padding: '4px 8px', fontSize: '12px' }} />
              <input placeholder={t.targetBudg} type="number" value={newSite.budget} onChange={e => setNewSite({...newSite, budget: e.target.value})} style={{ ...inputStyle, padding: '4px 8px', fontSize: '12px' }} />
              <input placeholder={t.contractRev} type="number" value={newSite.projectedRevenue} onChange={e => setNewSite({...newSite, projectedRevenue: e.target.value})} style={{ ...inputStyle, padding: '4px 8px', fontSize: '12px' }} />
              <button onClick={handleCreateSite} style={{ ...flexBtn('#0f172a'), width: '100%', justifyContent: 'center', fontSize: '11px', padding: '6px' }}>{t.spawnBtn}</button>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN EXECUTIVE WORKSPACE CONTAINER WINDOW */}
        {currentSiteId === 'global' ? (
          /* ==================== GLOBAL EXECUTIVE DASHBOARD OVERVIEW ==================== */
          <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🌐 {t.allProjects}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>{t.totalBudget}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>${globalRollup.budget.toLocaleString()}</div>
              </div>
              <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>{t.totalRevenue}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>${globalRollup.revenue.toLocaleString()}</div>
              </div>
              <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>{t.totalSpent}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>${globalRollup.spent.toLocaleString()}</div>
              </div>
              <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>{t.netCashFlow}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>${globalRollup.balance.toLocaleString()}</div>
              </div>
            </div>
            
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, minHeight: '300px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>Cross-Center Cost Allocations Ratio</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sites.map(s => ({ name: s.name, Budget: s.budget, Spent: calcDetailedMetrics(s).actualCost }))}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* ==================== INDIVIDUAL ACTIVE PROJECT COST WORKSPACE ==================== */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            
            {/* INTER-TAB SCREEN HEADER LAYOUT ELEMENT */}
            <div style={{ display: 'flex', background: '#ffffff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', padding: '0 16px' }}>
              {Object.entries(t.tabs).map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '14px 16px', border: 'none', background: 'none', borderBottom: activeTab === key ? '3px solid #f59e0b' : '3px solid transparent', color: activeTab === key ? '#0f172a' : '#64748b', fontWeight: activeTab === key ? '700' : '500', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* TAB CONTEXT DISPLAY PORT PANELS */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              
              {/* VIEW 1: EXECUTIVE ANALYTICS TAB WINDOW */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{activeProjectInstance.name}</h2>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>📍 {activeProjectInstance.location} · {activeProjectInstance.startDate}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={triggerCSVDownload} style={flexBtn('#0f172a')}><Download size={14} /> CSV Audit Export</button>
                      <button onClick={() => handleDeleteSite(activeProjectInstance.id)} style={flexBtn('#fee2e2', '#991b1b')}><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* HIGH METRIC DYNAMIC KPI GRID CARD MODULES */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{t.cards.revisedCeiling}</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>${metrics.revisedBudget.toLocaleString()}</div>
                    </div>
                    
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{t.cards.actualCost}</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#7c3aed', marginTop: '4px' }}>${metrics.actualCost.toLocaleString()}</div>
                    </div>
                    
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{t.cards.costVariance}</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: metrics.variance >= 0 ? '#16a34a' : '#dc2626', marginTop: '4px' }}>${metrics.variance.toLocaleString()}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{metrics.variance >= 0 ? t.alerts.underCeiling : t.alerts.costSlippage}</div>
                    </div>

                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{t.cards.ownerFunds}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>$</span>
                        <input type="number" value={activeProjectInstance.moneyReceivedFromOwner || ''} onChange={e => handleUpdateOwnerFunds(e.target.value)} style={{ ...inputStyle, border: 'none', borderBottom: '2px solid #cbd5e1', padding: '2px', fontSize: '18px', fontWeight: '800', color: '#16a34a', width: '130px' }} placeholder="0" />
                      </div>
                    </div>

                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{t.cards.netLiquidity}</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: metrics.netLiquidity >= 0 ? '#16a34a' : '#dc2626', marginTop: '4px' }}>${metrics.netLiquidity.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* VISUAL RECHARTS HISTOGRAM MATRIX PLOT */}
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '12px', fontSize: '13px', fontWeight: '700' }}>Cash Burn History Stream Tracking</div>
                    {monthlyPaymentData.length === 0 ? (
                      <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>{t.alerts.noRecords}</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyPaymentData}>
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="Disbursed" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 2: PAYMENTS JOURNAL & CASH BURNDOWN DISBURSEMENT */}
              {activeTab === 'payments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.date}</label>
                      <input type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.type}</label>
                      <select value={newPayment.type} onChange={e => setNewPayment({...newPayment, type: e.target.value, reference: ''})} style={inputStyle}>
                        <option value="Contractor">Contractor Drawdown</option>
                        <option value="Material">Material Procurement PO</option>
                        <option value="Other">Other Operational Cost</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.reference}</label>
                      <input placeholder="Entity Name" value={newPayment.reference} onChange={e => setNewPayment({...newPayment, reference: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.amount}</label>
                      <input type="number" placeholder="Value ($)" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.method}</label>
                      <select value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})} style={inputStyle}>
                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <button onClick={handleAddPayment} style={flexBtn('#0284c7')}><Plus size={14} /> Log Cash Entry</button>
                  </div>

                  <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={ERP_TH}>{t.fields.date}</th>
                          <th style={ERP_TH}>{t.fields.type}</th>
                          <th style={ERP_TH}>{t.fields.reference}</th>
                          <th style={ERP_TH}>{t.fields.amount}</th>
                          <th style={ERP_TH}>{t.fields.method}</th>
                          <th style={ERP_TH}>{t.fields.status}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!activeProjectInstance.payments || activeProjectInstance.payments.length === 0) ? (
                          <tr><td colSpan="6" style={{ ...ERP_TD, textAlign: 'center', color: '#94a3b8' }}>{t.alerts.noRecords}</td></tr>
                        ) : activeProjectInstance.payments.map(p => (
                          <tr key={p.id}>
                            <td style={ERP_TD}>{p.date}</td>
                            <td style={ERP_TD}><span style={{ padding: '2px 6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{p.type}</span></td>
                            <td style={ERP_TD}>{p.reference}</td>
                            <td style={ERP_TD}>${parseFloat(p.amount).toLocaleString()}</td>
                            <td style={ERP_TD}>{p.method}</td>
                            <td style={ERP_TD}><span style={{ padding: '2px 6px', background: '#d1fae5', color: '#065f46', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{p.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 3: WBS COST CODES CONFIGURATOR AND DIVISION LOGS */}
              {activeTab === 'wbs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'end' }}>
                    <div style={{ width: '120px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>CSI Code</label>
                      <input placeholder="e.g. 03-000" value={newCodeInput.code} onChange={e => setNewCodeInput({...newCodeInput, code: e.target.value})} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>Division Element Name</label>
                      <input placeholder="Element Description" value={newCodeInput.name} onChange={e => setNewCodeInput({...newCodeInput, name: e.target.value})} style={inputStyle} />
                    </div>
                    <button onClick={handleAddCostCode} style={flexBtn('#0f172a')}><Plus size={14} /> Append Code</button>
                  </div>

                  <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ padding: '14px', fontWeight: '700', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>CSI Cost Master Ledger Matrix</div>
                    {costCodes.map((cc, i) => (
                      <div key={i} style={{ display: 'flex', justifyContext: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0284c7', width: '80px' }}>{cc.code}</span>
                        <span style={{ color: '#334155' }}>{cc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW 4: COMMITMENTS & BOQ LEDGER SECTION WITH INLINE EDIT CAPABILITY */}
              {activeTab === 'commitments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>Contractor</label>
                      <input placeholder="Company Name" value={newContractor.name} onChange={e => setNewContractor({...newContractor, name: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.scope}</label>
                      <input placeholder="Structural, MEP, etc." value={newContractor.scope} onChange={e => setNewContractor({...newContractor, scope: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.qty}</label>
                      <input type="number" placeholder="Volume" value={newContractor.quantity} onChange={e => setNewContractor({...newContractor, quantity: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.unitPrice}</label>
                      <input type="number" placeholder="Rate ($)" value={newContractor.pricePerUnit} onChange={e => setNewContractor({...newContractor, pricePerUnit: e.target.value})} style={inputStyle} />
                    </div>
                    <button onClick={handleAddContractor} style={flexBtn('#0f172a')}><Plus size={14} /> Commit BOQ Scope</button>
                  </div>

                  <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={ERP_TH}>Contractor / Scope</th>
                          <th style={ERP_TH}>{t.fields.qty}</th>
                          <th style={ERP_TH}>{t.fields.unitPrice}</th>
                          <th style={ERP_TH}>{t.fields.boqTotal}</th>
                          <th style={ERP_TH}>{t.fields.paid}</th>
                          <th style={ERP_TH}>{t.fields.actions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!activeProjectInstance.contractors || activeProjectInstance.contractors.length === 0) ? (
                          <tr><td colSpan="6" style={{ ...ERP_TD, textAlign: 'center', color: '#94a3b8' }}>{t.alerts.noRecords}</td></tr>
                        ) : activeProjectInstance.contractors.map(c => (
                          <tr key={c.id}>
                            <td style={ERP_TD}>
                              <div style={{ fontWeight: '700' }}>{c.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{c.scope}</div>
                            </td>
                            <td style={ERP_TD}>
                              {editingContractorId === c.id ? (
                                <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} style={{ ...inputStyle, width: '80px' }} />
                              ) : c.quantity}
                            </td>
                            <td style={ERP_TD}>
                              {editingContractorId === c.id ? (
                                <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ ...inputStyle, width: '90px' }} />
                              ) : `$${parseFloat(c.pricePerUnit).toLocaleString()}`}
                            </td>
                            <td style={ERP_TD}>${parseFloat(c.boqTotal).toLocaleString()}</td>
                            <td style={ERP_TD}>${parseFloat(c.paid || 0).toLocaleString()}</td>
                            <td style={ERP_TD}>
                              {editingContractorId === c.id ? (
                                <button onClick={() => saveContractorBOQ(c.id)} style={flexBtn('#16a34a')}><Check size={12} /></button>
                              ) : (
                                <button onClick={() => startEditingContractor(c)} style={flexBtn('#cbd5e1', '#334155')}><Edit2 size={12} /> Edit</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 5: CHANGE MANAGEMENT CONTROL WORKSPACE */}
              {activeTab === 'changeorders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.title}</label>
                      <input placeholder="Scope Delta" value={newChangeOrder.title} onChange={e => setNewChangeOrder({...newChangeOrder, title: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>Source Origin</label>
                      <select value={newChangeOrder.type} onChange={e => setNewChangeOrder({...newChangeOrder, type: e.target.value})} style={inputStyle}>
                        <option value="Owner">Owner Change Order (OCO)</option>
                        <option value="Subcontractor">Subcontractor Request (SCO)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.amount}</label>
                      <input type="number" placeholder="Cost ($)" value={newChangeOrder.amount} onChange={e => setNewChangeOrder({...newChangeOrder, amount: e.target.value})} style={inputStyle} />
                    </div>
                    <button onClick={handleAddChangeOrder} style={flexBtn('#0f172a')}><Plus size={14} /> Inject Order</button>
                  </div>

                  <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={ERP_TH}>{t.fields.title}</th>
                          <th style={ERP_TH}>{t.fields.type}</th>
                          <th style={ERP_TH}>{t.fields.amount}</th>
                          <th style={ERP_TH}>{t.fields.status}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!activeProjectInstance.changeOrders || activeProjectInstance.changeOrders.length === 0) ? (
                          <tr><td colSpan="4" style={{ ...ERP_TD, textAlign: 'center', color: '#94a3b8' }}>{t.alerts.noRecords}</td></tr>
                        ) : activeProjectInstance.changeOrders.map(co => (
                          <tr key={co.id}>
                            <td style={ERP_TD}>{co.title}</td>
                            <td style={ERP_TD}>{co.type}</td>
                            <td style={ERP_TD}>${parseFloat(co.amount).toLocaleString()}</td>
                            <td style={ERP_TD}><span style={{ padding: '2px 6px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{co.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 6: PROGRESS INVOICING & SOV JOURNAL */}
              {activeTab === 'billings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>Partner Vendor</label>
                      <input placeholder="Company Name" value={newBilling.partner} onChange={e => setNewBilling({...newBilling, partner: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>Invoice Gross Value ($)</label>
                      <input type="number" placeholder="Amount" value={newBilling.amount} onChange={e => setNewBilling({...newBilling, amount: e.target.value})} style={inputStyle} />
                    </div>
                    <button onClick={handleAddBilling} style={flexBtn('#0f172a')}><Plus size={14} /> Record Claim</button>
                  </div>

                  <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={ERP_TH}>Partner Account</th>
                          <th style={ERP_TH}>Gross Claim Amount</th>
                          <th style={ERP_TH}>{t.fields.status}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!activeProjectInstance.billings || activeProjectInstance.billings.length === 0) ? (
                          <tr><td colSpan="3" style={{ ...ERP_TD, textAlign: 'center', color: '#94a3b8' }}>{t.alerts.noRecords}</td></tr>
                        ) : activeProjectInstance.billings.map(b => (
                          <tr key={b.id}>
                            <td style={ERP_TD}>{b.partner}</td>
                            <td style={ERP_TD}>${parseFloat(b.amount).toLocaleString()}</td>
                            <td style={ERP_TD}><span style={{ padding: '2px 6px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{b.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 7: INVENTORY LOGS & MATERIAL RESOURCE TRACKING */}
              {activeTab === 'materials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>Material Description</label>
                      <input placeholder="e.g. Geopolymer Mortar Mix" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.qty}</label>
                      <input type="number" placeholder="Volume" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial, quantity: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>{t.fields.unitPrice}</label>
                      <input type="number" placeholder="Rate ($)" value={newMaterial.unitCost} onChange={e => setNewMaterial({...newMaterial, unitCost: e.target.value})} style={inputStyle} />
                    </div>
                    <button onClick={handleAddMaterial} style={flexBtn('#7c3aed')}><Plus size={14} /> Log Manifest</button>
                  </div>

                  <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={ERP_TH}>Resource Resource</th>
                          <th style={ERP_TH}>Volume Logged</th>
                          <th style={ERP_TH}>Unit Matrix Rate</th>
                          <th style={ERP_TH}>Extended Cost Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!activeProjectInstance.materials || activeProjectInstance.materials.length === 0) ? (
                          <tr><td colSpan="4" style={{ ...ERP_TD, textAlign: 'center', color: '#94a3b8' }}>{t.alerts.noRecords}</td></tr>
                        ) : activeProjectInstance.materials.map(m => (
                          <tr key={m.id}>
                            <td style={ERP_TD}>{m.name}</td>
                            <td style={ERP_TD}>{m.quantity} {m.unit || 'units'}</td>
                            <td style={ERP_TD}>${parseFloat(m.unitCost).toLocaleString()}</td>
                            <td style={ERP_TD}>${(parseFloat(m.quantity) * parseFloat(m.unitCost)).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 8: CORE QUANT AI ADVISOR COMPLIANT CHAT LOG CONSOLE */}
              {activeTab === 'ai' && (
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '420px' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '700', fontSize: '13px' }}>
                    Sage-300 Smart Analysis Engine Context Active
                  </div>
                  
                  <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {messages.map((msg, index) => (
                      <div key={index} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                        <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: msg.role === 'user' ? '#f59e0b' : '#f1f5f9', color: msg.role === 'user' ? '#fff' : '#1e293b' }}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {aiLoading && <div style={{ fontSize: '12px', color: '#64748b' }}>🤔 Analyzing WBS variance bounds and data parameters...</div>}
                    <div ref={messagesEndRef} />
                  </div>

                  <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
                    <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAIEngineExecution()} placeholder="Ask: How much retention am I holding? What is my net project liquidity cushion?" style={inputStyle} disabled={aiLoading} />
                    <button onClick={handleAIEngineExecution} disabled={aiLoading || !input.trim()} style={flexBtn(aiLoading || !input.trim() ? '#94a3b8' : '#0f172a')}>
                      <Send size={14} /> Execute
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ConstructionFinanceApp;