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



const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  ? 'http://localhost:5000' 

  : 'https://basirah-backend-yc1b.onrender.com'; 



export default function App() {

  const [currentPage, setCurrentPage] = useState('dashboard');

  const [materials, setMaterials] = useState([]);

  const [contractors, setContractors] = useState([]);

  const [loans, setLoans] = useState([]);

  const [returns, setReturns] = useState([]);



  // Advanced Drill-Down States

  const [dashboardCardFilter, setDashboardCardFilter] = useState('ALL'); 

  const [activeDrillDown, setActiveDrillDown] = useState({ active: false, type: null, value: null });



  // Form States

  const [loanForm, setLoanForm] = useState({ material_id: null, contractor_id: null, quantity: '', expected_return_date: '', site_name: '' });

  const [newMaterialForm, setNewMaterialForm] = useState({ name: '', category: '', quantity: '' });



  // Returns State

  const [selectedActiveLoan, setSelectedActiveLoan] = useState(null);

  const [returnQuantity, setReturnQuantity] = useState('');

  const [returnCondition, setReturnCondition] = useState('Good');

  const [dropdownResetKey, setDropdownResetKey] = useState(0);



  const syncSystemData = async () => {

    try {

      const matRes = await axios.get(`${API_BASE}/api/materials`);

      const conRes = await axios.get(`${API_BASE}/api/contractors`);

      const loanRes = await axios.get(`${API_BASE}/api/loans`);

      const retRes = await axios.get(`${API_BASE}/api/returns`).catch(() => ({ data: [] }));

      

      setMaterials(matRes.data || []);

      setContractors(conRes.data || []);

      setLoans(loanRes.data || []);

      setReturns(retRes.data || []);

    } catch (err) {

      console.error("Data sync error:", err);

    }

  };



  useEffect(() => { syncSystemData(); }, []);



  // Precise Math Inventory Tracking Engine

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



  const globalUtilizationRate = totalStock > 0 ? ((totalLended / totalStock) * 100).toFixed(1) : 0;

  

  const damagedReturns = returns.filter(r => r.returned_condition === 'Damaged').reduce((sum, r) => sum + Number(r.returned_quantity || 0), 0);

  const totalReturns = returns.reduce((sum, r) => sum + Number(r.returned_quantity || 0), 0);

  const damageBurnRate = totalReturns > 0 ? ((damagedReturns / totalReturns) * 100).toFixed(1) : 0;



  // Professional Dark Matrix Theme Configuration

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

      label: `[${l.site_name || 'General'}] ${l.material_name} — Assigned to: ${l.contact_person} (${getLoanRemainingQty(l.id)} Units Pending)`

    }));



  const siteChartData = Object.values(loans.reduce((acc, current) => {

    const rem = getLoanRemainingQty(current.id);

    if (rem <= 0 || !current.site_name) return acc;

    const site = current.site_name.trim();

    if (!acc[site]) acc[site] = { name: site, totalLoaned: 0 };

    acc[site].totalLoaned += rem;

    return acc;

  }, {}));



  // INTERACTIVE DRILL-DOWN HANDLER

  const handleChartDrillDown = (data) => {

    if (data && data.name) {

      setActiveDrillDown({ active: true, type: 'SITE', value: data.name });

      // Automatically shift top filter to show deployed assets if it was set to Available

      if (dashboardCardFilter === 'AVAILABLE') setDashboardCardFilter('LENDED');

    }

  };



  const clearAllFilters = () => {

    setDashboardCardFilter('ALL');

    setActiveDrillDown({ active: false, type: null, value: null });

  };



  // Render Engine for Telemetry Drill Down Table

  const generateTelemetryRows = () => {

    let rows = [];

    

    // Vault Assets (Hide if actively drilling down into a specific field site)

    if (['ALL', 'AVAILABLE'].includes(dashboardCardFilter) && !activeDrillDown.active) {

      materials.forEach(m => {

        if (Number(m.quantity) > 0) {

          rows.push({ id: `mat-${m.id}`, name: m.name, location: 'Vault Reserve', qty: m.quantity, status: 'UNLENDED', color: THEME.accentEmerald });

        }

      });

    }

    

    // Deployed Assets

    if (['ALL', 'LENDED', 'OVERDUE'].includes(dashboardCardFilter)) {

      loans.forEach(l => {

        const rem = getLoanRemainingQty(l.id);

        if (rem > 0) {

          const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date();

          

          // Card Filters

          if (dashboardCardFilter === 'OVERDUE' && !isOverdue) return;

          

          // Interactive Chart Site Filter

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



  // Form Submissions

  const handleReturnSubmit = async (e) => {

    e.preventDefault();

    if (!selectedActiveLoan) return alert('Select an active deployment trail.');

    const selectedId = parseInt(selectedActiveLoan.value);

    const returnQty = parseInt(returnQuantity);

    const maxAvailable = getLoanRemainingQty(selectedId);

    if (returnQty <= 0) return alert('Invalid volume.');

    if (returnQty > maxAvailable) return alert(`Over-allocation: Only ${maxAvailable} units outstanding.`);

    try {

      await axios.post(`${API_BASE}/api/returns`, { loan_id: selectedId, returned_quantity: returnQty, returned_condition: returnCondition, site_name: selectedActiveLoan.site_name });

      setSelectedActiveLoan(null); setReturnQuantity(''); setDropdownResetKey(prev => prev + 1);

      await syncSystemData(); alert('Return metrics logged successfully.');

    } catch (err) { alert('Transaction error.'); }

  };



  const handleAddMaterialSubmit = async (e) => {

    e.preventDefault();

    try {

      await axios.post(`${API_BASE}/api/materials`, { name: newMaterialForm.name, category: newMaterialForm.category, quantity: parseInt(newMaterialForm.quantity), barcode: "BR-" + Math.floor(100000 + Math.random() * 900000) });

      setNewMaterialForm({ name: '', category: '', quantity: '' }); await syncSystemData(); alert('Asset registered.');

    } catch (err) { alert('Database error.'); }

  };



  const handleLoanSubmit = async (e) => {

    e.preventDefault();

    try {

      await axios.post(`${API_BASE}/api/loans`, { material_id: parseInt(loanForm.material_id), contractor_id: parseInt(loanForm.contractor_id), quantity: parseInt(loanForm.quantity), expected_return_date: loanForm.expected_return_date, site_name: loanForm.site_name });

      setLoanForm({ material_id: null, contractor_id: null, quantity: '', expected_return_date: '', site_name: '' }); await syncSystemData(); alert('Dispatch authorized.');

    } catch (err) { alert('Dispatch error.'); }

  };



  const styles = {

    container: { fontFamily: '"Inter", sans-serif', backgroundColor: THEME.bg, color: THEME.textMain, minHeight: '100vh', display: 'flex' },

    sidebar: { width: '280px', backgroundColor: THEME.cardBg, borderRight: `1px solid ${THEME.border}`, padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '8px' },

    navLink: (isActive) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '8px', cursor: 'pointer', backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent', color: isActive ? THEME.accentBlue : THEME.textMuted, border: `1px solid ${isActive ? 'rgba(37, 99, 235, 0.2)' : 'transparent'}`, textAlign: 'left', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' }),

    mainContent: { flex: 1, padding: '40px 48px', display: 'flex', flexDirection: 'column', maxWidth: '1600px', margin: '0 auto' },

    grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' },

    card: (glowColor, isActive) => ({ backgroundColor: THEME.cardBg, border: `1px solid ${isActive ? glowColor : THEME.border}`, padding: '24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? `0 0 20px -5px ${glowColor}40` : 'none' }),

    box: { backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, padding: '28px', borderRadius: '12px', marginBottom: '24px' },

    label: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '11px', color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '1px' },

    input: { width: '100%', padding: '12px 16px', borderRadius: '6px', border: `1px solid ${THEME.border}`, backgroundColor: THEME.bg, color: '#fff', fontSize: '14px' },

    button: (color) => ({ width: '100%', padding: '14px', backgroundColor: color, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }),

    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },

    th: { color: THEME.textMuted, padding: '16px', textAlign: 'left', borderBottom: `1px solid ${THEME.border}`, fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },

    td: { padding: '16px', borderBottom: `1px solid ${THEME.border}`, color: THEME.textMain, fontSize: '14px' },

    customSelect: {

      control: (provided) => ({ ...provided, backgroundColor: THEME.bg, borderColor: THEME.border, color: '#fff', padding: '4px' }),

      menu: (provided) => ({ ...provided, backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}` }),

      singleValue: (provided) => ({ ...provided, color: '#fff' }),

      option: (provided, state) => ({ ...provided, backgroundColor: state.isFocused ? THEME.accentBlue : 'transparent', color: '#fff' })

    }

  };



  return (

    <div style={styles.container}>

      <div style={styles.sidebar}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingBottom: '20px', borderBottom: `1px solid ${THEME.border}` }}>

          <ShieldCheck size={28} color={THEME.accentBlue}/>

          <h3 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>BASIRAH <span style={{ color: THEME.accentBlue }}>360</span></h3>

        </div>

        <button style={styles.navLink(currentPage === 'dashboard')} onClick={() => { setCurrentPage('dashboard'); clearAllFilters(); }}><BarChart3 size={18}/> Global Telemetry</button>

        <button style={styles.navLink(currentPage === 'materials')} onClick={() => setCurrentPage('materials')}><Package size={18}/> Asset Registry</button>

        <button style={styles.navLink(currentPage === 'returns_page')} onClick={() => setCurrentPage('returns_page')}><RotateCcw size={18}/> Recovery Operations</button>

      </div>



      <div style={styles.mainContent}>

        {currentPage === 'dashboard' && (

          <div style={{ flex: 1, animation: 'fadeIn 0.3s ease-in' }}>

            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>Executive Operational Matrix</h2>

            <p style={{ color: THEME.textMuted, fontSize: '14px', marginBottom: '32px' }}>Real-time aggregated volumetric tracking. Select a logic node or chart bar below to isolate data streams.</p>



            <div style={styles.grid4}>

              <div style={styles.card(THEME.accentBlue, dashboardCardFilter === 'ALL')} onClick={() => {setDashboardCardFilter('ALL'); setActiveDrillDown({active: false});}}>

                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: `${THEME.accentBlue}15`, color: THEME.accentBlue }}><LayoutGrid size={20}/></div>

                <div><small style={styles.label}>Total Gross Stock</small><h3 style={{ fontSize: '24px', margin: 0, fontWeight: '700' }}>{totalStock} Units</h3></div>

              </div>

              <div style={styles.card(THEME.accentEmerald, dashboardCardFilter === 'AVAILABLE')} onClick={() => {setDashboardCardFilter('AVAILABLE'); setActiveDrillDown({active: false});}}>

                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: `${THEME.accentEmerald}15`, color: THEME.accentEmerald }}><Package size={20}/></div>

                <div><small style={styles.label}>Vault Reserve Available</small><h3 style={{ fontSize: '24px', margin: 0, fontWeight: '700' }}>{totalAvailable} Units</h3></div>

              </div>

              <div style={styles.card(THEME.accentAmber, dashboardCardFilter === 'LENDED')} onClick={() => setDashboardCardFilter('LENDED')}>

                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: `${THEME.accentAmber}15`, color: THEME.accentAmber }}><ArrowLeftRight size={20}/></div>

                <div><small style={styles.label}>Active Field Deployed</small><h3 style={{ fontSize: '24px', margin: 0, fontWeight: '700' }}>{totalLended} Units</h3></div>

              </div>

              <div style={styles.card(THEME.accentCrimson, dashboardCardFilter === 'OVERDUE')} onClick={() => setDashboardCardFilter('OVERDUE')}>

                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: `${THEME.accentCrimson}15`, color: THEME.accentCrimson }}><AlertTriangle size={20}/></div>

                <div><small style={styles.label}>Critical Overdue Risk</small><h3 style={{ fontSize: '24px', margin: 0, fontWeight: '700' }}>{criticalOverdueCount} Trails</h3></div>

              </div>

            </div>



            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>

              <div style={styles.box}>

                <h4 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '600', color: THEME.textMuted }}>NODE DEPLOYMENT VOLUMETRICS (CLICK BAR TO DRILL DOWN)</h4>

                <div style={{ height: '240px' }}>

                  <ResponsiveContainer width="100%" height="100%">

                    <BarChart data={siteChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.border}/>

                      <XAxis dataKey="name" stroke={THEME.textMuted} fontSize={11} tickLine={false} axisLine={false} />

                      <YAxis stroke={THEME.textMuted} fontSize={11} tickLine={false} axisLine={false} />

                      <Tooltip cursor={{fill: `${THEME.border}50`}} contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, borderRadius: '8px', fontSize: '12px' }} />

                      <Bar 

                        dataKey="totalLoaned" 

                        fill={THEME.accentBlue} 

                        radius={[4, 4, 0, 0]} 

                        barSize={28} 

                        onClick={handleChartDrillDown} 

                        cursor="pointer" 

                      >

                        {siteChartData.map((entry, index) => (

                          <Cell key={`cell-${index}`} fill={activeDrillDown.active && activeDrillDown.value === entry.name ? THEME.accentAmber : THEME.accentBlue} />

                        ))}

                      </Bar>

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              </div>



              <div style={styles.box}>

                <h4 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '600', color: THEME.textMuted }}>EFFICIENCY & RISK KPIs</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  <div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '13px', color: THEME.textMain }}>Global Utilization Target</span><span style={{ fontSize: '13px', fontWeight: '700', color: THEME.accentBlue }}>{globalUtilizationRate}%</span></div>

                    <div style={{ width: '100%', height: '6px', backgroundColor: THEME.border, borderRadius: '4px' }}><div style={{ width: `${globalUtilizationRate}%`, height: '100%', backgroundColor: THEME.accentBlue, borderRadius: '4px' }}></div></div>

                  </div>

                  <div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '13px', color: THEME.textMain }}>Asset Damage Burn Rate</span><span style={{ fontSize: '13px', fontWeight: '700', color: THEME.accentCrimson }}>{damageBurnRate}%</span></div>

                    <div style={{ width: '100%', height: '6px', backgroundColor: THEME.border, borderRadius: '4px' }}><div style={{ width: `${damageBurnRate}%`, height: '100%', backgroundColor: THEME.accentCrimson, borderRadius: '4px' }}></div></div>

                  </div>

                </div>

              </div>

            </div>



            <div style={styles.box}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>

                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>

                  Active Data Stream: <span style={{ color: THEME.accentBlue }}>{dashboardCardFilter}</span>

                  {activeDrillDown.active && <span style={{ color: THEME.accentAmber, marginLeft: '8px' }}>| Node: {activeDrillDown.value}</span>}

                </h4>

                {(dashboardCardFilter !== 'ALL' || activeDrillDown.active) && (

                  <button style={{ background: 'none', border: `1px solid ${THEME.border}`, color: THEME.textMain, cursor: 'pointer', fontSize: '12px', padding: '6px 12px', borderRadius: '4px' }} onClick={clearAllFilters}>

                    Clear Filters

                  </button>

                )}

              </div>

              

              <table style={styles.table}>

                <thead>

                  <tr>

                    <th style={styles.th}>Asset Nomenclature</th>

                    <th style={styles.th}>Current Operational Location</th>

                    <th style={styles.th}>Volumetric Balance</th>

                    <th style={styles.th}>Status Vector</th>

                  </tr>

                </thead>

                <tbody>

                  {generateTelemetryRows().map((row) => (

                    <tr key={row.id}>

                      <td style={styles.td}><b>{row.name}</b></td>

                      <td style={styles.td}><span style={{ color: THEME.textMuted }}>{row.location}</span></td>

                      <td style={styles.td}>{row.qty} Pcs</td>

                      <td style={styles.td}><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', backgroundColor: `${row.color}15`, color: row.color }}>{row.status}</span></td>

                    </tr>

                  ))}

                  {generateTelemetryRows().length === 0 && (

                    <tr><td colSpan="4" style={{...styles.td, textAlign: 'center', color: THEME.textMuted, padding: '32px'}}>No metrics match the current visual filter parameters.</td></tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}



        {/* ... (Returns and Asset Registry code remains identical to previous block) ... */}

        {currentPage === 'returns_page' && (

          <div style={{ animation: 'fadeIn 0.3s ease-in' }}>

            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>Recovery Operations Node</h2>

            <p style={{ color: THEME.textMuted, fontSize: '14px', marginBottom: '32px' }}>State-safe singular pipeline for resolving inbound asset logistics.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

              <div style={styles.box}>

                <h4 style={{ margin: '0 0 24px 0', fontSize: '15px', fontWeight: '600', color: THEME.textMuted }}>INBOUND RESOLUTION TRANSACTION</h4>

                <form onSubmit={handleReturnSubmit}>

                  <div style={{ marginBottom: '24px' }}>

                    <label style={styles.label}>Select Active Deployment Trail</label>

                    <Select key={`loan-omni-${dropdownResetKey}`} styles={styles.customSelect} options={activeTrailsOptions} value={selectedActiveLoan} placeholder="Search by site, material, or contractor..." onChange={(v) => setSelectedActiveLoan(v)} />

                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

                    <div><label style={styles.label}>Recovery Volume</label><input style={styles.input} type="number" required value={returnQuantity} onChange={(e) => setReturnQuantity(e.target.value)} placeholder="Qty" /></div>

                    <div>

                      <label style={styles.label}>Quality Audit Matrix</label>

                      <select style={styles.input} value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)}>

                        <option value="Good">Optimal (Good)</option>

                        <option value="Worn">Degraded (Worn)</option>

                        <option value="Damaged">Critical (Damaged)</option>

                      </select>

                    </div>

                  </div>

                  <button type="submit" style={styles.button(THEME.accentEmerald)}>Authorize Protocol Inbound</button>

                </form>

              </div>

              <div style={styles.box}>

                <h4 style={{ margin: '0 0 24px 0', fontSize: '15px', fontWeight: '600', color: THEME.textMuted }}>HISTORICAL CONDITION DISTRIBUTION</h4>

                <div style={{ width: '100%', height: '240px' }}>

                  <ResponsiveContainer width="100%" height="100%">

                    <PieChart>

                      <Pie data={Object.values(returns.reduce((acc, curr) => { const c = curr.returned_condition || 'Good'; if (!acc[c]) acc[c] = { name: c, value: 0 }; acc[c].value += Number(curr.returned_quantity || 0); return acc; }, { 'Good': { name: 'Good', value: 0 }, 'Worn': { name: 'Worn', value: 0 }, 'Damaged': { name: 'Damaged', value: 0 } }))} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">

                        {['Good', 'Worn', 'Damaged'].map((entry, index) => <Cell key={`cell-${index}`} fill={CONDITION_COLORS[entry]} stroke={THEME.cardBg} strokeWidth={3} />)}

                      </Pie>

                      <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, borderRadius: '8px' }} itemStyle={{ color: THEME.textMain }} />

                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: THEME.textMuted }}/>

                    </PieChart>

                  </ResponsiveContainer>

                </div>

              </div>

            </div>

          </div>

        )}



        {currentPage === 'materials' && (

          <div style={{ animation: 'fadeIn 0.3s ease-in' }}>

            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>Master Asset Registry</h2>

            <p style={{ color: THEME.textMuted, fontSize: '14px', marginBottom: '32px' }}>Architectural vault configurations and external deployment staging.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

              <div style={styles.box}>

                <h4 style={{ margin: '0 0 24px 0', fontSize: '15px', fontWeight: '600', color: THEME.textMuted }}>VAULT INGESTION</h4>

                <form onSubmit={handleAddMaterialSubmit}>

                  <div style={{ marginBottom: '16px' }}><label style={styles.label}>Nomenclature String</label><input style={styles.input} type="text" required value={newMaterialForm.name} onChange={(e) => setNewMaterialForm({...newMaterialForm, name: e.target.value})} placeholder="e.g. UX-90 Framework" /></div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

                    <div><label style={styles.label}>Category</label><input style={styles.input} type="text" required value={newMaterialForm.category} onChange={(e) => setNewMaterialForm({...newMaterialForm, category: e.target.value})} /></div>

                    <div><label style={styles.label}>Base Volume</label><input style={styles.input} type="number" required value={newMaterialForm.quantity} onChange={(e) => setNewMaterialForm({...newMaterialForm, quantity: e.target.value})} /></div>

                  </div>

                  <button type="submit" style={styles.button(THEME.accentBlue)}>Commit to Vault Storage</button>

                </form>

              </div>

              <div style={styles.box}>

                <h4 style={{ margin: '0 0 24px 0', fontSize: '15px', fontWeight: '600', color: THEME.textMuted }}>DEPLOYMENT OUTBOUND</h4>

                <form onSubmit={handleLoanSubmit}>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

                    <div><label style={styles.label}>Asset Profile</label><Select styles={styles.customSelect} options={materials.map(m => ({ value: m.id, label: `${m.name}` }))} onChange={(v) => setLoanForm({...loanForm, material_id: v ? v.value : null})} /></div>

                    <div><label style={styles.label}>Target Custodian</label><Select styles={styles.customSelect} options={contractors.map(c => ({ value: c.id, label: c.contact_person }))} onChange={(v) => setLoanForm({...loanForm, contractor_id: v ? v.value : null})} /></div>

                  </div>

                  <div style={{ marginBottom: '16px' }}><label style={styles.label}>Site Node Location</label><input style={styles.input} type="text" required value={loanForm.site_name} onChange={(e) => setLoanForm({...loanForm, site_name: e.target.value})} /></div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

                    <div><label style={styles.label}>Volume Out</label><input style={styles.input} type="number" required value={loanForm.quantity} onChange={(e) => setLoanForm({...loanForm, quantity: e.target.value})} /></div>

                    <div><label style={styles.label}>Deadline Timestamp</label><input style={styles.input} type="date" required value={loanForm.expected_return_date} onChange={(e) => setLoanForm({...loanForm, expected_return_date: e.target.value})} /></div>

                  </div>

                  <button type="submit" style={styles.button(THEME.accentAmber)}>Execute Field Dispatch</button>

                </form>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}

