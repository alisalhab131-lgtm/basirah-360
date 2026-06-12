import React, { useState } from 'react';
import {
  LayoutGrid, Package, ArrowLeftRight, AlertTriangle,
  CheckCircle, Wrench, XCircle, TrendingUp, Users, MapPin,
  ChevronRight, X, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { THEME, CONDITION_COLORS, STYLES } from '../utils/theme';

// Enhanced KPI Card with Drilldown
function KpiCard({ icon: Icon, label, value, color, isActive, onClick, subtitle, data }) {
  const [showDrill, setShowDrill] = useState(false);

  return (
    <>
      <div onClick={() => { setShowDrill(true); }} style={{
        backgroundColor: THEME.cardBg,
        border: `1px solid ${isActive ? color : THEME.border}`,
        padding: '20px 24px', borderRadius: '12px',
        display: 'flex', alignItems: 'center', gap: '16px',
        cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: isActive ? `0 0 0 1px ${color}22` : 'none',
        '&:hover': { borderColor: color }
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px',
          backgroundColor: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={22} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{label}</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: THEME.textMain, lineHeight: 1 }}>{value}</div>
          {subtitle && <div style={{ fontSize: '12px', color: THEME.textMuted, marginTop: '4px' }}>{subtitle}</div>}
        </div>
        <div style={{ fontSize: '12px', color: THEME.textMuted }}>Click to drill →</div>
      </div>

      {/* Drilldown Modal */}
      {showDrill && data && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: THEME.cardBg, borderRadius: '16px',
            padding: '28px', maxWidth: '700px', width: '90%',
            maxHeight: '90vh', overflowY: 'auto',
            border: `1px solid ${THEME.border}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{label} - Details</h3>
              <button onClick={() => setShowDrill(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: THEME.textMuted
              }}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              padding: '16px', borderRadius: '8px',
              backgroundColor: `${color}11`, border: `1px solid ${color}33`,
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '12px', color: THEME.textMuted, marginBottom: '4px' }}>Current Value</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: color }}>{value}</div>
            </div>

            {data.records && data.records.length > 0 && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: THEME.textMuted }}>
                  Top Records ({data.records.length})
                </div>
                <table style={STYLES.table}>
                  <thead>
                    <tr>
                      {data.columns.map(col => (
                        <th key={col} style={STYLES.th}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((rec, idx) => (
                      <tr key={idx}>
                        {data.columns.map(col => (
                          <td key={col} style={STYLES.td}>
                            {typeof rec[col] === 'number' ? rec[col] : String(rec[col] || '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.breakdown && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: THEME.textMuted }}>
                  Breakdown
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {Object.entries(data.breakdown).map(([key, val]) => (
                    <div key={key} style={{
                      padding: '12px', borderRadius: '8px',
                      backgroundColor: THEME.bg, border: `1px solid ${THEME.border}`
                    }}>
                      <div style={{ fontSize: '11px', color: THEME.textMuted, marginBottom: '4px' }}>{key}</div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardPage({ materials, contractors, loans, returns, getLoanRemainingQty }) {
  const [cardFilter, setCardFilter] = useState('ALL');
  const [drillDown, setDrillDown] = useState({ active: false, type: null, value: null });

  // Calculate all metrics
  const totalAvailable = materials.reduce((a, m) => a + Number(m.quantity || 0), 0);
  const totalLended = loans.reduce((a, l) => a + getLoanRemainingQty(l.id), 0);
  const totalStock = totalAvailable + totalLended;

  const overdueLoans = loans.filter(l => {
    const rem = getLoanRemainingQty(l.id);
    return rem > 0 && l.expected_return_date && new Date(l.expected_return_date) < new Date();
  });

  // Return operations metrics
  const returnOpsCount = returns.length;
  const totalGood = returns.filter(r => r.returned_condition === 'Good').reduce((s, r) => s + Number(r.returned_quantity || r.quantity || 0), 0);
  const totalWorn = returns.filter(r => r.returned_condition === 'Worn').reduce((s, r) => s + Number(r.returned_quantity || r.quantity || 0), 0);
  const totalDamaged = returns.filter(r => r.returned_condition === 'Damaged').reduce((s, r) => s + Number(r.returned_quantity || r.quantity || 0), 0);
  const totalReturned = totalGood + totalWorn + totalDamaged;

  const utilizationRate = totalStock > 0 ? Math.round((totalLended / totalStock) * 100) : 0;
  const healthRate = totalReturned > 0 ? Math.round((totalGood / totalReturned) * 100) : 0;

  // Return operations by contractor
  const returnsByContractor = contractors.map(c => {
    const cReturns = returns.filter(r => {
      const loan = loans.find(l => l.id === Number(r.loan_id));
      return loan && String(loan.contractor_id) === String(c.id);
    });
    return {
      name: c.contact_person,
      count: cReturns.length,
      quantity: cReturns.reduce((s, r) => s + Number(r.returned_quantity || r.quantity || 0), 0),
      company: c.company_name
    };
  }).filter(x => x.count > 0).sort((a, b) => b.count - a.count);

  // Return operations by site
  const returnsBySite = Object.values(
    returns.reduce((acc, r) => {
      const loan = loans.find(l => l.id === Number(r.loan_id));
      if (!loan) return acc;
      const site = (loan.site_name || 'Unknown').trim();
      if (!acc[site]) acc[site] = { name: site, count: 0, quantity: 0 };
      acc[site].count += 1;
      acc[site].quantity += Number(r.returned_quantity || r.quantity || 0);
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  // Return latency (days between dispatch and return)
  const returnLatencyData = returns.map(r => {
    const loan = loans.find(l => l.id === Number(r.loan_id));
    if (!loan) return null;
    const dispatchDate = new Date(loan.created_at || loan.expected_return_date);
    const returnDate = new Date(r.return_date);
    const daysToReturn = Math.round((returnDate - dispatchDate) / (1000 * 60 * 60 * 24));
    return { material: loan.material_name, daysToReturn, condition: r.returned_condition };
  }).filter(Boolean);

  const avgLatency = returnLatencyData.length > 0
    ? Math.round(returnLatencyData.reduce((s, x) => s + x.daysToReturn, 0) / returnLatencyData.length)
    : 0;

  // Return operations timeline (last 14 days)
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  const returnTimeline = last14Days.map(date => {
    const count = returns.filter(r => r.return_date?.startsWith(date)).length;
    return { date, count, name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
  });

  const siteChartData = Object.values(
    loans.reduce((acc, l) => {
      const rem = getLoanRemainingQty(l.id);
      if (rem <= 0 || !l.site_name) return acc;
      const site = l.site_name.trim();
      if (!acc[site]) acc[site] = { name: site, active: 0, overdue: 0, returned: 0 };
      const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date();
      if (isOverdue) acc[site].overdue += rem;
      else acc[site].active += rem;

      // Count returns for this site
      const siteReturns = returns.filter(r => {
        const rLoan = loans.find(l2 => l2.id === Number(r.loan_id));
        return rLoan && rLoan.site_name === l.site_name;
      });
      acc[site].returned = siteReturns.length;
      return acc;
    }, {})
  );

  const generateRows = () => {
    let rows = [];
    if (['ALL', 'AVAILABLE'].includes(cardFilter) && !drillDown.active) {
      materials.forEach(m => {
        if (Number(m.quantity) > 0) {
          rows.push({ id: `mat-${m.id}`, name: m.name, location: 'Vault Reserve', qty: m.quantity, status: 'IN STOCK', color: THEME.accentEmerald, contractor: '—', due: '—' });
        }
      });
    }
    if (['ALL', 'LENDED', 'OVERDUE'].includes(cardFilter)) {
      loans.forEach(l => {
        const rem = getLoanRemainingQty(l.id);
        if (rem <= 0) return;
        const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date();
        if (cardFilter === 'OVERDUE' && !isOverdue) return;
        if (drillDown.active && drillDown.type === 'SITE' && l.site_name?.trim() !== drillDown.value) return;
        rows.push({
          id: `loan-${l.id}`, name: l.material_name, location: l.site_name || 'Field',
          qty: rem, status: isOverdue ? 'OVERDUE' : 'DEPLOYED',
          color: isOverdue ? THEME.accentCrimson : THEME.accentAmber,
          contractor: l.contact_person || '—', due: l.expected_return_date || '—',
        });
      });
    }
    return rows;
  };

  const clearFilters = () => { setCardFilter('ALL'); setDrillDown({ active: false, type: null, value: null }); };

  // Prepare drilldown data for KPI cards
  const kpiData = {
    STOCK: {
      records: materials.slice(0, 5).map(m => ({ name: m.name, available: m.quantity })),
      columns: ['name', 'available'],
      breakdown: {
        'Total Materials': materials.length,
        'With Stock': materials.filter(m => m.quantity > 0).length,
        'Out of Stock': materials.filter(m => m.quantity === 0).length
      }
    },
    DEPLOYMENTS: {
      records: returnsByContractor.slice(0, 5),
      columns: ['name', 'count', 'quantity'],
      breakdown: {
        'Active Loans': loans.filter(l => getLoanRemainingQty(l.id) > 0).length,
        'Deployed Units': totalLended,
        'Contractors': contractors.length
      }
    },
    RETURNS: {
      records: returnsByContractor.slice(0, 5),
      columns: ['name', 'count', 'quantity'],
      breakdown: {
        'Total Operations': returnOpsCount,
        'Units Returned': totalReturned,
        'Avg Per Op': returnOpsCount > 0 ? Math.round(totalReturned / returnOpsCount) : 0
      }
    },
    CONDITIONS: {
      records: [
        { condition: 'Good', count: totalGood, pct: totalReturned > 0 ? Math.round((totalGood / totalReturned) * 100) : 0 },
        { condition: 'Worn', count: totalWorn, pct: totalReturned > 0 ? Math.round((totalWorn / totalReturned) * 100) : 0 },
        { condition: 'Damaged', count: totalDamaged, pct: totalReturned > 0 ? Math.round((totalDamaged / totalReturned) * 100) : 0 }
      ],
      columns: ['condition', 'count', 'pct'],
      breakdown: {
        'Good %': `${totalReturned > 0 ? Math.round((totalGood / totalReturned) * 100) : 0}%`,
        'Usable': totalGood + totalWorn,
        'Scrap': totalDamaged
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Telemetry Dashboard</h2>
        <div style={{ fontSize: '12px', color: THEME.textMuted }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Primary KPI Cards with Drilldown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <KpiCard icon={LayoutGrid} label="Total Managed Stock" value={totalStock} color={THEME.accentBlue} data={kpiData.STOCK} />
        <KpiCard icon={Package} label="Vault Reserve" value={totalAvailable} color={THEME.accentEmerald} data={kpiData.STOCK} />
        <KpiCard icon={ArrowLeftRight} label="Active Deployments" value={totalLended} color={THEME.accentAmber} data={kpiData.DEPLOYMENTS} />
        <KpiCard icon={AlertTriangle} label="Overdue Loans" value={overdueLoans.length} color={THEME.accentCrimson} data={{ records: overdueLoans.map(l => ({ material: l.material_name, site: l.site_name, dueDate: l.expected_return_date })), columns: ['material', 'site', 'dueDate'] }} />
      </div>

      {/* Secondary KPI Cards - Returns Focus */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiCard icon={RefreshCw} label="Return Operations" value={returnOpsCount} color={THEME.accentCyan} subtitle={`${totalReturned} units processed`} data={kpiData.RETURNS} />
        <KpiCard icon={CheckCircle} label="Good Condition" value={totalGood} color={THEME.accentEmerald} subtitle={totalReturned > 0 ? `${Math.round((totalGood / totalReturned) * 100)}% of returns` : '0%'} data={kpiData.CONDITIONS} />
        <KpiCard icon={Wrench} label="Worn Condition" value={totalWorn} color={THEME.accentAmber} subtitle="Needs service review" data={kpiData.CONDITIONS} />
        <KpiCard icon={XCircle} label="Damaged" value={totalDamaged} color={THEME.accentCrimson} subtitle="Critical scrap" data={kpiData.CONDITIONS} />
      </div>

      {/* Tertiary KPI Cards - Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiCard icon={TrendingUp} label="Utilization Rate" value={`${utilizationRate}%`} color={THEME.accentPurple} subtitle={`${totalLended} of ${totalStock} units out`} />
        <KpiCard icon={Users} label="Active Contractors" value={contractors.length} color={THEME.accentCyan} subtitle={`${returnsByContractor.length} with returns`} data={{ records: returnsByContractor, columns: ['name', 'count', 'quantity'] }} />
        <KpiCard icon={MapPin} label="Active Sites" value={siteChartData.length} color={THEME.accentAmber} subtitle={`${returnsBySite.length} with returns`} data={{ records: returnsBySite, columns: ['name', 'count', 'quantity'] }} />
        <KpiCard icon={CheckCircle} label="Return Health Rate" value={`${healthRate}%`} color={THEME.accentEmerald} subtitle={`${totalGood} good units`} />
        <KpiCard icon={Package} label="Total Returned" value={totalReturned} color={THEME.accentBlue} subtitle="All-time items recovered" />
        <KpiCard icon={TrendingUp} label="Avg Return Latency" value={`${avgLatency} days`} color={THEME.accentAmber} subtitle="Dispatch to return" />
      </div>

      {/* Return Operations Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Return Operations - Last 14 Days</div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={returnTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="name" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                <YAxis stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                <Line type="monotone" dataKey="count" name="Operations" stroke={THEME.accentCyan} strokeWidth={2} dot={{ fill: THEME.accentCyan, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Return Condition Distribution</div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[{ name: 'Good', value: totalGood }, { name: 'Worn', value: totalWorn }, { name: 'Damaged', value: totalDamaged }].filter(d => d.value > 0)}
                  cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                >
                  <Cell fill={CONDITION_COLORS.Good} /><Cell fill={CONDITION_COLORS.Worn} /><Cell fill={CONDITION_COLORS.Damaged} />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Deployments by Site & Return Operations by Site */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Deployments by Site</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={siteChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="name" stroke={THEME.textMuted} tick={{ fontSize: 11 }} />
                <YAxis stroke={THEME.textMuted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                <Legend />
                <Bar dataKey="active" name="Active" fill={THEME.accentAmber} stackId="a" />
                <Bar dataKey="overdue" name="Overdue" fill={THEME.accentCrimson} stackId="a" />
                <Bar dataKey="returned" name="Returned Ops" fill={THEME.accentEmerald} stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={STYLES.box}>
          <div style={STYLES.label}>Returns by Site Performance</div>
          <table style={STYLES.table}>
            <thead><tr>
              <th style={STYLES.th}>Site</th>
              <th style={STYLES.th}>Operations</th>
              <th style={STYLES.th}>Units</th>
            </tr></thead>
            <tbody>
              {returnsBySite.length === 0
                ? <tr><td colSpan={3} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No returns yet</td></tr>
                : returnsBySite.map(s => (
                  <tr key={s.name} style={{ cursor: 'pointer' }}>
                    <td style={STYLES.td}><strong>{s.name}</strong></td>
                    <td style={STYLES.td}>{s.count}</td>
                    <td style={STYLES.td}>{s.quantity}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Operations by Contractor */}
      <div style={STYLES.box}>
        <div style={{ ...STYLES.label, marginBottom: '16px' }}>Return Operations by Contractor Performance</div>
        <table style={STYLES.table}>
          <thead><tr>
            <th style={STYLES.th}>Contractor</th>
            <th style={STYLES.th}>Company</th>
            <th style={STYLES.th}>Return Ops</th>
            <th style={STYLES.th}>Units Returned</th>
            <th style={STYLES.th}>Avg Units/Op</th>
          </tr></thead>
          <tbody>
            {returnsByContractor.length === 0
              ? <tr><td colSpan={5} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No return operations yet</td></tr>
              : returnsByContractor.map(c => (
                <tr key={c.name} style={{ cursor: 'pointer' }}>
                  <td style={STYLES.td}><strong>{c.name}</strong></td>
                  <td style={STYLES.td}>{c.company}</td>
                  <td style={STYLES.td}><span style={{ color: THEME.accentCyan, fontWeight: '700' }}>{c.count}</span></td>
                  <td style={STYLES.td}>{c.quantity}</td>
                  <td style={STYLES.td}>{Math.round(c.quantity / c.count)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Active Tracking Table */}
      <div style={STYLES.box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={STYLES.label}>
            Active Tracking {cardFilter !== 'ALL' && `· Filter: ${cardFilter}`}
            {drillDown.active && ` · Site: ${drillDown.value}`}
          </div>
          {(cardFilter !== 'ALL' || drillDown.active) && (
            <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: THEME.accentBlue, cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Clear Filters</button>
          )}
        </div>
        <table style={STYLES.table}>
          <thead>
            <tr>
              <th style={STYLES.th}>Asset</th><th style={STYLES.th}>Site / Location</th>
              <th style={STYLES.th}>Contractor</th><th style={STYLES.th}>Qty</th>
              <th style={STYLES.th}>Due Date</th><th style={STYLES.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {generateRows().length === 0
              ? <tr><td colSpan={6} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No records match this filter</td></tr>
              : generateRows().map(row => (
                <tr key={row.id}>
                  <td style={STYLES.td}>{row.name}</td><td style={STYLES.td}>{row.location}</td>
                  <td style={STYLES.td}>{row.contractor}</td><td style={STYLES.td}>{row.qty}</td>
                  <td style={STYLES.td}>{row.due}</td>
                  <td style={STYLES.td}><span style={{ color: row.color, fontWeight: '700', fontSize: '12px' }}>{row.status}</span></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
