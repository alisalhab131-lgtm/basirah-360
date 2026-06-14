import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Download, Trash2, Plus, Send, FileText, DollarSign, Home, Users, 
  Package, Map, MessageCircle, Tag, X, Edit2, Check, TrendingUp, 
  AlertTriangle, Layers, Briefcase, Clock, ArrowUpRight, ArrowDownLeft, Shield, Search, ChevronDown, ChevronUp, Eye, Globe
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ==================== TRANSLATION DICTIONARY ====================
const DICTIONARY = {
  en: {
    title: "Digiations 360 Core ERP",
    subtitle: "Contractor Packages · Direct Material Logs · Dynamic Sub-Ledger Drill Downs",
    totalSpent: "Consolidated Project Cash Outflows",
    operationalCenters: "Project Operational Centers",
    budget: "Budget",
    spent: "Spent",
    spawnProject: "Spawn Project Site",
    siteNamePlh: "Site Designation Name",
    locationPlh: "Location Vector",
    budgetPlh: "Total Allocated Budget ($)",
    initCenter: "Initialize Center",
    tabOverview: "📊 Executive Dashboard",
    tabCommitments: "👷 Contractor BOQ Table",
    tabMaterials: "📦 Material Log Manifest",
    tabPayments: "💳 Cash Ledger",
    tabChanges: "🔄 Change Control",
    tabWbs: "🗂️ CSI Cost Codes",
    tabAi: "🤖 Core AI Quant Advisor",
    totalBoq: "Contractors Total BOQ",
    disbursedPaid: "Contractors Disbursed Paid",
    outstandingBal: "Outstanding Contract Balance",
    totalMaterialCost: "Total Site Material Cost",
    drilldownPrompt: "Press card to view tables and visual charts below",
    chartTitle1: "Contractor Performance & Clearance Allocation",
    chartTitle2: "Material Outlay Footprint by Contractor Package",
    action: "Actions",
    edit: "Edit",
    save: "Save",
    delete: "Delete",
    noData: "No data available recorded in this workspace section.",
    contractorName: "Contractor Name",
    scope: "Scope Work",
    costCode: "Cost Code",
    unit: "Unit",
    unitPrice: "Unit Price",
    qty: "Quantity",
    boqTotal: "BOQ Total",
    paid: "Paid Out",
    retention: "Retention %",
    status: "Status"
  },
  ar: {
    title: "رقمنة الرقمية 360 ERP",
    subtitle: "حزم المقاولين · سجلات المواد المباشرة · التحليلات التفصيلية لدفاتر الأستاذ المساعدة",
    totalSpent: "إجمالي التدفقات النقدية الخارجة للمشاريع الموحدة",
    operationalCenters: "مراكز العمليات التشغيلية للمشاريع",
    budget: "الميزانية",
    spent: "المنصرف",
    spawnProject: "إنشاء موقع مشروع جديد",
    siteNamePlh: "اسم موقع المشروع",
    locationPlh: "موقع المشروع الجغرافي",
    budgetPlh: "إجمالي الميزانية المرصودة ($)",
    initCenter: "تفعيل المركز التشغيلي",
    tabOverview: "📊 لوحة التحكم التنفيذية",
    tabCommitments: "👷 جدول جدول كميات المقاولين BOQ",
    tabMaterials: "📦 بيان سجلات المواد الموردة",
    tabPayments: "💳 دفتر الأستاذ النقدي المصرفي",
    tabChanges: "🔄 إدارة أوامر التغيير",
    tabWbs: "🗂️ رموز تكلفة CSI الهندسية",
    tabAi: "🤖 مستشار الذكاء الاصطناعي الكمي الكمي",
    totalBoq: "إجمالي جداول كميات المقاولين",
    disbursedPaid: "المبالغ المصروفة للمقاولين",
    outstandingBal: "رصيد العقود المتبقي المستحق",
    totalMaterialCost: "إجمالي تكاليف مواد الموقع",
    drilldownPrompt: "اضغط على البطاقة لعرض الجداول الرسومية التفصيلية أدناه",
    chartTitle1: "أداء المقاولين وتخصيص المخالصات المالية المعتمدة",
    chartTitle2: "حجم الإنفاق المالي على المواد لكل حزمة مقاول",
    action: "الإجراءات",
    edit: "تعديل",
    save: "حفظ",
    delete: "حذف",
    noData: "لا توجد بيانات مسجلة حالياً في هذا القسم التشغيلي.",
    contractorName: "اسم المقاول",
    scope: "نطاق العمل",
    costCode: "رمز التكلفة",
    unit: "الوحدة",
    unitPrice: "سعر الوحدة",
    qty: "الكمية",
    boqTotal: "إجمالي جدول الكميات",
    paid: "المصروف",
    retention: "نسبة الاستقطاع %",
    status: "الحالة"
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

const PRESET_CONTRACTORS = [
  'Al Bayan Contracting', 'Gulf Build Co.', 'Al Masa Engineering', 
  'Horizon Contractors', 'Delta Civil Works', 'Apex Construction', 'Nile Infrastructure'
];

const PRESET_SUPPLIERS = ['BuildCo Supply', 'Steel Ltd', 'Gulf Materials', 'AlSafwa Trading', 'Delta Supplies'];
const PAYMENT_METHODS = ['Bank Transfer', 'Cheque', 'Cash', 'Letter of Credit'];

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
      { id: 'm1', name: 'Ultra-High Performance Concrete', category: '03-000 Concrete & Masonry', quantity: 250, unit: 'm³', unitCost: 150, contractorName: 'Al Bayan Contracting', supplier: 'BuildCo Supply', deliveryDate: '2024-02-01', condition: 'Good', notes: 'Ready-mix batch' },
      { id: 'm2', name: 'Structural Grade Steel Rebar', category: '05-000 Steel & Structural Metal', quantity: 50, unit: 'ton', unitCost: 800, contractorName: 'Al Bayan Contracting', supplier: 'Steel Ltd', deliveryDate: '2024-02-05', condition: 'Good', notes: 'Grade 60 TMT' },
      { id: 'm3', name: 'Ultra-High Performance Concrete', category: '03-000 Concrete & Masonry', quantity: 120, unit: 'm³', unitCost: 155, contractorName: 'Gulf Build Co.', supplier: 'BuildCo Supply', deliveryDate: '2024-03-12', condition: 'Good', notes: 'Superstructure segment' }
    ],
    contractors: [
      { id: 'c1', name: 'Al Bayan Contracting', scope: 'Foundation Work', costCode: '03-000 Concrete & Masonry', unit: 'm²', pricePerUnit: 400, quantity: 300, boqTotal: 120000, paid: 75000, retention: 10, startDate: '2024-01-20', endDate: '2024-04-20', status: 'In Progress', contact: '+966 50 000 0001', notes: 'Phase 1 substructure complete' },
      { id: 'c2', name: 'Gulf Build Co.', scope: 'Structural Works', costCode: '05-000 Steel & Structural Metal', unit: 'Lump Sum', pricePerUnit: 180000, quantity: 1, boqTotal: 180000, paid: 90000, retention: 10, startDate: '2024-02-15', endDate: '2024-08-30', status: 'In Progress', contact: '+966 50 000 0003', notes: 'Core framing' },
      { id: 'c3', name: 'Al Masa Engineering', scope: 'MEP Works', costCode: '22-000 Plumbing & Drainage', unit: 'Lump Sum', pricePerUnit: 45000, quantity: 1, boqTotal: 45000, paid: 15000, retention: 5, startDate: '2024-03-01', endDate: '2024-08-15', status: 'In Progress', contact: '+966 50 000 0002', notes: 'Rough-ins ongoing' }
    ],
    changeOrders: [
      { id: 'co1', title: 'Subgrade Rock Excavation Overrun', type: 'Owner', costCode: '02-000 Earthworks & Site Clearance', amount: 35000, status: 'Approved', date: '2024-02-10', description: 'Encountered unexpected bedrock tier' }
    ],
    payments: [
      { id: 'p1', date: '2024-02-15', type: 'Contractor', reference: 'Al Bayan Contracting', amount: 45000, method: 'Bank Transfer', status: 'Paid', notes: 'Phase 1 milestone' }
    ]
  }
];

