import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Download, Trash2, Plus, Send, FileText, DollarSign, Home, Users, 
  Package, Map, MessageCircle, Tag, X, Edit2, Check, TrendingUp, 
  AlertTriangle, Layers, Briefcase, Clock, ArrowUpRight, ArrowDownLeft, Shield, Search, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

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
      { id: 'm1', name: 'Ultra-High Performance Concrete', category: '03-000 Concrete & Masonry', quantity: 250, unit: 'm³', unitCost: 150, contractorName: 'Al Bayan Contracting', supplier: 'BuildCo Supply', deliveryDate: '2024-02-01', condition: 'Good', notes: 'Ready-mix batch' },
      { id: 'm2', name: 'Structural Grade Steel Rebar', category: '05-000 Steel & Structural Metal', quantity: 50, unit: 'ton', unitCost: 800, contractorName: 'Al Bayan Contracting', supplier: 'Steel Ltd', deliveryDate: '2024-02-05', condition: 'Good', notes: 'Grade 60 TMT' },
      { id: 'm3', name: 'Ultra-High Performance Concrete', category: '03-000 Concrete & Masonry', quantity: 120, unit: 'm³', unitCost: 155, contractorName: 'Gulf Build Co.', supplier: 'BuildCo Supply', deliveryDate: '2024-03-12', condition: 'Good', notes: 'Superstructure segment' },
      { id: 'm4', name: 'Pvc Conduits & Fittings', category: '22-000 Plumbing & Drainage', quantity: 1500, unit: 'pcs', unitCost: 4.5, contractorName: 'Al Masa Engineering', supplier: 'Delta Supplies', deliveryDate: '2024-04-01', condition: 'Good', notes: 'Schedule 40 PVC' },
      { id: 'm5', name: 'Structural Grade Steel Rebar', category: '05-000 Steel & Structural Metal', quantity: 25, unit: 'ton', unitCost: 810, contractorName: 'Gulf Build Co.', supplier: 'Steel Ltd', deliveryDate: '2024-03-20', condition: 'Good', notes: 'Beams enforcement' }
    ],
    contractors: [
      { id: 'c1', name: 'Al Bayan Contracting', scope: 'Foundation Work', costCode: '03-000 Concrete & Masonry', unit: 'm²', pricePerUnit: 400, quantity: 300, boqTotal: 120000, paid: 75000, retention: 10, startDate: '2024-01-20', endDate: '2024-04-20', status: 'In Progress', contact: '+966 50 000 0001', notes: 'Phase 1 substructure complete' },
      { id: 'c2', name: 'Gulf Build Co.', scope: 'Structural Works', costCode: '05-000 Steel & Structural Metal', unit: 'Lump Sum', pricePerUnit: 180000, quantity: 1, boqTotal: 180000, paid: 90000, retention: 10, startDate: '2024-02-15', endDate: '2024-08-30', status: 'In Progress', contact: '+966 50 000 0003', notes: 'Core framing' },
      { id: 'c3', name: 'Al Masa Engineering', scope: 'MEP Works', costCode: '22-000 Plumbing & Drainage', unit: 'Lump Sum', pricePerUnit: 45000, quantity: 1, boqTotal: 45000, paid: 15000, retention: 5, startDate: '2024-03-01', endDate: '2024-08-15', status: 'In Progress', contact: '+966 50 000 0002', notes: 'Rough-ins ongoing' }
    ],
    changeOrders: [
      { id: 'co1', title: 'Subgrade Rock Excavation Overrun', type: 'Owner', costCode: '02-000 Earthworks & Site Clearance', amount: 35000, status: 'Approved', date: '2024-02-10', description: 'Encountered unexpected bedrock tier' },
      { id: 'co2', title: 'Additional Reinforcement Flange', type: 'Subcontractor', contractId: 'c1', costCode: '05-000 Steel & Structural Metal', amount: 12000, status: 'Pending', date: '2024-03-02', description: 'Structural engineer adjustment request' }
    ],
    payments: [
      { id: 'p1', date: '2024-02-15', type: 'Contractor', reference: 'Al Bayan Contracting', amount: 45000, method: 'Bank Transfer', status: 'Paid', notes: 'Phase 1 milestone' },
      { id: 'p2', date: '2024-03-01', type: 'Material', reference: 'BuildCo Supply', amount: 37500, method: 'Bank Transfer', status: 'Paid', notes: 'Concrete batch 1' },
      { id: 'p3', date: '2024-03-10', type: 'Contractor', reference: 'Al Masa Engineering', amount: 15000, method: 'Cheque', status: 'Paid', notes: 'MEP rough-in advance' },
      { id: 'p4', date: '2024-04-05', type: 'Contractor', reference: 'Al Bayan Contracting', amount: 30000, method: 'Bank Transfer', status: 'Paid', notes: 'Foundation settlement log clearance' }
    ]
  }
];

const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e'];

