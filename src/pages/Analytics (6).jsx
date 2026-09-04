import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { MapPin, Users, ChevronRight, ChevronLeft, Download, Trash2, AlertTriangle } from 'lucide-react';
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

// ── Shared aggregation helpers (used across drill-downs) ────────────────────
function monthKey(dateStr) {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d)) return 'Unknown';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}
function buildStackedTrend(recordsList) {
  const map = {};
  recordsList.forEach(r => {
    const key = monthKey(r.return_date);
    if (!map[key]) map[key] = { month: key, Good: 0, Worn: 0, Damaged: 0 };
    const q = returnQty(r);
    if (r.returned_condition === 'Good') map[key].Good += q;
    else if (r.returned_condition === 'Worn') map[key].Worn += q;
    else if (r.returned_condition === 'Damaged') map[key].Damaged += q;
  });
  return Object.values(map).sort((a, b) => new Date(a.month) - new Date(b.month));
}
function buildSingleTrend(recordsList) {
  const map = {};
  recordsList.forEach(r => {
    const key = monthKey(r.return_date);
    if (!map[key]) map[key] = { month: key, qty: 0 };
    map[key].qty += returnQty(r);
  });
  return Object.values(map).sort((a, b) => new Date(a.month) - new Date(b.month));
}
function buildShareTrend(allReturns, conditionValue) {
  const totalMap = {};
  const condMap = {};
  allReturns.forEach(r => {
    const key = monthKey(r.return_date);
    totalMap[key] = (totalMap[key] || 0) + returnQty(r);
    if (r.returned_condition === conditionValue) condMap[key] = (condMap[key] || 0) + returnQty(r);
  });
  return Object.keys(totalMap).map(key => ({
    month: key,
    sharePct: totalMap[key] > 0 ? Math.round(((condMap[key] || 0) / totalMap[key]) * 100) : 0,
  })).sort((a, b) => new Date(a.month) - new Date(b.month));
}

function buildTopBy(recordsList, keyFn, limit = 8) {
  const map = {};
  recordsList.forEach(r => {
    const name = keyFn(r) || 'Unknown';
    if (!map[name]) map[name] = { name, qty: 0 };
    map[name].qty += returnQty(r);
  });
  return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, limit);
}

