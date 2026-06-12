import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line, ScatterChart, Scatter
} from 'recharts';
import { MapPin, Users, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import { THEME, CONDITION_COLORS, STYLES } from '../utils/theme';

const BADGE = (color, label) => (
  <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: '700' }}>
    {label}
  </span>
);

export default function AnalyticsPage({ materials, contractors, loans, returns, getLoanRemainingQty }) {
  const [drillType, setDrillType] = useState(null);
  const [drillValue, setDrillValue] = useState(null);
  const [viewMode, setViewMode] = useState('OVERVIEW'); // OVERVIEW | RETURNS_OPS | LATENCY

  // Calculate return latency data
  const returnLatencyData = returns.map(r => {
    const loan = loans.find(l => l.id === Number(r.loan_id));
    if (!loan) return null;
    const dispatchDate = new Date(loan.created_at || loan.expected_return_date);
    const returnDate = new Date(r.return_date);
    const daysToReturn = Math.round((returnDate - dispatchDate) / (1000 * 60 * 60 * 24));
    return {
      material: loan.material_name,
      contractor: loan.contact_person,
      site: loan.site_name,
      daysToReturn,
      condition: r.returned_condition,
      returnDate: r.return_date,
      qty: Number(r.returned_quantity || r.quantity || 0)
    };
  }).filter(Boolean);

  // Return operations statistics
  const totalReturnOps = returns.length;
  const avgReturnLatency = returnLatencyData.length > 0
    ? Math.round(returnLatencyData.reduce((s, x) => s + x.daysToReturn, 0) / returnLatencyData.length)
    : 0;
  const minLatency = returnLatencyData.length > 0 ? Math.min(...returnLatencyData.map(x => x.daysToReturn)) : 0;
  const maxLatency = returnLatencyData.length > 0 ? Math.max(...returnLatencyData.map(x => x.daysToReturn)) : 0;

  // Return operations timeline
  const returnTimeline = (() => {
    const timeline = {};
    returns.forEach(r => {
      const dateStr = r.return_date || new Date().toISOString().split('T')[0];
      const date = dateStr.substring(0, 7); // YYYY-MM
      if (!timeline[date]) timeline[date] = { date, operations: 0, good: 0, worn: 0, damaged: 0 };
      timeline[date].operations += 1;
      if (r.returned_condition === 'Good') timeline[date].good += 1;
      if (r.returned_condition === 'Worn') timeline[date].worn += 1;
      if (r.returned_condition === 'Damaged') timeline[date].damaged += 1;
    });
    return Object.values(timeline).sort((a, b) => new Date(a.date) - new Date(b.date));
  })();

  // Latency distribution
  const latencyBuckets = {
    '0-7 days': returnLatencyData.filter(x => x.daysToReturn >= 0 && x.daysToReturn <= 7).length,
    '8-14 days': returnLatencyData.filter(x => x.daysToReturn >= 8 && x.daysToReturn <= 14).length,
    '15-30 days': returnLatencyData.filter(x => x.daysToReturn >= 15 && x.daysToReturn <= 30).length,
    '30+ days': returnLatencyData.filter(x => x.daysToReturn > 30).length,
  };

  // Site Stats with return operations
  const siteStats = Object.values(
    loans.reduce((acc, l) => {
      const site = (l.site_name || 'Unknown').trim();
      if (!acc[site]) acc[site] = { name: site, loaned: 0, returned: 0, overdue: 0, damaged: 0, worn: 0, good: 0, loanIds: [], returnOps: 0 };
      acc[site].loaned += Number(l.quantity || 0);
      acc[site].loanIds.push(l.id);
      const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date() && getLoanRemainingQty(l.id) > 0;
      if (isOverdue) acc[site].overdue += getLoanRemainingQty(l.id);
      return acc;
    }, {})
  ).map(s => {
    returns.forEach(r => {
      if (s.loanIds.includes(Number(r.loan_id))) {
        const qty = Number(r.returned_quantity || r.quantity || 0);
        s.returned += qty;
        s.returnOps += 1;
        if (r.returned_condition === 'Good') s.good += qty;
        if (r.returned_condition === 'Worn') s.worn += qty;
        if (r.returned_condition === 'Damaged') s.damaged += qty;
      }
    });
    return { ...s, healthRate: s.returned > 0 ? Math.round((s.good / s.returned) * 100) : null, returnRate: s.loaned > 0 ? Math.round((s.returned / s.loaned) * 100) : 0 };
  }).sort((a, b) => b.loaned - a.loaned);

  // Contractor Stats with return operations
  const contractorStats = contractors.map(c => {
    const cLoans = loans.filter(l => String(l.contractor_id) === String(c.id));
    const loaned = cLoans.reduce((s, l) => s + Number(l.quantity || 0), 0);
    const loanIds = cLoans.map(l => l.id);
    let returned = 0, good = 0, worn = 0, damaged = 0, overdue = 0, returnOps = 0;
    returns.forEach(r => {
      if (loanIds.includes(Number(r.loan_id))) {
        returnOps += 1;
        const qty = Number(r.returned_quantity || r.quantity || 0);
        returned += qty; good += r.returned_condition === 'Good' ? qty : 0;
        worn += r.returned_condition === 'Worn' ? qty : 0; damaged += r.returned_condition === 'Damaged' ? qty : 0;
      }
    });
    cLoans.forEach(l => { if (l.expected_return_date && new Date(l.expected_return_date) < new Date() && getLoanRemainingQty(l.id) > 0) overdue += getLoanRemainingQty(l.id); });
    return { ...c, loaned, returned, good, worn, damaged, overdue, returnOps,
      healthRate: returned > 0 ? Math.round((good / returned) * 100) : null,
      returnRate: loaned > 0 ? Math.round((returned / loaned) * 100) : 0,
      stillOut: loaned - returned, loanIds,
      sites: [...new Set(cLoans.map(l => l.site_name).filter(Boolean))]
    };
  }).sort((a, b) => b.returnOps - a.returnOps);

  const selectedSite = drillType === 'site' ? siteStats.find(s => s.name === drillValue) : null;
  const selectedContractor = drillType === 'contractor' ? contractorStats.find(c => String(c.id) === String(drillValue)) : null;

  const exitDrill = () => { setDrillType(null); setDrillValue(null); };
  const condPie = (good, worn, damaged) => [{ name: 'Good', value: good }, { name: 'Worn', value: worn }, { name: 'Damaged', value: damaged }].filter(d => d.value > 0);

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

  // RETURN OPERATIONS VIEW
  if (viewMode === 'RETURNS_OPS') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Return Operations Analysis</h2>
          <button onClick={() => setViewMode('OVERVIEW')} style={{ background: 'none', border: 'none', color: THEME.accentBlue, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
            ← Back to Overview
          </button>
        </div>
        <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>Detailed analysis of all return operations and processing patterns</p>

        <StatGrid stats={[
          { label: 'Total Operations', value: totalReturnOps, color: THEME.accentCyan },
          { label: 'Avg Latency', value: `${avgLatency}d`, color: THEME.accentAmber },
          { label: 'Min Latency', value: `${minLatency}d`, color: THEME.accentEmerald },
          { label: 'Max Latency', value: `${maxLatency}d`, color: THEME.accentCrimson },
        ]} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div style={STYLES.box}>
            <div style={STYLES.label}>Return Operations Timeline</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={returnTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                  <XAxis dataKey="date" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <YAxis stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="operations" name="Operations" stroke={THEME.accentCyan} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={STYLES.box}>
            <div style={STYLES.label}>Return Latency Distribution</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={Object.entries(latencyBuckets).map(([range, count]) => ({ range, count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                  <XAxis dataKey="range" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <YAxis stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                  <Bar dataKey="count" fill={THEME.accentCyan} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={STYLES.box}>
          <div style={STYLES.label}>Return Operations Details</div>
          <table style={STYLES.table}>
            <thead><tr>
              <th style={STYLES.th}>Material</th>
              <th style={STYLES.th}>Contractor</th>
              <th style={STYLES.th}>Site</th>
              <th style={STYLES.th}>Return Date</th>
              <th style={STYLES.th}>Latency</th>
              <th style={STYLES.th}>Condition</th>
              <th style={STYLES.th}>Qty</th>
            </tr></thead>
            <tbody>
              {returnLatencyData.length === 0
                ? <tr><td colSpan={7} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No return operations</td></tr>
                : returnLatencyData.sort((a, b) => new Date(b.returnDate) - new Date(a.returnDate)).map((r, i) => (
                  <tr key={i}>
                    <td style={STYLES.td}>{r.material}</td>
                    <td style={STYLES.td}>{r.contractor}</td>
                    <td style={STYLES.td}>{r.site || '—'}</td>
                    <td style={STYLES.td}>{r.returnDate}</td>
                    <td style={{ ...STYLES.td, color: r.daysToReturn > 30 ? THEME.accentCrimson : r.daysToReturn > 14 ? THEME.accentAmber : THEME.accentEmerald, fontWeight: '700' }}>
                      {r.daysToReturn}d
                    </td>
                    <td style={STYLES.td}>
                      <span style={{ color: CONDITION_COLORS[r.condition] || THEME.textMuted, fontWeight: '700', fontSize: '12px' }}>
                        {r.condition}
                      </span>
                    </td>
                    <td style={STYLES.td}>{r.qty}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // LATENCY VIEW
  if (viewMode === 'LATENCY') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Return Processing Latency Analysis</h2>
          <button onClick={() => setViewMode('OVERVIEW')} style={{ background: 'none', border: 'none', color: THEME.accentBlue, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
            ← Back to Overview
          </button>
        </div>
        <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>Days from dispatch to return by contractor and site</p>

        <StatGrid stats={[
          { label: 'Avg Days to Return', value: avgLatency, color: THEME.accentAmber },
          { label: 'Fastest Return', value: minLatency, color: THEME.accentEmerald },
          { label: 'Slowest Return', value: maxLatency, color: THEME.accentCrimson },
          { label: 'Total Processed', value: totalReturnOps, color: THEME.accentCyan },
        ]} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div style={STYLES.box}>
            <div style={STYLES.label}>Latency by Contractor</div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={contractorStats.filter(c => c.returnOps > 0).map(c => {
                  const latencies = returnLatencyData.filter(r => r.contractor === c.contact_person);
                  const avg = latencies.length > 0 ? Math.round(latencies.reduce((s, x) => s + x.daysToReturn, 0) / latencies.length) : 0;
                  return { contractor: c.contact_person, latency: avg, count: latencies.length };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                  <XAxis dataKey="contractor" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <YAxis stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                  <Bar dataKey="latency" fill={THEME.accentAmber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={STYLES.box}>
            <div style={STYLES.label}>Latency by Site</div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={siteStats.filter(s => s.returnOps > 0).map(s => {
                  const latencies = returnLatencyData.filter(r => r.site === s.name);
                  const avg = latencies.length > 0 ? Math.round(latencies.reduce((s, x) => s + x.daysToReturn, 0) / latencies.length) : 0;
                  return { site: s.name, latency: avg, count: latencies.length };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                  <XAxis dataKey="site" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <YAxis stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                  <Bar dataKey="latency" fill={THEME.accentCyan} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DRILLED DOWN SITE VIEW
  if (drillType === 'site' && selectedSite) {
    return (
      <div>
        <BackBtn />
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Site: {selectedSite.name}</h2>
        <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>Full utilization history and return operation breakdown</p>
        <StatGrid stats={[
          { label: 'Total Loaned', value: selectedSite.loaned, color: THEME.accentBlue },
          { label: 'Total Returned', value: selectedSite.returned, color: THEME.accentEmerald },
          { label: 'Return Operations', value: selectedSite.returnOps, color: THEME.accentCyan },
          { label: 'Still Out', value: selectedSite.loaned - selectedSite.returned, color: THEME.accentAmber },
          { label: 'Overdue Units', value: selectedSite.overdue, color: THEME.accentCrimson },
          { label: 'Health Rate', value: selectedSite.healthRate !== null ? `${selectedSite.healthRate}%` : 'N/A', color: THEME.accentEmerald },
        ]} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div style={STYLES.box}>
            <div style={STYLES.label}>Return Condition Mix</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={condPie(selectedSite.good, selectedSite.worn, selectedSite.damaged)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    <Cell fill={CONDITION_COLORS.Good} /><Cell fill={CONDITION_COLORS.Worn} /><Cell fill={CONDITION_COLORS.Damaged} />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={STYLES.box}>
            <div style={STYLES.label}>Condition Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: `${THEME.accentEmerald}11`, border: `1px solid ${THEME.accentEmerald}33` }}>
                <div style={{ fontSize: '12px', color: THEME.textMuted }}>Good Condition</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: THEME.accentEmerald }}>{selectedSite.good}</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: `${THEME.accentAmber}11`, border: `1px solid ${THEME.accentAmber}33` }}>
                <div style={{ fontSize: '12px', color: THEME.textMuted }}>Worn / Service Review</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: THEME.accentAmber }}>{selectedSite.worn}</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: `${THEME.accentCrimson}11`, border: `1px solid ${THEME.accentCrimson}33` }}>
                <div style={{ fontSize: '12px', color: THEME.textMuted }}>Damaged / Scrap</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: THEME.accentCrimson }}>{selectedSite.damaged}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DRILLED DOWN CONTRACTOR VIEW
  if (drillType === 'contractor' && selectedContractor) {
    return (
      <div>
        <BackBtn />
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Contractor: {selectedContractor.contact_person}</h2>
        <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>{selectedContractor.company_name} — Loan and return performance analysis</p>
        <StatGrid stats={[
          { label: 'Total Loaned', value: selectedContractor.loaned, color: THEME.accentBlue },
          { label: 'Total Returned', value: selectedContractor.returned, color: THEME.accentEmerald },
          { label: 'Return Operations', value: selectedContractor.returnOps, color: THEME.accentCyan },
          { label: 'Still Out', value: selectedContractor.stillOut, color: THEME.accentAmber },
          { label: 'Overdue Units', value: selectedContractor.overdue, color: THEME.accentCrimson },
          { label: 'Return Rate', value: `${selectedContractor.returnRate}%`, color: THEME.accentPurple },
          { label: 'Health Rate', value: selectedContractor.healthRate !== null ? `${selectedContractor.healthRate}%` : 'N/A', color: THEME.accentEmerald },
          { label: 'Active Sites', value: selectedContractor.sites.length, color: THEME.accentAmber },
        ]} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div style={STYLES.box}>
            <div style={STYLES.label}>Return Condition Mix</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={condPie(selectedContractor.good, selectedContractor.worn, selectedContractor.damaged)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    <Cell fill={CONDITION_COLORS.Good} /><Cell fill={CONDITION_COLORS.Worn} /><Cell fill={CONDITION_COLORS.Damaged} />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={STYLES.box}>
            <div style={STYLES.label}>Condition Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: `${THEME.accentEmerald}11`, border: `1px solid ${THEME.accentEmerald}33` }}>
                <div style={{ fontSize: '12px', color: THEME.textMuted }}>Good Condition</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: THEME.accentEmerald }}>{selectedContractor.good}</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: `${THEME.accentAmber}11`, border: `1px solid ${THEME.accentAmber}33` }}>
                <div style={{ fontSize: '12px', color: THEME.textMuted }}>Worn / Service Review</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: THEME.accentAmber }}>{selectedContractor.worn}</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: `${THEME.accentCrimson}11`, border: `1px solid ${THEME.accentCrimson}33` }}>
                <div style={{ fontSize: '12px', color: THEME.textMuted }}>Damaged / Scrap</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: THEME.accentCrimson }}>{selectedContractor.damaged}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT OVERVIEW VIEW
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Analytics Dashboard</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setViewMode('RETURNS_OPS')} style={{ padding: '8px 14px', borderRadius: '6px', border: `1px solid ${THEME.border}`, background: THEME.cardBg, cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: THEME.textMain }}>
            📊 Return Ops Analysis
          </button>
          <button onClick={() => setViewMode('LATENCY')} style={{ padding: '8px 14px', borderRadius: '6px', border: `1px solid ${THEME.border}`, background: THEME.cardBg, cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: THEME.textMain }}>
            ⏱ Latency Analysis
          </button>
        </div>
      </div>

      <StatGrid stats={[
        { label: 'Return Operations', value: totalReturnOps, color: THEME.accentCyan },
        { label: 'Avg Latency', value: `${avgLatency}d`, color: THEME.accentAmber },
        { label: 'Sites with Returns', value: siteStats.filter(s => s.returnOps > 0).length, color: THEME.accentBlue },
        { label: 'Contractors Returning', value: contractorStats.filter(c => c.returnOps > 0).length, color: THEME.accentEmerald },
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Site Utilization & Condition Performance</div>
          <table style={STYLES.table}>
            <thead><tr>
              <th style={STYLES.th}>Site</th><th style={STYLES.th}>Return Ops</th><th style={STYLES.th}>Health %</th><th style={STYLES.th}></th>
            </tr></thead>
            <tbody>
              {siteStats.filter(s => s.returnOps > 0).length === 0
                ? <tr><td colSpan={4} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No return operations yet</td></tr>
                : siteStats.filter(s => s.returnOps > 0).map(s => (
                  <tr key={s.name} style={{ cursor: 'pointer' }} onClick={() => { setDrillType('site'); setDrillValue(s.name); }}>
                    <td style={STYLES.td}><strong>{s.name}</strong></td>
                    <td style={STYLES.td}><span style={{ color: THEME.accentCyan, fontWeight: '700' }}>{s.returnOps}</span></td>
                    <td style={STYLES.td}>
                      {s.healthRate !== null
                        ? <span style={{ color: s.healthRate >= 80 ? THEME.accentEmerald : s.healthRate >= 50 ? THEME.accentAmber : THEME.accentCrimson, fontWeight: '700' }}>{s.healthRate}%</span>
                        : <span style={{ color: THEME.textMuted }}>—</span>}
                    </td>
                    <td style={STYLES.td}><ChevronRight size={14} color={THEME.textMuted} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div style={STYLES.box}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Users size={16} color={THEME.accentCyan} />
            <div style={{ ...STYLES.label, marginBottom: 0 }}>Contractor Return Performance</div>
          </div>
          <table style={STYLES.table}>
            <thead><tr>
              <th style={STYLES.th}>Contractor</th><th style={STYLES.th}>Return Ops</th><th style={STYLES.th}>Health %</th><th style={STYLES.th}></th>
            </tr></thead>
            <tbody>
              {contractorStats.filter(c => c.returnOps > 0).length === 0
                ? <tr><td colSpan={4} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No return operations yet</td></tr>
                : contractorStats.filter(c => c.returnOps > 0).map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => { setDrillType('contractor'); setDrillValue(c.id); }}>
                    <td style={STYLES.td}><strong>{c.contact_person}</strong></td>
                    <td style={STYLES.td}><span style={{ color: THEME.accentCyan, fontWeight: '700' }}>{c.returnOps}</span></td>
                    <td style={STYLES.td}>
                      {c.healthRate !== null
                        ? <span style={{ color: c.healthRate >= 80 ? THEME.accentEmerald : c.healthRate >= 50 ? THEME.accentAmber : THEME.accentCrimson, fontWeight: '700' }}>{c.healthRate}%</span>
                        : <span style={{ color: THEME.textMuted }}>—</span>}
                    </td>
                    <td style={STYLES.td}><ChevronRight size={14} color={THEME.textMuted} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Return Operations Timeline</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={returnTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="date" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                <YAxis stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                <Line type="monotone" dataKey="operations" stroke={THEME.accentCyan} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Latency Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(latencyBuckets).map(([range, count]) => (
              <div key={range} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px' }}>{range}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '80px', height: '6px', borderRadius: '3px', backgroundColor: THEME.border, overflow: 'hidden' }}>
                    <div style={{ width: `${returnLatencyData.length > 0 ? (count / returnLatencyData.length) * 100 : 0}%`, height: '100%', backgroundColor: THEME.accentAmber }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', minWidth: '30px', textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
