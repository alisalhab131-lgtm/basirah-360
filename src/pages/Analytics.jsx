import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { MapPin, Users, ChevronRight, ChevronLeft, Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { API_BASE, THEME, CONDITION_COLORS, STYLES } from '../utils/theme';

const BADGE = (color, label) => (
  <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: '700' }}>
    {label}
  </span>
);

const msgStyle = (type) => ({
  padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
  backgroundColor: type === 'success' ? `${THEME.accentEmerald}18` : `${THEME.accentCrimson}18`,
  color: type === 'success' ? THEME.accentEmerald : THEME.accentCrimson,
  border: `1px solid ${type === 'success' ? THEME.accentEmerald : THEME.accentCrimson}44`,
});

const returnQty = (r) => Number(r.quantity || 0);

export default function AnalyticsPage({ materials, contractors, loans, returns, getLoanRemainingQty, syncSystemData }) {
  const [drillType, setDrillType] = useState(null);   // 'site' | 'contractor' | 'condition' | null
  const [drillValue, setDrillValue] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState(null);

  // Report filter state
  const [reportSite, setReportSite] = useState('All');
  const [reportMaterial, setReportMaterial] = useState('All');
  const [reportContractor, setReportContractor] = useState('All');

  // ── Delete a return record (reverses stock + loan status on the backend) ──
  const handleDeleteReturn = async (returnId) => {
    if (!window.confirm('Delete this return record? The quantity it restored to stock will be reversed and the loan may reopen.')) return;
    setDeletingId(returnId); setDeleteMsg(null);
    try {
      await axios.delete(`${API_BASE}/api/returns/${returnId}`);
      await syncSystemData();
      setDeleteMsg({ type: 'success', text: 'Return deleted and reversed.' });
    } catch (err) {
      setDeleteMsg({ type: 'error', text: err.response?.data?.error || 'Failed to delete return.' });
    } finally { setDeletingId(null); }
  };

  // ── Global quantity-based KPIs ─────────────────────────────────────────
  const totalLoanedQty = loans.reduce((s, l) => s + Number(l.quantity || 0), 0);
  const totalReturnedQty = returns.reduce((s, r) => s + returnQty(r), 0);
  const totalRemainingQty = Math.max(0, totalLoanedQty - totalReturnedQty);
  const totalOverdueQty = loans.reduce((s, l) => {
    if (l.expected_return_date && new Date(l.expected_return_date) < new Date() && getLoanRemainingQty(l.id) > 0) {
      return s + getLoanRemainingQty(l.id);
    }
    return s;
  }, 0);

  const globalGoodQty = returns.filter(r => r.returned_condition === 'Good').reduce((s, r) => s + returnQty(r), 0);
  const globalWornQty = returns.filter(r => r.returned_condition === 'Worn').reduce((s, r) => s + returnQty(r), 0);
  const globalDamagedQty = returns.filter(r => r.returned_condition === 'Damaged').reduce((s, r) => s + returnQty(r), 0);
  const globalConditionTotal = globalGoodQty + globalWornQty + globalDamagedQty;
  const pct = (n) => globalConditionTotal > 0 ? Math.round((n / globalConditionTotal) * 100) : 0;

  // ── Site stats (quantity-based) ─────────────────────────────────────────
  const siteStats = Object.values(
    loans.reduce((acc, l) => {
      const site = (l.site_name || 'Unknown').trim();
      if (!acc[site]) acc[site] = { name: site, loaned: 0, returnedQty: 0, overdue: 0, goodQty: 0, wornQty: 0, damagedQty: 0, loanIds: [] };
      acc[site].loaned += Number(l.quantity || 0);
      acc[site].loanIds.push(l.id);
      if (l.expected_return_date && new Date(l.expected_return_date) < new Date() && getLoanRemainingQty(l.id) > 0)
        acc[site].overdue += getLoanRemainingQty(l.id);
      return acc;
    }, {})
  ).map(s => {
    returns.forEach(r => {
      if (s.loanIds.includes(Number(r.loan_id))) {
        const q = returnQty(r);
        s.returnedQty += q;
        if (r.returned_condition === 'Good') s.goodQty += q;
        if (r.returned_condition === 'Worn') s.wornQty += q;
        if (r.returned_condition === 'Damaged') s.damagedQty += q;
      }
    });
    const condTotal = s.goodQty + s.wornQty + s.damagedQty;
    return {
      ...s,
      remaining: Math.max(0, s.loaned - s.returnedQty),
      healthRate: condTotal > 0 ? Math.round((s.goodQty / condTotal) * 100) : null,
      returnRate: s.loaned > 0 ? Math.round((s.returnedQty / s.loaned) * 100) : 0,
    };
  }).sort((a, b) => b.loaned - a.loaned);

  // ── Contractor stats (quantity-based) ───────────────────────────────────
  const contractorStats = contractors.map(c => {
    const cLoans = loans.filter(l => String(l.contractor_id) === String(c.id));
    const loaned = cLoans.reduce((s, l) => s + Number(l.quantity || 0), 0);
    const loanIds = cLoans.map(l => l.id);
    let returnedQty = 0, goodQty = 0, wornQty = 0, damagedQty = 0, overdue = 0;
    returns.forEach(r => {
      if (loanIds.includes(Number(r.loan_id))) {
        const q = returnQty(r);
        returnedQty += q;
        if (r.returned_condition === 'Good') goodQty += q;
        if (r.returned_condition === 'Worn') wornQty += q;
        if (r.returned_condition === 'Damaged') damagedQty += q;
      }
    });
    cLoans.forEach(l => {
      if (l.expected_return_date && new Date(l.expected_return_date) < new Date() && getLoanRemainingQty(l.id) > 0)
        overdue += getLoanRemainingQty(l.id);
    });
    const condTotal = goodQty + wornQty + damagedQty;
    return {
      ...c, loaned, returnedQty, goodQty, wornQty, damagedQty, overdue,
      healthRate: condTotal > 0 ? Math.round((goodQty / condTotal) * 100) : null,
      returnRate: loaned > 0 ? Math.round((returnedQty / loaned) * 100) : 0,
      stillOut: Math.max(0, loaned - returnedQty),
      loanIds,
      sites: [...new Set(cLoans.map(l => l.site_name).filter(Boolean))],
    };
  }).sort((a, b) => b.loaned - a.loaned);

  // ── Drill-down datasets ─────────────────────────────────────────────────
  const selectedSite = drillType === 'site' ? siteStats.find(s => s.name === drillValue) : null;
  const siteLoanHistory = selectedSite
    ? loans.filter(l => (l.site_name || '').trim() === selectedSite.name).map(l => {
        const lReturns = returns.filter(r => Number(r.loan_id) === l.id);
        const retQty = lReturns.reduce((s, r) => s + returnQty(r), 0);
        return { ...l, retQty, remaining: getLoanRemainingQty(l.id), lReturns };
      })
    : [];
  const siteReturnRecords = selectedSite
    ? returns.filter(r => selectedSite.loanIds.includes(Number(r.loan_id)))
    : [];

  const selectedContractor = drillType === 'contractor' ? contractorStats.find(c => String(c.id) === String(drillValue)) : null;
  const contractorLoanHistory = selectedContractor
    ? loans.filter(l => String(l.contractor_id) === String(selectedContractor.id)).map(l => {
        const lReturns = returns.filter(r => Number(r.loan_id) === l.id);
        const retQty = lReturns.reduce((s, r) => s + returnQty(r), 0);
        return { ...l, retQty, remaining: getLoanRemainingQty(l.id), lReturns };
      })
    : [];
  const contractorReturnRecords = selectedContractor
    ? returns.filter(r => selectedContractor.loanIds.includes(Number(r.loan_id)))
    : [];

  // Global condition drill (click a Good/Worn/Damaged % card)
  const conditionRecords = drillType === 'condition'
    ? returns.filter(r => r.returned_condition === drillValue)
    : [];

  const exitDrill = () => { setDrillType(null); setDrillValue(null); };

  const condPieQty = (good, worn, damaged) =>
    [{ name: 'Good', value: good }, { name: 'Worn', value: worn }, { name: 'Damaged', value: damaged }].filter(d => d.value > 0);

  const BackBtn = () => (
    <button onClick={exitDrill} style={{ background: 'none', border: 'none', color: THEME.accentBlue, cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
      <ChevronLeft size={16} /> Back to Analytics
    </button>
  );

  const StatGrid = ({ stats }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
      {stats.map(k => (
        <div key={k.label} style={{ ...STYLES.box, marginBottom: 0, padding: '18px' }}>
          <div style={STYLES.label}>{k.label}</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: k.color }}>{k.value}</div>
        </div>
      ))}
    </div>
  );

  const DeleteReturnBtn = ({ id }) => (
    <button
      onClick={() => handleDeleteReturn(id)}
      disabled={deletingId === id}
      style={{
        padding: '4px 10px', borderRadius: '5px', border: `1px solid ${THEME.accentCrimson}55`,
        backgroundColor: `${THEME.accentCrimson}10`, color: THEME.accentCrimson, fontSize: '11px',
        cursor: deletingId === id ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: deletingId === id ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', gap: '4px',
      }}
    >
      <Trash2 size={12} /> {deletingId === id ? '...' : 'Delete'}
    </button>
  );

  // ── Report generator ─────────────────────────────────────────────────────
  const uniqueSites = [...new Set(loans.map(l => l.site_name).filter(Boolean))];

  const buildFilteredLoans = () => loans.filter(l => {
    if (reportSite !== 'All' && (l.site_name || '') !== reportSite) return false;
    if (reportMaterial !== 'All' && String(l.material_id) !== String(reportMaterial)) return false;
    if (reportContractor !== 'All' && String(l.contractor_id) !== String(reportContractor)) return false;
    return true;
  });

  const buildFilteredReturns = () => {
    const filteredLoanIds = new Set(buildFilteredLoans().map(l => l.id));
    return returns.filter(r => filteredLoanIds.has(Number(r.loan_id)));
  };

  const downloadReport = () => {
    const fLoans = buildFilteredLoans();
    const fReturns = buildFilteredReturns();

    const loanSheet = fLoans.map(l => ({
      Material: l.material_name,
      Contractor: l.contact_person,
      Company: l.company_name,
      Site: l.site_name || '—',
      'Qty Loaned': l.quantity,
      'Qty Remaining': getLoanRemainingQty(l.id),
      'Due Date': l.expected_return_date || '—',
      Status: getLoanRemainingQty(l.id) > 0
        ? (l.expected_return_date && new Date(l.expected_return_date) < new Date() ? 'Overdue' : 'Active')
        : 'Closed',
    }));

    const returnSheet = fReturns.map(r => ({
      Material: r.material_name,
      Contractor: r.contact_person,
      Site: r.site_name || '—',
      'Qty Returned': returnQty(r),
      Condition: r.returned_condition,
      'Return Date': r.return_date,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(loanSheet.length ? loanSheet : [{ Note: 'No matching loans' }]), 'Loans');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(returnSheet.length ? returnSheet : [{ Note: 'No matching returns' }]), 'Returns');

    const parts = [];
    if (reportSite !== 'All') parts.push(reportSite);
    if (reportContractor !== 'All') {
      const c = contractors.find(c => String(c.id) === String(reportContractor));
      if (c) parts.push(c.company_name || c.contact_person);
    }
    if (reportMaterial !== 'All') {
      const m = materials.find(m => String(m.id) === String(reportMaterial));
      if (m) parts.push(m.name);
    }
    const suffix = parts.length ? '_' + parts.join('_').replace(/\s+/g, '-') : '_All';
    XLSX.writeFile(wb, `Basirah_Report${suffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const ReportPanel = () => (
    <div style={STYLES.box}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Download size={16} color={THEME.accentEmerald} />
        <div style={{ ...STYLES.label, marginBottom: 0 }}>Download Filtered Report</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        <div>
          <label style={STYLES.label}>Site</label>
          <select style={STYLES.input} value={reportSite} onChange={e => setReportSite(e.target.value)}>
            <option value="All">All Sites</option>
            {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={STYLES.label}>Material</label>
          <select style={STYLES.input} value={reportMaterial} onChange={e => setReportMaterial(e.target.value)}>
            <option value="All">All Materials</option>
            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label style={STYLES.label}>Contractor</label>
          <select style={STYLES.input} value={reportContractor} onChange={e => setReportContractor(e.target.value)}>
            <option value="All">All Contractors</option>
            {contractors.map(c => <option key={c.id} value={c.id}>{c.contact_person} — {c.company_name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ fontSize: '12px', color: THEME.textMuted, marginBottom: '14px' }}>
        {buildFilteredLoans().length} matching loan(s), {buildFilteredReturns().length} matching return(s) will be included.
      </div>
      <button onClick={downloadReport} style={{ ...STYLES.button(THEME.accentEmerald), width: 'auto', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <Download size={14} /> Download Report (.xlsx)
      </button>
    </div>
  );

  const ConditionOverviewCards = ({ good, worn, damaged, total }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
      {[
        { label: 'Good', qty: good, color: CONDITION_COLORS.Good },
        { label: 'Worn', qty: worn, color: CONDITION_COLORS.Worn },
        { label: 'Damaged', qty: damaged, color: CONDITION_COLORS.Damaged },
      ].map(c => {
        const p = total > 0 ? Math.round((c.qty / total) * 100) : 0;
        return (
          <div
            key={c.label}
            onClick={() => { setDrillType('condition'); setDrillValue(c.label); }}
            style={{ ...STYLES.box, marginBottom: 0, padding: '18px', cursor: 'pointer', border: `1px solid ${c.color}44`, transition: 'transform 0.1s' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={STYLES.label}>{c.label} Returns</div>
              <ChevronRight size={14} color={THEME.textMuted} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: c.color }}>{p}%</div>
            <div style={{ fontSize: '12px', color: THEME.textMuted }}>{c.qty} unit(s) · click to see details</div>
          </div>
        );
      })}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // DRILL VIEW: Global condition (click a Good/Worn/Damaged card)
  // ═══════════════════════════════════════════════════════════════════════
  if (drillType === 'condition') return (
    <div>
      <BackBtn />
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Returns marked: {drillValue}</h2>
      <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>
        {conditionRecords.length} record(s) · {conditionRecords.reduce((s, r) => s + returnQty(r), 0)} unit(s) total
      </p>
      {deleteMsg && <div style={{ ...msgStyle(deleteMsg.type), marginBottom: '16px' }}>{deleteMsg.text}</div>}
      <div style={STYLES.box}>
        <table style={STYLES.table}>
          <thead><tr>
            <th style={STYLES.th}>Material</th><th style={STYLES.th}>Contractor</th><th style={STYLES.th}>Site</th>
            <th style={STYLES.th}>Qty Returned</th><th style={STYLES.th}>Return Date</th><th style={STYLES.th}></th>
          </tr></thead>
          <tbody>
            {conditionRecords.length === 0
              ? <tr><td colSpan={6} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No records</td></tr>
              : conditionRecords.map(r => (
                <tr key={r.id}>
                  <td style={STYLES.td}>{r.material_name}</td>
                  <td style={STYLES.td}>{r.contact_person}</td>
                  <td style={STYLES.td}>{r.site_name || '—'}</td>
                  <td style={{ ...STYLES.td, fontWeight: '700', color: THEME.accentEmerald }}>{returnQty(r)}</td>
                  <td style={STYLES.td}>{r.return_date || '—'}</td>
                  <td style={STYLES.td}><DeleteReturnBtn id={r.id} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // DRILL VIEW: Site
  // ═══════════════════════════════════════════════════════════════════════
  if (drillType === 'site' && selectedSite) return (
    <div>
      <BackBtn />
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Site: {selectedSite.name}</h2>
      <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>Full utilization and condition breakdown</p>
      <StatGrid stats={[
        { label: 'Total Loaned (qty)', value: selectedSite.loaned, color: THEME.accentBlue },
        { label: 'Total Returned (qty)', value: selectedSite.returnedQty, color: THEME.accentEmerald },
        { label: 'Remaining (qty)', value: selectedSite.remaining, color: THEME.accentAmber },
        { label: 'Overdue (qty)', value: selectedSite.overdue, color: THEME.accentCrimson },
        { label: 'Return Rate', value: `${selectedSite.returnRate}%`, color: THEME.accentPurple },
        { label: 'Health Rate', value: selectedSite.healthRate !== null ? `${selectedSite.healthRate}%` : 'N/A', color: THEME.accentEmerald },
      ]} />
      {deleteMsg && <div style={{ ...msgStyle(deleteMsg.type), marginBottom: '16px' }}>{deleteMsg.text}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Loan History</div>
          <table style={STYLES.table}>
            <thead><tr>
              <th style={STYLES.th}>Material</th><th style={STYLES.th}>Contractor</th>
              <th style={STYLES.th}>Qty</th><th style={STYLES.th}>Returned</th>
              <th style={STYLES.th}>Remaining</th><th style={STYLES.th}>Due</th>
            </tr></thead>
            <tbody>
              {siteLoanHistory.length === 0
                ? <tr><td colSpan={6} style={{ ...STYLES.td, color: THEME.textMuted, textAlign: 'center' }}>No loans</td></tr>
                : siteLoanHistory.map(l => {
                  const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date() && l.remaining > 0;
                  return (
                    <tr key={l.id}>
                      <td style={STYLES.td}>{l.material_name}</td>
                      <td style={STYLES.td}>{l.contact_person}</td>
                      <td style={STYLES.td}>{l.quantity}</td>
                      <td style={STYLES.td}>{l.retQty}</td>
                      <td style={STYLES.td}>{l.remaining}</td>
                      <td style={{ ...STYLES.td, color: isOverdue ? THEME.accentCrimson : THEME.textMuted, fontWeight: isOverdue ? '700' : '400' }}>
                        {l.expected_return_date || '—'}{isOverdue ? ' ⚠' : ''}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Condition Breakdown (qty)</div>
          {selectedSite.returnedQty > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={condPieQty(selectedSite.goodQty, selectedSite.wornQty, selectedSite.damagedQty)} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    <Cell fill={CONDITION_COLORS.Good} /><Cell fill={CONDITION_COLORS.Worn} /><Cell fill={CONDITION_COLORS.Damaged} />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div style={{ color: THEME.textMuted, fontSize: '13px', padding: '20px 0' }}>No returns yet</div>}
        </div>
      </div>
      <div style={STYLES.box}>
        <div style={STYLES.label}>Individual Return Records ({siteReturnRecords.length})</div>
        <table style={STYLES.table}>
          <thead><tr>
            <th style={STYLES.th}>Material</th><th style={STYLES.th}>Contractor</th>
            <th style={STYLES.th}>Qty</th><th style={STYLES.th}>Condition</th><th style={STYLES.th}>Date</th><th style={STYLES.th}></th>
          </tr></thead>
          <tbody>
            {siteReturnRecords.length === 0
              ? <tr><td colSpan={6} style={{ ...STYLES.td, color: THEME.textMuted, textAlign: 'center' }}>No returns yet</td></tr>
              : siteReturnRecords.map(r => (
                <tr key={r.id}>
                  <td style={STYLES.td}>{r.material_name}</td>
                  <td style={STYLES.td}>{r.contact_person}</td>
                  <td style={{ ...STYLES.td, fontWeight: '700', color: THEME.accentEmerald }}>{returnQty(r)}</td>
                  <td style={STYLES.td}>{BADGE(CONDITION_COLORS[r.returned_condition] || THEME.textMuted, r.returned_condition || '—')}</td>
                  <td style={STYLES.td}>{r.return_date || '—'}</td>
                  <td style={STYLES.td}><DeleteReturnBtn id={r.id} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // DRILL VIEW: Contractor
  // ═══════════════════════════════════════════════════════════════════════
  if (drillType === 'contractor' && selectedContractor) return (
    <div>
      <BackBtn />
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>{selectedContractor.contact_person} — {selectedContractor.company_name}</h2>
      <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>Sites: {selectedContractor.sites.join(', ') || 'None'}</p>
      <StatGrid stats={[
        { label: 'Total Loaned (qty)', value: selectedContractor.loaned, color: THEME.accentBlue },
        { label: 'Total Returned (qty)', value: selectedContractor.returnedQty, color: THEME.accentEmerald },
        { label: 'Still Out (qty)', value: selectedContractor.stillOut, color: THEME.accentAmber },
        { label: 'Overdue (qty)', value: selectedContractor.overdue, color: THEME.accentCrimson },
        { label: 'Return Rate', value: `${selectedContractor.returnRate}%`, color: THEME.accentPurple },
        { label: 'Health Rate', value: selectedContractor.healthRate !== null ? `${selectedContractor.healthRate}%` : 'N/A', color: THEME.accentEmerald },
        { label: 'Good Qty', value: selectedContractor.goodQty, color: THEME.accentEmerald },
        { label: 'Damaged Qty', value: selectedContractor.damagedQty, color: THEME.accentCrimson },
      ]} />
      {deleteMsg && <div style={{ ...msgStyle(deleteMsg.type), marginBottom: '16px' }}>{deleteMsg.text}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Loan History</div>
          <table style={STYLES.table}>
            <thead><tr>
              <th style={STYLES.th}>Material</th><th style={STYLES.th}>Site</th>
              <th style={STYLES.th}>Qty</th><th style={STYLES.th}>Returned</th>
              <th style={STYLES.th}>Remaining</th><th style={STYLES.th}>Status</th>
            </tr></thead>
            <tbody>
              {contractorLoanHistory.length === 0
                ? <tr><td colSpan={6} style={{ ...STYLES.td, color: THEME.textMuted, textAlign: 'center' }}>No history</td></tr>
                : contractorLoanHistory.map(l => {
                  const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date() && l.remaining > 0;
                  return (
                    <tr key={l.id}>
                      <td style={STYLES.td}>{l.material_name}</td>
                      <td style={STYLES.td}>{l.site_name || '—'}</td>
                      <td style={STYLES.td}>{l.quantity}</td>
                      <td style={STYLES.td}>{l.retQty}</td>
                      <td style={STYLES.td}>{l.remaining}</td>
                      <td style={STYLES.td}>
                        {l.remaining > 0
                          ? BADGE(isOverdue ? THEME.accentCrimson : THEME.accentAmber, isOverdue ? 'OVERDUE' : 'OUT')
                          : BADGE(THEME.accentEmerald, 'CLOSED')}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Condition Breakdown (qty)</div>
          {selectedContractor.returnedQty > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={condPieQty(selectedContractor.goodQty, selectedContractor.wornQty, selectedContractor.damagedQty)} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    <Cell fill={CONDITION_COLORS.Good} /><Cell fill={CONDITION_COLORS.Worn} /><Cell fill={CONDITION_COLORS.Damaged} />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div style={{ color: THEME.textMuted, fontSize: '13px', padding: '20px 0' }}>No returns yet</div>}
        </div>
      </div>
      <div style={STYLES.box}>
        <div style={STYLES.label}>Individual Return Records ({contractorReturnRecords.length})</div>
        <table style={STYLES.table}>
          <thead><tr>
            <th style={STYLES.th}>Material</th><th style={STYLES.th}>Site</th>
            <th style={STYLES.th}>Qty</th><th style={STYLES.th}>Condition</th><th style={STYLES.th}>Date</th><th style={STYLES.th}></th>
          </tr></thead>
          <tbody>
            {contractorReturnRecords.length === 0
              ? <tr><td colSpan={6} style={{ ...STYLES.td, color: THEME.textMuted, textAlign: 'center' }}>No returns yet</td></tr>
              : contractorReturnRecords.map(r => (
                <tr key={r.id}>
                  <td style={STYLES.td}>{r.material_name}</td>
                  <td style={STYLES.td}>{r.site_name || '—'}</td>
                  <td style={{ ...STYLES.td, fontWeight: '700', color: THEME.accentEmerald }}>{returnQty(r)}</td>
                  <td style={STYLES.td}>{BADGE(CONDITION_COLORS[r.returned_condition] || THEME.textMuted, r.returned_condition || '—')}</td>
                  <td style={STYLES.td}>{r.return_date || '—'}</td>
                  <td style={STYLES.td}><DeleteReturnBtn id={r.id} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN VIEW
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>KPI Analytics</h2>
      <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '28px' }}>Click any row, condition card, or site/contractor to drill into full history</p>

      <StatGrid stats={[
        { label: 'Total Loaned (qty)', value: totalLoanedQty, color: THEME.accentBlue },
        { label: 'Total Returned (qty)', value: totalReturnedQty, color: THEME.accentEmerald },
        { label: 'Total Remaining (qty)', value: totalRemainingQty, color: THEME.accentAmber },
        { label: 'Total Overdue (qty)', value: totalOverdueQty, color: THEME.accentCrimson },
      ]} />

      <div style={{ marginBottom: '8px', ...STYLES.label }}>Return Condition Overview (click to drill down)</div>
      <ConditionOverviewCards good={globalGoodQty} worn={globalWornQty} damaged={globalDamagedQty} total={globalConditionTotal} />

      <div style={{ marginBottom: '32px' }}>
        <ReportPanel />
      </div>

      <div style={{ ...STYLES.box, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <MapPin size={16} color={THEME.accentAmber} />
          <div style={{ ...STYLES.label, marginBottom: 0 }}>Site Utilization & Condition Performance</div>
        </div>
        <table style={STYLES.table}>
          <thead><tr>
            <th style={STYLES.th}>Site</th><th style={STYLES.th}>Loaned</th>
            <th style={STYLES.th}>Returned</th><th style={STYLES.th}>Remaining</th>
            <th style={STYLES.th}>Overdue</th><th style={STYLES.th}>Return %</th>
            <th style={STYLES.th}>Health %</th><th style={STYLES.th}>Good/Worn/Dmg (qty)</th>
            <th style={STYLES.th}></th>
          </tr></thead>
          <tbody>
            {siteStats.length === 0
              ? <tr><td colSpan={9} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No site data yet</td></tr>
              : siteStats.map(s => (
                <tr key={s.name} style={{ cursor: 'pointer' }} onClick={() => { setDrillType('site'); setDrillValue(s.name); }}>
                  <td style={STYLES.td}><strong>{s.name}</strong></td>
                  <td style={STYLES.td}>{s.loaned}</td>
                  <td style={STYLES.td}>{s.returnedQty}</td>
                  <td style={{ ...STYLES.td, color: s.remaining > 0 ? THEME.accentAmber : THEME.textMain }}>{s.remaining}</td>
                  <td style={{ ...STYLES.td, color: s.overdue > 0 ? THEME.accentCrimson : THEME.textMain, fontWeight: s.overdue > 0 ? '700' : '400' }}>{s.overdue}</td>
                  <td style={STYLES.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', borderRadius: '3px', backgroundColor: THEME.border, overflow: 'hidden' }}>
                        <div style={{ width: `${s.returnRate}%`, height: '100%', backgroundColor: THEME.accentEmerald }} />
                      </div>
                      <span style={{ fontSize: '12px' }}>{s.returnRate}%</span>
                    </div>
                  </td>
                  <td style={STYLES.td}>
                    {s.healthRate !== null
                      ? <span style={{ color: s.healthRate >= 80 ? THEME.accentEmerald : s.healthRate >= 50 ? THEME.accentAmber : THEME.accentCrimson, fontWeight: '700' }}>{s.healthRate}%</span>
                      : <span style={{ color: THEME.textMuted }}>—</span>}
                  </td>
                  <td style={STYLES.td}>
                    <span style={{ color: THEME.accentEmerald }}>{s.goodQty}</span> / <span style={{ color: THEME.accentAmber }}>{s.wornQty}</span> / <span style={{ color: THEME.accentCrimson }}>{s.damagedQty}</span>
                  </td>
                  <td style={STYLES.td}><ChevronRight size={14} color={THEME.textMuted} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Site Health Rate</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={siteStats.filter(s => s.healthRate !== null)}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="name" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} formatter={v => `${v}%`} />
                <Bar dataKey="healthRate" name="Health %" radius={[4, 4, 0, 0]}>
                  {siteStats.filter(s => s.healthRate !== null).map((s, i) => (
                    <Cell key={i} fill={s.healthRate >= 80 ? THEME.accentEmerald : s.healthRate >= 50 ? THEME.accentAmber : THEME.accentCrimson} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Contractor Return Rate</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={contractorStats.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="contact_person" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} formatter={v => `${v}%`} />
                <Bar dataKey="returnRate" name="Return %" radius={[4, 4, 0, 0]}>
                  {contractorStats.slice(0, 8).map((c, i) => (
                    <Cell key={i} fill={c.returnRate >= 80 ? THEME.accentEmerald : c.returnRate >= 50 ? THEME.accentAmber : THEME.accentCrimson} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={STYLES.box}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Users size={16} color={THEME.accentCyan} />
          <div style={{ ...STYLES.label, marginBottom: 0 }}>Contractor Return Performance</div>
        </div>
        <table style={STYLES.table}>
          <thead><tr>
            <th style={STYLES.th}>Contractor</th><th style={STYLES.th}>Company</th>
            <th style={STYLES.th}>Loaned</th><th style={STYLES.th}>Returned</th>
            <th style={STYLES.th}>Still Out</th><th style={STYLES.th}>Overdue</th>
            <th style={STYLES.th}>Return %</th><th style={STYLES.th}>Health %</th>
            <th style={STYLES.th}>Good/Worn/Dmg (qty)</th><th style={STYLES.th}></th>
          </tr></thead>
          <tbody>
            {contractorStats.length === 0
              ? <tr><td colSpan={10} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No contractor data yet</td></tr>
              : contractorStats.map(c => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => { setDrillType('contractor'); setDrillValue(c.id); }}>
                  <td style={STYLES.td}><strong>{c.contact_person}</strong></td>
                  <td style={STYLES.td}>{c.company_name}</td>
                  <td style={STYLES.td}>{c.loaned}</td>
                  <td style={STYLES.td}>{c.returnedQty}</td>
                  <td style={{ ...STYLES.td, color: c.stillOut > 0 ? THEME.accentAmber : THEME.textMain }}>{c.stillOut}</td>
                  <td style={{ ...STYLES.td, color: c.overdue > 0 ? THEME.accentCrimson : THEME.textMain, fontWeight: c.overdue > 0 ? '700' : '400' }}>{c.overdue}</td>
                  <td style={STYLES.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '50px', height: '6px', borderRadius: '3px', backgroundColor: THEME.border, overflow: 'hidden' }}>
                        <div style={{ width: `${c.returnRate}%`, height: '100%', backgroundColor: THEME.accentEmerald }} />
                      </div>
                      <span style={{ fontSize: '12px' }}>{c.returnRate}%</span>
                    </div>
                  </td>
                  <td style={STYLES.td}>
                    {c.healthRate !== null
                      ? <span style={{ color: c.healthRate >= 80 ? THEME.accentEmerald : c.healthRate >= 50 ? THEME.accentAmber : THEME.accentCrimson, fontWeight: '700' }}>{c.healthRate}%</span>
                      : <span style={{ color: THEME.textMuted }}>—</span>}
                  </td>
                  <td style={STYLES.td}>
                    <span style={{ color: THEME.accentEmerald }}>{c.goodQty}</span> / <span style={{ color: THEME.accentAmber }}>{c.wornQty}</span> / <span style={{ color: THEME.accentCrimson }}>{c.damagedQty}</span>
                  </td>
                  <td style={STYLES.td}><ChevronRight size={14} color={THEME.textMuted} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