const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e'];

const ConstructionFinanceApp = () => {
  // ==================== LOCAL STATE MANAGEMENT ====================
  const [lang, setLang] = useState('en');
  const [costCodes, setCostCodes] = useState(() => {
    const saved = localStorage.getItem('cfCostCodes');
    return saved ? JSON.parse(saved) : DEFAULT_COST_CODES;
  });

  const [sites, setSites] = useState(() => {
    const saved = localStorage.getItem('constructionSitesERP_V4');
    return saved ? JSON.parse(saved) : INITIAL_SITES;
  });

  const [currentSiteId, setCurrentSiteId] = useState(sites[0]?.id || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMaterialDrilldown, setSelectedMaterialDrilldown] = useState(null);

  // Inline BOQ Row Edit Tracking States
  const [editingContractorId, setEditingContractorId] = useState(null);
  const [editContractorForm, setEditContractorForm] = useState({});

  // AI Assistant Interaction
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Digiations 360 Principal Intelligence Hub initialized. Track contractor packages, dynamic item logs, and aggregate cost codes instantly.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const drillDownSectionRef = useRef(null);

  // Initialization Forms Structure
  const [newSite, setNewSite] = useState({ name: '', location: '', budget: '', projectedRevenue: '', startDate: '' });
  const [newMaterial, setNewMaterial] = useState({ name: '', category: '', quantity: '', unit: '', unitCost: '', contractorName: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' });
  const [newContractor, setNewContractor] = useState({ name: '', scope: '', costCode: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '10', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' });
  const [newChangeOrder, setNewChangeOrder] = useState({ title: '', type: 'Owner', contractId: '', costCode: '', amount: '', status: 'Pending', date: '', description: '' });
  const [newPayment, setNewPayment] = useState({ date: '', type: 'Contractor', reference: '', amount: '', method: 'Bank Transfer', status: 'Pending', notes: '' });
  const [newCodeInput, setNewCodeInput] = useState({ code: '', name: '' });

  const [contractorNameMode, setContractorNameMode] = useState('preset');
  const [customContractorName, setCustomContractorName] = useState('');

  // ==================== STORAGE SYNC HOOKS ====================
  useEffect(() => { localStorage.setItem('constructionSitesERP_V4', JSON.stringify(sites)); }, [sites]);
  useEffect(() => { localStorage.setItem('cfCostCodes', JSON.stringify(costCodes)); }, [costCodes]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const activeProjectInstance = useMemo(() => {
    return sites.find(s => s.id === currentSiteId) || sites[0] || null;
  }, [sites, currentSiteId]);

  // Translate lookup shortcut helper
  const t = (key) => DICTIONARY[lang][key] || key;

  // ==================== DYNAMIC ANALYTICS CALCULATIONS ====================
  const metrics = useMemo(() => {
    if (!activeProjectInstance) return {
      totalContractorBOQ: 0, totalContractorPaid: 0, totalContractorRemaining: 0, totalMaterialCost: 0, materialShareByContractor: [], materialDrilldownSummary: {}, chartDataByMaterial: []
    };

    const contractors = activeProjectInstance.contractors || [];
    const materials = activeProjectInstance.materials || [];

    const totalContractorBOQ = contractors.reduce((sum, c) => sum + parseFloat(c.boqTotal || 0), 0);
    const totalContractorPaid = contractors.reduce((sum, c) => sum + parseFloat(c.paid || 0), 0);
    const totalContractorRemaining = Math.max(0, totalContractorBOQ - totalContractorPaid);

    const totalMaterialCost = materials.reduce((sum, m) => sum + (parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0)), 0);

    const contractorMatMap = {};
    contractors.forEach(c => { contractorMatMap[c.name] = 0; });
    materials.forEach(m => {
      const cost = parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0);
      const cName = m.contractorName || 'General Inventory';
      contractorMatMap[cName] = (contractorMatMap[cName] || 0) + cost;
    });
    
    const materialShareByContractor = Object.keys(contractorMatMap).map(name => ({
      name, value: contractorMatMap[name]
    })).filter(item => item.value > 0);

    const materialDrilldownSummary = {};
    materials.forEach(m => {
      if (!materialDrilldownSummary[m.name]) {
        materialDrilldownSummary[m.name] = { name: m.name, unit: m.unit, totalQty: 0, totalCost: 0, logs: [] };
      }
      const cost = parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0);
      materialDrilldownSummary[m.name].totalQty += parseFloat(m.quantity || 0);
      materialDrilldownSummary[m.name].totalCost += cost;
      materialDrilldownSummary[m.name].logs.push(m);
    });

    const chartDataByMaterial = Object.values(materialDrilldownSummary).map(m => ({
      name: m.name, totalCost: m.totalCost, totalQty: m.totalQty
    }));

    return {
      totalContractorBOQ, totalContractorPaid, totalContractorRemaining, totalMaterialCost, materialShareByContractor, materialDrilldownSummary, chartDataByMaterial
    };
  }, [activeProjectInstance]);

  const globalRollup = useMemo(() => {
    let budget = 0, spentMat = 0, spentCon = 0;
    sites.forEach(s => {
      budget += s.budget || 0;
      spentMat += (s.materials || []).reduce((sum, m) => sum + (parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0)), 0);
      spentCon += (s.contractors || []).reduce((sum, c) => sum + parseFloat(c.paid || 0), 0);
    });
    return { budget, totalSpent: spentMat + spentCon };
  }, [sites]);

  const triggerMaterialDrilldown = (materialName) => {
    setSelectedMaterialDrilldown(materialName);
    setTimeout(() => { drillDownSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  };

  // ==================== COMMITTED MUTATIONS & ACTIONS ====================
  const addSite = () => {
    if (!newSite.name || !newSite.budget) return;
    const s = {
      id: Date.now(),
      name: newSite.name,
      location: newSite.location || 'Unassigned Site',
      status: 'In Progress',
      startDate: newSite.startDate || new Date().toISOString().split('T')[0],
      budget: parseFloat(newSite.budget),
      projectedRevenue: parseFloat(newSite.projectedRevenue) || parseFloat(newSite.budget) * 1.15,
      materials: [], contractors: [], changeOrders: [], payments: []
    };
    const updated = [...sites, s];
    setSites(updated);
    setCurrentSiteId(s.id);
    setNewSite({ name: '', location: '', budget: '', projectedRevenue: '', startDate: '' });
  };

  const deleteSite = (siteId, e) => {
    e.stopPropagation(); // Avoid triggering switch layout selection click
    if (sites.length <= 1) {
      alert("System Rule Exception: Integrity matrix requires a minimum of 1 active operational project tracking dashboard.");
      return;
    }
    const filtered = sites.filter(s => s.id !== siteId);
    setSites(filtered);
    if (currentSiteId === siteId) {
      setCurrentSiteId(filtered[0].id);
    }
  };

  const startInlineEditContractor = (contractor) => {
    setEditingContractorId(contractor.id);
    setEditContractorForm({ ...contractor });
  };

  const saveInlineEditContractor = () => {
    const qty = parseFloat(editContractorForm.quantity) || 0;
    const ppu = parseFloat(editContractorForm.pricePerUnit) || 0;
    
    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      return {
        ...s,
        contractors: s.contractors.map(c => {
          if (c.id !== editingContractorId) return c;
          return {
            ...editContractorForm,
            quantity: qty,
            pricePerUnit: ppu,
            boqTotal: qty * ppu,
            paid: parseFloat(editContractorForm.paid) || 0,
            retention: parseFloat(editContractorForm.retention) || 0
          };
        })
      };
    }));
    setEditingContractorId(null);
  };

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.quantity || !newMaterial.unitCost) return;
    const log = {
      id: `mat-${Date.now()}`,
      name: newMaterial.name,
      category: newMaterial.category || '03-000 Concrete & Masonry',
      quantity: parseFloat(newMaterial.quantity),
      unit: newMaterial.unit || 'pcs',
      unitCost: parseFloat(newMaterial.unitCost),
      contractorName: newMaterial.contractorName || 'General Inventory',
      supplier: newMaterial.supplier || 'General Supply',
      deliveryDate: newMaterial.deliveryDate || new Date().toISOString().split('T')[0],
      condition: newMaterial.condition,
      notes: newMaterial.notes
    };
    setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, materials: [...s.materials, log] }));
    setSelectedMaterialDrilldown(newMaterial.name);
    setNewMaterial({ name: '', category: '', quantity: '', unit: '', unitCost: '', contractorName: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' });
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
        name: finalName,
        scope: newContractor.scope,
        costCode: newContractor.costCode || '01-000 General Requirements',
        unit: newContractor.unit || 'Lump Sum',
        pricePerUnit: ppu,
        quantity: qty,
        boqTotal: qty * ppu,
        paid: parseFloat(newContractor.paid) || 0,
        retention: parseFloat(newContractor.retention || 0),
        startDate: newContractor.startDate || new Date().toISOString().split('T')[0],
        endDate: newContractor.endDate || '',
        status: newContractor.status,
        contact: newContractor.contact,
        notes: newContractor.notes
      }]
    }));
    setNewContractor({ name: '', scope: '', costCode: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '10', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' });
    setCustomContractorName('');
    setContractorNameMode('preset');
  };

  const addChangeOrder = () => {
    if (!newChangeOrder.title || !newChangeOrder.amount) return;
    setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, changeOrders: [...(s.changeOrders || []), { id: `co-${Date.now()}`, ...newChangeOrder, amount: parseFloat(newChangeOrder.amount) }] }));
    setNewChangeOrder({ title: '', type: 'Owner', contractId: '', costCode: '', amount: '', status: 'Pending', date: '', description: '' });
  };

  const addPayment = () => {
    if (!newPayment.reference || !newPayment.amount || !newPayment.date) return;
    const payment = { id: `pay-${Date.now()}`, ...newPayment, amount: parseFloat(newPayment.amount) };
    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      let contractors = s.contractors;
      if (payment.type === 'Contractor' && payment.status === 'Paid') {
        contractors = contractors.map(c => c.name === payment.reference ? { ...c, paid: Math.min(parseFloat(c.boqTotal || 0), parseFloat(c.paid || 0) + payment.amount) } : c);
      }
      return { ...s, payments: [...(s.payments || []), payment], contractors };
    }));
    setNewPayment({ date: '', type: 'Contractor', reference: '', amount: '', method: 'Bank Transfer', status: 'Pending', notes: '' });
  };

  const appendCostCode = () => {
    if (!newCodeInput.code || !newCodeInput.name) return;
    setCostCodes([...costCodes, { code: newCodeInput.code, name: newCodeInput.name }]);
    setNewCodeInput({ code: '', name: '' });
  };

  const deleteMaterial = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, materials: s.materials.filter(m => m.id !== id) }));
  const deleteContractor = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, contractors: s.contractors.filter(c => c.id !== id) }));
  const deletePayment = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, payments: (s.payments || []).filter(p => p.id !== id) }));

  // ==================== AI BOT INTERACTION SIMULATION ====================
  const handleSendAIRequest = () => {
    if (!input.trim()) return;
    const userPrompt = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    setLoading(true);

    setTimeout(() => {
      let reply = `${t('title')} AI Layer: `;
      const cleanPrompt = userPrompt.toLowerCase();
      if (cleanPrompt.includes('material') || cleanPrompt.includes('cost')) {
        reply += `The tracked site material structural investment is currently $${metrics.totalMaterialCost.toLocaleString()}. `;
        const top = Object.values(metrics.materialDrilldownSummary).sort((a,b)=>b.totalCost-a.totalCost)[0];
        if (top) reply += `Max outlier density verified under "${top.name}" package allocation totalizing $${top.totalCost.toLocaleString()}.`;
      } else if (cleanPrompt.includes('contractor') || cleanPrompt.includes('paid') || cleanPrompt.includes('boq')) {
        reply += `Total commercial obligations stand at $${metrics.totalContractorBOQ.toLocaleString()} with $${metrics.totalContractorPaid.toLocaleString()} paid out. Outstanding commitment balance is $${metrics.totalContractorRemaining.toLocaleString()}.`;
      } else {
        reply += "Continuous telemetry active. Request specific structural calculations, subgrade contingency limits, or variance evaluations.";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setLoading(false);
    }, 600);
  };

  const executeCSVDownload = () => {
    if (!activeProjectInstance) return;
    let raw = `DIGIATIONS 360 ERP COMMERCIAL MATRIX - ${activeProjectInstance.name.toUpperCase()}\n`;
    raw += `METRIC,VALUE\nContractors Total Package BOQ,$${metrics.totalContractorBOQ}\nContractors Paid,$${metrics.totalContractorPaid}\nTotal Site Material Cost,$${metrics.totalMaterialCost}\n\n`;
    raw += `MATERIAL LOGS\nItem,Category,Contractor,Quantity,Unit Cost,Total\n`;
    (activeProjectInstance.materials || []).forEach(m => {
      raw += `"${m.name}","${m.category}","${m.contractorName}",${m.quantity},${m.unitCost},${m.quantity * m.unitCost}\n`;
    });
    const blob = new Blob([raw], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Project_Telemetry_${activeProjectInstance.name.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  // Styles definitions
  const ERP_TH = { padding: '14px 16px', textAlign: lang === 'ar' ? 'right' : 'left', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4b5563', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' };
  const ERP_TD = { padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', borderBottom: '1px solid #e5e7eb', color: '#1f2937' };
  const inputStyle = { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', width: '100%', outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const flexBtn = (bgColor, textColor = '#fff') => ({ padding: '10px 16px', background: bgColor, color: textColor, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' });

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
      
      {/* GLOBAL ERP APPLICATION TOP HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #f59e0b', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={28} style={{ color: '#f59e0b' }} /> {t('title')} 
            <span style={{ fontSize: '12px', background: '#334155', padding: '4px 8px', borderRadius: '4px', color: '#cbd5e1' }}>رقمنة الرقمية</span>
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '13px' }}>{t('subtitle')}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* LANGAUGE TRANSLATION INTERACTIVE CONTROLLER */}
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} style={{ ...flexBtn('#334155', '#fff'), border: '1px solid #475569' }}>
            <Globe size={16} style={{ color: '#f59e0b' }} />
            <span>{lang === 'en' ? 'العربية (Arabic)' : 'English'}</span>
          </button>
          
          <div style={{ textAlign: lang === 'ar' ? 'left' : 'right' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>{t('totalSpent')}</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>${globalRollup.totalSpent.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 88px)', flexWrap: 'wrap' }}>
        
        {/* OPERATIONAL SITES CONTROL SIDEBAR MODULE */}
        <div style={{ width: '310px', background: '#ffffff', borderRight: lang === 'en' ? '1px solid #e2e8f0' : 'none', borderLeft: lang === 'ar' ? '1px solid #e2e8f0' : 'none', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('operationalCenters')}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {sites.map(s => {
              const isActive = currentSiteId === s.id;
              const sMatCost = (s.materials || []).reduce((sum, m) => sum + (m.quantity * m.unitCost), 0);
              const sConCost = (s.contractors || []).reduce((sum, c) => sum + c.paid, 0);
              return (
                <div key={s.id} onClick={() => setCurrentSiteId(s.id)} style={{ padding: '14px', background: isActive ? '#f8fafc' : 'transparent', border: `1px solid ${isActive ? '#cbd5e1' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{s.name}</div>
                    
                    {/* INTRANET MODULE DELETION ACTION ROUTE */}
                    <button 
                      onClick={(e) => deleteSite(s.id, e)} 
                      title="Purge project center configuration"
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.location}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', fontWeight: '600' }}>
                    <span style={{ color: '#0284c7' }}>{t('budget')}: ${(s.budget / 1000).toFixed(0)}k</span>
                    <span style={{ color: '#10b981' }}>{t('spent')}: ${((sMatCost + sConCost) / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '10px' }}>+ {t('spawnProject')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input placeholder={t('siteNamePlh')} value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }} />
              <input placeholder={t('locationPlh')} value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }} />
              <input placeholder={t('budgetPlh')} type="number" value={newSite.budget} onChange={e => setNewSite({...newSite, budget: e.target.value})} style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }} />
              <button onClick={addSite} style={{ ...flexBtn('#0f172a'), width: '100%', justifyContent: 'center', padding: '8px', fontSize: '12px' }}>{t('initCenter')}</button>
            </div>
          </div>
        </div>

        {/* WORKSPACE CONTENT ROUTER LAYOUT CONTAINER */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          
          {/* TABS NAVIGATION ANCHORS */}
          <div style={{ display: 'flex', background: '#ffffff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', padding: '0 16px' }}>
            {[
              { id: 'overview', label: t('tabOverview') },
              { id: 'commitments', label: t('tabCommitments') },
              { id: 'materials', label: t('tabMaterials') },
              { id: 'payments', label: t('tabPayments') },
              { id: 'changeorders', label: t('tabChanges') },
              { id: 'wbs', label: t('tabWbs') },
              { id: 'ai', label: t('tabAi') },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '16px 20px', border: 'none', background: 'transparent', borderBottom: activeTab === tab.id ? '3px solid #f59e0b' : '3px solid transparent', color: activeTab === tab.id ? '#0f172a' : '#64748b', fontWeight: activeTab === tab.id ? '700' : '500', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
            
            {/* VIEW 1: EXECUTIVE DASHBOARD */}
            {activeTab === 'overview' && activeProjectInstance && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* KPI METRIC CARDS TRACK TRACKER ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{t('totalBoq')}</span>
                      <Users size={18} style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>${metrics.totalContractorBOQ.toLocaleString()}</div>
                  </div>

                  <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{t('disbursedPaid')}</span>
                      <DollarSign size={18} style={{ color: '#10b981' }} />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '12px' }}>${metrics.totalContractorPaid.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>{t('outstandingBal')}: ${metrics.totalContractorRemaining.toLocaleString()}</div>
                  </div>

                  <div onClick={() => triggerMaterialDrilldown(Object.keys(metrics.materialDrilldownSummary)[0])} style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '2px solid #7c3aed', boxShadow: '0 4px 6px rgba(124, 58, 237, 0.08)', cursor: 'pointer', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase' }}>{t('totalMaterialCost')}</span>
                      <Package size={18} style={{ color: '#7c3aed' }} />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#7c3aed', marginTop: '12px' }}>${metrics.totalMaterialCost.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                      <Eye size={12} /> {t('drilldownPrompt')}
                    </div>
                  </div>
                </div>

                {/* GRAPHIC CHARTS PLOTTING SEGMENT GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                  <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{t('chartTitle1')}</h3>
                    <div style={{ height: '260px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeProjectInstance.contractors || []}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="boqTotal" name="Total BOQ Val" fill="#1e293b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="paid" name="Cleared Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{t('chartTitle2')}</h3>
                    <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {metrics.chartDataByMaterial.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.chartDataByMaterial}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                            <Bar dataKey="totalCost" name="Cost Matrix" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#94a3b8' }}>{t('noData')}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* DYNAMIC INDEXED DRILL DOWN SUMMARY SECTION */}
                <div ref={drillDownSectionRef} style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>📊 Direct Material Distribution Ledgers</h3>
                    <button onClick={executeCSVDownload} style={flexBtn('#0f172a')}><Download size={14} /> Export Telemetry</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderRight: lang === 'en' ? '1px solid #f1f5f9' : 'none', borderLeft: lang === 'ar' ? '1px solid #f1f5f9' : 'none', paddingRight: '10px' }}>
                      {Object.keys(metrics.materialDrilldownSummary).map(k => (
                        <button key={k} onClick={() => setSelectedMaterialDrilldown(k)} style={{ padding: '10px 12px', border: 'none', background: selectedMaterialDrilldown === k ? '#f1f5f9' : 'transparent', borderRadius: '6px', textRendering: 'optimizeLegibility', textAlign: lang==='ar'?'right':'left', cursor: 'pointer', fontSize: '13px', color: '#1e293b', fontWeight: selectedMaterialDrilldown === k ? '700' : '500' }}>
                          {k} (${metrics.materialDrilldownSummary[k].totalCost.toLocaleString()})
                        </button>
                      ))}
                    </div>

                    <div>
                      {selectedMaterialDrilldown && metrics.materialDrilldownSummary[selectedMaterialDrilldown] ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={ERP_TH}>Category</th>
                                <th style={ERP_TH}>Assigned Contractor</th>
                                <th style={ERP_TH}>Supplier</th>
                                <th style={ERP_TH}>Quantity</th>
                                <th style={ERP_TH}>Unit Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {metrics.materialDrilldownSummary[selectedMaterialDrilldown].logs.map((log, i) => (
                                <tr key={log.id || i}>
                                  <td style={ERP_TD}>{log.category}</td>
                                  <td style={ERP_TD}>{log.contractorName}</td>
                                  <td style={ERP_TD}>{log.supplier}</td>
                                  <td style={ERP_TD}>{log.quantity} {log.unit}</td>
                                  <td style={ERP_TD}>${log.unitCost}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : <div style={{ fontSize: '13px', color: '#94a3b8', padding: '20px' }}>{t('noData')}</div>}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 2: CONTRACTOR BOQ TABLE INTERACTIVE FIELD MANAGER */}
            {activeTab === 'commitments' && activeProjectInstance && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>🏗️ Master Contractor Bill of Quantities Ledger</h3>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={ERP_TH}>{t('contractorName')}</th>
                          <th style={ERP_TH}>{t('scope')}</th>
                          <th style={ERP_TH}>{t('costCode')}</th>
                          <th style={ERP_TH}>{t('unit')}</th>
                          <th style={ERP_TH}>{t('unitPrice')}</th>
                          <th style={ERP_TH}>{t('qty')}</th>
                          <th style={ERP_TH}>{t('boqTotal')}</th>
                          <th style={ERP_TH}>{t('paid')}</th>
                          <th style={ERP_TH}>{t('retention')}</th>
                          <th style={ERP_TH}>{t('status')}</th>
                          <th style={ERP_TH}>{t('action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeProjectInstance.contractors || []).map(c => {
                          const isEditing = editingContractorId === c.id;
                          return (
                            <tr key={c.id}>
                              {isEditing ? (
                                <>
                                  <td style={ERP_TD}><input style={inputStyle} value={editContractorForm.name} onChange={e => setEditContractorForm({...editContractorForm, name: e.target.value})} /></td>
                                  <td style={ERP_TD}><input style={inputStyle} value={editContractorForm.scope} onChange={e => setEditContractorForm({...editContractorForm, scope: e.target.value})} /></td>
                                  <td style={ERP_TD}>
                                    <select style={inputStyle} value={editContractorForm.costCode} onChange={e => setEditContractorForm({...editContractorForm, costCode: e.target.value})}>
                                      {costCodes.map(cc => <option key={cc.code} value={`${cc.code} ${cc.name}`}>{cc.code} - {cc.name}</option>)}
                                    </select>
                                  </td>
                                  <td style={ERP_TD}><input style={inputStyle} value={editContractorForm.unit} onChange={e => setEditContractorForm({...editContractorForm, unit: e.target.value})} /></td>
                                  <td style={ERP_TD}><input style={inputStyle} type="number" value={editContractorForm.pricePerUnit} onChange={e => setEditContractorForm({...editContractorForm, pricePerUnit: e.target.value})} /></td>
                                  <td style={ERP_TD}><input style={inputStyle} type="number" value={editContractorForm.quantity} onChange={e => setEditContractorForm({...editContractorForm, quantity: e.target.value})} /></td>
                                  <td style={ERP_TD}><span style={{ fontWeight: '700' }}>${((parseFloat(editContractorForm.quantity)||0) * (parseFloat(editContractorForm.pricePerUnit)||0)).toLocaleString()}</span></td>
                                  <td style={ERP_TD}><input style={inputStyle} type="number" value={editContractorForm.paid} onChange={e => setEditContractorForm({...editContractorForm, paid: e.target.value})} /></td>
                                  <td style={ERP_TD}><input style={inputStyle} type="number" value={editContractorForm.retention} onChange={e => setEditContractorForm({...editContractorForm, retention: e.target.value})} /></td>
                                  <td style={ERP_TD}>
                                    <select style={inputStyle} value={editContractorForm.status} onChange={e => setEditContractorForm({...editContractorForm, status: e.target.value})}>
                                      <option value="Pending">Pending</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Completed">Completed</option>
                                    </select>
                                  </td>
                                  <td style={ERP_TD}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button onClick={saveInlineEditContractor} style={{ ...flexBtn('#10b981'), padding: '6px 10px' }}><Check size={14} /></button>
                                      <button onClick={() => setEditingContractorId(null)} style={{ ...flexBtn('#64748b'), padding: '6px 10px' }}><X size={14} /></button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td style={{ ...ERP_TD, fontWeight: '700' }}>{c.name}</td>
                                  <td style={ERP_TD}>{c.scope}</td>
                                  <td style={ERP_TD}><span style={{ fontSize: '11px', background: '#e2e8f0', padding: '3px 6px', borderRadius: '4px' }}>{c.costCode}</span></td>
                                  <td style={ERP_TD}>{c.unit}</td>
                                  <td style={ERP_TD}>${parseFloat(c.pricePerUnit).toLocaleString()}</td>
                                  <td style={ERP_TD}>{c.quantity}</td>
                                  <td style={{ ...ERP_TD, fontWeight: '700', color: '#0f172a' }}>${parseFloat(c.boqTotal || 0).toLocaleString()}</td>
                                  <td style={{ ...ERP_TD, color: '#10b981', fontWeight: '600' }}>${parseFloat(c.paid || 0).toLocaleString()}</td>
                                  <td style={ERP_TD}>{c.retention}%</td>
                                  <td style={ERP_TD}>
                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px', background: c.status==='Completed'?'#d1fae5':'#fef3c7', color: c.status==='Completed'?'#065f46':'#92400e' }}>{c.status}</span>
                                  </td>
                                  <td style={ERP_TD}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button onClick={() => startInlineEditContractor(c)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#3b82f6' }} title="Modify baseline parameters"><Edit2 size={14} /></button>
                                      <button onClick={() => deleteContractor(c.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }} title="Purge entry"><Trash2 size={14} /></button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* APPEND CONTRACTOR COMPONENT FORM PANEL */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700' }}>➕ Append New Contractor Commitment Package</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563' }}>Contractor Source Selection</label>
                      <select style={{ ...inputStyle, marginTop: '4px' }} value={contractorNameMode} onChange={e => setContractorNameMode(e.target.value)}>
                        <option value="preset">Use Standard Preset Entities</option>
                        <option value="new">Register New Custom Entity</option>
                      </select>
                    </div>
                    {contractorNameMode === 'preset' ? (
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563' }}>Entity Selection</label>
                        <select style={{ ...inputStyle, marginTop: '4px' }} value={newContractor.name} onChange={e => setNewContractor({...newContractor, name: e.target.value})}>
                          <option value="">-- Choose Corporate Supplier --</option>
                          {PRESET_CONTRACTORS.map(pc => <option key={pc} value={pc}>{pc}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563' }}>Corporate Legal Designation</label>
                        <input style={{ ...inputStyle, marginTop: '4px' }} placeholder="Enterprise Title" value={customContractorName} onChange={e => setCustomContractorName(e.target.value)} />
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563' }}>Operational Scope Description</label>
                      <input style={{ ...inputStyle, marginTop: '4px' }} placeholder="Excavation, MEP Frame, etc" value={newContractor.scope} onChange={e => setNewContractor({...newContractor, scope: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563' }}>WBS CSI Code Binding</label>
                      <select style={{ ...inputStyle, marginTop: '4px' }} value={newContractor.costCode} onChange={e => setNewContractor({...newContractor, costCode: e.target.value})}>
                        <option value="">-- Select Structural Ledger --</option>
                        {costCodes.map(cc => <option key={cc.code} value={`${cc.code} ${cc.name}`}>{cc.code} {cc.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563' }}>Unit</label>
                      <input style={{ ...inputStyle, marginTop: '4px' }} placeholder="m³, Lump Sum, Ton" value={newContractor.unit} onChange={e => setNewContractor({...newContractor, unit: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563' }}>Unit Cost Rate ($)</label>
                      <input style={{ ...inputStyle, marginTop: '4px' }} type="number" placeholder="0.00" value={newContractor.pricePerUnit} onChange={e => setNewContractor({...newContractor, pricePerUnit: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563' }}>Contract Item Quantity</label>
                      <input style={{ ...inputStyle, marginTop: '4px' }} type="number" placeholder="0" value={newContractor.quantity} onChange={e => setNewContractor({...newContractor, quantity: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button onClick={addContractor} style={{ ...flexBtn('#0f172a'), width: '100%', justifyContent: 'center' }}><Plus size={16} /> Append Package Commit</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: MATERIAL LOG MANIFEST */}
            {activeTab === 'materials' && activeProjectInstance && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>📦 Material Supply Manifest Chain</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={ERP_TH}>Material Item Description</th>
                          <th style={ERP_TH}>Structural Category</th>
                          <th style={ERP_TH}>Allocated Contractor</th>
                          <th style={ERP_TH}>Supplier Entity</th>
                          <th style={ERP_TH}>Volume Rate</th>
                          <th style={ERP_TH}>Aggregate Total Value</th>
                          <th style={ERP_TH}>Condition</th>
                          <th style={ERP_TH}>{t('action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeProjectInstance.materials || []).map(m => (
                          <tr key={m.id}>
                            <td style={{ ...ERP_TD, fontWeight: '600' }}>{m.name}</td>
                            <td style={ERP_TD}>{m.category}</td>
                            <td style={ERP_TD}>{m.contractorName}</td>
                            <td style={ERP_TD}>{m.supplier}</td>
                            <td style={ERP_TD}>{m.quantity} {m.unit} x ${m.unitCost}</td>
                            <td style={{ ...ERP_TD, fontWeight: '700' }}>${(m.quantity * m.unitCost).toLocaleString()}</td>
                            <td style={ERP_TD}><span style={{ fontSize: '11px', background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{m.condition}</span></td>
                            <td style={ERP_TD}>
                              <button onClick={() => deleteMaterial(m.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700' }}>➕ Log New Inbound Material Ingestion Batch</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <input style={inputStyle} placeholder="Material Label Name" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} />
                    <select style={inputStyle} value={newMaterial.category} onChange={e => setNewMaterial({...newMaterial, category: e.target.value})}>
                      <option value="">-- Choose Structural Division --</option>
                      {costCodes.map(cc => <option key={cc.code} value={`${cc.code} ${cc.name}`}>{cc.code} {cc.name}</option>)}
                    </select>
                    <select style={inputStyle} value={newMaterial.contractorName} onChange={e => setNewMaterial({...newMaterial, contractorName: e.target.value})}>
                      <option value="">-- Assign Contractor Handing --</option>
                      {(activeProjectInstance.contractors || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <select style={inputStyle} value={newMaterial.supplier} onChange={e => setNewMaterial({...newMaterial, supplier: e.target.value})}>
                      <option value="">-- Select External Vendor --</option>
                      {PRESET_SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input style={inputStyle} type="number" placeholder="Batch Quantity" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial, quantity: e.target.value})} />
                    <input style={inputStyle} placeholder="Unit (m³, Ton, LFT)" value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} />
                    <input style={inputStyle} type="number" placeholder="Unit Rate Cost ($)" value={newMaterial.unitCost} onChange={e => setNewMaterial({...newMaterial, unitCost: e.target.value})} />
                    <button onClick={addMaterial} style={flexBtn('#0f172a')}><Plus size={16} /> Record Supply Log</button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: CASH LEDGER */}
            {activeTab === 'payments' && activeProjectInstance && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>💳 Cash Ledger Disbursements Journal</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={ERP_TH}>Date Axis</th>
                          <th style={ERP_TH}>Classification Type</th>
                          <th style={ERP_TH}>Payee Profile Beneficiary</th>
                          <th style={ERP_TH}>Disbursed Value Amount</th>
                          <th style={ERP_TH}>Clearance Mode</th>
                          <th style={ERP_TH}>Processing State</th>
                          <th style={ERP_TH}>{t('action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeProjectInstance.payments || []).map(p => (
                          <tr key={p.id}>
                            <td style={ERP_TD}>{p.date}</td>
                            <td style={ERP_TD}><span style={{ fontSize: '11px', background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px' }}>{p.type}</span></td>
                            <td style={{ ...ERP_TD, fontWeight: '600' }}>{p.reference}</td>
                            <td style={{ ...ERP_TD, fontWeight: '700', color: '#10b981' }}>${p.amount.toLocaleString()}</td>
                            <td style={ERP_TD}>{p.method}</td>
                            <td style={ERP_TD}>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '12px' }}>{p.status}</span>
                            </td>
                            <td style={ERP_TD}>
                              <button onClick={() => deletePayment(p.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700' }}>➕ Dispatch Liquidity Allocation</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <input style={inputStyle} type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} />
                    <select style={inputStyle} value={newPayment.type} onChange={e => setNewPayment({...newPayment, type: e.target.value})}>
                      <option value="Contractor">Contractor Balance Clearance</option>
                      <option value="Material">Direct Procurement Payment</option>
                    </select>
                    <input style={inputStyle} placeholder="Recipient Legal Entity Title" value={newPayment.reference} onChange={e => setNewPayment({...newPayment, reference: e.target.value})} />
                    <input style={inputStyle} type="number" placeholder="Disbursed Value ($)" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} />
                    <select style={inputStyle} value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})}>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button onClick={addPayment} style={flexBtn('#10b981')}><Check size={14} /> Commit Liquidity Output</button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: CHANGE ORDERS CONTROL */}
            {activeTab === 'changeorders' && activeProjectInstance && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>🔄 Contract Contingency Modification Indexes</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={ERP_TH}>Title Log Designation</th>
                          <th style={ERP_TH}>Originator Class</th>
                          <th style={ERP_TH}>CSI Allocation</th>
                          <th style={ERP_TH}>Contingency Premium</th>
                          <th style={ERP_TH}>State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeProjectInstance.changeOrders || []).map(co => (
                          <tr key={co.id}>
                            <td style={{ ...ERP_TD, fontWeight: '600' }}>{co.title}</td>
                            <td style={ERP_TD}>{co.type}</td>
                            <td style={ERP_TD}>{co.costCode}</td>
                            <td style={{ ...ERP_TD, fontWeight: '700', color: '#b45309' }}>${co.amount.toLocaleString()}</td>
                            <td style={ERP_TD}>
                              <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{co.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700' }}>➕ Inject Systematic Variance Change Index</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <input style={inputStyle} placeholder="Modification Reason / Variant Anchor" value={newChangeOrder.title} onChange={e => setNewChangeOrder({...newChangeOrder, title: e.target.value})} />
                    <select style={inputStyle} value={newChangeOrder.type} onChange={e => setNewChangeOrder({...newChangeOrder, type: e.target.value})}>
                      <option value="Owner">Client Scope Expansion</option>
                      <option value="Subcontractor">Site Optimization / Variance Event</option>
                    </select>
                    <input style={inputStyle} type="number" placeholder="Financial Scale Delta ($)" value={newChangeOrder.amount} onChange={e => setNewChangeOrder({...newChangeOrder, amount: e.target.value})} />
                    <button onClick={addChangeOrder} style={flexBtn('#f59e0b')}><Plus size={14} /> Commit Change Directive</button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 6: CSI MASTER COST CODES REGISTER */}
            {activeTab === 'wbs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>🗂️ Master WBS CSI Reference Standard Index</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {costCodes.map(cc => (
                      <div key={cc.code} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ background: '#0f172a', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>{cc.code}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{cc.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700' }}>➕ Append Structural CSI Account Code</h4>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input style={{ ...inputStyle, width: '140px' }} placeholder="Code (e.g. 04-000)" value={newCodeInput.code} onChange={e => setNewCodeInput({...newCodeInput, code: e.target.value})} />
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="Structural Classification Title" value={newCodeInput.name} onChange={e => setNewCodeInput({...newCodeInput, name: e.target.value})} />
                    <button onClick={appendCostCode} style={flexBtn('#0f172a')}><Plus size={16} /> Append Account Binding</button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 7: CORE AI QUANT QUANTITATIVE ADVISOR */}
            {activeTab === 'ai' && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '560px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', background: '#0f172a', color: '#fff', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid #f59e0b' }}>
                  🤖 Neural Quant Infrastructure Agent Terminal
                </div>
                
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxStyle: '75%', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.5', background: msg.role === 'user' ? '#f59e0b' : '#ffffff', color: msg.role === 'user' ? '#fff' : '#334155', border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0' }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>🤔 Evaluating Work Breakdown Structure variance bounds...</div>}
                  <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', background: '#fff' }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendAIRequest()} placeholder="Ask: What is our material exposure? Or compute total paid out to commitments..." style={inputStyle} disabled={loading} />
                  <button onClick={handleSendAIRequest} disabled={loading || !input.trim()} style={flexBtn(loading || !input.trim() ? '#94a3b8' : '#0f172a')}>
                    <Send size={15} /> Execute
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