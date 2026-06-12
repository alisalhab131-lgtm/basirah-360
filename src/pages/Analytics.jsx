import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { MapPin, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { THEME, CONDITION_COLORS, STYLES } from '../utils/theme';

const BADGE = (color, label) => (
  <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: '700' }}>
    {label}
  </span>
);

export default function AnalyticsPage({ materials, contractors, loans, returns, getLoanRemainingQty }) {
  const [drillType, setDrillType] = useState(null);
  const [drillValue, setDrillValue] = useState(null);

  const siteStats = Object.values(
    loans.reduce((acc, l) => {
      const site = (l.site_name || 'Unknown').trim();
      if (!acc[site]) acc[site] = { name: site, loaned: 0, returned: 0, overdue: 0, good: 0, worn: 0, damaged: 0, loanIds: [] };
      acc[site].loaned += Number(l.quantity || 0);
      acc[site].loanIds.push(l.id);
      if (l.expected_return_date && new Date(l.expected_return_date) < new Date() && getLoanRemainingQty(l.id) > 0)
        acc[site].overdue += getLoanRemainingQty(l.id);
      return acc;
    }, {})
  ).map(s => {
    returns.forEach(r => {
      if (s.loanIds.includes(Number(r.loan_id))) {
        s.returned += 1;
        if (r.returned_condition === 'Good') s.good += 1;
        if (r.returned_condition === 'Worn') s.worn += 1;
        if (r.returned_condition === 'Damaged') s.damaged += 1;
      }
    });
    return {
      ...s,
      healthRate: s.returned > 0 ? Math.round((s.good / s.returned) * 100) : null,
      returnRate: s.loaned > 0 ? Math.round((s.returned / s.loaned) * 100) : 0,
    };
  }).sort((a, b) => b.loaned - a.loaned);

  const contractorStats = contractors.map(c => {
    const cLoans = loans.filter(l => String(l.contractor_id) === String(c.id));
    const loaned = cLoans.reduce((s, l) => s + Number(l.quantity || 0), 0);
    const loanIds = cLoans.map(l => l.id);
    let returned = 0, good = 0, worn = 0, damaged = 0, overdue = 0;
    returns.forEach(r => {
      if (loanIds.includes(Number(r.loan_id))) {
        returned += 1;
        if (r.returned_condition === 'Good') good += 1;
        if (r.returned_condition === 'Worn') worn += 1;
        if (r.returned_condition === 'Damaged') damaged += 1;
      }
    });
    cLoans.forEach(l => {
      if (l.expected_return_date && new Date(l.expected_return_date) < new Date() && getLoanRemainingQty(l.id) > 0)
        overdue += getLoanRemainingQty(l.id);
    });
    return {
      ...c, loaned, returned, good, worn, damaged, overdue,
      healthRate: returned > 0 ? Math.round((good / returned) * 100) : null,
      returnRate: loaned > 0 ? Math.round((returned / loaned) * 100) : 0,
      stillOut: loaned - returned,
      loanIds,
      sites: [...new Set(cLoans.map(l => l.site_name).filter(Boolean))],
    };
  }).sort((a, b) => b.loaned - a.loaned);

  const selectedSite = drillType === 'site' ? siteStats.find(s => s.name === drillValue) : null;
  const siteLoanHistory = selectedSite
    ? loans.filter(l => (l.site_name || '').trim() === selectedSite.name).map(l => {
        const lReturns = returns.filter(r => Number(r.loan_id) === l.id);
        return { ...l, retQty: lReturns.length, remaining: getLoanRemainingQty(l.id), lReturns };
      })
    : [];

  const selectedContractor = drillType === 'contractor' ? contractorStats.find(c => String(c.id) === String(drillValue)) : null;
  const contractorLoanHistory = selectedContractor
    ? loans.filter(l => String(l.contractor_id) === String(selectedContractor.id)).map(l => {
        const lReturns = returns.filter(r => Number(r.loan_id) === l.id);
        return { ...l, retQty: lReturns.length, remaining: getLoanRemainingQty(l.id), lReturns };
      })
    : [];

  const exitDrill = () => { setDrillType(null); setDrillValue(null); };

  const condPie = (good, worn, damaged) =>
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

  if (drillType === 'site' && selectedSite) return (
    <div>
      <BackBtn />
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Site: {selectedSite.name}</h2>
      <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>Full utilization and condition breakdown</p>
      <StatGrid stats={[
        { label: 'Total Loaned', value: selectedSite.loaned, color: THEME.accentBlue },
        { label: 'Total Returned', value: selectedSite.returned, color: THEME.accentEmerald },
        { label: 'Still Out', value: selectedSite.loaned - selectedSite.returned, color: THEME.accentAmber },
        { label: 'Overdue Units', value: selectedSite.overdue, color: THEME.accentCrimson },
        { label: 'Return Rate', value: `${selectedSite.returnRate}%`, color: THEME.accentPurple },
        { label: 'Health Rate', value: selectedSite.healthRate !== null ? `${selectedSite.healthRate}%` : 'N/A', color: THEME.accentEmerald },
      ]} />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Loan History</div>
          <table style={STYLES.table}>
            <thead><tr>
              <th style={STYLES.th}>Material</th><th style={STYLES.th}>Contractor</th>
              <th style={STYLES.th}>Qty</th><th style={STYLES.th}>Returned</th>
              <th style={STYLES.th}>Remaining</th><th style={STYLES.th}>Condition</th><th style={STYLES.th}>Due</th>
            </tr></thead>
            <tbody>
              {siteLoanHistory.length === 0
                ? <tr><td colSpan={7} style={{ ...STYLES.td, color: THEME.textMuted, textAlign: 'center' }}>No loans</td></tr>
                : siteLoanHistory.map(l => {
                  const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date() && l.remaining > 0;
                  const conds = [...new Set(l.lReturns.map(r => r.returned_condition).filter(Boolean))].join(', ');
                  return (
                    <tr key={l.id}>
                      <td style={STYLES.td}>{l.material_name}</td>
                      <td style={STYLES.td}>{l.contact_person}</td>
                      <td style={STYLES.td}>{l.quantity}</td>
                      <td style={STYLES.td}>{l.retQty}</td>
                      <td style={STYLES.td}>{l.remaining}</td>
                      <td style={STYLES.td}>{conds || '—'}</td>
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
          <div style={STYLES.label}>Condition Breakdown</div>
          {selectedSite.returned > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={condPie(selectedSite.good, selectedSite.worn, selectedSite.damaged)} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
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
    </div>
  );

  if (drillType === 'contractor' && selectedContractor) return (
    <div>
      <BackBtn />
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>{selectedContractor.contact_person} — {selectedContractor.company_name}</h2>
      <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>Sites: {selectedContractor.sites.join(', ') || 'None'}</p>
      <StatGrid stats={[
        { label: 'Total Loaned', value: selectedContractor.loaned, color: THEME.accentBlue },
        { label: 'Total Returned', value: selectedContractor.returned, color: THEME.accentEmerald },
        { label: 'Still Out', value: selectedContractor.stillOut, color: THEME.accentAmber },
        { label: 'Overdue Units', value: selectedContractor.overdue, color: THEME.accentCrimson },
        { label: 'Return Rate', value: `${selectedContractor.returnRate}%`, color: THEME.accentPurple },
        { label: 'Health Rate', value: selectedContractor.healthRate !== null ? `${selectedContractor.healthRate}%` : 'N/A', color: THEME.accentEmerald },
        { label: 'Good Returns', value: selectedContractor.good, color: THEME.accentEmerald },
        { label: 'Damaged Returns', value: selectedContractor.damaged, color: THEME.accentCrimson },
      ]} />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Return History</div>
          <table style={STYLES.table}>
            <thead><tr>
              <th style={STYLES.th}>Material</th><th style={STYLES.th}>Site</th>
              <th style={STYLES.th}>Qty</th><th style={STYLES.th}>Returned</th>
              <th style={STYLES.th}>Conditions</th><th style={STYLES.th}>Status</th>
            </tr></thead>
            <tbody>
              {contractorLoanHistory.length === 0
                ? <tr><td colSpan={6} style={{ ...STYLES.td, color: THEME.textMuted, textAlign: 'center' }}>No history</td></tr>
                : contractorLoanHistory.map(l => {
                  const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date() && l.remaining > 0;
                  const condMap = {};
                  l.lReturns.forEach(r => { condMap[r.returned_condition] = (condMap[r.returned_condition] || 0) + 1; });
                  return (
                    <tr key={l.id}>
                      <td style={STYLES.td}>{l.material_name}</td>
                      <td style={STYLES.td}>{l.site_name || '—'}</td>
                      <td style={STYLES.td}>{l.quantity}</td>
                      <td style={STYLES.td}>{l.retQty}</td>
                      <td style={STYLES.td}>
                        {Object.entries(condMap).length > 0
                          ? Object.entries(condMap).map(([cond, qty]) => (
                            <span key={cond} style={{ marginRight: '6px' }}>
                              {BADGE(CONDITION_COLORS[cond] || THEME.textMuted, `${cond}: ${qty}`)}
                            </span>
                          ))
                          : <span style={{ color: THEME.textMuted }}>None yet</span>}
                      </td>
                      <td style={STYLES.td}>
                        {l.remaining > 0
                          ? BADGE(isOverdue ? THEME.accentCrimson : THEME.accentAmber, isOverdue ? 'OVERDUE' : 'OUT')
                          : BADGE(THEME.accentEmerald, 'RETURNED')}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Condition Breakdown</div>
          {selectedContractor.returned > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={condPie(selectedContractor.good, selectedContractor.worn, selectedContractor.damaged)} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
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
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>KPI Analytics</h2>
      <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '28px' }}>Click any row to drill into full history and condition breakdown</p>

      <div style={STYLES.box}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <MapPin size={16} color={THEME.accentAmber} />
          <div style={{ ...STYLES.label, marginBottom: 0 }}>Site Utilization & Condition Performance</div>
        </div>
        <table style={STYLES.table}>
          <thead><tr>
            <th style={STYLES.th}>Site</th><th style={STYLES.th}>Loaned</th>
            <th style={STYLES.th}>Returned</th><th style={STYLES.th}>Still Out</th>
            <th style={STYLES.th}>Overdue</th><th style={STYLES.th}>Return %</th>
            <th style={STYLES.th}>Health %</th><th style={STYLES.th}>Good/Worn/Dmg</th>
            <th style={STYLES.th}></th>
          </tr></thead>
          <tbody>
            {siteStats.length === 0
              ? <tr><td colSpan={9} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No site data yet</td></tr>
              : siteStats.map(s => (
                <tr key={s.name} style={{ cursor: 'pointer' }} onClick={() => { setDrillType('site'); setDrillValue(s.name); }}>
                  <td style={STYLES.td}><strong>{s.name}</strong></td>
                  <td style={STYLES.td}>{s.loaned}</td>
                  <td style={STYLES.td}>{s.returned}</td>
                  <td style={{ ...STYLES.td, color: s.loaned - s.returned > 0 ? THEME.accentAmber : THEME.textMain }}>{s.loaned - s.returned}</td>
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
                    <span style={{ color: THEME.accentEmerald }}>{s.good}</span> / <span style={{ color: THEME.accentAmber }}>{s.worn}</span> / <span style={{ color: THEME.accentCrimson }}>{s.damaged}</span>
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
            <th style={STYLES.th}>Good/Worn/Dmg</th><th style={STYLES.th}></th>
          </tr></thead>
          <tbody>
            {contractorStats.length === 0
              ? <tr><td colSpan={10} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No contractor data yet</td></tr>
              : contractorStats.map(c => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => { setDrillType('contractor'); setDrillValue(c.id); }}>
                  <td style={STYLES.td}><strong>{c.contact_person}</strong></td>
                  <td style={STYLES.td}>{c.company_name}</td>
                  <td style={STYLES.td}>{c.loaned}</td>
                  <td style={STYLES.td}>{c.returned}</td>
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
                    <span style={{ color: THEME.accentEmerald }}>{c.good}</span> / <span style={{ color: THEME.accentAmber }}>{c.worn}</span> / <span style={{ color: THEME.accentCrimson }}>{c.damaged}</span>
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