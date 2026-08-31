import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import { THEME, STYLES } from '../utils/theme';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'AVAILABLE', label: 'Available' },
  { id: 'LENDED', label: 'Deployed' },
  { id: 'OVERDUE', label: 'Overdue' },
];

export default function AssetTrackingPage({ materials, loans, getLoanRemainingQty, initialFilter }) {
  const [statusFilter, setStatusFilter] = useState(initialFilter || 'ALL');
  const [siteFilter, setSiteFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Sync when Dashboard navigates here with a specific filter pre-selected
  useEffect(() => { if (initialFilter) setStatusFilter(initialFilter); }, [initialFilter]);

  const uniqueSites = [...new Set(loans.map(l => l.site_name).filter(Boolean))];

  const buildRows = () => {
    let rows = [];
    if (['ALL', 'AVAILABLE'].includes(statusFilter)) {
      materials.forEach(m => {
        if (Number(m.quantity) > 0) {
          rows.push({
            id: `mat-${m.id}`, name: m.name, location: 'Vault Reserve',
            qty: m.quantity, status: 'IN STOCK', color: THEME.accentEmerald,
            contractor: '—', due: '—', site: null,
          });
        }
      });
    }
    if (['ALL', 'LENDED', 'OVERDUE'].includes(statusFilter)) {
      loans.forEach(l => {
        const rem = getLoanRemainingQty(l.id);
        if (rem <= 0) return;
        const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date();
        if (statusFilter === 'OVERDUE' && !isOverdue) return;
        rows.push({
          id: `loan-${l.id}`, name: l.material_name, location: l.site_name || 'Field',
          qty: rem, status: isOverdue ? 'OVERDUE' : 'DEPLOYED',
          color: isOverdue ? THEME.accentCrimson : THEME.accentAmber,
          contractor: l.contact_person || '—', due: l.expected_return_date || '—',
          site: l.site_name || null,
        });
      });
    }
    return rows;
  };

  const filteredRows = buildRows().filter(row => {
    if (siteFilter !== 'All' && row.site !== siteFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = `${row.name} ${row.contractor} ${row.location}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const clearAll = () => { setStatusFilter('ALL'); setSiteFilter('All'); setSearch(''); };
  const hasActiveFilters = statusFilter !== 'ALL' || siteFilter !== 'All' || search.trim() !== '';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Asset Tracking</h2>
          <p style={{ color: THEME.textMuted, fontSize: '13px', margin: '4px 0 0' }}>
            Live view of every unit — in the vault or deployed on site
          </p>
        </div>
        {hasActiveFilters && (
          <button onClick={clearAll} style={{ background: 'none', border: `1px solid ${THEME.border}`, borderRadius: '6px', padding: '8px 16px', color: THEME.accentBlue, cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
            Clear all filters
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ ...STYLES.box, marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Filter size={13} color={THEME.textMuted} />
              <label style={{ ...STYLES.label, marginBottom: 0 }}>Status</label>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    border: `1px solid ${statusFilter === f.id ? THEME.accentBlue : THEME.border}`,
                    backgroundColor: statusFilter === f.id ? `${THEME.accentBlue}18` : 'transparent',
                    color: statusFilter === f.id ? THEME.accentBlue : THEME.textMuted,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <MapPin size={13} color={THEME.textMuted} />
              <label style={{ ...STYLES.label, marginBottom: 0 }}>Site</label>
            </div>
            <select style={{ ...STYLES.input, minWidth: '180px' }} value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
              <option value="All">All Sites</option>
              {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Search size={13} color={THEME.textMuted} />
              <label style={{ ...STYLES.label, marginBottom: 0 }}>Search</label>
            </div>
            <input
              style={STYLES.input}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by asset, contractor, or site..."
            />
          </div>
        </div>
      </div>

      <div style={STYLES.box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={STYLES.label}>{filteredRows.length} record{filteredRows.length !== 1 ? 's' : ''}</div>
        </div>
        <table style={STYLES.table}>
          <thead>
            <tr>
              <th style={STYLES.th}>Asset</th>
              <th style={STYLES.th}>Site</th>
              <th style={STYLES.th}>Contractor</th>
              <th style={STYLES.th}>Qty</th>
              <th style={STYLES.th}>Due Date</th>
              <th style={STYLES.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0
              ? <tr><td colSpan={6} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No matching records</td></tr>
              : filteredRows.map(row => (
                <tr key={row.id}>
                  <td style={STYLES.td}>{row.name}</td>
                  <td style={STYLES.td}>{row.location}</td>
                  <td style={STYLES.td}>{row.contractor}</td>
                  <td style={STYLES.td}>{row.qty}</td>
                  <td style={STYLES.td}>{row.due}</td>
                  <td style={STYLES.td}>
                    <span style={{ color: row.color, fontWeight: '700', fontSize: '12px' }}>{row.status}</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
