import Login from "./pages/Login.jsx";

import React, { useState, useEffect } from 'react';

import axios from 'axios';

import { 

  Package, ArrowLeftRight, BarChart3, AlertTriangle, 

  LayoutGrid, RotateCcw, ShieldCheck

} from 'lucide-react';

import { 

  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 

  CartesianGrid, Cell, PieChart, Pie, Legend

} from 'recharts';

import Select from 'react-select';



// ==========================================

// PRODUCTION BACKEND API LINK

// ==========================================

const API_BASE = 'https://basirah-backend-1.onrender.com';

export default function App() {

 const [token, setToken] = useState(() => {

  return localStorage.getItem("token") || null;

});



useEffect(() => {

  console.log("TOKEN =", token);

}, [token]);  

  const [currentPage, setCurrentPage] = useState('dashboard');

  const [materials, setMaterials] = useState([]);

  const [contractors, setContractors] = useState([]);

  const [loans, setLoans] = useState([]);

  const [returns, setReturns] = useState([]);



  // Filter & Stacking States

  const [dashboardCardFilter, setDashboardCardFilter] = useState('ALL'); 

  const [activeDrillDown, setActiveDrillDown] = useState({ active: false, type: null, value: null });



  // Form Management States

  const [loanForm, setLoanForm] = useState({ material_id: null, contractor_id: null, quantity: '', expected_return_date: '', site_name: '' });

  const [newMaterialForm, setNewMaterialForm] = useState({ name: '', category: '', quantity: '' });

  const [newContractorForm, setNewContractorForm] = useState({ contact_person: '', company_name: '' });



  // Returns/Recovery Operations States

  const [selectedActiveLoan, setSelectedActiveLoan] = useState(null);

  const [returnQuantity, setReturnQuantity] = useState('');

  const [returnCondition, setReturnCondition] = useState('Good');

  const [dropdownResetKey, setDropdownResetKey] = useState(0);



  // Sync Master Data Stream

  const syncSystemData = async () => {

    try {

      const [matRes, conRes, loanRes, retRes] = await Promise.all([

        axios.get(`${API_BASE}/api/materials`),

        axios.get(`${API_BASE}/api/contractors`),

        axios.get(`${API_BASE}/api/loans`),

        axios.get(`${API_BASE}/api/returns`).catch(() => ({ data: [] }))

      ]);

      

      setMaterials(matRes.data || []);

      setContractors(conRes.data || []);

      setLoans(loanRes.data || []);

      setReturns(retRes.data || []);

    } catch (err) {

      console.error("Data syncing pipeline error:", err);

    }

  };

useEffect(() => {

  syncSystemData();

}, []);



useEffect(() => {

  const savedToken = localStorage.getItem("token");



  if (!savedToken) {

    setToken(null);

  }

}, []);

  // Volumetric Inventory Math Analytics

  const totalAvailable = materials.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);

  

  const getLoanRemainingQty = (loanId) => {

    const loanObj = loans.find(l => l.id === loanId);

    if (!loanObj) return 0;

    const totalReturned = returns

      .filter(r => Number(r.loan_id) === Number(loanId))

      .reduce((sum, r) => sum + Number(r.returned_quantity || 0), 0);

    return Math.max(0, Number(loanObj.quantity || 0) - totalReturned);

  };



  const totalLended = loans.reduce((acc, curr) => acc + getLoanRemainingQty(curr.id), 0);

  const totalStock = totalAvailable + totalLended;



  const criticalOverdueCount = loans.filter(l => {

    const remaining = getLoanRemainingQty(l.id);

    return remaining > 0 && l.expected_return_date && new Date(l.expected_return_date) < new Date();

  }).length;



  // Flashcard Condition Metrics

  const totalGoodStock = returns.filter(r => r.returned_condition === 'Good').reduce((sum, r) => sum + Number(r.returned_quantity || 0), 0);

  const totalWornStock = returns.filter(r => r.returned_condition === 'Worn').reduce((sum, r) => sum + Number(r.returned_quantity || 0), 0);

  const totalDamagedStock = returns.filter(r => r.returned_condition === 'Damaged').reduce((sum, r) => sum + Number(r.returned_quantity || 0), 0);



  const THEME = {

    bg: '#0a0a0a', cardBg: '#121212', border: '#262626',

    textMain: '#f5f5f5', textMuted: '#a3a3a3',

    accentBlue: '#2563eb', accentEmerald: '#059669', accentAmber: '#d97706', accentCrimson: '#dc2626'

  };



  const CONDITION_COLORS = { 'Good': THEME.accentEmerald, 'Worn': THEME.accentAmber, 'Damaged': THEME.accentCrimson };



  const activeTrailsOptions = loans

    .filter(l => getLoanRemainingQty(l.id) > 0)

    .map(l => ({

      value: l.id, site_name: l.site_name,

      label: `[${l.site_name || 'General'}] ${l.material_name} — Custodian: ${l.contact_person} (${getLoanRemainingQty(l.id)} Remaining)`

    }));



  const siteChartData = Object.values(loans.reduce((acc, current) => {

    const rem = getLoanRemainingQty(current.id);

    if (rem <= 0 || !current.site_name) return acc;

    const site = current.site_name.trim();

    if (!acc[site]) acc[site] = { name: site, totalLoaned: 0 };

    acc[site].totalLoaned += rem;

    return acc;

  }, {}));



  const custodianChartData = Object.values(loans.reduce((acc, current) => {

    const rem = getLoanRemainingQty(current.id);

    if (rem <= 0 || !current.contact_person) return acc;

    const cp = current.contact_person.trim();

    if (!acc[cp]) acc[cp] = { name: cp, Good: 0, Worn: 0, Damaged: 0 };

    

    returns.filter(r => r.loan_id === current.id).forEach(r => {

      acc[cp][r.returned_condition] += Number(r.returned_quantity || 0);

    });

    return acc;

  }, {}));



  const handleChartDrillDown = (data) => {

    if (data && data.name) {

      setActiveDrillDown({ active: true, type: 'SITE', value: data.name });

    }

  };



  const clearAllFilters = () => {

    setDashboardCardFilter('ALL');

    setActiveDrillDown({ active: false, type: null, value: null });

  };



  const generateTelemetryRows = () => {

    let rows = [];

    if (['ALL', 'AVAILABLE'].includes(dashboardCardFilter) && !activeDrillDown.active) {

      materials.forEach(m => {

        if (Number(m.quantity) > 0) {

          rows.push({ id: `mat-${m.id}`, name: m.name, location: 'Vault Reserve', qty: m.quantity, status: 'UNLENDED', color: THEME.accentEmerald });

        }

      });

    }

    if (['ALL', 'LENDED', 'OVERDUE'].includes(dashboardCardFilter)) {

      loans.forEach(l => {

        const rem = getLoanRemainingQty(l.id);

        if (rem > 0) {

          const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date();

          if (dashboardCardFilter === 'OVERDUE' && !isOverdue) return;

          if (activeDrillDown.active && activeDrillDown.type === 'SITE' && l.site_name?.trim() !== activeDrillDown.value) return;



          rows.push({ 

            id: `loan-${l.id}`, name: l.material_name, location: l.site_name || 'Field', 

            qty: rem, status: isOverdue ? 'OVERDUE' : 'DEPLOYED', color: isOverdue ? THEME.accentCrimson : THEME.accentAmber 

          });

        }

      });

    }

    return rows;

  };



  const handleReturnSubmit = async (e) => {

    e.preventDefault();

    if (!selectedActiveLoan) return alert('Select an active deployment trail.');

    const selectedId = parseInt(selectedActiveLoan.value);

    const returnQty = parseInt(returnQuantity);

    const maxAvailable = getLoanRemainingQty(selectedId);

    if (returnQty <= 0 || returnQty > maxAvailable) return alert('Quantity calculation mismatch.');

    try {

      await axios.post(`${API_BASE}/api/returns`, { loan_id: selectedId, returned_quantity: returnQty, returned_condition: returnCondition });

      setSelectedActiveLoan(null); setReturnQuantity(''); setDropdownResetKey(prev => prev + 1);

      await syncSystemData(); alert('Recovery action verified successfully!');

    } catch (err) { alert('Transaction error.'); }

  };



  const handleAddMaterialSubmit = async (e) => {

    e.preventDefault();

    try {

      await axios.post(`${API_BASE}/api/materials`, { name: newMaterialForm.name, category: newMaterialForm.category, quantity: parseInt(newMaterialForm.quantity), barcode: "BR-" + Math.floor(100000 + Math.random() * 900000) });

      setNewMaterialForm({ name: '', category: '', quantity: '' }); await syncSystemData(); alert('Asset registered successfully.');

    } catch (err) { alert('Failed to register asset.'); }

  };



  const handleAddContractorSubmit = async (e) => {

    e.preventDefault();

    try {

      await axios.post(`${API_BASE}/api/contractors`, { contact_person: newContractorForm.contact_person, company_name: newContractorForm.company_name, phone: '0500000000' });

      setNewContractorForm({ contact_person: '', company_name: '' }); await syncSystemData(); alert('Custodian identity saved!');

    } catch (err) { alert('Failed to save identity.'); }

  };



  const handleLoanSubmit = async (e) => {

    e.preventDefault();

    try {

      await axios.post(`${API_BASE}/api/loans`, { material_id: parseInt(loanForm.material_id), contractor_id: parseInt(loanForm.contractor_id), quantity: parseInt(loanForm.quantity), expected_return_date: loanForm.expected_return_date, site_name: loanForm.site_name });

      setLoanForm({ material_id: null, contractor_id: null, quantity: '', expected_return_date: '', site_name: '' }); await syncSystemData(); alert('Dispatch authorization verified!');

    } catch (err) { alert('Dispatch allocation halted.'); }

  };



  const styles = {

    container: { fontFamily: '"Inter", sans-serif', backgroundColor: THEME.bg, color: THEME.textMain, minHeight: '100vh', display: 'flex' },

    sidebar: { width: '280px', backgroundColor: THEME.cardBg, borderRight: `1px solid ${THEME.border}`, padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '8px' },

    navLink: (isActive) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '8px', cursor: 'pointer', backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent', color: isActive ? THEME.accentBlue : THEME.textMuted, border: `1px solid ${isActive ? 'rgba(37, 99, 235, 0.2)' : 'transparent'}`, textAlign: 'left', fontWeight: '600', fontSize: '14px' }),

    mainContent: { flex: 1, padding: '40px 48px', display: 'flex', flexDirection: 'column', maxWidth: '1600px', margin: '0 auto' },

    grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' },

    card: (glowColor, isActive) => ({ backgroundColor: THEME.cardBg, border: `1px solid ${isActive ? glowColor : THEME.border}`, padding: '24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s' }),

    box: { backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, padding: '28px', borderRadius: '12px', marginBottom: '24px' },

    label: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '11px', color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '1px' },

    input: { width: '100%', padding: '12px 16px', borderRadius: '6px', border: `1px solid ${THEME.border}`, backgroundColor: THEME.bg, color: '#fff', fontSize: '14px' },

    button: (color) => ({ width: '100%', padding: '14px', backgroundColor: color, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }),

    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },

    th: { color: THEME.textMuted, padding: '16px', textAlign: 'left', borderBottom: `1px solid ${THEME.border}`, fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' },

    td: { padding: '16px', borderBottom: `1px solid ${THEME.border}`, color: THEME.textMain, fontSize: '14px' },

    customSelect: {

      control: (provided) => ({ ...provided, backgroundColor: THEME.bg, borderColor: THEME.border, color: '#fff', padding: '4px' }),

      menu: (provided) => ({ ...provided, backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}` }),

      singleValue: (provided) => ({ ...provided, color: '#fff' }),

      option: (provided, state) => ({ ...provided, backgroundColor: state.isFocused ? THEME.accentBlue : 'transparent', color: '#fff' })

    }

  };



  return token ? (

  <div style={styles.container}>



    {/* ================= LOGOUT BUTTON ================= */}

    <div style={{ position: "absolute", top: 10, right: 10 }}>

      <button

        onClick={() => {

          localStorage.removeItem("token");

          setToken(null);

        }}

        style={{

          padding: "8px 12px",

          background: "#dc2626",

          color: "#fff",

          border: "none",

          borderRadius: "6px",

          cursor: "pointer"

        }}

      >

        Logout

      </button>

    </div>



    {/* ================= YOUR EXISTING APP UI ================= */}

    <div style={styles.sidebar}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingBottom: '20px', borderBottom: `1px solid ${THEME.border}` }}>

        <ShieldCheck size={28} color={THEME.accentBlue}/>

        <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>

          BASIRAH <span style={{ color: THEME.accentBlue }}>360</span>

        </h3>

      </div>



      <button style={styles.navLink(currentPage === 'dashboard')} onClick={() => { setCurrentPage('dashboard'); clearAllFilters(); }}>

        <BarChart3 size={18}/> Telemetry Dashboard

      </button>



      <button style={styles.navLink(currentPage === 'materials')} onClick={() => setCurrentPage('materials')}>

        <Package size={18}/> Asset Registry

      </button>



      <button style={styles.navLink(currentPage === 'returns_page')} onClick={() => setCurrentPage('returns_page')}>

        <RotateCcw size={18}/> Recovery Ops

      </button>

    </div>



    <div style={styles.mainContent}>

      {/* KEEP EVERYTHING YOU ALREADY HAD BELOW EXACTLY */}

      {currentPage === 'dashboard' && (

        <div>

          {/* YOUR FULL DASHBOARD CODE STAYS HERE */}

        </div>

      )}



      {currentPage === 'materials' && (

        <div>

          {/* YOUR MATERIALS CODE STAYS HERE */}

        </div>

      )}



      {currentPage === 'returns_page' && (

        <div>

          {/* YOUR RETURNS CODE STAYS HERE */}

        </div>

      )}

    </div>



  </div>

) : (

  <Login setToken={setToken} />

);

} 