// ── Material Condition Diagnostics — reusable for global or contractor scope ─
function MaterialConditionBreakdown({ returns, onMaterialClick, showTable = true }) {
  const map = {};
  returns.forEach(r => {
    const name = r.material_name || 'Unknown';
    if (!map[name]) map[name] = { name, good: 0, worn: 0, damaged: 0 };
    const q = returnQty(r);
    if (r.returned_condition === 'Good') map[name].good += q;
    else if (r.returned_condition === 'Worn') map[name].worn += q;
    else if (r.returned_condition === 'Damaged') map[name].damaged += q;
  });
  const rows = Object.values(map).map(m => {
    const total = m.good + m.worn + m.damaged;
    const problemRate = total > 0 ? Math.round(((m.worn + m.damaged) / total) * 100) : 0;
    return { ...m, total, problemRate };
  }).sort((a, b) => b.problemRate - a.problemRate || b.total - a.total);

  if (rows.length === 0) return <div style={{ color: THEME.textMuted, fontSize: '13px', padding: '20px 0' }}>No return data yet</div>;

  const barClick = (data) => { if (onMaterialClick && data && data.name) onMaterialClick(data.name); };

  return (
    <div>
      {onMaterialClick && (
        <div style={{ fontSize: '11px', color: THEME.textMuted, marginBottom: '10px', fontStyle: 'italic' }}>
          Click any bar to see the detailed records for that material
        </div>
      )}
      <div style={{ height: Math.max(220, rows.length * 36) }}>
        <ResponsiveContainer>
          <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
            <XAxis type="number" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" stroke={THEME.textMuted} tick={{ fontSize: 11 }} width={150} />
            <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
            <Legend />
            <Bar dataKey="good" name="Good" stackId="a" fill={CONDITION_COLORS.Good} onClick={barClick} cursor={onMaterialClick ? 'pointer' : 'default'} />
            <Bar dataKey="worn" name="Worn" stackId="a" fill={CONDITION_COLORS.Worn} onClick={barClick} cursor={onMaterialClick ? 'pointer' : 'default'} />
            <Bar dataKey="damaged" name="Damaged" stackId="a" fill={CONDITION_COLORS.Damaged} radius={[0, 4, 4, 0]} onClick={barClick} cursor={onMaterialClick ? 'pointer' : 'default'} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {showTable && (
        <table style={{ ...STYLES.table, marginTop: '16px' }}>
          <thead><tr>
            <th style={STYLES.th}>Material</th><th style={STYLES.th}>Good</th><th style={STYLES.th}>Worn</th>
            <th style={STYLES.th}>Damaged</th><th style={STYLES.th}>Total</th><th style={STYLES.th}>Problem Rate</th>
          </tr></thead>
          <tbody>
            {rows.map(m => (
              <tr key={m.name} style={onMaterialClick ? { cursor: 'pointer' } : {}} onClick={() => barClick(m)}>
                <td style={STYLES.td}><strong>{m.name}</strong></td>
                <td style={{ ...STYLES.td, color: THEME.accentEmerald }}>{m.good}</td>
                <td style={{ ...STYLES.td, color: THEME.accentAmber }}>{m.worn}</td>
                <td style={{ ...STYLES.td, color: THEME.accentCrimson }}>{m.damaged}</td>
                <td style={STYLES.td}>{m.total}</td>
                <td style={STYLES.td}>
                  <span style={{ fontWeight: '700', color: m.problemRate >= 50 ? THEME.accentCrimson : m.problemRate >= 20 ? THEME.accentAmber : THEME.accentEmerald }}>
                    {m.problemRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Material Usage chart — total quantity loaned per material (clickable) ──
function MaterialUsageChart({ loansList, onMaterialClick }) {
  const map = {};
  loansList.forEach(l => {
    const name = l.material_name || 'Unknown';
    if (!map[name]) map[name] = { name, qty: 0 };
    map[name].qty += Number(l.quantity || 0);
  });
  const rows = Object.values(map).sort((a, b) => b.qty - a.qty);
  if (rows.length === 0) return <div style={{ color: THEME.textMuted, fontSize: '13px', padding: '20px 0' }}>No loan data yet</div>;

  const barClick = (data) => { if (onMaterialClick && data && data.name) onMaterialClick(data.name); };

  return (
    <div>
      {onMaterialClick && (
        <div style={{ fontSize: '11px', color: THEME.textMuted, marginBottom: '10px', fontStyle: 'italic' }}>
          Click any bar to see the detailed loan/return records for that material
        </div>
      )}
      <div style={{ height: Math.max(220, rows.length * 36) }}>
        <ResponsiveContainer>
          <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
            <XAxis type="number" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" stroke={THEME.textMuted} tick={{ fontSize: 11 }} width={150} />
            <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
            <Bar dataKey="qty" name="Qty Loaned" fill={THEME.accentBlue} radius={[0, 4, 4, 0]} onClick={barClick} cursor={onMaterialClick ? 'pointer' : 'default'} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${THEME.accentBlue}18`, color: THEME.accentBlue, border: `1px solid ${THEME.accentBlue}44`, borderRadius: '20px', padding: '4px 6px 4px 12px', fontSize: '12px', fontWeight: '600' }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: THEME.accentBlue, cursor: 'pointer', fontSize: '15px', lineHeight: 1, padding: '0 4px' }}>×</button>
    </span>
  );
}

// ── Interactive explorer: grouped bar (Loaned vs Returned) + clickable donut ──
// + search/dropdown filters + filter chips + reactive Loan History & Return tables
// ── Per-material condition breakdown as a stacked VERTICAL bar chart ────────
// Columns = materials, each column split into Good/Worn/Damaged (green/amber/red)
// Tooltip shows both the raw count and the percentage. Clicking a segment filters.
function MaterialConditionStackedChart({ returns, onMaterialClick }) {
  const map = {};
  returns.forEach(r => {
    const name = r.material_name || 'Unknown';
    if (!map[name]) map[name] = { name, Good: 0, Worn: 0, Damaged: 0 };
    const q = returnQty(r);
    if (r.returned_condition === 'Good') map[name].Good += q;
    else if (r.returned_condition === 'Worn') map[name].Worn += q;
    else if (r.returned_condition === 'Damaged') map[name].Damaged += q;
  });
  const rows = Object.values(map).map(m => {
    const total = m.Good + m.Worn + m.Damaged;
    return {
      ...m, total,
      GoodPct: total > 0 ? Math.round((m.Good / total) * 100) : 0,
      WornPct: total > 0 ? Math.round((m.Worn / total) * 100) : 0,
      DamagedPct: total > 0 ? Math.round((m.Damaged / total) * 100) : 0,
    };
  }).sort((a, b) => b.total - a.total);

  if (rows.length === 0) return <div style={{ color: THEME.textMuted, fontSize: '13px', padding: '20px 0' }}>No condition data yet</div>;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const row = rows.find(r => r.name === label);
    if (!row) return null;
    return (
      <div style={{ backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
        <div style={{ fontWeight: '700', color: THEME.textMain, marginBottom: '6px' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
            <span>{p.dataKey}:</span>
            <span style={{ fontWeight: '700' }}>{p.value} ({row[p.dataKey + 'Pct']}%)</span>
          </div>
        ))}
      </div>
    );
  };

  const barClick = (data) => { if (onMaterialClick && data && data.name) onMaterialClick(data.name); };

  return (
    <div>
      {onMaterialClick && (
        <div style={{ fontSize: '11px', color: THEME.textMuted, marginBottom: '10px', fontStyle: 'italic' }}>
          Hover a column for exact numbers and percentages · click to filter the table below
        </div>
      )}
      <div style={{ height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ bottom: 50, top: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
            <XAxis dataKey="name" stroke={THEME.textMuted} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} height={60} />
            <YAxis stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Good" name="Good" stackId="cond" fill={CONDITION_COLORS.Good} onClick={barClick} cursor={onMaterialClick ? 'pointer' : 'default'} />
            <Bar dataKey="Worn" name="Worn" stackId="cond" fill={CONDITION_COLORS.Worn} onClick={barClick} cursor={onMaterialClick ? 'pointer' : 'default'} />
            <Bar dataKey="Damaged" name="Damaged" stackId="cond" fill={CONDITION_COLORS.Damaged} radius={[4, 4, 0, 0]} onClick={barClick} cursor={onMaterialClick ? 'pointer' : 'default'} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Interactive explorer: grouped bar (Loaned vs Returned) + clickable donut ──
// + condition stacked chart + search/dropdown filters + filter chips +
// collapsible totals that expand into reactive, filterable, searchable tables
function ReturnRecordsExplorer({ scopedLoans, scopedReturns, scopeType, onDeleteReturn, deletingId }) {
  const [filters, setFilters] = useState({ search: '', material: 'All', condition: 'All', site: 'All' });
  const [showLoanTable, setShowLoanTable] = useState(false);
  const [showReturnTable, setShowReturnTable] = useState(false);

  const uniqueMaterials = [...new Set(scopedLoans.map(l => l.material_name).filter(Boolean))];
  const uniqueSites = scopeType === 'contractor' ? [...new Set(scopedLoans.map(l => l.site_name).filter(Boolean))] : [];

  const barData = (() => {
    const map = {};
    scopedLoans.forEach(l => {
      const name = l.material_name || 'Unknown';
      if (!map[name]) map[name] = { name, loaned: 0, returned: 0 };
      map[name].loaned += Number(l.quantity || 0);
    });
    scopedReturns.forEach(r => {
      const name = r.material_name || 'Unknown';
      if (!map[name]) map[name] = { name, loaned: 0, returned: 0 };
      map[name].returned += returnQty(r);
    });
    return Object.values(map).sort((a, b) => b.loaned - a.loaned);
  })();

  const goodQty = scopedReturns.filter(r => r.returned_condition === 'Good').reduce((s, r) => s + returnQty(r), 0);
  const wornQty = scopedReturns.filter(r => r.returned_condition === 'Worn').reduce((s, r) => s + returnQty(r), 0);
  const damagedQty = scopedReturns.filter(r => r.returned_condition === 'Damaged').reduce((s, r) => s + returnQty(r), 0);
  const donutData = [
    { name: 'Good', value: goodQty },
    { name: 'Worn', value: wornQty },
    { name: 'Damaged', value: damagedQty },
  ].filter(d => d.value > 0);

  const filteredReturns = scopedReturns.filter(r => {
    if (filters.material !== 'All' && r.material_name !== filters.material) return false;
    if (filters.condition !== 'All' && r.returned_condition !== filters.condition) return false;
    if (filters.site !== 'All' && (r.site_name || '') !== filters.site) return false;
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const haystack = `${r.material_name || ''} ${r.site_name || ''} ${r.contact_person || ''} ${r.returned_condition || ''} ${r.return_date || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const filteredLoans = scopedLoans.filter(l => {
    if (filters.material !== 'All' && l.material_name !== filters.material) return false;
    if (filters.site !== 'All' && (l.site_name || '') !== filters.site) return false;
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const haystack = `${l.material_name || ''} ${l.site_name || ''} ${l.contact_person || ''} ${l.expected_return_date || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const hasActiveFilters = filters.material !== 'All' || filters.condition !== 'All' || filters.site !== 'All' || filters.search.trim() !== '';
  const clearAll = () => setFilters({ search: '', material: 'All', condition: 'All', site: 'All' });

  const onChartMaterialClick = (name) => { setFilters(f => ({ ...f, material: name })); setShowReturnTable(true); setShowLoanTable(true); };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Material Return Status — Loaned vs Returned</div>
          <div style={{ fontSize: '11px', color: THEME.textMuted, marginBottom: '10px', fontStyle: 'italic' }}>Click a bar to filter the tables below</div>
          <div style={{ height: Math.max(220, barData.length * 40) }}>
            <ResponsiveContainer>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}
                onClick={(e) => { if (e && e.activePayload && e.activePayload[0]) onChartMaterialClick(e.activePayload[0].payload.name); }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis type="number" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke={THEME.textMuted} tick={{ fontSize: 11 }} width={140} />
                <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                <Legend />
                <Bar dataKey="loaned" name="Loaned" fill={THEME.accentBlue} cursor="pointer" />
                <Bar dataKey="returned" name="Returned" fill={THEME.accentEmerald} radius={[0, 4, 4, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={STYLES.box}>
          <div style={STYLES.label}>Condition Breakdown</div>
          <div style={{ fontSize: '11px', color: THEME.textMuted, marginBottom: '10px', fontStyle: 'italic' }}>Click a slice to filter the tables below</div>
          {donutData.length > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value"
                    onClick={(data) => { setFilters(f => ({ ...f, condition: data.name })); setShowReturnTable(true); }}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                  >
                    {donutData.map((entry, i) => <Cell key={i} fill={CONDITION_COLORS[entry.name]} cursor="pointer" />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div style={{ color: THEME.textMuted, fontSize: '13px', padding: '20px 0' }}>No returns yet</div>}
        </div>
      </div>

      <div style={{ ...STYLES.box, marginBottom: '20px' }}>
        <div style={STYLES.label}>Condition Breakdown per Material</div>
        <MaterialConditionStackedChart returns={scopedReturns} onMaterialClick={onChartMaterialClick} />
      </div>

      <div style={{ ...STYLES.box, marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: hasActiveFilters ? '14px' : 0 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={STYLES.label}>Search</label>
            <input style={STYLES.input} value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search material, site, condition, date..." />
          </div>
          <div>
            <label style={STYLES.label}>Material</label>
            <select style={STYLES.input} value={filters.material} onChange={e => setFilters(f => ({ ...f, material: e.target.value }))}>
              <option value="All">All Materials</option>
              {uniqueMaterials.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {scopeType === 'contractor' && (
            <div>
              <label style={STYLES.label}>Site</label>
              <select style={STYLES.input} value={filters.site} onChange={e => setFilters(f => ({ ...f, site: e.target.value }))}>
                <option value="All">All Sites</option>
                {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={STYLES.label}>Condition</label>
            <select style={STYLES.input} value={filters.condition} onChange={e => setFilters(f => ({ ...f, condition: e.target.value }))}>
              <option value="All">All Conditions</option>
              <option value="Good">Good</option>
              <option value="Worn">Worn</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {filters.material !== 'All' && <FilterChip label={`Material: ${filters.material}`} onRemove={() => setFilters(f => ({ ...f, material: 'All' }))} />}
            {filters.condition !== 'All' && <FilterChip label={`Condition: ${filters.condition}`} onRemove={() => setFilters(f => ({ ...f, condition: 'All' }))} />}
            {filters.site !== 'All' && <FilterChip label={`Site: ${filters.site}`} onRemove={() => setFilters(f => ({ ...f, site: 'All' }))} />}
            {filters.search.trim() && <FilterChip label={`Search: "${filters.search}"`} onRemove={() => setFilters(f => ({ ...f, search: '' }))} />}
            <button onClick={clearAll} style={{ background: 'none', border: `1px solid ${THEME.border}`, borderRadius: '6px', padding: '5px 12px', color: THEME.accentCrimson, cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div onClick={() => setShowLoanTable(v => !v)} style={{ ...STYLES.box, marginBottom: 0, cursor: 'pointer', textAlign: 'center', border: `1px solid ${showLoanTable ? THEME.accentBlue : THEME.border}` }}>
          <div style={STYLES.label}>Loan History</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: THEME.accentBlue }}>{filteredLoans.length}</div>
          <div style={{ fontSize: '12px', color: THEME.textMuted }}>of {scopedLoans.length} total · click to {showLoanTable ? 'hide' : 'view'} details</div>
        </div>
        <div onClick={() => setShowReturnTable(v => !v)} style={{ ...STYLES.box, marginBottom: 0, cursor: 'pointer', textAlign: 'center', border: `1px solid ${showReturnTable ? THEME.accentEmerald : THEME.border}` }}>
          <div style={STYLES.label}>Individual Return Records</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: THEME.accentEmerald }}>{filteredReturns.length}</div>
          <div style={{ fontSize: '12px', color: THEME.textMuted }}>of {scopedReturns.length} total · click to {showReturnTable ? 'hide' : 'view'} details</div>
        </div>
      </div>

      {showLoanTable && (
        <div style={{ ...STYLES.box, marginBottom: '20px' }}>
          <div style={STYLES.label}>Loan History ({filteredLoans.length})</div>
          <table style={STYLES.table}>
            <thead><tr>
              {scopeType === 'site' && <th style={STYLES.th}>Contractor</th>}
              {scopeType === 'contractor' && <th style={STYLES.th}>Site</th>}
              <th style={STYLES.th}>Material</th>
              <th style={STYLES.th}>Qty</th><th style={STYLES.th}>Returned</th>
              <th style={STYLES.th}>Remaining</th><th style={STYLES.th}>Due</th>
            </tr></thead>
            <tbody>
              {filteredLoans.length === 0
                ? <tr><td colSpan={6} style={{ ...STYLES.td, color: THEME.textMuted, textAlign: 'center' }}>No matching loans</td></tr>
                : filteredLoans.map(l => {
                  const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date() && l.remaining > 0;
                  return (
                    <tr key={l.id}>
                      {scopeType === 'site' && <td style={STYLES.td}>{l.contact_person}</td>}
                      {scopeType === 'contractor' && <td style={STYLES.td}>{l.site_name || '—'}</td>}
                      <td style={STYLES.td}>{l.material_name}</td>
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
      )}

      {showReturnTable && (
        <div style={STYLES.box}>
          <div style={STYLES.label}>Individual Return Records ({filteredReturns.length} of {scopedReturns.length})</div>
          <table style={STYLES.table}>
            <thead><tr>
              <th style={STYLES.th}>Material</th>
              {scopeType === 'contractor' && <th style={STYLES.th}>Site</th>}
              {scopeType === 'site' && <th style={STYLES.th}>Contractor</th>}
              <th style={STYLES.th}>Qty</th><th style={STYLES.th}>Condition</th><th style={STYLES.th}>Date</th><th style={STYLES.th}></th>
            </tr></thead>
            <tbody>
              {filteredReturns.length === 0
                ? <tr><td colSpan={6} style={{ ...STYLES.td, color: THEME.textMuted, textAlign: 'center' }}>No matching records</td></tr>
                : filteredReturns.map(r => (
                  <tr key={r.id}>
                    <td style={STYLES.td}>{r.material_name}</td>
                    {scopeType === 'contractor' && <td style={STYLES.td}>{r.site_name || '—'}</td>}
                    {scopeType === 'site' && <td style={STYLES.td}>{r.contact_person}</td>}
                    <td style={{ ...STYLES.td, fontWeight: '700', color: THEME.accentEmerald }}>{returnQty(r)}</td>
                    <td style={STYLES.td}>{BADGE(CONDITION_COLORS[r.returned_condition] || THEME.textMuted, r.returned_condition || '—')}</td>
                    <td style={STYLES.td}>{r.return_date || '—'}</td>
                    <td style={STYLES.td}>
                      <button onClick={() => onDeleteReturn(r.id)} disabled={deletingId === r.id} style={{ padding: '4px 10px', borderRadius: '5px', border: `1px solid ${THEME.accentCrimson}55`, backgroundColor: `${THEME.accentCrimson}10`, color: THEME.accentCrimson, fontSize: '11px', cursor: deletingId === r.id ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: deletingId === r.id ? 0.5 : 1 }}>
                        {deletingId === r.id ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage({ materials, contractors, loans, returns, getLoanRemainingQty, syncSystemData, initialDrill }) {
  const [drillType, setDrillType] = useState(initialDrill ? initialDrill.type : null);   // 'site' | 'contractor' | 'condition' | null
  const [drillValue, setDrillValue] = useState(initialDrill ? initialDrill.value : null);

  // Sync when Dashboard (or another page) deep-links here with a specific drill target
  useEffect(() => {
    if (initialDrill) { setDrillType(initialDrill.type); setDrillValue(initialDrill.value); }
  }, [initialDrill]);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState(null);

  const [reportSite, setReportSite] = useState('All');
  const [reportMaterial, setReportMaterial] = useState('All');
  const [reportContractor, setReportContractor] = useState('All');

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
      Material: l.material_name, Contractor: l.contact_person, Company: l.company_name,
      Site: l.site_name || '—', 'Qty Loaned': l.quantity, 'Qty Remaining': getLoanRemainingQty(l.id),
      'Due Date': l.expected_return_date || '—',
      Status: getLoanRemainingQty(l.id) > 0 ? (l.expected_return_date && new Date(l.expected_return_date) < new Date() ? 'Overdue' : 'Active') : 'Closed',
    }));
    const returnSheet = fReturns.map(r => ({
      Material: r.material_name, Contractor: r.contact_person, Site: r.site_name || '—',
      'Qty Returned': returnQty(r), Condition: r.returned_condition, 'Return Date': r.return_date,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(loanSheet.length ? loanSheet : [{ Note: 'No matching loans' }]), 'Loans');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(returnSheet.length ? returnSheet : [{ Note: 'No matching returns' }]), 'Returns');

    const parts = [];
    if (reportSite !== 'All') parts.push(reportSite);
    if (reportContractor !== 'All') { const c = contractors.find(c => String(c.id) === String(reportContractor)); if (c) parts.push(c.company_name || c.contact_person); }
    if (reportMaterial !== 'All') { const m = materials.find(m => String(m.id) === String(reportMaterial)); if (m) parts.push(m.name); }
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
        <div><label style={STYLES.label}>Site</label>
          <select style={STYLES.input} value={reportSite} onChange={e => setReportSite(e.target.value)}>
            <option value="All">All Sites</option>
            {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label style={STYLES.label}>Material</label>
          <select style={STYLES.input} value={reportMaterial} onChange={e => setReportMaterial(e.target.value)}>
            <option value="All">All Materials</option>
            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select></div>
        <div><label style={STYLES.label}>Contractor</label>
          <select style={STYLES.input} value={reportContractor} onChange={e => setReportContractor(e.target.value)}>
            <option value="All">All Contractors</option>
            {contractors.map(c => <option key={c.id} value={c.id}>{c.contact_person} — {c.company_name}</option>)}
          </select></div>
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
          <div key={c.label} onClick={() => { setDrillType('condition'); setDrillValue(c.label); }}
            style={{ ...STYLES.box, marginBottom: 0, padding: '18px', cursor: 'pointer', border: `1px solid ${c.color}44` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={STYLES.label}>{c.label} Returns</div>
              <ChevronRight size={14} color={THEME.textMuted} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: c.color }}>{p}%</div>
            <div style={{ fontSize: '12px', color: THEME.textMuted }}>{c.qty} unit(s) · click for full diagnostics</div>
          </div>
        );
      })}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // DRILL VIEW: Global condition — now with material/contractor/trend charts
  // ═══════════════════════════════════════════════════════════════════════
  if (drillType === 'condition') {
    const materialTotals = buildTopBy(conditionRecords, r => r.material_name);
    const contractorTotals = buildTopBy(conditionRecords, r => r.contact_person);
    const trend = buildSingleTrend(conditionRecords);
    const shareTrend = buildShareTrend(returns, drillValue);
    const color = CONDITION_COLORS[drillValue] || THEME.textMuted;

    return (
      <div>
        <BackBtn />
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Returns marked: {drillValue}</h2>
        <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>
          {conditionRecords.length} record(s) · {conditionRecords.reduce((s, r) => s + returnQty(r), 0)} unit(s) total
        </p>
        {deleteMsg && <div style={{ ...msgStyle(deleteMsg.type), marginBottom: '16px' }}>{deleteMsg.text}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={STYLES.box}>
            <div style={STYLES.label}>Top Materials — {drillValue}</div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={materialTotals} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                  <XAxis type="number" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" stroke={THEME.textMuted} tick={{ fontSize: 11 }} width={140} />
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                  <Bar dataKey="qty" name={`${drillValue} qty`} fill={color} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={STYLES.box}>
            <div style={STYLES.label}>Top Contractors — {drillValue}</div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={contractorTotals} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                  <XAxis type="number" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" stroke={THEME.textMuted} tick={{ fontSize: 11 }} width={140} />
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                  <Bar dataKey="qty" name={`${drillValue} qty`} fill={color} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={STYLES.box}>
            <div style={STYLES.label}>{drillValue} Volume Over Time</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                  <XAxis dataKey="month" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <YAxis stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} />
                  <Line type="monotone" dataKey="qty" name={`${drillValue} qty`} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={STYLES.box}>
            <div style={STYLES.label}>{drillValue} Share of All Returns (%)</div>
            <p style={{ fontSize: '11px', color: THEME.textMuted, marginBottom: '8px' }}>
              Is {drillValue.toLowerCase()} becoming a bigger problem, or just growing with volume?
            </p>
            <div style={{ height: 190 }}>
              <ResponsiveContainer>
                <LineChart data={shareTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                  <XAxis dataKey="month" stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke={THEME.textMuted} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, color: '#fff' }} formatter={v => `${v}%`} />
                  <Line type="monotone" dataKey="sharePct" name="% share" stroke={THEME.accentPurple} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={STYLES.box}>
          <div style={STYLES.label}>Detail Records</div>
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
                    <td style={{ ...STYLES.td, fontWeight: '700', color }}>{returnQty(r)}</td>
                    <td style={STYLES.td}>{r.return_date || '—'}</td>
                    <td style={STYLES.td}><DeleteReturnBtn id={r.id} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DRILL VIEW: Site
  // ═══════════════════════════════════════════════════════════════════════
  if (drillType === 'site' && selectedSite) {
    return (
      <div>
        <BackBtn />
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Site: {selectedSite.name}</h2>
        <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '24px' }}>Interactive material return status and condition analysis</p>
        <StatGrid stats={[
          { label: 'Total Loaned (qty)', value: selectedSite.loaned, color: THEME.accentBlue },
          { label: 'Total Returned (qty)', value: selectedSite.returnedQty, color: THEME.accentEmerald },
          { label: 'Remaining (qty)', value: selectedSite.remaining, color: THEME.accentAmber },
          { label: 'Overdue (qty)', value: selectedSite.overdue, color: THEME.accentCrimson },
          { label: 'Return Rate', value: `${selectedSite.returnRate}%`, color: THEME.accentPurple },
          { label: 'Health Rate', value: selectedSite.healthRate !== null ? `${selectedSite.healthRate}%` : 'N/A', color: THEME.accentEmerald },
        ]} />
        {deleteMsg && <div style={{ ...msgStyle(deleteMsg.type), marginBottom: '16px' }}>{deleteMsg.text}</div>}

        <ReturnRecordsExplorer
          key={selectedSite.name}
          scopedLoans={siteLoanHistory}
          scopedReturns={siteReturnRecords}
          scopeType="site"
          onDeleteReturn={handleDeleteReturn}
          deletingId={deletingId}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DRILL VIEW: Contractor — now includes material-level diagnostics
  // ═══════════════════════════════════════════════════════════════════════
  if (drillType === 'contractor' && selectedContractor) {
    return (
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
        ]} />
        {deleteMsg && <div style={{ ...msgStyle(deleteMsg.type), marginBottom: '16px' }}>{deleteMsg.text}</div>}

        <ReturnRecordsExplorer
          key={selectedContractor.id}
          scopedLoans={contractorLoanHistory}
          scopedReturns={contractorReturnRecords}
          scopeType="contractor"
          onDeleteReturn={handleDeleteReturn}
          deletingId={deletingId}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN VIEW
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>KPI Analytics</h2>
      <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '28px' }}>Click any row, condition card, or site/contractor to drill into full charts and history</p>

      <StatGrid stats={[
        { label: 'Total Loaned (qty)', value: totalLoanedQty, color: THEME.accentBlue },
        { label: 'Total Returned (qty)', value: totalReturnedQty, color: THEME.accentEmerald },
        { label: 'Total Remaining (qty)', value: totalRemainingQty, color: THEME.accentAmber },
        { label: 'Total Overdue (qty)', value: totalOverdueQty, color: THEME.accentCrimson },
      ]} />

      <div style={{ marginBottom: '8px', ...STYLES.label }}>Return Condition Overview (click to drill down)</div>
      <ConditionOverviewCards good={globalGoodQty} worn={globalWornQty} damaged={globalDamagedQty} total={globalConditionTotal} />

      <div style={{ ...STYLES.box, marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <AlertTriangle size={15} color={THEME.accentAmber} />
          <div style={{ ...STYLES.label, marginBottom: 0 }}>Material Diagnostics — All Contractors</div>
        </div>
        <p style={{ fontSize: '12px', color: THEME.textMuted, marginBottom: '12px' }}>
          System-wide: which materials consistently come back Good vs Worn/Damaged, regardless of contractor. High problem rates may indicate a material quality issue rather than a handling issue.
        </p>
        <MaterialConditionBreakdown returns={returns} />
      </div>

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
