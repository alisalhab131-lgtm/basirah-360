import React, { useState } from 'react';
import {
  TrendingUp, Package, AlertTriangle, ShieldAlert,
  ArrowUpRight, BarChart2, Layers, CheckCircle, Wrench, XCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area
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

export default function Analytics({
  materials = [],
  contractors = [],
  loans = [],
  returns = [],
  getLoanRemainingQty = () => 0,
  setDrillType = () => {},
  setDrillValue = () => {}
}) {
  const now = new Date();

  // 1. Safe Data Wrappers & Core Metrics
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeContractors = Array.isArray(contractors) ? contractors : [];
  const safeLoans = Array.isArray(loans) ? loans : [];
  const safeReturns = Array.isArray(returns) ? returns : [];
  const safeGetRem = typeof getLoanRemainingQty === 'function' ? getLoanRemainingQty : () => 0;

  const totalStock = safeMaterials.reduce((sum, m) => sum + Number(m?.quantity || 0), 0);
  const deployedUnits = safeLoans.reduce((sum, l) => sum + safeGetRem(l?.id), 0);
  const availableUnits = Math.max(0, totalStock - deployedUnits);
  const utilizationRate = totalStock > 0 ? Math.round((deployedUnits / totalStock) * 100) : 0;

  // 2. Returns Breakdown
  const returnQty = (r) => Number(r?.quantity || 0);
  const totalGoodQty = safeReturns.filter(r => r?.returned_condition === 'Good').reduce((s, r) => s + returnQty(r), 0);
  const totalWornQty = safeReturns.filter(r => r?.returned_condition === 'Worn').reduce((s, r) => s + returnQty(r), 0);
  const totalDamagedQty = safeReturns.filter(r => r?.returned_condition === 'Damaged').reduce((s, r) => s + returnQty(r), 0);
  const totalReturnedQty = safeReturns.reduce((s, r) => s + returnQty(r), 0);

  const conditionMixData = [
    { name: 'Good', value: totalGoodQty },
    { name: 'Worn', value: totalWornQty },
    { name: 'Damaged', value: totalDamagedQty },
  ].filter(d => d.value > 0);

  // 3. Category Distribution
  const categoryMap = safeMaterials.reduce((acc, m) => {
    const cat = m?.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += Number(m?.quantity || 0);
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // 4. Drilldown Handlers (Using app native setDrillType / setDrillValue)
  const handleDrill = (type, val) => {
    if (typeof setDrillType === 'function') setDrillType(type);
    if (typeof setDrillValue === 'function') setDrillValue(val);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: safeTheme.textMain }}>Advanced Analytics & Telemetry</h2>
          <p style={{ fontSize: '13px', color: safeTheme.textMuted, margin: '4px 0 0 0' }}>Deep telemetry insights, inventory distributions, and risk scoring.</p>
        </div>
        <div style={{ fontSize: '12px', color: safeTheme.textMuted }}>
          {now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Executive Risk & KPI Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={safeStyles.box} onClick={() => handleDrill('ALL', null)} role="button" style={{ ...safeStyles.box, cursor: 'pointer' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: safeTheme.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>Total Inventory Stock</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: safeTheme.textMain }}>{totalStock.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: safeTheme.accentBlue, marginTop: '4px' }}>Across {safeMaterials.length} item types</div>
        </div>
        <div style={safeStyles.box} onClick={() => handleDrill('AVAILABLE', null)} role="button" style={{ ...safeStyles.box, cursor: 'pointer' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: safeTheme.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>Available Reserve</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: safeTheme.accentEmerald }}>{availableUnits.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: safeTheme.textMuted, marginTop: '4px' }}>Ready for deployment</div>
        </div>
        <div style={safeStyles.box} onClick={() => handleDrill('LENDED', null)} role="button" style={{ ...safeStyles.box, cursor: 'pointer' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: safeTheme.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>Active Deployments</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: safeTheme.accentAmber }}>{deployedUnits.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: safeTheme.textMuted, marginTop: '4px' }}>{utilizationRate}% utilization rate</div>
        </div>
        <div style={safeStyles.box}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: safeTheme.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>Total Recoveries</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: safeTheme.accentPurple }}>{totalReturnedQty.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: safeTheme.textMuted, marginTop: '4px' }}>{totalGoodQty} returned in good order</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <div style={safeStyles.box}>
          <div style={safeStyles.label}>Inventory Distribution by Category</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={safeTheme.border} />
                <XAxis dataKey="name" stroke={safeTheme.textMuted} tick={{ fontSize: 11 }} />
                <YAxis stroke={safeTheme.textMuted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: safeTheme.cardBg, borderColor: safeTheme.border, color: '#fff' }} />
                <Bar dataKey="value" fill={safeTheme.accentBlue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={safeStyles.box}>
          <div style={safeStyles.label}>Return Asset Condition Breakdown</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={conditionMixData}
                  cx="50%" cy="50%" innerRadius={65} outerRadius={90}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  <Cell fill={CONDITION_COLORS?.Good || '#10b981'} />
                  <Cell fill={CONDITION_COLORS?.Worn || '#f59e0b'} />
                  <Cell fill={CONDITION_COLORS?.Damaged || '#ef4444'} />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: safeTheme.cardBg, borderColor: safeTheme.border, color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Telemetry Summary Table */}
      <div style={safeStyles.box}>
        <div style={safeStyles.label}>Core Metrics Summary Export Matrix</div>
        <table style={safeStyles.table}>
          <thead>
            <tr>
              <th style={safeStyles.th}>Metric Parameter</th>
              <th style={safeStyles.th}>Quantified Value</th>
              <th style={safeStyles.th}>Operational Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={safeStyles.td}><strong>Total Stock</strong></td>
              <td style={safeStyles.td}>{totalStock.toLocaleString()} units</td>
              <td style={{ ...safeStyles.td, color: safeTheme.accentEmerald }}>Active</td>
            </tr>
            <tr>
              <td style={safeStyles.td}><strong>Vault Reserve (Available)</strong></td>
              <td style={safeStyles.td}>{availableUnits.toLocaleString()} units</td>
              <td style={{ ...safeStyles.td, color: safeTheme.accentBlue }}>Ready</td>
            </tr>
            <tr>
              <td style={safeStyles.td}><strong>Active Field Deployments</strong></td>
              <td style={safeStyles.td}>{deployedUnits.toLocaleString()} units</td>
              <td style={{ ...safeStyles.td, color: safeTheme.accentAmber }}>Deployed</td>
            </tr>
            <tr>
              <td style={safeStyles.td}><strong>Condition Quality Index</strong></td>
              <td style={safeStyles.td}>{totalReturnedQty > 0 ? Math.round((totalGoodQty / totalReturnedQty) * 100) : 100}% Good</td>
              <td style={{ ...safeStyles.td, color: safeTheme.accentEmerald }}>Optimal</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}