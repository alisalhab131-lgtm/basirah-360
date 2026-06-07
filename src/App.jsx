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
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://basirah-backend-1.onrender.com';
export default function App() {
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

  useEffect(() => { syncSystemData(); }, []);

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

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingBottom: '20px', borderBottom: `1px solid ${THEME.border}` }}>
          <ShieldCheck size={28} color={THEME.accentBlue}/>
          <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>BASIRAH <span style={{ color: THEME.accentBlue }}>360</span></h3>
        </div>
        <button style={styles.navLink(currentPage === 'dashboard')} onClick={() => { setCurrentPage('dashboard'); clearAllFilters(); }}><BarChart3 size={18}/> Telemetry Dashboard</button>
        <button style={styles.navLink(currentPage === 'materials')} onClick={() => setCurrentPage('materials')}><Package size={18}/> Asset Registry</button>
        <button style={styles.navLink(currentPage === 'returns_page')} onClick={() => setCurrentPage('returns_page')}><RotateCcw size={18}/> Recovery Ops</button>
      </div>

      <div style={styles.mainContent}>
        {currentPage === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '32px' }}>Operational Matrix Dashboard</h2>

            {/* DYNAMIC CARD COUNTERS */}
            <div style={styles.grid4}>
              <div style={styles.card(THEME.accentBlue, dashboardCardFilter === 'ALL')} onClick={() => {setDashboardCardFilter('ALL'); setActiveDrillDown({active: false});}}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: `${THEME.accentBlue}15`, color: THEME.accentBlue }}><LayoutGrid size={20}/></div>
                <div><small style={styles.label}>Total Gross Stock</small><h3 style={{ fontSize: '24px', margin: 0 }}>{totalStock} Units</h3></div>
              </div>
              <div style={styles.card(THEME.accentEmerald, dashboardCardFilter === 'AVAILABLE')} onClick={() => {setDashboardCardFilter('AVAILABLE'); setActiveDrillDown({active: false});}}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: `${THEME.accentEmerald}15`, color: THEME.accentEmerald }}><Package size={20}/></div>
                <div><small style={styles.label}>Vault Available</small><h3 style={{ fontSize: '24px', margin: 0 }}>{totalAvailable} Units</h3></div>
              </div>
              <div style={styles.card(THEME.accentAmber, dashboardCardFilter === 'LENDED')} onClick={() => setDashboardCardFilter('LENDED')}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: `${THEME.accentAmber}15`, color: THEME.accentAmber }}><ArrowLeftRight size={20}/></div>
                <div><small style={styles.label}>Active Field Deployed</small><h3 style={{ fontSize: '24px', margin: 0 }}>{totalLended} Units</h3></div>
              </div>
              <div style={styles.card(THEME.accentCrimson, dashboardCardFilter === 'OVERDUE')} onClick={() => setDashboardCardFilter('OVERDUE')}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: `${THEME.accentCrimson}15`, color: THEME.accentCrimson }}><AlertTriangle size={20}/></div>
                <div><small style={styles.label}>Overdue Actions</small><h3 style={{ fontSize: '24px', margin: 0 }}>{criticalOverdueCount} Trails</h3></div>
              </div>
            </div>

            {/* LIVE CONDITION STATUS FLASHCARDS */}
            <div style={styles.grid4}>
              <div style={{ ...styles.box, borderLeft: `4px solid ${THEME.accentEmerald}`, marginBottom: 0, padding: '20px' }}>
                <small style={styles.label}>Good Condition Total</small><h3 style={{ fontSize: '26px', fontWeight: '800', color: THEME.accentEmerald }}>{totalGoodStock} Pcs</h3>
              </div>
              <div style={{ ...styles.box, borderLeft: `4px solid ${THEME.accentAmber}`, marginBottom: 0, padding: '20px' }}>
                <small style={styles.label}>Worn Condition Total</small><h3 style={{ fontSize: '26px', fontWeight: '800', color: THEME.accentAmber }}>{totalWornStock} Pcs</h3>
              </div>
              <div style={{ ...styles.box, borderLeft: `4px solid ${THEME.accentCrimson}`, marginBottom: 0, padding: '20px' }}>
                <small style={styles.label}>Damaged Condition Total</small><h3 style={{ fontSize: '26px', fontWeight: '800', color: THEME.accentCrimson }}>{totalDamagedStock} Pcs</h3>
              </div>
            </div>
            <br />

            {/* CHARTS GRAPH SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div style={styles.box}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '13px', color: THEME.textMuted }}>NODE SITE VOLUMETRICS (CLICK BAR TO FILTER)</h4>
                <div style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={siteChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.border}/>
                      <XAxis dataKey="name" stroke={THEME.textMuted} fontSize={11} />
                      <YAxis stroke={THEME.textMuted} fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border }} />
                      <Bar dataKey="totalLoaned" fill={THEME.accentBlue} radius={[4, 4, 0, 0]} onClick={handleChartDrillDown} cursor="pointer">
                        {siteChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={activeDrillDown.active && activeDrillDown.value === entry.name ? THEME.accentAmber : THEME.accentBlue} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={styles.box}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '13px', color: THEME.textMuted }}>CUSTODIAN CONDITION BREAKDOWN MATRIX</h4>
                <div style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={custodianChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.border}/>
                      <XAxis dataKey="name" stroke={THEME.textMuted} fontSize={11} />
                      <YAxis stroke={THEME.textMuted} fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border }} />
                      <Legend />
                      <Bar dataKey="Good" stackId="a" fill={THEME.accentEmerald} />
                      <Bar dataKey="Worn" stackId="a" fill={THEME.accentAmber} />
                      <Bar dataKey="Damaged" stackId="a" fill={THEME.accentCrimson} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* MAIN TELEMETRY DATA LISTING */}
            <div style={styles.box}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                  Stream Feed Focus: <span style={{ color: THEME.accentBlue }}>{dashboardCardFilter}</span>
                  {activeDrillDown.active && <span style={{ color: THEME.accentAmber, marginLeft: '8px' }}>| Node: {activeDrillDown.value}</span>}
                </h4>
                {(dashboardCardFilter !== 'ALL' || activeDrillDown.active) && (
                  <button style={{ background: 'none', border: `1px solid ${THEME.border}`, color: THEME.textMain, cursor: 'pointer', fontSize: '12px', padding: '6px 12px', borderRadius: '4px' }} onClick={clearAllFilters}>Reset Focus Filters</button>
                )}
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Asset Nomenclature</th>
                    <th style={styles.th}>Placement Node Location</th>
                    <th style={styles.th}>Outstanding Balance</th>
                    <th style={styles.th}>Telemetry Vector</th>
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
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REGISTRY INGESTION VIEW */}
        {currentPage === 'materials' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '32px' }}>Staging Registry Nodes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div style={styles.box}>
                <h4 style={{ margin: '0 0 24px 0', fontSize: '15px', color: THEME.textMuted }}>1. VAULT ASSET HARDWARE INGESTION</h4>
                <form onSubmit={handleAddMaterialSubmit}>
                  <div style={{ marginBottom: '16px' }}><label style={styles.label}>Nomenclature String</label><input style={styles.input} type="text" required value={newMaterialForm.name} onChange={(e) => setNewMaterialForm({...newMaterialForm, name: e.target.value})} placeholder="e.g. Digiations Device Frame" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div><label style={styles.label}>Category Group</label><input style={styles.input} type="text" required value={newMaterialForm.category} onChange={(e) => setNewMaterialForm({...newMaterialForm, category: e.target.value})} /></div>
                    <div><label style={styles.label}>Base Volume</label><input style={styles.input} type="number" required value={newMaterialForm.quantity} onChange={(e) => setNewMaterialForm({...newMaterialForm, quantity: e.target.value})} /></div>
                  </div>
                  <button type="submit" style={styles.button(THEME.accentBlue)}>Commit to Vault Storage</button>
                </form>
              </div>

              <div style={styles.box}>
                <h4 style={{ margin: '0 0 24px 0', fontSize: '15px', color: THEME.textMuted }}>2. REGISTER CUSTODIAN AFFILIATIONS</h4>
                <form onSubmit={handleAddContractorSubmit}>
                  <div style={{ marginBottom: '16px' }}><label style={styles.label}>Operator Contact Name</label><input style={styles.input} type="text" required value={newContractorForm.contact_person} onChange={(e) => setNewContractorForm({...newContractorForm, contact_person: e.target.value})} placeholder="e.g. Samaher" /></div>
                  <div style={{ marginBottom: '24px' }}><label style={styles.label}>Enterprise Organization Affiliation</label><input style={styles.input} type="text" required value={newContractorForm.company_name} onChange={(e) => setNewContractorForm({...newContractorForm, company_name: e.target.value})} placeholder="e.g. Dallah Health" /></div>
                  <button type="submit" style={styles.button(THEME.accentBlue)}>Authenticate Custodian Identity</button>
                </form>
              </div>
            </div>

            <div style={styles.box}>
              <h4 style={{ margin: '0 0 24px 0', fontSize: '15px', color: THEME.textMuted }}>3. LOG FIELD OUTBOUND DISPATCH</h4>
              <form onSubmit={handleLoanSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div><label style={styles.label}>Asset Profile Class</label><Select styles={styles.customSelect} options={materials.map(m => ({ value: m.id, label: `${m.name} (Available: ${m.quantity})` }))} onChange={(v) => setLoanForm({...loanForm, material_id: v ? v.value : null})} /></div>
                  <div><label style={styles.label}>Target Custodian Entity</label><Select styles={styles.customSelect} options={contractors.map(c => ({ value: c.id, label: `${c.contact_person} (${c.company_name})` }))} onChange={(v) => setLoanForm({...loanForm, contractor_id: v ? v.value : null})} /></div>
                </div>
                <div style={{ marginBottom: '16px' }}><label style={styles.label}>Placement Node Location</label><input style={styles.input} type="text" required value={loanForm.site_name} onChange={(e) => setLoanForm({...loanForm, site_name: e.target.value})} placeholder="e.g. Sector Hub Alpha" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div><label style={styles.label}>Outbound Quantity Volume</label><input style={styles.input} type="number" required value={loanForm.quantity} onChange={(e) => setLoanForm({...loanForm, quantity: e.target.value})} /></div>
                  <div><label style={styles.label}>Expected Recovery Target Date</label><input style={styles.input} type="date" required value={loanForm.expected_return_date} onChange={(e) => setLoanForm({...loanForm, expected_return_date: e.target.value})} /></div>
                </div>
                <button type="submit" style={styles.button(THEME.accentAmber)}>Authorize Field Dispatch Pipeline</button>
              </form>
            </div>
          </div>
        )}

        {/* INBOUND OPERATIONS RESOLUTION RECOVERY RECYCLING VIEW */}
        {currentPage === 'returns_page' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '32px' }}>Inbound Recovery Terminal</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={styles.box}>
                <h4 style={{ margin: '0 0 24px 0', fontSize: '15px', color: THEME.textMuted }}>INBOUND LOGISTICS RESOLUTION</h4>
                <form onSubmit={handleReturnSubmit}>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={styles.label}>Select Active Deployment Trail Vector</label>
                    <Select key={`loan-omni-${dropdownResetKey}`} styles={styles.customSelect} options={activeTrailsOptions} value={selectedActiveLoan} placeholder="Search running trails by node site or contractor name..." onChange={(v) => setSelectedActiveLoan(v)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div><label style={styles.label}>Inbound Volume Restored</label><input style={styles.input} type="number" required value={returnQuantity} onChange={(e) => setReturnQuantity(e.target.value)} placeholder="Qty" /></div>
                    <div>
                      <label style={styles.label}>Quality Assessment Value Matrix</label>
                      <select style={styles.input} value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)}>
                        <option value="Good">Optimal State (Good)</option>
                        <option value="Worn">Degraded State (Worn)</option>
                        <option value="Damaged">Critical Damage State (Damaged)</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" style={styles.button(THEME.accentEmerald)}>Log Inbound Recovery Verification</button>
                </form>
              </div>

              <div style={styles.box}>
                <h4 style={{ margin: '0 0 24px 0', fontSize: '15px', color: THEME.textMuted }}>AGGREGATE DEPLOYED QUALITY RATIO</h4>
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[ { name: 'Good', value: totalGoodStock }, { name: 'Worn', value: totalWornStock }, { name: 'Damaged', value: totalDamagedStock } ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {['Good', 'Worn', 'Damaged'].map((entry, index) => <Cell key={`cell-${index}`} fill={CONDITION_COLORS[entry]} stroke={THEME.cardBg} strokeWidth={3} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: THEME.textMuted }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}