const ConstructionFinanceApp = () => {
  // ==================== STATE MANAGEMENT ====================
  const [costCodes, setCostCodes] = useState(() => {
    const saved = localStorage.getItem('cfCostCodes');
    return saved ? JSON.parse(saved) : DEFAULT_COST_CODES;
  });

  const [sites, setSites] = useState(() => {
    const saved = localStorage.getItem('constructionSitesERP_V3');
    return saved ? JSON.parse(saved) : INITIAL_SITES;
  });

  const [currentSiteId, setCurrentSiteId] = useState(sites[0]?.id || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMaterialDrilldown, setSelectedMaterialDrilldown] = useState(null);
  const [expandedContractorId, setExpandedContractorId] = useState(null);

  // AI Space
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Digiations 360 Principal Intelligence Hub initialized. Track contractor packages, dynamic item logs, and aggregate cost codes instantly.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const drillDownSectionRef = useRef(null);

  // Forms
  const [newSite, setNewSite] = useState({ name: '', location: '', budget: '', projectedRevenue: '', startDate: '' });
  const [newMaterial, setNewMaterial] = useState({ name: '', category: '', quantity: '', unit: '', unitCost: '', contractorName: '', supplier: '', deliveryDate: '', condition: 'Good', notes: '' });
  const [newContractor, setNewContractor] = useState({ name: '', scope: '', costCode: '', unit: '', pricePerUnit: '', quantity: '', paid: '', retention: '10', startDate: '', endDate: '', status: 'Pending', contact: '', notes: '' });
  const [newChangeOrder, setNewChangeOrder] = useState({ title: '', type: 'Owner', contractId: '', costCode: '', amount: '', status: 'Pending', date: '', description: '' });
  const [newPayment, setNewPayment] = useState({ date: '', type: 'Contractor', reference: '', amount: '', method: 'Bank Transfer', status: 'Pending', notes: '' });
  const [newCodeInput, setNewCodeInput] = useState({ code: '', name: '' });

  const [contractorNameMode, setContractorNameMode] = useState('preset');
  const [customContractorName, setCustomContractorName] = useState('');

  // LocalStorage Hooks
  useEffect(() => { localStorage.setItem('constructionSitesERP_V3', JSON.stringify(sites)); }, [sites]);
  useEffect(() => { localStorage.setItem('cfCostCodes', JSON.stringify(costCodes)); }, [costCodes]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const activeProjectInstance = useMemo(() => sites.find(s => s.id === currentSiteId) || sites[0], [sites, currentSiteId]);

  // ==================== DYNAMIC ANALYTICS COMPILATION ====================
  const metrics = useMemo(() => {
    if (!activeProjectInstance) return {
      totalContractorBOQ: 0, totalContractorPaid: 0, totalContractorRemaining: 0, totalMaterialCost: 0, materialShareByContractor: [], materialDrilldownSummary: [], chartDataByMaterial: []
    };

    const contractors = activeProjectInstance.contractors || [];
    const materials = activeProjectInstance.materials || [];

    const totalContractorBOQ = contractors.reduce((sum, c) => sum + parseFloat(c.boqTotal || 0), 0);
    const totalContractorPaid = contractors.reduce((sum, c) => sum + parseFloat(c.paid || 0), 0);
    const totalContractorRemaining = Math.max(0, totalContractorBOQ - totalContractorPaid);

    const totalMaterialCost = materials.reduce((sum, m) => sum + (parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0)), 0);

    // Group materials consumed per contractor
    const contractorMatMap = {};
    contractors.forEach(c => { contractorMatMap[c.name] = 0; });
    materials.forEach(m => {
      const cost = parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0);
      const cName = m.contractorName || 'General Inventory';
      contractorMatMap[cName] = (contractorMatMap[cName] || 0) + cost;
    });
    
    const materialShareByContractor = Object.keys(contractorMatMap).map(name => ({
      name,
      value: contractorMatMap[name]
    })).filter(item => item.value > 0);

    // Dynamic compilation for material categories/drill-down index
    const materialDrilldownSummary = {};
    materials.forEach(m => {
      if (!materialDrilldownSummary[m.name]) {
        materialDrilldownSummary[m.name] = {
          name: m.name,
          unit: m.unit,
          totalQty: 0,
          totalCost: 0,
          logs: []
        };
      }
      const cost = parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0);
      materialDrilldownSummary[m.name].totalQty += parseFloat(m.quantity || 0);
      materialDrilldownSummary[m.name].totalCost += cost;
      materialDrilldownSummary[m.name].logs.push(m);
    });

    const chartDataByMaterial = Object.values(materialDrilldownSummary).map(m => ({
      name: m.name,
      totalCost: m.totalCost,
      totalQty: m.totalQty
    }));

    if (!selectedMaterialDrilldown && Object.keys(materialDrilldownSummary).length > 0) {
      setSelectedMaterialDrilldown(Object.keys(materialDrilldownSummary)[0]);
    }

    return {
      totalContractorBOQ,
      totalContractorPaid,
      totalContractorRemaining,
      totalMaterialCost,
      materialShareByContractor,
      materialDrilldownSummary,
      chartDataByMaterial
    };
  }, [activeProjectInstance, selectedMaterialDrilldown]);

  const globalRollup = useMemo(() => {
    let budget = 0, spentMat = 0, spentCon = 0;
    sites.forEach(s => {
      budget += s.budget || 0;
      spentMat += (s.materials || []).reduce((sum, m) => sum + (parseFloat(m.quantity || 0) * parseFloat(m.unitCost || 0)), 0);
      spentCon += (s.contractors || []).reduce((sum, c) => sum + parseFloat(c.paid || 0), 0);
    });
    return { budget, totalSpent: spentMat + spentCon };
  }, [sites]);

  // Handle drill down click routing
  const triggerMaterialDrilldown = (materialName) => {
    setSelectedMaterialDrilldown(materialName);
    setTimeout(() => {
      drillDownSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ==================== STATE MUTATIONS ====================
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
    setSites([...sites, s]);
    setCurrentSiteId(s.id);
    setNewSite({ name: '', location: '', budget: '', projectedRevenue: '', startDate: '' });
  };

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.quantity || !newMaterial.unitCost) return;
    const materialLog = {
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

    setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, materials: [...s.materials, materialLog] }));
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

  const updatePaymentStatus = (payId, newStatus) => {
    setSites(sites.map(s => {
      if (s.id !== currentSiteId) return s;
      const payment = (s.payments || []).find(p => p.id === payId);
      let contractors = s.contractors;
      if (payment && payment.type === 'Contractor' && newStatus === 'Paid' && payment.status !== 'Paid') {
        contractors = contractors.map(c => c.name === payment.reference ? { ...c, paid: Math.min(parseFloat(c.boqTotal || 0), parseFloat(c.paid || 0) + parseFloat(payment.amount || 0)) } : c);
      }
      return { ...s, payments: s.payments.map(p => p.id === payId ? { ...p, status: newStatus } : p), contractors };
    }));
  };

  const deleteMaterial = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, materials: s.materials.filter(m => m.id !== id) }));
  const deleteContractor = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, contractors: s.contractors.filter(c => c.id !== id) }));
  const deletePayment = id => setSites(sites.map(s => s.id !== currentSiteId ? s : { ...s, payments: (s.payments || []).filter(p => p.id !== id) }));

  // ==================== AI AGENT QUERY LOGIC ====================
  const handleSendAIRequest = () => {
    if (!input.trim()) return;
    const userPrompt = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    setLoading(true);

    setTimeout(() => {
      let reply = "Digiations 360 Knowledge base response: ";
      const cleanPrompt = userPrompt.toLowerCase();

      if (cleanPrompt.includes('material') || cleanPrompt.includes('cost')) {
        reply += `The tracked direct site material valuation amounts to $${metrics.totalMaterialCost.toLocaleString()}. `;
        if (Object.keys(metrics.materialDrilldownSummary).length > 0) {
          const topMat = Object.values(metrics.materialDrilldownSummary).sort((a,b)=>b.totalCost-a.totalCost)[0];
          reply += `The largest layout footprint belongs to "${topMat.name}" totaling $${topMat.totalCost.toLocaleString()}.`;
        }
      } else if (cleanPrompt.includes('contractor') || cleanPrompt.includes('paid')) {
        reply += `Total contractor commitments stand at $${metrics.totalContractorBOQ.toLocaleString()} with $${metrics.totalContractorPaid.toLocaleString()} paid out to date. Balance outstanding remains at $${metrics.totalContractorRemaining.toLocaleString()}.`;
      } else {
        reply += "Optimal data vectors verified. Let me know if you need specific analytical graphs computed for materials or individual contractors.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setLoading(false);
    }, 700);
  };

  const executeCSVDownload = () => {
    let raw = `DIGIATIONS 360 ERP COMMERCIAL MATRIX - ${activeProjectInstance.name.toUpperCase()}\n`;
    raw += `METRIC,VALUE\n`;
    raw += `Contractors Total Package BOQ,$${metrics.totalContractorBOQ}\n`;
    raw += `Contractors Paid,$${metrics.totalContractorPaid}\n`;
    raw += `Total Site Material Cost,$${metrics.totalMaterialCost}\n\n`;

    raw += `MATERIAL LOGS INVENTORY MATRIX\nItem,Category,Assigned Contractor,Quantity,Unit,Unit Cost,Total,Supplier,Date\n`;
    (activeProjectInstance.materials || []).forEach(m => {
      raw += `"${m.name}","${m.category}","${m.contractorName}",${m.quantity},${m.unit},${m.unitCost},${m.quantity * m.unitCost},"${m.supplier}",${m.deliveryDate}\n`;
    });

    const blob = new Blob([raw], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Site_Commercial_Analytics_${activeProjectInstance.name.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  // Styles definitions
  const ERP_TH = { padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4b5563', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' };
  const ERP_TD = { padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', borderBottom: '1px solid #e5e7eb', color: '#1f2937' };
  const inputStyle = { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', width: '100%', outline: 'none', background: '#fff' };
  const flexBtn = (bgColor, textColor = '#fff') => ({ padding: '10px 16px', background: bgColor, color: textColor, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' });

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER BAR */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #f59e0b' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={28} style={{ color: '#f59e0b' }} /> Digiations 360 Core ERP <span style={{ fontSize: '12px', background: '#334155', padding: '4px 8px', borderRadius: '4px', color: '#cbd5e1' }}>رقمنة الرقمية</span>
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '13px' }}>Contractor Packages · Direct Material Logs · Dynamic Sub-Ledger Drill Downs · Cross-Contract Distribution Summary</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Consolidated Project Cash Outflows</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>${globalRollup.totalSpent.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 88px)' }}>
        
        {/* SIDEBAR */}
        <div style={{ width: '290px', background: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Project Operational Centers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {sites.map(s => {
              const isActive = currentSiteId === s.id;
              const sMatCost = (s.materials || []).reduce((sum, m) => sum + (m.quantity * m.unitCost), 0);
              const sConCost = (s.contractors || []).reduce((sum, c) => sum + c.paid, 0);
              return (
                <div key={s.id} onClick={() => setCurrentSiteId(s.id)} style={{ padding: '14px', background: isActive ? '#f8fafc' : 'transparent', border: `1px solid ${isActive ? '#cbd5e1' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}>
                  {isActive && <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: '4px', background: '#f59e0b', borderRadius: '0 4px 4px 0' }} />}
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.location}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', fontWeight: '600' }}>
                    <span style={{ color: '#0284c7' }}>Budget: ${(s.budget / 1000).toFixed(0)}k</span>
                    <span style={{ color: '#10b981' }}>Spent: ${((sMatCost + sConCost) / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '10px' }}>+ Spawn Project Site</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input placeholder="Site Designation Name" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }} />
              <input placeholder="Location Vector" value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }} />
              <input placeholder="Total Alloc Budget ($)" type="number" value={newSite.budget} onChange={e => setNewSite({...newSite, budget: e.target.value})} style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }} />
              <button onClick={addSite} style={{ ...flexBtn('#0f172a'), width: '100%', justifyContent: 'center', padding: '8px', fontSize: '12px' }}>Initialize Center</button>
            </div>
          </div>
        </div>

        {/* WORKSPACE CONTENT AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          
          {/* TABS NAVIGATION */}
          <div style={{ display: 'flex', background: '#ffffff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', padding: '0 16px' }}>
            {[
              { id: 'overview', label: '📊 Executive Dashboard' },
              { id: 'commitments', label: '👷 Contractor BOQ Table' },
              { id: 'materials', label: '📦 Material Log Manifest' },
              { id: 'payments', label: '💳 Cash Ledger' },
              { id: 'changeorders', label: '🔄 Change Control' },
              { id: 'wbs', label: '🗂️ CSI Cost Codes' },
              { id: 'ai', label: '🤖 Core AI Quant Advisor' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '16px 20px', border: 'none', background: 'transparent', borderBottom: activeTab === tab.id ? '3px solid #f59e0b' : '3px solid transparent', color: activeTab === tab.id ? '#0f172a' : '#64748b', fontWeight: activeTab === tab.id ? '700' : '500', fontSize: '13px', cursor: 'pointer', whitespace: 'nowrap', transition: 'all 0.15s' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
            
            {/* VIEW 1: EXECUTIVE DASHBOARD */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* HIGH LEVEL KPI ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Contractors Total BOQ</span>
                      <Users size={18} style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>${metrics.totalContractorBOQ.toLocaleString()}</div>
                  </div>

                  <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Contractors Disbursed Paid</span>
                      <DollarSign size={18} style={{ color: '#10b981' }} />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '12px' }}>${metrics.totalContractorPaid.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>Outstanding Contract Balance: ${metrics.totalContractorRemaining.toLocaleString()}</div>
                  </div>

                  {/* INTERACTIVE MATERIAL QUANTITIES SUM CARD */}
                  <div onClick={() => triggerMaterialDrilldown(Object.keys(metrics.materialDrilldownSummary)[0])} style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '2px solid #7c3aed', boxShadow: '0 4px 6px rgba(124, 58, 237, 0.08)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase' }}>Total Site Material Cost</span>
                      <Package size={18} style={{ color: '#7c3aed' }} />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#7c3aed', marginTop: '12px' }}>${metrics.totalMaterialCost.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                      <Eye size={12} /> Press card to view tables and visual charts below
                    </div>
                    <span style={{ position: 'absolute', right: '12px', bottom: '12px', fontSize: '10px', background: '#7c3aed', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>DRILL DOWN INTERACTIVE</span>
                  </div>
                </div>

                {/* GRAPHIC CHARTS GRID OVERVIEW */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                  
                  {/* BAR CHART: PACKAGES SUMMARY */}
                  <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Contractor Performance & Clearance Allocation</h3>
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

                  {/* PIE CHART: MATERIAL EXPENDITURE DISTRIBUTION PER CONTRACTOR */}
                  <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Material Values Absorbed Per Contractor</h3>
                    {metrics.materialShareByContractor.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>No logged contractor allocations found</div>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyIntersection: 'center' }}>
                        <div style={{ height: '150px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={metrics.materialShareByContractor} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                                {metrics.materialShareByContractor.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginTop: '12px', overflowY: 'auto', maxHeight: '110px' }}>
                          {metrics.materialShareByContractor.map((item, idx) => (
                            <div key={item.name} style={{ display: 'flex', justifyIntersection: 'space-between', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                                {item.name}
                              </span>
                              <span style={{ fontWeight: '700', color: '#0f172a' }}>${item.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* DEEP DIVE DRILL-DOWN SUB-DASHBOARD (TARGETED VIA CARD CLICK) */}
                <div ref={drillDownSectionRef} style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #7c3aed', marginTop: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f0f1f3', paddingBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={20} style={{ color: '#7c3aed' }} /> Site Material Breakdown Index & Visual Charts
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Select a specific logged inventory element to load independent multi-chart distributions and log histories.</p>
                    </div>
                    <button onClick={executeCSVDownload} style={flexBtn('#0f172a')}><Download size={14} /> Extract Global Financials</button>
                  </div>

                  {Object.keys(metrics.materialDrilldownSummary).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '14px' }}>Zero logged materials initialized.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
                      
                      {/* SIDE SELECTOR LIST */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
                        {Object.values(metrics.materialDrilldownSummary).map(m => {
                          const isSelected = selectedMaterialDrilldown === m.name;
                          return (
                            <div key={m.name} onClick={() => setSelectedMaterialDrilldown(m.name)} style={{ padding: '12px', background: isSelected ? '#f5f3ff' : '#f8fafc', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', border: isSelected ? '1px solid #7c3aed' : '1px solid #e2e8f0' }}>
                              <div style={{ fontWeight: '700', fontSize: '13px', color: isSelected ? '#6d28d9' : '#1f2937' }}>{m.name}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                                <span>Total Volume: {m.totalQty} {m.unit}</span>
                                <span style={{ fontWeight: '700', color: '#0f172a' }}>${m.totalCost.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* DETAILED DRILL DOWN MULTI-CHART SUB-DASHBOARD */}
                      <div>
                        {selectedMaterialDrilldown && metrics.materialDrilldownSummary[selectedMaterialDrilldown] ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            {/* MINI STAT BAR */}
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Focused Material Stream</span>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{selectedMaterialDrilldown}</h4>
                              </div>
                              <div style={{ display: 'flex', gap: '24px' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>Aggregate Cost</div>
                                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#7c3aed' }}>${metrics.materialDrilldownSummary[selectedMaterialDrilldown].totalCost.toLocaleString()}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>Aggregate Quantity</div>
                                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{metrics.materialDrilldownSummary[selectedMaterialDrilldown].totalQty} {metrics.materialDrilldownSummary[selectedMaterialDrilldown].unit}</div>
                                </div>
                              </div>
                            </div>

                            {/* DYNAMIC DRILL-DOWN VISUALS: PIE AND BAR DISTRIBUTION FOR SPECIFIC MATERIAL */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', marginBottom: '12px' }}>Volume Allocation Share Per Contractor</div>
                                <div style={{ height: '140px' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie data={metrics.materialDrilldownSummary[selectedMaterialDrilldown].logs} nameKey="contractorName" dataKey="quantity" cx="50%" cy="50%" outerRadius={50} fill="#8884d8">
                                        {metrics.materialDrilldownSummary[selectedMaterialDrilldown].logs.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip formatter={(v) => `${v} ${metrics.materialDrilldownSummary[selectedMaterialDrilldown].unit}`} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                              
                              <div style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', marginBottom: '12px' }}>Financial Breakdown Value By Entry</div>
                                <div style={{ height: '140px' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics.materialDrilldownSummary[selectedMaterialDrilldown].logs.map((l, i) => ({ name: `Entry ${i+1}`, cost: l.quantity * l.unitCost }))}>
                                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                                      <Tooltip formatter={(v) => `$${v}`} />
                                      <Bar dataKey="cost" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </div>

                            {/* CHRONOLOGICAL DRILL DOWN TABLE */}
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th style={ERP_TH}>Date</th>
                                    <th style={ERP_TH}>Responsible Contractor</th>
                                    <th style={ERP_TH}>CSI Division Code</th>
                                    <th style={{ ...ERP_TH, textAlign: 'right' }}>Logged Vol</th>
                                    <th style={{ ...ERP_TH, textAlign: 'right' }}>Unit Rate</th>
                                    <th style={{ ...ERP_TH, textAlign: 'right' }}>Subtotal Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {metrics.materialDrilldownSummary[selectedMaterialDrilldown].logs.map(log => (
                                    <tr key={log.id} style={{ background: '#ffffff' }}>
                                      <td style={ERP_TD}>{log.deliveryDate}</td>
                                      <td style={{ ...ERP_TD, fontWeight: '700', color: '#1e3a8a' }}>{log.contractorName}</td>
                                      <td style={ERP_TD}><span style={{ fontSize: '11px', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{log.category}</span></td>
                                      <td style={{ ...ERP_TD, textAlign: 'right' }}>{log.quantity} {log.unit}</td>
                                      <td style={{ ...ERP_TD, textAlign: 'right' }}>${log.unitCost}</td>
                                      <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>${(log.quantity * log.unitCost).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Select an asset element to generate full drill-down sets.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* VIEW 2: CONTRACTOR BOQ TABLE WITH SUB-LEDGER DRILL DOWNS */}
            {activeTab === 'commitments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* INJECT AGREEMENT FORM */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>➕ Execute New Subcontract Scope Binding</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <select value={contractorNameMode} onChange={e => setContractorNameMode(e.target.value)} style={inputStyle}>
                        <option value="preset">Preset Elite Matrix</option>
                        <option value="new">Add Custom Entity</option>
                      </select>
                      {contractorNameMode === 'preset' ? (
                        <select value={newContractor.name} onChange={e => setNewContractor({...newContractor, name: e.target.value})} style={{ ...inputStyle, marginTop: '4px' }}>
                          <option value="">-- Choose Contractor --</option>
                          {PRESET_CONTRACTORS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <input placeholder="Custom Contractor Name" value={customContractorName} onChange={e => setCustomContractorName(e.target.value)} style={{ ...inputStyle, marginTop: '4px' }} />
                      )}
                    </div>
                    <select value={newContractor.scope} onChange={e => setNewContractor({...newContractor, scope: e.target.value})} style={inputStyle}>
                      <option value="">-- Structural Scope --</option>
                      {CONTRACTOR_SCOPES.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                    </select>
                    <select value={newContractor.costCode} onChange={e => setNewContractor({...newContractor, costCode: e.target.value})} style={inputStyle}>
                      <option value="">-- CSI Reference Code --</option>
                      {costCodes.map(cc => <option key={cc.code} value={`${cc.code} ${cc.name}`}>{cc.code} - {cc.name}</option>)}
                    </select>
                    <input placeholder="Quantity" type="number" value={newContractor.quantity} onChange={e => setNewContractor({...newContractor, quantity: e.target.value})} style={inputStyle} />
                    <input placeholder="Unit Price Rate ($)" type="number" value={newContractor.pricePerUnit} onChange={e => setNewContractor({...newContractor, pricePerUnit: e.target.value})} style={inputStyle} />
                    <input placeholder="Initial Disbursed Paid ($)" type="number" value={newContractor.paid} onChange={e => setNewContractor({...newContractor, paid: e.target.value})} style={inputStyle} />
                    <input placeholder="Retention Buffer (%)" type="number" value={newContractor.retention} onChange={e => setNewContractor({...newContractor, retention: e.target.value})} style={inputStyle} />
                  </div>
                  <button onClick={addContractor} style={flexBtn('#0f172a')}><Plus size={15} /> Bind Commitment Contract</button>
                </div>

                {/* MASTER BOQ TABLE WITH SUB-LEDGER INTERACTIVE DRILL-DOWN DATA ROWS */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Active Contractor Base Package Values</h3>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...ERP_TH, width: '40px' }}></th>
                        <th style={ERP_TH}>Contractor / Operation Scope</th>
                        <th style={ERP_TH}>CSI Division</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Total Target BOQ</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Total Payments Cleared</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Absorbed Materials Vol Cost</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Outstanding Contract Balance</th>
                        <th style={{ ...ERP_TH, textAlign: 'center' }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeProjectInstance.contractors || []).length === 0 ? (
                        <tr><td colSpan="8" style={{ ...ERP_TD, textAlign: 'center', color: '#94a3b8' }}>No subcontracts defined.</td></tr>
                      ) : (
                        (activeProjectInstance.contractors || []).map(c => {
                          const isExpanded = expandedContractorId === c.id;
                          const balance = Math.max(0, parseFloat(c.boqTotal || 0) - parseFloat(c.paid || 0));
                          
                          // Compute materials matching this specific contractor
                          const matchedMaterials = (activeProjectInstance.materials || []).filter(m => m.contractorName === c.name);
                          const totalMatchedMaterialCost = matchedMaterials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0);

                          // Compute payments matching this contractor
                          const matchedPayments = (activeProjectInstance.payments || []).filter(p => p.type === 'Contractor' && p.reference === c.name);

                          return (
                            <React.Fragment key={c.id}>
                              <tr style={{ background: isExpanded ? '#f8fafc' : '#ffffff', transition: 'background 0.2s' }}>
                                <td style={ERP_TD}>
                                  <button onClick={() => setExpandedContractorId(isExpanded ? null : c.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </button>
                                </td>
                                <td style={ERP_TD}>
                                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{c.name}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{c.scope}</div>
                                </td>
                                <td style={ERP_TD}><span style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{c.costCode}</span></td>
                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700' }}>${parseFloat(c.boqTotal || 0).toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', color: '#10b981', fontWeight: '600' }}>${parseFloat(c.paid || 0).toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', color: '#7c3aed', fontWeight: '600' }}>${totalMatchedMaterialCost.toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700', color: balance > 0 ? '#ef4444' : '#10b981' }}>${balance.toLocaleString()}</td>
                                <td style={{ ...ERP_TD, textAlign: 'center' }}>
                                  <button onClick={() => deleteContractor(c.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                </td>
                              </tr>

                              {/* DRILL DOWN EXPANDABLE SUB-LEDGER ROW PANEL */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan="8" style={{ background: '#f8fafc', padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                                      
                                      {/* SUB DRILL DOWN 1: CONTRACTOR INDEPENDENT MATERIAL LINE ENTRIES */}
                                      <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px' }}>
                                          📦 Material Drawdown Log ({matchedMaterials.length} entries)
                                        </div>
                                        {matchedMaterials.length === 0 ? (
                                          <div style={{ fontSize: '12px', color: '#94a3b8', padding: '12px', textAlign: 'center' }}>No material items currently logged under this contractor entity.</div>
                                        ) : (
                                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                              <tr>
                                                <th style={{ fontSize: '11px', color: '#64748b', textAlign: 'left', padding: '6px 4px' }}>Item</th>
                                                <th style={{ fontSize: '11px', color: '#64748b', textAlign: 'right', padding: '6px 4px' }}>Qty</th>
                                                <th style={{ fontSize: '11px', color: '#64748b', textAlign: 'right', padding: '6px 4px' }}>Rate</th>
                                                <th style={{ fontSize: '11px', color: '#64748b', textAlign: 'right', padding: '6px 4px' }}>Total</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {matchedMaterials.map(m => (
                                                <tr key={m.id}>
                                                  <td style={{ fontSize: '12px', padding: '6px 4px', borderBottom: '1px solid #f3f4f6' }}>{m.name}</td>
                                                  <td style={{ fontSize: '12px', textAlign: 'right', padding: '6px 4px', borderBottom: '1px solid #f3f4f6' }}>{m.quantity} {m.unit}</td>
                                                  <td style={{ fontSize: '12px', textAlign: 'right', padding: '6px 4px', borderBottom: '1px solid #f3f4f6' }}>${m.unitCost}</td>
                                                  <td style={{ fontSize: '12px', textAlign: 'right', fontWeight: '700', padding: '6px 4px', borderBottom: '1px solid #f3f4f6' }}>${(m.quantity * m.unitCost).toLocaleString()}</td>
                                                </tr>
                                              ))}
                                              <tr style={{ background: '#f8fafc' }}>
                                                <td colSpan="3" style={{ fontSize: '12px', fontWeight: '700', padding: '8px 4px', textAlign: 'right' }}>Absorbed Sum:</td>
                                                <td style={{ fontSize: '12px', fontWeight: '800', color: '#7c3aed', padding: '8px 4px', textAlign: 'right' }}>${totalMatchedMaterialCost.toLocaleString()}</td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        )}
                                      </div>

                                      {/* SUB DRILL DOWN 2: CONTRACTOR CLEARANCE CASH PAYMENTS */}
                                      <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px' }}>
                                          💳 Historical Cash Disbursals ({matchedPayments.length} records)
                                        </div>
                                        {matchedPayments.length === 0 ? (
                                          <div style={{ fontSize: '12px', color: '#94a3b8', padding: '12px', textAlign: 'center' }}>No cash clearance traces found for this contractor.</div>
                                        ) : (
                                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                              <tr>
                                                <th style={{ fontSize: '11px', color: '#64748b', textAlign: 'left', padding: '6px 4px' }}>Date</th>
                                                <th style={{ fontSize: '11px', color: '#64748b', textAlign: 'left', padding: '6px 4px' }}>Method</th>
                                                <th style={{ fontSize: '11px', color: '#64748b', textAlign: 'right', padding: '6px 4px' }}>Amount</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {matchedPayments.map(p => (
                                                <tr key={p.id}>
                                                  <td style={{ fontSize: '12px', padding: '6px 4px', borderBottom: '1px solid #f3f4f6' }}>{p.date}</td>
                                                  <td style={{ fontSize: '12px', padding: '6px 4px', borderBottom: '1px solid #f3f4f6' }}>{p.method}</td>
                                                  <td style={{ fontSize: '12px', textAlign: 'right', fontWeight: '700', color: '#10b981', padding: '6px 4px', borderBottom: '1px solid #f3f4f6' }}>${p.amount.toLocaleString()}</td>
                                                </tr>
                                              ))}
                                              <tr style={{ background: '#f8fafc' }}>
                                                <td colSpan="2" style={{ fontSize: '12px', fontWeight: '700', padding: '8px 4px', textAlign: 'right' }}>Total Released:</td>
                                                <td style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', padding: '8px 4px', textAlign: 'right' }}>${parseFloat(c.paid || 0).toLocaleString()}</td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        )}
                                      </div>

                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* VIEW 3: TRACK AND ASSIGN INVENTORY DIRECT MATERIAL ENTRY LOGS */}
            {activeTab === 'materials' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>📝 Allocate & Log Site Material Entry</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <input placeholder="Material Asset Name (e.g. Ready-Mix Concrete)" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} style={inputStyle} />
                    <select value={newMaterial.category} onChange={e => setNewMaterial({...newMaterial, category: e.target.value})} style={inputStyle}>
                      <option value="">-- Choose Cost Division --</option>
                      {costCodes.map(cc => <option key={cc.code} value={`${cc.code} ${cc.name}`}>{cc.code} - {cc.name}</option>)}
                    </select>
                    <select value={newMaterial.contractorName} onChange={e => setNewMaterial({...newMaterial, contractorName: e.target.value})} style={inputStyle}>
                      <option value="">-- Bind To Responsible Contractor --</option>
                      {(activeProjectInstance.contractors || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      <option value="General Inventory">General Inventory (Unassigned)</option>
                    </select>
                    <input placeholder="Quantity Volume" type="number" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial, quantity: e.target.value})} style={inputStyle} />
                    <input placeholder="Unit Measure (e.g. m³, ton)" value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} style={inputStyle} />
                    <input placeholder="Unit Rate Cost ($)" type="number" value={newMaterial.unitCost} onChange={e => setNewMaterial({...newMaterial, unitCost: e.target.value})} style={inputStyle} />
                    <input placeholder="Supplier Entity" value={newMaterial.supplier} onChange={e => setNewMaterial({...newMaterial, supplier: e.target.value})} style={inputStyle} />
                    <input type="date" value={newMaterial.deliveryDate} onChange={e => setNewMaterial({...newMaterial, deliveryDate: e.target.value})} style={inputStyle} />
                  </div>
                  <button onClick={addMaterial} style={flexBtn('#7c3aed')}><Plus size={15} /> Commit Material To Contractor Balance</button>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={ERP_TH}>Asset Material</th>
                        <th style={ERP_TH}>Bound Contractor Vector</th>
                        <th style={ERP_TH}>CSI Category</th>
                        <th style={ERP_TH}>Supplier</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Logged Quantity</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Unit Rate</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Total Cost Baseline</th>
                        <th style={{ ...ERP_TH, textAlign: 'center' }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeProjectInstance.materials || []).length === 0 ? (
                        <tr><td colSpan="8" style={{ ...ERP_TD, textAlign: 'center', color: '#94a3b8' }}>Zero tracked inventory variables.</td></tr>
                      ) : (
                        (activeProjectInstance.materials || []).map(m => (
                          <tr key={m.id}>
                            <td style={{ ...ERP_TD, fontWeight: '700' }}>{m.name}</td>
                            <td style={{ ...ERP_TD, color: '#1e40af', fontWeight: '700' }}>{m.contractorName}</td>
                            <td style={ERP_TD}><span style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{m.category}</span></td>
                            <td style={ERP_TD}>{m.supplier}</td>
                            <td style={{ ...ERP_TD, textAlign: 'right' }}>{m.quantity} {m.unit}</td>
                            <td style={{ ...ERP_TD, textAlign: 'right' }}>${m.unitCost}</td>
                            <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700' }}>${(m.quantity * m.unitCost).toLocaleString()}</td>
                            <td style={{ ...ERP_TD, textAlign: 'center' }}>
                              <button onClick={() => deleteMaterial(m.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 4: REGISTER REVENUE DISTRIBUTIONS IN CASH DISBURSEMENT LEDGER */}
            {activeTab === 'payments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>💳 Release Contractor/Supplier Outbound Disbursement</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <input type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} style={inputStyle} />
                    <select value={newPayment.type} onChange={e => setNewPayment({...newPayment, type: e.target.value})} style={inputStyle}>
                      <option value="Contractor">Contractor Progress Valuation</option>
                      <option value="Material">Material Bulk Procurement</option>
                    </select>
                    <select value={newPayment.reference} onChange={e => setNewPayment({...newPayment, reference: e.target.value})} style={inputStyle}>
                      <option value="">-- Select Beneficiary Recipient --</option>
                      {newPayment.type === 'Contractor' 
                        ? (activeProjectInstance.contractors || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                        : PRESET_SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)
                      }
                    </select>
                    <input placeholder="Transaction Value ($)" type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} style={inputStyle} />
                    <select value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})} style={inputStyle}>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <button onClick={addPayment} style={flexBtn('#10b981')}><Plus size={15} /> Execute Ledger Payment</button>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={ERP_TH}>Date Logged</th>
                        <th style={ERP_TH}>Classification</th>
                        <th style={ERP_TH}>Beneficiary Vendor</th>
                        <th style={{ ...ERP_TH, textAlign: 'right' }}>Disbursed Amount</th>
                        <th style={ERP_TH}>Routing Channel</th>
                        <th style={ERP_TH}>Status Clearance</th>
                        <th style={{ ...ERP_TH, textAlign: 'center' }}>Purge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeProjectInstance.payments || []).length === 0 ? (
                        <tr><td colSpan="7" style={{ ...ERP_TD, textAlign: 'center', color: '#94a3b8' }}>Zero tracked ledger logs.</td></tr>
                      ) : (
                        (activeProjectInstance.payments || []).map(p => (
                          <tr key={p.id}>
                            <td style={ERP_TD}>{p.date}</td>
                            <td style={ERP_TD}>
                              <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px', background: p.type === 'Contractor' ? '#dbeafe' : '#f3e8ff', color: p.type === 'Contractor' ? '#1e40af' : '#6b21a8' }}>
                                {p.type}
                              </span>
                            </td>
                            <td style={{ ...ERP_TD, fontWeight: '700' }}>{p.reference}</td>
                            <td style={{ ...ERP_TD, textAlign: 'right', fontWeight: '700' }}>${p.amount.toLocaleString()}</td>
                            <td style={ERP_TD}>{p.method}</td>
                            <td style={ERP_TD}>
                              <select value={p.status} onChange={e => updatePaymentStatus(p.id, e.target.value)} style={{ ...inputStyle, padding: '4px 8px', fontSize: '12px', width: '120px' }}>
                                <option value="Pending">Pending Approval</option>
                                <option value="Paid">Cleared / Fully Paid</option>
                              </select>
                            </td>
                            <td style={{ ...ERP_TD, textAlign: 'center' }}>
                              <button onClick={() => deletePayment(p.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 5: CHANGE CONTROLS VARIATION ORDERS */}
            {activeTab === 'changeorders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>🔄 Authorize Scope Variation Log</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <input placeholder="Scope Adjustment Title" value={newChangeOrder.title} onChange={e => setNewChangeOrder({...newChangeOrder, title: e.target.value})} style={inputStyle} />
                    <select value={newChangeOrder.type} onChange={e => setNewChangeOrder({...newChangeOrder, type: e.target.value})} style={inputStyle}>
                      <option value="Owner">Client / Owner Change Order (Increases Site Topline)</option>
                      <option value="Subcontractor">Subcontractor Variation (Increases Commitment Costs)</option>
                    </select>
                    <input placeholder="Deviation Cost Delta ($)" type="number" value={newChangeOrder.amount} onChange={e => setNewChangeOrder({...newChangeOrder, amount: e.target.value})} style={inputStyle} />
                    <input type="date" value={newChangeOrder.date} onChange={e => setNewChangeOrder({...newChangeOrder, date: e.target.value})} style={inputStyle} />
                  </div>
                  <button onClick={addChangeOrder} style={flexBtn('#f59e0b')}><Plus size={15} /> Inject Change Track Record</button>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                  Refer to the Executive Analytics summary tab to trace total cumulative project change order thresholds.
                </div>
              </div>
            )}

            {/* VIEW 6: CSI CODES SPECIFICATION REFERENCE */}
            {activeTab === 'wbs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div style={{ flex: '0 0 140px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>CSI Code</label>
                    <input placeholder="e.g. 04-000" value={newCodeInput.code} onChange={e => setNewCodeInput({...newCodeInput, code: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Scope Designation Description</label>
                    <input placeholder="e.g. Structural Blockworks & Partitioning" value={newCodeInput.name} onChange={e => setNewCodeInput({...newCodeInput, name: e.target.value})} style={inputStyle} />
                  </div>
                  <button onClick={addCostCode} style={flexBtn('#0f172a')}><Plus size={15} /> Append Index Code</button>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '700', fontSize: '14px', color: '#334155' }}>
                    Master Construction Specifications Index System (CSI MasterFormat)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px', padding: '20px' }}>
                    {costCodes.map(cc => (
                      <div key={cc.code} style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ background: '#1e293b', color: '#fff', fontWeight: '700', fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}>{cc.code}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{cc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 7: PRINCIPAL AI COMPANION AGENT PLATFORM */}
            {activeTab === 'ai' && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', height: '560px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 24px', background: '#0f172a', color: '#fff', borderTopLeftRadius: '11px', borderTopRightRadius: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageCircle size={18} style={{ color: '#f59e0b' }} />
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>Digiations 360 AI Co-Pilot Core Principal</span>
                  </div>
                </div>

                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc' }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '75%', padding: '14px 18px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.5', background: msg.role === 'user' ? '#f59e0b' : '#ffffff', color: msg.role === 'user' ? '#fff' : '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0' }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div style={{ fontSize: '12px', color: '#64748b' }}>🤔 Analyzing variance aggregates...</div>}
                  <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', background: '#fff', borderBottomLeftRadius: '11px', borderBottomRightRadius: '11px' }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendAIRequest()} placeholder="Ask about contractor outstanding balance metrics or material summaries..." style={inputStyle} disabled={loading} />
                  <button onClick={handleSendAIRequest} disabled={loading || !input.trim()} style={flexBtn(loading || !input.trim() ? '#94a3b8' : '#0f172a')}>
                    <Send size={15} /> Analyze
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