import React, { useState, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { API_BASE, THEME, STYLES } from '../utils/theme';

const msg = (type, text) => ({
  padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
  backgroundColor: type === 'success' ? `${THEME.accentEmerald}18` : `${THEME.accentCrimson}18`,
  color: type === 'success' ? THEME.accentEmerald : THEME.accentCrimson,
  border: `1px solid ${type === 'success' ? THEME.accentEmerald : THEME.accentCrimson}44`,
});

const ACTION_LABELS = {
  update_barcode: { label: 'Update (barcode match)', color: THEME.accentBlue },
  update_name:    { label: 'Update (name match)',    color: THEME.accentEmerald },
  create:         { label: 'New material',           color: THEME.accentAmber },
  skip:           { label: 'Skip',                   color: THEME.textMuted },
};

// ─── ExcelImportPanel ──────────────────────────────────────────────────────
function ExcelImportPanel({ syncSystemData }) {
  const [file, setFile]       = useState(null);
  const [plan, setPlan]       = useState(null);   // array from /preview-excel
  const [summary, setSummary] = useState(null);
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  // ── Download template ────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const sample = [
      { 'Material Name': 'Steel Pipe 2-inch', Category: 'Structural', Quantity: 100, Barcode: '' },
      { 'Material Name': 'Safety Helmet',     Category: 'PPE',        Quantity: 50,  Barcode: '' },
      { 'Material Name': 'Concrete Mix 40kg', Category: 'Civil',      Quantity: 200, Barcode: '' },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sample), 'Materials');
    XLSX.writeFile(wb, 'basirah_materials_template.xlsx');
  };

  // ── Step 1: send file, get automapping plan ──────────────────────────────
  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    setPlan(null);
    setSummary(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await axios.post(`${API_BASE}/api/materials/preview-excel`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPlan(data.plan.map(p => ({ ...p }))); // local copy so user can edit actions
      setSummary({ total: data.total, to_update: data.to_update, to_create: data.to_create });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Failed to analyse file.' });
    } finally {
      setLoading(false);
    }
  };

  // ── User can override an action per row ──────────────────────────────────
  const setRowAction = (rowIndex, action) => {
    setPlan(prev => prev.map((p, i) => i === rowIndex ? { ...p, action } : p));
  };

  // ── Step 2: commit confirmed plan ────────────────────────────────────────
  const handleCommit = async () => {
    if (!plan) return;
    setLoading(true);
    setStatus(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/materials/commit-excel`, { plan });
      setStatus({ type: 'success', text: data.message });
      setSummary(data.summary);
      setPlan(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      await syncSystemData();
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Commit failed.' });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setPlan(null); setSummary(null); setStatus(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={STYLES.box}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: THEME.textMain, marginBottom: '4px' }}>
            📊 Bulk Import via Excel
          </div>
          <div style={{ fontSize: '12px', color: THEME.textMuted }}>
            Auto-maps Excel rows to existing materials by name or barcode. Review before saving.
          </div>
        </div>
        <button onClick={downloadTemplate} style={{
          padding: '8px 16px', borderRadius: '6px', border: `1px solid ${THEME.border}`,
          backgroundColor: 'transparent', color: THEME.textMuted, fontSize: '12px', cursor: 'pointer',
        }}>↓ Template</button>
      </div>

      {/* File picker — hide once plan is loaded */}
      {!plan && (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${file ? THEME.accentEmerald : THEME.border}`,
              borderRadius: '10px', padding: '28px 24px', textAlign: 'center', cursor: 'pointer',
              backgroundColor: file ? `${THEME.accentEmerald}08` : '#0a0a0a', transition: 'all 0.2s',
            }}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => { setFile(e.target.files[0]); setStatus(null); }} />
            {file ? (
              <>
                <div style={{ fontSize: '26px', marginBottom: '6px' }}>📄</div>
                <div style={{ color: THEME.accentEmerald, fontWeight: '600', fontSize: '14px' }}>{file.name}</div>
                <div style={{ color: THEME.textMuted, fontSize: '12px', marginTop: '4px' }}>{(file.size / 1024).toFixed(1)} KB · click to change</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>📂</div>
                <div style={{ color: THEME.textMain, fontWeight: '600', fontSize: '14px' }}>Click to select Excel file</div>
                <div style={{ color: THEME.textMuted, fontSize: '12px', marginTop: '4px' }}>Accepts .xlsx or .xls · Arabic & English headers supported</div>
              </>
            )}
          </div>
          {file && (
            <button onClick={handlePreview} disabled={loading} style={{
              ...STYLES.button(loading ? '#374151' : THEME.accentBlue), marginTop: '14px', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? '⏳ Analysing...' : '🔍 Analyse & Map to Existing Materials'}
            </button>
          )}
        </>
      )}

      {/* Status */}
      {status && <div style={{ ...msg(status.type), marginTop: '14px' }}>{status.text}</div>}

      {/* Summary badges */}
      {summary && !plan && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginTop: '14px' }}>
          {[
            { label: 'Updated', value: summary.updated ?? summary.to_update, color: THEME.accentEmerald },
            { label: 'Created', value: summary.created ?? summary.to_create, color: THEME.accentAmber },
            { label: 'Skipped', value: summary.skipped ?? 0, color: THEME.textMuted },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#0a0a0a', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: THEME.textMuted, marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Mapping review table ── */}
      {plan && (
        <>
          {/* Summary chips */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { label: `${plan.filter(p=>p.action!=='create'&&p.action!=='skip').length} will update`, color: THEME.accentEmerald },
              { label: `${plan.filter(p=>p.action==='create').length} will create`,                   color: THEME.accentAmber },
              { label: `${plan.filter(p=>p.action==='skip').length} skipped`,                         color: THEME.textMuted },
            ].map(c => (
              <span key={c.label} style={{ fontSize: '12px', fontWeight: '600', color: c.color,
                backgroundColor: c.color + '18', border: `1px solid ${c.color}44`,
                padding: '4px 12px', borderRadius: '20px' }}>{c.label}</span>
            ))}
          </div>

          <div style={{ fontSize: '12px', color: THEME.textMuted, marginBottom: '12px' }}>
            Review each row's auto-mapped action. You can override any row to <strong style={{color:THEME.textMain}}>Skip</strong> or force <strong style={{color:THEME.textMain}}>New Material</strong> if the match is wrong.
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
            <table style={{ ...STYLES.table, marginTop: 0 }}>
              <thead>
                <tr>
                  <th style={STYLES.th}>Excel Name</th>
                  <th style={STYLES.th}>Category</th>
                  <th style={STYLES.th}>Qty</th>
                  <th style={STYLES.th}>Auto-Mapped To</th>
                  <th style={STYLES.th}>Match</th>
                  <th style={STYLES.th}>New Stock</th>
                  <th style={STYLES.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((p, i) => {
                  const act = ACTION_LABELS[p.action] || ACTION_LABELS.skip;
                  const isMatch = p.action === 'update_barcode' || p.action === 'update_name';
                  return (
                    <tr key={i} style={{ opacity: p.action === 'skip' ? 0.45 : 1 }}>
                      <td style={STYLES.td}><strong>{p.excel_name}</strong></td>
                      <td style={{ ...STYLES.td, color: THEME.textMuted }}>{p.excel_category}</td>
                      <td style={{ ...STYLES.td, color: THEME.accentBlue, fontWeight: '700' }}>+{p.excel_quantity}</td>

                      {/* Matched material name */}
                      <td style={STYLES.td}>
                        {isMatch ? (
                          <span style={{ color: THEME.textMain }}>{p.matched_name}</span>
                        ) : (
                          <span style={{ color: THEME.textMuted, fontStyle: 'italic' }}>— new entry —</span>
                        )}
                      </td>

                      {/* Match confidence */}
                      <td style={STYLES.td}>
                        {isMatch ? (
                          <span style={{
                            fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                            backgroundColor: p.match_score >= 90 ? `${THEME.accentEmerald}22` : `${THEME.accentAmber}22`,
                            color: p.match_score >= 90 ? THEME.accentEmerald : THEME.accentAmber,
                          }}>{p.match_score}%</span>
                        ) : <span style={{ color: THEME.textMuted }}>—</span>}
                      </td>

                      {/* New stock after update */}
                      <td style={STYLES.td}>
                        {isMatch ? (
                          <span style={{ color: THEME.accentEmerald, fontWeight: '700' }}>
                            {p.matched_current_qty} → {p.matched_new_qty}
                          </span>
                        ) : (
                          <span style={{ color: THEME.accentAmber, fontWeight: '700' }}>{p.excel_quantity}</span>
                        )}
                      </td>

                      {/* Action override */}
                      <td style={STYLES.td}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {/* Show relevant overrides */}
                          {isMatch && (
                            <button onClick={() => setRowAction(i, 'create')} style={{
                              fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
                              border: `1px solid ${THEME.accentAmber}`, backgroundColor: 'transparent',
                              color: THEME.accentAmber,
                            }}>Force New</button>
                          )}
                          {p.action === 'create' && p.matched_id && (
                            <button onClick={() => setRowAction(i, 'update_name')} style={{
                              fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
                              border: `1px solid ${THEME.accentEmerald}`, backgroundColor: 'transparent',
                              color: THEME.accentEmerald,
                            }}>Use Match</button>
                          )}
                          <button onClick={() => setRowAction(i, p.action === 'skip' ? (p.matched_id ? 'update_name' : 'create') : 'skip')} style={{
                            fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
                            border: `1px solid ${THEME.border}`, backgroundColor: 'transparent',
                            color: p.action === 'skip' ? THEME.accentEmerald : THEME.textMuted,
                          }}>{p.action === 'skip' ? '↩ Restore' : 'Skip'}</button>

                          {/* Current action badge */}
                          <span style={{
                            fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px',
                            backgroundColor: act.color + '18', color: act.color,
                          }}>{act.label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Confirm / cancel */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button onClick={handleCommit} disabled={loading} style={{
              ...STYLES.button(loading ? '#374151' : THEME.accentEmerald),
              flex: 2, opacity: loading ? 0.7 : 1,
            }}>
              {loading ? '⏳ Saving...' : `✅ Confirm & Import ${plan.filter(p=>p.action!=='skip').length} rows`}
            </button>
            <button onClick={reset} style={{
              ...STYLES.button('transparent'), flex: 1,
              border: `1px solid ${THEME.border}`, color: THEME.textMuted,
            }}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main MaterialsPage ────────────────────────────────────────────────────
export default function MaterialsPage({ materials, contractors, syncSystemData }) {
  const [newMaterialForm, setNewMaterialForm] = useState({ name: '', category: '', quantity: '' });
  const [newContractorForm, setNewContractorForm] = useState({ contact_person: '', company_name: '' });
  const [matMsg, setMatMsg]   = useState(null);
  const [conMsg, setConMsg]   = useState(null);

  const msgStyle = (type) => ({
    padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
    backgroundColor: type === 'success' ? `${THEME.accentEmerald}18` : `${THEME.accentCrimson}18`,
    color: type === 'success' ? THEME.accentEmerald : THEME.accentCrimson,
    border: `1px solid ${type === 'success' ? THEME.accentEmerald : THEME.accentCrimson}44`,
  });

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/materials`, {
        name: newMaterialForm.name, category: newMaterialForm.category,
        quantity: parseInt(newMaterialForm.quantity),
        barcode: 'BR-' + Math.floor(100000 + Math.random() * 900000),
      });
      setNewMaterialForm({ name: '', category: '', quantity: '' });
      await syncSystemData();
      setMatMsg({ type: 'success', text: 'Asset registered successfully.' });
    } catch (err) {
      setMatMsg({ type: 'error', text: err.response?.data?.error || 'Failed to register asset.' });
    }
  };

  const handleAddContractor = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/contractors`, {
        contact_person: newContractorForm.contact_person,
        company_name: newContractorForm.company_name, phone: '0500000000',
      });
      setNewContractorForm({ contact_person: '', company_name: '' });
      await syncSystemData();
      setConMsg({ type: 'success', text: 'Contractor registered successfully.' });
    } catch (err) {
      setConMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save contractor.' });
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '28px' }}>Asset Registry</h2>

      {/* Excel Import */}
      <ExcelImportPanel syncSystemData={syncSystemData} />

      {/* Manual forms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '32px' }}>
        <div style={STYLES.box}>
          <div style={{ ...STYLES.label, fontSize: '13px', marginBottom: '20px' }}>Register New Material</div>
          <form onSubmit={handleAddMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div><label style={STYLES.label}>Material Name</label>
              <input style={STYLES.input} value={newMaterialForm.name} onChange={e => setNewMaterialForm({ ...newMaterialForm, name: e.target.value })} required placeholder="e.g. Steel Pipe 2-inch" /></div>
            <div><label style={STYLES.label}>Category</label>
              <input style={STYLES.input} value={newMaterialForm.category} onChange={e => setNewMaterialForm({ ...newMaterialForm, category: e.target.value })} required placeholder="e.g. Structural" /></div>
            <div><label style={STYLES.label}>Initial Quantity</label>
              <input type="number" style={STYLES.input} value={newMaterialForm.quantity} onChange={e => setNewMaterialForm({ ...newMaterialForm, quantity: e.target.value })} required placeholder="e.g. 500" min="1" /></div>
            {matMsg && <div style={msgStyle(matMsg.type)}>{matMsg.text}</div>}
            <button type="submit" style={STYLES.button(THEME.accentBlue)}>Add Material</button>
          </form>
        </div>
        <div style={STYLES.box}>
          <div style={{ ...STYLES.label, fontSize: '13px', marginBottom: '20px' }}>Register New Contractor</div>
          <form onSubmit={handleAddContractor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div><label style={STYLES.label}>Contact Person</label>
              <input style={STYLES.input} value={newContractorForm.contact_person} onChange={e => setNewContractorForm({ ...newContractorForm, contact_person: e.target.value })} required placeholder="e.g. Ahmed Al-Rashid" /></div>
            <div><label style={STYLES.label}>Company Name</label>
              <input style={STYLES.input} value={newContractorForm.company_name} onChange={e => setNewContractorForm({ ...newContractorForm, company_name: e.target.value })} required placeholder="e.g. Gulf Construction LLC" /></div>
            {conMsg && <div style={msgStyle(conMsg.type)}>{conMsg.text}</div>}
            <button type="submit" style={STYLES.button(THEME.accentEmerald)}>Add Contractor</button>
          </form>
        </div>
      </div>

      {/* Tables */}
      <div style={STYLES.box}>
        <div style={{ ...STYLES.label, marginBottom: '16px' }}>All Materials ({materials.length})</div>
        <table style={STYLES.table}>
          <thead><tr><th style={STYLES.th}>ID</th><th style={STYLES.th}>Name</th><th style={STYLES.th}>Category</th><th style={STYLES.th}>In Stock</th></tr></thead>
          <tbody>
            {materials.length === 0
              ? <tr><td colSpan={4} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No materials registered</td></tr>
              : materials.map(m => (
                <tr key={m.id}>
                  <td style={STYLES.td}>{m.id}</td>
                  <td style={STYLES.td}><strong>{m.name}</strong></td>
                  <td style={STYLES.td}>{m.category || '—'}</td>
                  <td style={{ ...STYLES.td, color: Number(m.quantity) === 0 ? THEME.accentCrimson : THEME.accentEmerald, fontWeight: '700' }}>{m.quantity}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div style={STYLES.box}>
        <div style={{ ...STYLES.label, marginBottom: '16px' }}>All Contractors ({contractors.length})</div>
        <table style={STYLES.table}>
          <thead><tr><th style={STYLES.th}>ID</th><th style={STYLES.th}>Contact Person</th><th style={STYLES.th}>Company</th></tr></thead>
          <tbody>
            {contractors.length === 0
              ? <tr><td colSpan={3} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No contractors registered</td></tr>
              : contractors.map(c => (
                <tr key={c.id}>
                  <td style={STYLES.td}>{c.id}</td>
                  <td style={STYLES.td}><strong>{c.contact_person}</strong></td>
                  <td style={STYLES.td}>{c.company_name}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
