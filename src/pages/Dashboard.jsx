import React, { useState } from 'react';
import {
  LayoutGrid, Package, ArrowLeftRight, AlertTriangle,
  CheckCircle, Wrench, XCircle, TrendingUp, Users, MapPin
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { THEME, CONDITION_COLORS, STYLES } from '../utils/theme';

function KpiCard({ icon: Icon, label, value, color, isActive, onClick, subtitle }) {
  return (
    <div onClick={onClick} style={{
      backgroundColor: THEME.cardBg,
      border: `1px solid ${isActive ? color : THEME.border}`,
      padding: '20px 24px', borderRadius: '12px',
      display: 'flex', alignItems: 'center', gap: '16px',
      cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s',
      boxShadow: isActive ? `0 0 0 1px ${color}22` : 'none',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        backgroundColor: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '26px', fontWeight: '700', color: THEME.textMain, lineHeight: 1 }}>{value}</div>
        {subtitle && <div style={{ fontSize: '12px', color: THEME.textMuted, marginTop: '4px' }}>{subtitle}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage({ materials, contractors, loans, returns, getLoanRemainingQty }) {
  const [cardFilter, setCardFilter] = useState('ALL');
  const [drillDown, setDrillDown] = useState({ active: false, type: null, value: null });

  const totalAvailable = materials.reduce((a, m) => a + Number(m.quantity || 0), 0);
  const totalLended = loans.reduce((a, l) => a + getLoanRemainingQty(l.id), 0);
  const totalStock = totalAvailable + totalLended;

  const overdueLoans = loans.filter(l => {
    const rem = getLoanRemainingQty(l.id);
    return rem > 0 && l.expected_return_date && new Date(l.expected_return_date) < new Date();
  });

  const totalGood = returns.filter(r => r.returned_condition === 'Good').reduce((s, r) => s + Number(r.returned_quantity || r.quantity || 0), 0);
  const totalWorn = returns.filter(r => r.returned_condition === 'Worn').reduce((s, r) => s + Number(r.returned_quantity || r.quantity || 0), 0);
  const totalDamaged = returns.filter(r => r.returned_condition === 'Damaged').reduce((s, r) => s + Number(r.returned_quantity || r.quantity || 0), 0);
  const totalReturned = totalGood + totalWorn + totalDamaged;

  const utilizationRate = totalStock > 0 ? Math.round((totalLended / totalStock) * 100) : 0;
  const healthRate = totalReturned > 0 ? Math.round((totalGood / totalReturned) * 100) : 0;

  const siteChartData = Object.values(
    loans.reduce((acc, l) => {
      const rem = getLoanRemainingQty(l.id);
      if (rem <= 0 || !l.site_name) return acc;
      const site = l.site_name.trim();
      if (!acc[site]) acc[site] = { name: site, active: 0, overdue: 0 };
      const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date();
      if (isOverdue) acc[site].overdue += rem;
      else acc[site].active += rem;
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Telemetry Dashboard</h2>
        <div style={{ fontSize: '12px', color: THEME.textMuted }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <KpiCard icon={LayoutGrid} label="Total Managed Stock" value={totalStock} color={THEME.accentBlue} isActive={cardFilter === 'ALL'} onClick={clearFilters} />
        <KpiCard icon={Package} label="Vault Reserve" value={totalAvailable} color={THEME.accentEmerald} isActive={cardFilter === 'AVAILABLE'} onClick={() => setCardFilter('AVAILABLE')} />
        <KpiCard icon={ArrowLeftRight} label="Active Deployments" value={totalLended} color={THEME.accentAmber} isActive={cardFilter === 'LENDED'} onClick={() => setCardFilter('LENDED')} />
        <KpiCard icon={AlertTriangle} label="Overdue Loans" value={overdueLoans.length} color={THEME.accentCrimson} isActive={cardFilter === 'OVERDUE'} onClick={() => setCardFilter('OVERDUE')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiCard icon={TrendingUp} label="Utilization Rate" value={`${utilizationRate}%`} color={THEME.accentPurple} subtitle={`${totalLended} of ${totalStock} units out`} />
        <KpiCard icon={CheckCircle} label="Good Condition" value={totalGood} color={THEME.accentEmerald} subtitle="Returned units" />
        <KpiCard icon={Wrench} label="Worn Condition" value={totalWorn} color={THEME.accentAmber} subtitle="Needs service review" />
        <KpiCard icon={XCircle} label="Damaged" value={totalDamaged} color={THEME.accentCrimson} subtitle="Critical scrap" />
        <KpiCard icon={Users} label="Active Contractors" value={contractors.length} color={THEME.accentCyan} subtitle="Registered custodians" />
        <KpiCard icon={MapPin} label="Active Sites" value={siteChartData.length} color={THEME.accentAmber} subtitle="Locations with deployments" />
        <KpiCard icon={CheckCircle} label="Return Health Rate" value={`${healthRate}%`} color={THEME.accentEmerald} subtitle="Good of all returns" />
        <KpiCard icon={Package} label="Total Returned" value={totalReturned} color={THEME.accentBlue} subtitle="All-time items recovered" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Deployments by Site — click to drill down</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={siteChartData} onClick={(d) => d?.activePayload && setDrillDown({ active: true, type: 'SITE', value: d.activeLabel })}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="name" stroke={THEME.textMuted} tick={{ fontSize: 11 }} />
                <YAxis stroke={THEME.textMuted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                <Legend />
                <Bar dataKey="active" name="Active" fill={THEME.accentAmber} stackId="a" />
                <Bar dataKey="overdue" name="Overdue" fill={THEME.accentCrimson} stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Return Condition Mix</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[{ name: 'Good', value: totalGood }, { name: 'Worn', value: totalWorn }, { name: 'Damaged', value: totalDamaged }].filter(d => d.value > 0)}
                  cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                >
                  <Cell fill={CONDITION_COLORS.Good} /><Cell fill={CONDITION_COLORS.Worn} /><Cell fill={CONDITION_COLORS.Damaged} />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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