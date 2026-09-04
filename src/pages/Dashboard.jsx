cd C:\Users\mapax\inventory-system\frontend

# 1. Overwrite src\pages\Dashboard.jsx directly
Set-Content -Path "src\pages\Dashboard.jsx" -Value @'
import React from 'react';
import {
  LayoutGrid, Package, ArrowLeftRight, AlertTriangle,
  CheckCircle, Wrench, XCircle, TrendingUp, Users, MapPin
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { THEME, CONDITION_COLORS, STYLES } from '../utils/theme';

const safeTheme = THEME || {
  cardBg: '#1e293b',
  border: '#334155',
  textMain: '#ffffff',
  textMuted: '#94a3b8',
  accentBlue: '#3b82f6',
  accentEmerald: '#10b981',
  accentAmber: '#f59e0b',
  accentCrimson: '#ef4444',
  accentPurple: '#8b5cf6',
  accentCyan: '#06b6d4',
};

const safeStyles = STYLES || {
  box: { backgroundColor: safeTheme.cardBg, border: `1px solid ${safeTheme.border}`, padding: '20px', borderRadius: '12px' },
  label: { fontSize: '14px', fontWeight: '700', color: safeTheme.textMain, marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px', color: safeTheme.textMuted, fontSize: '12px', borderBottom: `1px solid ${safeTheme.border}` },
  td: { padding: '10px', fontSize: '13px', color: safeTheme.textMain, borderBottom: `1px solid ${safeTheme.border}` }
};

const safeConditionColors = CONDITION_COLORS || {
  Good: '#10b981',
  Worn: '#f59e0b',
  Damaged: '#ef4444'
};

const alertAnimationStyles = `
  @keyframes flashRed {
    0% { border-color: rgba(220, 38, 38, 0.4); box-shadow: 0 0 0px rgba(220, 38, 38, 0); }
    50% { border-color: rgba(220, 38, 38, 1); box-shadow: 0 0 14px rgba(220, 38, 38, 0.6); }
    100% { border-color: rgba(220, 38, 38, 0.4); box-shadow: 0 0 0px rgba(220, 38, 38, 0); }
  }
  .flash-alert-card {
    animation: flashRed 1.5s infinite ease-in-out !important;
    background-color: rgba(220, 38, 38, 0.08) !important;
  }
`;

function KpiCard({ icon: Icon = AlertTriangle, label = '', value = 0, color = '#3b82f6', onClick, subtitle, isAlert }) {
  return (
    <div
      onClick={onClick}
      className={isAlert ? 'flash-alert-card' : ''}
      style={{
        backgroundColor: safeTheme.cardBg,
        border: `1px solid ${isAlert ? safeTheme.accentCrimson : safeTheme.border}`,
        padding: '20px 24px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        backgroundColor: isAlert ? `${safeTheme.accentCrimson}25` : `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={22} color={isAlert ? safeTheme.accentCrimson : color} />
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: safeTheme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '26px', fontWeight: '700', color: isAlert ? safeTheme.accentCrimson : safeTheme.textMain, lineHeight: 1 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{
            fontSize: '12px',
            color: isAlert ? safeTheme.accentCrimson : safeTheme.textMuted,
            marginTop: '4px',
            fontWeight: isAlert ? '600' : '400'
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage({
  materials = [],
  contractors = [],
  loans = [],
  returns = [],
  getLoanRemainingQty = () => 0,
  navigateToAssets = () => {}
}) {
  const now = new Date();

  // 1. Safe Data Wrappers
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeContractors = Array.isArray(contractors) ? contractors : [];
  const safeLoans = Array.isArray(loans) ? loans : [];
  const safeReturns = Array.isArray(returns) ? returns : [];
  const safeGetRem = typeof getLoanRemainingQty === 'function' ? getLoanRemainingQty : () => 0;

  // 2. Core Stock Calculations
  const totalAvailable = safeMaterials.reduce((a, m) => a + Number(m?.quantity || 0), 0);
  const totalLended = safeLoans.reduce((a, l) => a + safeGetRem(l?.id), 0);
  const totalStock = totalAvailable + totalLended;

  const utilizationRate = totalStock > 0 ? Math.round((totalLended / totalStock) * 100) : 0;

  // Overdue & Ghost Assets
  const overdueLoans = safeLoans.filter(l => {
    const rem = safeGetRem(l?.id);
    if (rem <= 0 || !l?.expected_return_date) return false;
    const d = new Date(l.expected_return_date);
    return !isNaN(d.getTime()) && d < now;
  });

  const severeOverdueLoans = safeLoans.filter(l => {
    const rem = safeGetRem(l?.id);
    if (rem <= 0 || !l?.expected_return_date) return false;
    const d = new Date(l.expected_return_date);
    if (isNaN(d.getTime())) return false;
    const daysOverdue = (now - d) / (1000 * 60 * 60 * 24);
    return daysOverdue > 14;
  });

  const severeOverdueQty = severeOverdueLoans.reduce((acc, l) => acc + safeGetRem(l?.id), 0);

  // Returns
  const returnQty = (r) => Number(r?.quantity || 0);
  const totalGoodQty = safeReturns.filter(r => r?.returned_condition === 'Good').reduce((s, r) => s + returnQty(r), 0);
  const totalWornQty = safeReturns.filter(r => r?.returned_condition === 'Worn').reduce((s, r) => s + returnQty(r), 0);
  const totalDamagedQty = safeReturns.filter(r => r?.returned_condition === 'Damaged').reduce((s, r) => s + returnQty(r), 0);
  const totalReturnedQty = safeReturns.reduce((s, r) => s + returnQty(r), 0);

  // Site Deployment Aggregates
  const siteChartData = Object.values(
    safeLoans.reduce((acc, l) => {
      const rem = safeGetRem(l?.id);
      if (rem <= 0 || !l?.site_name) return acc;
      const site = String(l.site_name).trim();
      if (!acc[site]) acc[site] = { name: site, active: 0, overdue: 0 };
      const d = l?.expected_return_date ? new Date(l.expected_return_date) : null;
      const isOverdue = d && !isNaN(d.getTime()) && d < now;
      if (isOverdue) acc[site].overdue += rem;
      else acc[site].active += rem;
      return acc;
    }, {})
  );

  const conditionData = [
    { name: 'Good', value: totalGoodQty },
    { name: 'Worn', value: totalWornQty },
    { name: 'Damaged', value: totalDamagedQty },
  ].filter(d => d.value > 0);

  // Contractor Health Matrix
  const contractorHealth = safeContractors.map(c => {
    const cLoans = safeLoans.filter(l => String(l?.contractor_id) === String(c?.id));
    const loanIds = cLoans.map(l => l?.id);
    const loaned = cLoans.reduce((s, l) => s + Number(l?.quantity || 0), 0);
    
    const cReturns = safeReturns.filter(r => loanIds.includes(Number(r?.loan_id)));
    const returnedQty = cReturns.reduce((s, r) => s + returnQty(r), 0);
    const goodQty = cReturns.filter(r => r?.returned_condition === 'Good').reduce((s, r) => s + returnQty(r), 0);
    
    const stillOut = Math.max(0, loaned - returnedQty);
    const returnComplianceRate = loaned > 0 ? Math.round((returnedQty / loaned) * 100) : 100;
    const conditionRate = returnedQty > 0 ? Math.round((goodQty / returnedQty) * 100) : 100;
    const compositeScore = Math.round((returnComplianceRate * 0.6) + (conditionRate * 0.4));

    return {
      id: c?.id || Math.random(),
      name: c?.contact_person || 'Unknown Contact',
      company: c?.company_name || 'N/A',
      loaned,
      returnedQty,
      stillOut,
      returnComplianceRate,
      conditionRate,
      compositeScore,
      isHighRisk: compositeScore < 50 || (stillOut > 15 && returnComplianceRate < 40)
    };
  }).filter(c => c.loaned > 0).sort((a, b) => a.compositeScore - b.compositeScore).slice(0, 8);

  const goTo = (filter) => { if (typeof navigateToAssets === 'function') navigateToAssets(filter); };

  return (
    <div>
      <style>{alertAnimationStyles}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: safeTheme.textMain }}>Telemetry Dashboard</h2>
        <div style={{ fontSize: '12px', color: safeTheme.textMuted }}>
          {now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <KpiCard icon={LayoutGrid} label="Total Stock" value={totalStock} color={safeTheme.accentBlue} onClick={() => goTo('ALL')} />
        <KpiCard icon={Package} label="Vault Reserve" value={totalAvailable} color={safeTheme.accentEmerald} onClick={() => goTo('AVAILABLE')} />
        <KpiCard icon={ArrowLeftRight} label="Active Deployments" value={totalLended} color={safeTheme.accentAmber} onClick={() => goTo('LENDED')} />
        
        <KpiCard 
          icon={AlertTriangle} 
          label="Ghost Assets (>14d)" 
          value={`${severeOverdueQty} units`} 
          color={safeTheme.accentCrimson} 
          isAlert={severeOverdueQty > 0} 
          onClick={() => goTo('OVERDUE')} 
          subtitle={`${severeOverdueLoans.length} unrecovered critical loans`}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiCard icon={TrendingUp} label="Utilization Rate" value={`${utilizationRate}%`} color={safeTheme.accentPurple} subtitle={`${totalLended} of ${totalStock} units out`} />
        <KpiCard icon={AlertTriangle} label="Total Overdue" value={overdueLoans.length} color={safeTheme.accentAmber} subtitle="Loans past expected return" onClick={() => goTo('OVERDUE')} />
        <KpiCard icon={CheckCircle} label="Good Returns (qty)" value={totalGoodQty} color={safeTheme.accentEmerald} subtitle="Returned in good condition" />
        <KpiCard icon={Wrench} label="Worn Returns (qty)" value={totalWornQty} color={safeTheme.accentAmber} subtitle="Needs service review" />
        <KpiCard icon={XCircle} label="Damaged Returns (qty)" value={totalDamagedQty} color={safeTheme.accentCrimson} subtitle="Requires repair or scrap" />
        <KpiCard icon={Users} label="Contractors" value={safeContractors.length} color={safeTheme.accentCyan} subtitle="Registered custodians" />
        <KpiCard icon={MapPin} label="Active Sites" value={siteChartData.length} color={safeTheme.accentAmber} subtitle="Sites with deployments" />
        <KpiCard icon={Package} label="Total Returned (qty)" value={totalReturnedQty} color={safeTheme.accentBlue} subtitle="All-time recoveries" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={safeStyles.box}>
          <div style={safeStyles.label}>Deployments by Site</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={siteChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={safeTheme.border} />
                <XAxis dataKey="name" stroke={safeTheme.textMuted} tick={{ fontSize: 11 }} />
                <YAxis stroke={safeTheme.textMuted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: safeTheme.cardBg, borderColor: safeTheme.border, color: '#fff' }} />
                <Legend />
                <Bar dataKey="active" name="Active" fill={safeTheme.accentAmber} stackId="a" />
                <Bar dataKey="overdue" name="Overdue" fill={safeTheme.accentCrimson} stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={safeStyles.box}>
          <div style={safeStyles.label}>Return Condition Mix</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={conditionData}
                  cx="50%" cy="50%" innerRadius={65} outerRadius={90}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  <Cell fill={safeConditionColors.Good || '#10b981'} />
                  <Cell fill={safeConditionColors.Worn || '#f59e0b'} />
                  <Cell fill={safeConditionColors.Damaged || '#ef4444'} />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: safeTheme.cardBg, borderColor: safeTheme.border, color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={safeStyles.box}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Users size={16} color={safeTheme.accentCyan} />
          <div style={{ ...safeStyles.label, marginBottom: 0 }}>Contractor Risk & Health Matrix</div>
        </div>
        <p style={{ fontSize: '12px', color: safeTheme.textMuted, marginBottom: '14px' }}>
          Ranked by risk profile. High-risk custodians with poor return compliance or unreturned volume are highlighted.
        </p>
        <table style={safeStyles.table}>
          <thead>
            <tr>
              <th style={safeStyles.th}>Contractor</th>
              <th style={safeStyles.th}>Company</th>
              <th style={safeStyles.th}>Loaned</th>
              <th style={safeStyles.th}>Returned</th>
              <th style={safeStyles.th}>Still Out</th>
              <th style={safeStyles.th}>Return Rate</th>
              <th style={safeStyles.th}>Condition Health</th>
              <th style={safeStyles.th}>Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {contractorHealth.length === 0 ? (
              <tr><td colSpan={8} style={{ ...safeStyles.td, textAlign: 'center', color: safeTheme.textMuted }}>No contractor activity yet</td></tr>
            ) : (
              contractorHealth.map(c => (
                <tr key={c.id} style={{ backgroundColor: c.isHighRisk ? 'rgba(220, 38, 38, 0.06)' : 'transparent' }}>
                  <td style={safeStyles.td}><strong>{c.name}</strong></td>
                  <td style={safeStyles.td}>{c.company}</td>
                  <td style={safeStyles.td}>{c.loaned}</td>
                  <td style={safeStyles.td}>{c.returnedQty}</td>
                  <td style={{ ...safeStyles.td, color: c.stillOut > 0 ? safeTheme.accentAmber : safeTheme.textMain }}>{c.stillOut}</td>
                  <td style={safeStyles.td}>{c.returnComplianceRate}%</td>
                  <td style={safeStyles.td}>{c.conditionRate}%</td>
                  <td style={safeStyles.td}>
                    <span style={{
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: c.compositeScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : c.compositeScore >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(220, 38, 38, 0.2)',
                      color: c.compositeScore >= 80 ? safeTheme.accentEmerald : c.compositeScore >= 50 ? safeTheme.accentAmber : safeTheme.accentCrimson
                    }}>
                      {c.compositeScore}% {c.isHighRisk ? '(HIGH RISK)' : ''}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


