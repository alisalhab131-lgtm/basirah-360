import React from 'react';
import {
  LayoutGrid, Package, ArrowLeftRight, AlertTriangle,
  CheckCircle, Wrench, XCircle, TrendingUp, Users, MapPin, ShieldAlert
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { THEME, CONDITION_COLORS, STYLES } from '../utils/theme';

// Inject CSS Keyframes for Flashing Theft / Critical Alerts
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

function KpiCard({ icon: Icon, label, value, color, onClick, subtitle, isAlert }) {
  return (
    <div
      onClick={onClick}
      className={isAlert ? 'flash-alert-card' : ''}
      style={{
        backgroundColor: THEME.cardBg,
        border: `1px solid ${isAlert ? THEME.accentCrimson : THEME.border}`,
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
        backgroundColor: isAlert ? `${THEME.accentCrimson}25` : `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
      }}>
        <Icon size={22} color={isAlert ? THEME.accentCrimson : color} />
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '26px', fontWeight: '700', color: isAlert ? THEME.accentCrimson : THEME.textMain, lineHeight: 1 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{
            fontSize: '12px',
            color: isAlert ? THEME.accentCrimson : THEME.textMuted,
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

export default function DashboardPage({ materials, contractors, loans, returns, getLoanRemainingQty, navigateToAssets }) {
  const now = new Date();

  // Core Inventory & Deployment Totals
  const totalAvailable = materials.reduce((a, m) => a + Number(m.quantity || 0), 0);
  const totalLended = loans.reduce((a, l) => a + getLoanRemainingQty(l.id), 0);
  const totalStock = totalAvailable + totalLended;

  // Standard Overdue vs Severe Overdue (>14 Days / Ghost Assets)
  const overdueLoans = loans.filter(l => {
    const rem = getLoanRemainingQty(l.id);
    return rem > 0 && l.expected_return_date && new Date(l.expected_return_date) < now;
  });

  const severeOverdueLoans = loans.filter(l => {
    const rem = getLoanRemainingQty(l.id);
    if (rem <= 0 || !l.expected_return_date) return false;
    const daysOverdue = (now - new Date(l.expected_return_date)) / (1000 * 60 * 60 * 24);
    return daysOverdue > 14;
  });

  const severeOverdueQty = severeOverdueLoans.reduce((acc, l) => acc + getLoanRemainingQty(l.id), 0);

  // Return Condition Breakdown
  const returnQty = (r) => Number(r.quantity || 0);
  const totalGoodQty = returns.filter(r => r.returned_condition === 'Good').reduce((s, r) => s + returnQty(r), 0);
  const totalWornQty = returns.filter(r => r.returned_condition === 'Worn').reduce((s, r) => s + returnQty(r), 0);
  const totalDamagedQty = returns.filter(r => r.returned_condition === 'Damaged').reduce((s, r) => s + returnQty(r), 0);
  const totalReturnedQty = returns.reduce((s, r) => s + returnQty(r), 0);

  const utilizationRate = totalStock > 0 ? Math.round((totalLended / totalStock) * 100) : 0;
  const healthRate = totalReturnedQty > 0 ? Math.round((totalGoodQty / totalReturnedQty) * 100) : 0;

  // Site Deployment Data
  const siteChartData = Object.values(
    loans.reduce((acc, l) => {
      const rem = getLoanRemainingQty(l.id);
      if (rem <= 0 || !l.site_name) return acc;
      const site = l.site_name.trim();
      if (!acc[site]) acc[site] = { name: site, active: 0, overdue: 0 };
      const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < now;
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

  // Multi-Factor Contractor Risk & Health Engine
  const contractorHealth = contractors.map(c => {
    const cLoans = loans.filter(l => String(l.contractor_id) === String(c.id));
    const loanIds = cLoans.map(l => l.id);
    const loaned = cLoans.reduce((s, l) => s + Number(l.quantity || 0), 0);
    
    const cReturns = returns.filter(r => loanIds.includes(Number(r.loan_id)));
    const returnedQty = cReturns.reduce((s, r) => s + returnQty(r), 0);
    const goodQty = cReturns.filter(r => r.returned_condition === 'Good').reduce((s, r) => s + returnQty(r), 0);
    
    const stillOut = Math.max(0, loaned - returnedQty);

    // Multi-factor scores
    const returnComplianceRate = loaned > 0 ? Math.round((returnedQty / loaned) * 100) : 100;
    const conditionRate = returnedQty > 0 ? Math.round((goodQty / returnedQty) * 100) : 100;
    const compositeScore = Math.round((returnComplianceRate * 0.6) + (conditionRate * 0.4));

    return {
      id: c.id,
      name: c.contact_person,
      company: c.company_name,
      loaned,
      returnedQty,
      stillOut,
      returnComplianceRate,
      conditionRate,
      compositeScore,
      isHighRisk: compositeScore < 50 || (stillOut > 15 && returnComplianceRate < 40)
    };
  }).filter(c => c.loaned > 0).sort((a, b) => a.compositeScore - b.compositeScore).slice(0, 8);

  const goTo = (filter) => { if (navigateToAssets) navigateToAssets(filter); };

  return (
    <div>
      <style>{alertAnimationStyles}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Telemetry Dashboard</h2>
        <div style={{ fontSize: '12px', color: THEME.textMuted }}>
          {now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Top Level Metric Grid with Theft Alert */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <KpiCard icon={LayoutGrid} label="Total Stock" value={totalStock} color={THEME.accentBlue} onClick={() => goTo('ALL')} />
        <KpiCard icon={Package} label="Vault Reserve" value={totalAvailable} color={THEME.accentEmerald} onClick={() => goTo('AVAILABLE')} />
        <KpiCard icon={ArrowLeftRight} label="Active Deployments" value={totalLended} color={THEME.accentAmber} onClick={() => goTo('LENDED')} />
        
        {/* Flashing Alert Card for Theft Risk & Ghost Assets */}
        <KpiCard 
          icon={ShieldAlert} 
          label="Ghost Assets (>14d)" 
          value={`${severeOverdueQty} units`} 
          color={THEME.accentCrimson} 
          isAlert={severeOverdueQty > 0} 
          onClick={() => goTo('OVERDUE')} 
          subtitle={`${severeOverdueLoans.length} unrecovered critical loans`}
        />
      </div>

      {/* Operational Performance Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiCard icon={TrendingUp} label="Utilization Rate" value={`${utilizationRate}%`} color={THEME.accentPurple} subtitle={`${totalLended} of ${totalStock} units out`} />
        <KpiCard icon={AlertTriangle} label="Total Overdue" value={overdueLoans.length} color={THEME.accentAmber} subtitle="Loans past expected return" onClick={() => goTo('OVERDUE')} />
        <KpiCard icon={CheckCircle} label="Good Returns (qty)" value={totalGoodQty} color={THEME.accentEmerald} subtitle="Returned in good condition" />
        <KpiCard icon={Wrench} label="Worn Returns (qty)" value={totalWornQty} color={THEME.accentAmber} subtitle="Needs service review" />
        <KpiCard icon={XCircle} label="Damaged Returns (qty)" value={totalDamagedQty} color={THEME.accentCrimson} subtitle="Requires repair or scrap" />
        <KpiCard icon={Users} label="Contractors" value={contractors.length} color={THEME.accentCyan} subtitle="Registered custodians" />
        <KpiCard icon={MapPin} label="Active Sites" value={siteChartData.length} color={THEME.accentAmber} subtitle="Sites with deployments" />
        <KpiCard icon={Package} label="Total Returned (qty)" value={totalReturnedQty} color={THEME.accentBlue} subtitle="All-time recoveries" />
      </div>

      {/* Recharts Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
                  data={conditionData}
                  cx="50%" cy="50%" innerRadius={65} outerRadius={90}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  <Cell fill={CONDITION_COLORS.Good} />
                  <Cell fill={CONDITION_COLORS.Worn} />
                  <Cell fill={CONDITION_COLORS.Damaged} />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Contractor Risk & Health Table */}
      <div style={STYLES.box}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Users size={16} color={THEME.accentCyan} />
          <div style={{ ...STYLES.label, marginBottom: 0 }}>Contractor Risk & Health Matrix</div>
        </div>
        <p style={{ fontSize: '12px', color: THEME.textMuted, marginBottom: '14px' }}>
          Ranked by risk profile. High-risk custodians with poor return compliance or unreturned volume are highlighted.
        </p>
        <table style={STYLES.table}>
          <thead>
            <tr>
              <th style={STYLES.th}>Contractor</th>
              <th style={STYLES.th}>Company</th>
              <th style={STYLES.th}>Loaned</th>
              <th style={STYLES.th}>Returned</th>
              <th style={STYLES.th}>Still Out</th>
              <th style={STYLES.th}>Return Rate</th>
              <th style={STYLES.th}>Condition Health</th>
              <th style={STYLES.th}>Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {contractorHealth.length === 0 ? (
              <tr><td colSpan={8} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No contractor activity yet</td></tr>
            ) : (
              contractorHealth.map(c => (
                <tr key={c.id} style={{ backgroundColor: c.isHighRisk ? 'rgba(220, 38, 38, 0.06)' : 'transparent' }}>
                  <td style={STYLES.td}><strong>{c.name}</strong></td>
                  <td style={STYLES.td}>{c.company}</td>
                  <td style={STYLES.td}>{c.loaned}</td>
                  <td style={STYLES.td}>{c.returnedQty}</td>
                  <td style={{ ...STYLES.td, color: c.stillOut > 0 ? THEME.accentAmber : THEME.textMain }}>{c.stillOut}</td>
                  <td style={STYLES.td}>{c.returnComplianceRate}%</td>
                  <td style={STYLES.td}>{c.conditionRate}%</td>
                  <td style={STYLES.td}>
                    <span style={{
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: c.compositeScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : c.compositeScore >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(220, 38, 38, 0.2)',
                      color: c.compositeScore >= 80 ? THEME.accentEmerald : c.compositeScore >= 50 ? THEME.accentAmber : THEME.accentCrimson
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