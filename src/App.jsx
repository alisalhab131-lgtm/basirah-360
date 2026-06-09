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
    if (token) {
      syncSystemData();
    }
  }, [token]);

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
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 50 }}>
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
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          Logout
        </button>
      </div>

      {/* ================= SIDEBAR NAVIGATION ================= */}
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

      {/* ================= MAIN CONTENT MODULES ================= */}
      <div style={styles.mainContent}>
        
        {/* ================= TELEMETRY DASHBOARD VIEW ================= */}
        {currentPage === 'dashboard' && (
          <div>
            <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '700' }}>System Telemetry Metrics</h2>
            
            <div style={styles.grid4}>
              <div style={styles.card(THEME.accentBlue, dashboardCardFilter === 'ALL')} onClick={clearAllFilters}>
                <LayoutGrid size={24} color={THEME.accentBlue}/>
                <div>
                  <div style={styles.label}>Total Managed Stock</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{totalStock}</div>
                </div>
              </div>

              <div style={styles.card(THEME.accentEmerald, dashboardCardFilter === 'AVAILABLE')} onClick={() => setDashboardCardFilter('AVAILABLE')}>
                <Package size={24} color={THEME.accentEmerald}/>
                <div>
                  <div style={styles.label}>Vault Reserve</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{totalAvailable}</div>
                </div>
              </div>

              <div style={styles.card(THEME.accentAmber, dashboardCardFilter === 'LENDED')} onClick={() => setDashboardCardFilter('LENDED')}>
                <ArrowLeftRight size={24} color={THEME.accentAmber}/>
                <div>
                  <div style={styles.label}>Active Deployments</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{totalLended}</div>
                </div>
              </div>

              <div style={styles.card(THEME.accentCrimson, dashboardCardFilter === 'OVERDUE')} onClick={() => setDashboardCardFilter('OVERDUE')}>
                <AlertTriangle size={24} color={THEME.accentCrimson}/>
                <div>
                  <div style={styles.label}>Critical Overdue</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{criticalOverdueCount}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div style={styles.box}>
                <div style={styles.label}>Deployment Demographics by Location</div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={siteChartData} onClick={handleChartDrillDown}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                      <XAxis dataKey="name" stroke={THEME.textMuted} />
                      <YAxis stroke={THEME.textMuted} />
                      <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border }} />
                      <Bar dataKey="totalLoaned" fill={THEME.accentBlue} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={styles.box}>
                <div style={styles.label}>Condition Analytics Mix</div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Good', value: totalGoodStock },
                          { name: 'Worn', value: totalWornStock },
                          { name: 'Damaged', value: totalDamagedStock }
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      >
                        <Cell fill={CONDITION_COLORS.Good} />
                        <Cell fill={CONDITION_COLORS.Worn} />
                        <Cell fill={CONDITION_COLORS.Damaged} />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={styles.box}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={styles.label}>Active Tracking Streams {dashboardCardFilter !== 'ALL' && `(${dashboardCardFilter})`}</div>
                {(dashboardCardFilter !== 'ALL' || activeDrillDown.active) && (
                  <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: THEME.accentBlue, cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Clear Filters</button>
                )}
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Asset Nomenclature</th>
                    <th style={styles.th}>Allocation Target / Hub</th>
                    <th style={styles.th}>Volumetric Quantities</th>
                    <th style={styles.th}>Status Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {generateTelemetryRows().map(row => (
                    <tr key={row.id}>
                      <td style={styles.td}>{row.name}</td>
                      <td style={styles.td}>{row.location}</td>
                      <td style={styles.td}>{row.qty} units</td>
                      <td style={styles.td}>
                        <span style={{ color: row.color, fontWeight: '700', fontSize: '12px' }}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= ASSET REGISTRY MANAGEMENT VIEW ================= */}
        {currentPage === 'materials' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div style={styles.box}>
              <div style={styles.label}>Register New Logistics Inventory Asset</div>
              <form onSubmit={handleAddMaterialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={styles.label}>Asset Name</label>
                  <input style={styles.input} value={newMaterialForm.name} onChange={e => setNewMaterialForm({...newMaterialForm, name: e.target.value})} required placeholder="e.g. Compound Mix"/>
                </div>
                <div>
                  <label style={styles.label}>Classification Category</label>
                  <input style={styles.input} value={newMaterialForm.category} onChange={e => setNewMaterialForm({...newMaterialForm, category: e.target.value})} required placeholder="e.g. Raw Material"/>
                </div>
                <div>
                  <label style={styles.label}>Initial Volumetric Base Quantity</label>
                  <input type="number" style={styles.input} value={newMaterialForm.quantity} onChange={e => setNewMaterialForm({...newMaterialForm, quantity: e.target.value})} required placeholder="e.g. 500"/>
                </div>
                <button type="submit" style={styles.button(THEME.accentBlue)}>Commit Asset to Registry</button>
              </form>
            </div>

            <div style={styles.box}>
              <div style={styles.label}>Authorized Custodian Verification Gateway</div>
              <form onSubmit={handleAddContractorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={styles.label}>Responsible Agent / Contact Representative</label>
                  <input style={styles.input} value={newContractorForm.contact_person} onChange={e => setNewContractorForm({...newContractorForm, contact_person: e.target.value})} required placeholder="e.g. Operations Manager"/>
                </div>
                <div>
                  <label style={styles.label}>Company / Institution Node</label>
                  <input style={styles.input} value={newContractorForm.company_name} onChange={e => setNewContractorForm({...newContractorForm, company_name: e.target.value})} required placeholder="e.g. Regional Cluster Logistics"/>
                </div>
                <button type="submit" style={styles.button(THEME.accentEmerald)}>Register Authorized Identity</button>
              </form>
            </div>
          </div>
        )}

        {/* ================= RECOVERY OPERATIONS & DISPATCH VIEW ================= */}
        {currentPage === 'returns_page' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div style={styles.box}>
              <div style={styles.label}>Authorize Logistic Route Dispatch Allocation</div>
              <form onSubmit={handleLoanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={styles.label}>Target Logistics Inventory Material</label>
                  <select style={styles.input} onChange={e => setLoanForm({...loanForm, material_id: e.target.value})} required value={loanForm.material_id || ''}>
                    <option value="" disabled>Select registry material...</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.quantity} available)</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Verified Custodian Node Target</label>
                  <select style={styles.input} onChange={e => setLoanForm({...loanForm, contractor_id: e.target.value})} required value={loanForm.contractor_id || ''}>
                    <option value="" disabled>Select clear agent profile...</option>
                    {contractors.map(c => <option key={c.id} value={c.id}>{c.contact_person} — {c.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Allocation Target Hub / Site Name</label>
                  <input style={styles.input} value={loanForm.site_name} onChange={e => setLoanForm({...loanForm, site_name: e.target.value})} required placeholder="e.g. Healthcare Ops Cluster A"/>
                </div>
                <div>
                  <label style={styles.label}>Allocation Volume Quantity</label>
                  <input type="number" style={styles.input} value={loanForm.quantity} onChange={e => setLoanForm({...loanForm, quantity: e.target.value})} required placeholder="Allocated Amount"/>
                </div>
                <div>
                  <label style={styles.label}>Expected Material Return Evaluation Date</label>
                  <input type="date" style={styles.input} value={loanForm.expected_return_date} onChange={e => setLoanForm({...loanForm, expected_return_date: e.target.value})} required/>
                </div>
                <button type="submit" style={styles.button(THEME.accentBlue)}>Authorize Deployment Chain Route</button>
              </form>
            </div>

            <div style={styles.box}>
              <div style={styles.label}>Process Asset Recovery Pipeline Intake</div>
              <form onSubmit={handleReturnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={styles.label}>Active Deployment Trail Identification Token</label>
                  <Select
                    key={dropdownResetKey}
                    options={activeTrailsOptions}
                    styles={styles.customSelect}
                    onChange={(opt) => setSelectedActiveLoan(opt)}
                    placeholder="Search or select active deployment trails..."
                    isClearable
                  />
                </div>
                <div>
                  <label style={styles.label}>Intake Recovery Quantity Verification</label>
                  <input type="number" style={styles.input} value={returnQuantity} onChange={e => setReturnQuantity(e.target.value)} required placeholder="Verified Returned Units"/>
                </div>
                <div>
                  <label style={styles.label}>Evaluated Post-Deployment Asset Material Condition</label>
                  <select style={styles.input} value={returnCondition} onChange={e => setReturnCondition(e.target.value)}>
                    <option value="Good">Good Condition (Restorable to Active Reserve)</option>
                    <option value="Worn">Worn Condition (Requires Service Review)</option>
                    <option value="Damaged">Damaged Condition (Critical System Scrap)</option>
                  </select>
                </div>
                <button type="submit" style={styles.button(THEME.accentAmber)}>Process Material Pipeline Recovery Route</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  ) : (
    <Login setToken={setToken} />
  );
}