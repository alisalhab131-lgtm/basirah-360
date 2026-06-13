import React, { useState, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { API_BASE, THEME, STYLES } from '../utils/theme';

const msgStyle = (type) => ({
  padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
  backgroundColor: type === 'success' ? `${THEME.accentEmerald}18` : `${THEME.accentCrimson}18`,
  color: type === 'success' ? THEME.accentEmerald : THEME.accentCrimson,
  border: `1px solid ${type === 'success' ? THEME.accentEmerald : THEME.accentCrimson}44`,
});

const HINT_LABELS = {
  'exact barcode': { label: '⬛ Barcode', color: THEME.accentBlue },
  exact:           { label: '✓ Exact',    color: THEME.accentEmerald },
  substring:       { label: '⊂ Contains', color: THEME.accentEmerald },
  initialism:      { label: '🔤 Initials', color: THEME.accentCyan },
  abbreviation:    { label: '✂ Abbrev',   color: THEME.accentCyan },
  'partial words': { label: '≈ Partial',  color: THEME.accentAmber },
  spelling:        { label: '~ Spelling', color: THEME.accentAmber },
};

const scoreColor = (s) => s >= 90 ? THEME.accentEmerald : s >= 75 ? THEME.accentCyan : THEME.accentAmber;

// ─── ExcelImportPanel ──────────────────────────────────────────────────────
function ExcelImportPanel({ syncSystemData }) {
  const [file, setFile]           = useState(null);
  const [plan, setPlan]           = useState(null);
  const [summary, setSummary]     = useState(null);
  const [status, setStatus]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [openDropdown, setOpenDD] = useState(null); // row index with open manual-map dropdown
  const inputRef = useRef();

  const downloadTemplate = () => {
    const sample = [
      { 'Material Name': 'Steel Pipe 2-inch', Category: 'Structural', Quantity: 100, Barcode: '' },
      { 'Material Name': 'Safety Helmet',     Category: 'PPE',        Quantity: 50,  Barcode: '' },
      { 'Material Name': 'Cmt',               Category: 'Civil',      Quantity: 200, Barcode: '' },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sample), 'Materials');
    XLSX.writeFile(wb, 'basirah_materials_template.xlsx');
  };

  // Step 1 — analyse file
  const handlePreview = async () => {
    if (!file) return;
    setLoading(true); setStatus(null); setPlan(null); setSummary(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await axios.post(`${API_BASE}/api/materials/preview-excel`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPlan(data.plan.map(p => ({ ...p })));
      setSummary({ total: data.total, to_update: data.to_update, to_create: data.to_create, suggestions: data.suggestions });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Failed to analyse file.' });
    } finally { setLoading(false); }
  };

  // Override action
  const setRowAction = (i, action) => setPlan(p => p.map((r, idx) => idx===i ? {...r, action} : r));

  // Manual map: user picks a specific existing material
  const setManualMap = (i, material) => {
    setPlan(p => p.map((r, idx) => idx !== i ? r : {
      ...r,
      action: 'manual_map',
      matched_id: material.id,
      matched_name: material.name,
      matched_current_qty: material.current_qty,
      matched_new_qty: material.current_qty + r.excel_quantity,
      match_score: null,
      match_hint: 'manual',
    }));
    setOpenDD(null);
  };

  // Step 2 — commit
  const handleCommit = async () => {
    if (!plan) return;
    setLoading(true); setStatus(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/materials/commit-excel`, { plan });
      setStatus({ type: 'success', text: data.message });
      setSummary(data.summary);
      setPlan(null); setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      await syncSystemData();
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Commit failed.' });
    } finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setPlan(null); setSummary(null); setStatus(null); if (inputRef.current) inputRef.current.value=''; };

  const activeRows = plan ? plan.filter(p => p.action !== 'skip').length : 0;

  return (
    <div style={STYLES.box}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: THEME.textMain, marginBottom: '4px' }}>
            📊 Bulk Import via Excel
          </div>
          <div style={{ fontSize: '12px', color: THEME.textMuted }}>
            Intelligent auto-mapping — detects abbreviations like <em>cmt → Cement</em>, initials, spelling variants. Review before saving.
          </div>
        </div>
        <button onClick={downloadTemplate} style={{
          padding: '8px 16px', borderRadius: '6px', border: `1px solid ${THEME.border}`,
          backgroundColor: 'transparent', color: THEME.textMuted, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>↓ Template</button>
      </div>

      {/* File picker */}
      {!plan && (
        <>
          <div onClick={() => inputRef.current?.click()} style={{
            border: `2px dashed ${file ? THEME.accentEmerald : THEME.border}`, borderRadius: '10px',
            padding: '28px 24px', textAlign: 'center', cursor: 'pointer',
            backgroundColor: file ? `${THEME.accentEmerald}08` : '#0a0a0a', transition: 'all 0.2s',
          }}>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }}
              onChange={e => { setFile(e.target.files[0]); setStatus(null); }} />
            {file ? (
              <>
                <div style={{ fontSize: '26px', marginBottom: '6px' }}>📄</div>
                <div style={{ color: THEME.accentEmerald, fontWeight: '600', fontSize: '14px' }}>{file.name}</div>
                <div style={{ color: THEME.textMuted, fontSize: '12px', marginTop: '4px' }}>{(file.size/1024).toFixed(1)} KB · click to change</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>📂</div>
                <div style={{ color: THEME.textMain, fontWeight: '600', fontSize: '14px' }}>Click to select Excel file</div>
                <div style={{ color: THEME.textMuted, fontSize: '12px', marginTop: '4px' }}>
                  .xlsx or .xls · Arabic & English headers · abbreviations auto-detected
                </div>
              </>
            )}
          </div>
          {file && (
            <button onClick={handlePreview} disabled={loading} style={{
              ...STYLES.button(loading ? '#374151' : THEME.accentBlue), marginTop: '14px', opacity: loading ? 0.7 : 1,
            }}>{loading ? '⏳ Analysing...' : '🔍 Analyse & Smart-Map to Existing Materials'}</button>
          )}
        </>
      )}

      {status && <div style={{ ...msgStyle(status.type), marginTop: '14px' }}>{status.text}</div>}

      {/* Post-commit summary */}
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
          {/* Legend chips */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: THEME.textMuted, marginRight: '4px' }}>Match type:</span>
            {Object.entries(HINT_LABELS).slice(0,6).map(([k,v]) => (
              <span key={k} style={{ fontSize: '10px', fontWeight: '600', color: v.color, backgroundColor: v.color+'18',
                border: `1px solid ${v.color}44`, padding: '2px 8px', borderRadius: '20px' }}>{v.label}</span>
            ))}
          </div>

          {/* Status chips */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[
              { label: `${plan.filter(p=>['update_name','update_barcode','manual_map'].includes(p.action)).length} updating`, color: THEME.accentEmerald },
              { label: `${plan.filter(p=>p.action==='suggest').length} need review`, color: THEME.accentAmber },
              { label: `${plan.filter(p=>p.action==='create').length} new`, color: THEME.accentPurple },
              { label: `${plan.filter(p=>p.action==='skip').length} skipped`, color: THEME.textMuted },
            ].map(c => (
              <span key={c.label} style={{ fontSize: '12px', fontWeight: '600', color: c.color,
                backgroundColor: c.color+'18', border: `1px solid ${c.color}44`, padding: '4px 12px', borderRadius: '20px' }}>{c.label}</span>
            ))}
          </div>

          <div style={{ fontSize: '12px', color: THEME.textMuted, marginBottom: '12px' }}>
            ⚠️ <strong style={{ color: THEME.accentAmber }}>Rows marked "need review"</strong> had a weaker match — confirm, remap manually, or skip each one.
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
            <table style={{ ...STYLES.table, marginTop: 0, minWidth: '900px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0d0d0d' }}>
                  <th style={STYLES.th}>Excel Name</th>
                  <th style={STYLES.th}>Qty</th>
                  <th style={STYLES.th}>Auto-Mapped To</th>
                  <th style={STYLES.th}>Match</th>
                  <th style={STYLES.th}>Stock Change</th>
                  <th style={{ ...STYLES.th, minWidth: '260px' }}>Action / Override</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((p, i) => {
                  const isUpdate = ['update_name','update_barcode','manual_map'].includes(p.action);
                  const isSuggest = p.action === 'suggest';
                  const isCreate = p.action === 'create';
                  const isSkip = p.action === 'skip';
                  const hint = HINT_LABELS[p.match_hint] || { label: p.match_hint, color: THEME.textMuted };
                  const rowBg = isSuggest ? `${THEME.accentAmber}08` : isSkip ? 'transparent' : 'transparent';

                  return (
                    <tr key={i} style={{ opacity: isSkip ? 0.4 : 1, backgroundColor: rowBg, position: 'relative' }}>
                      {/* Excel name */}
                      <td style={STYLES.td}>
                        <strong style={{ color: isSkip ? THEME.textMuted : THEME.textMain }}>{p.excel_name}</strong>
                        {isSuggest && <div style={{ fontSize: '10px', color: THEME.accentAmber, marginTop: '2px' }}>⚠ Low confidence — review needed</div>}
                      </td>

                      {/* Qty */}
                      <td style={{ ...STYLES.td, color: THEME.accentBlue, fontWeight: '700' }}>+{p.excel_quantity}</td>

                      {/* Matched material */}
                      <td style={STYLES.td}>
                        {p.matched_name ? (
                          <div>
                            <span style={{ color: THEME.textMain, fontWeight: '600' }}>{p.matched_name}</span>
                            {p.match_hint === 'manual' && (
                              <span style={{ fontSize: '10px', color: THEME.accentCyan, marginLeft: '6px' }}>✋ manual</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: THEME.textMuted, fontStyle: 'italic' }}>— new entry —</span>
                        )}
                      </td>

                      {/* Match confidence */}
                      <td style={STYLES.td}>
                        {p.match_hint === 'manual' ? (
                          <span style={{ fontSize: '11px', color: THEME.accentCyan, fontWeight: '700' }}>✋ Manual</span>
                        ) : p.match_score != null && p.matched_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                              backgroundColor: scoreColor(p.match_score)+'22', color: scoreColor(p.match_score) }}>
                              {p.match_score}%
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: '600', color: hint.color,
                              backgroundColor: hint.color+'18', border: `1px solid ${hint.color}44`,
                              padding: '1px 6px', borderRadius: '8px' }}>{hint.label}</span>
                          </div>
                        ) : <span style={{ color: THEME.textMuted }}>—</span>}
                      </td>

                      {/* Stock change */}
                      <td style={STYLES.td}>
                        {isUpdate || isSuggest ? (
                          p.matched_current_qty != null ? (
                            <span style={{ color: THEME.accentEmerald, fontWeight: '700' }}>
                              {p.matched_current_qty} → {p.matched_new_qty}
                            </span>
                          ) : null
                        ) : isCreate ? (
                          <span style={{ color: THEME.accentPurple, fontWeight: '700' }}>{p.excel_quantity} (new)</span>
                        ) : <span style={{ color: THEME.textMuted }}>—</span>}
                      </td>

                      {/* Action controls */}
                      <td style={{ ...STYLES.td, position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>

                          {/* Confirm button for suggest rows */}
                          {isSuggest && (
                            <button onClick={() => setRowAction(i, 'update_name')} style={{
                              fontSize: '11px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
                              border: `1px solid ${THEME.accentEmerald}`, backgroundColor: `${THEME.accentEmerald}18`,
                              color: THEME.accentEmerald, fontWeight: '600',
                            }}>✓ Confirm</button>
                          )}

                          {/* Force new */}
                          {(isUpdate || isSuggest) && (
                            <button onClick={() => setRowAction(i, 'create')} style={{
                              fontSize: '11px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
                              border: `1px solid ${THEME.accentAmber}`, backgroundColor: 'transparent', color: THEME.accentAmber,
                            }}>+ New</button>
                          )}

                          {/* Manual map dropdown trigger */}
                          <div style={{ position: 'relative' }}>
                            <button onClick={() => setOpenDD(openDropdown === i ? null : i)} style={{
                              fontSize: '11px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
                              border: `1px solid ${THEME.accentCyan}`, backgroundColor: 'transparent', color: THEME.accentCyan,
                            }}>🔗 Map to...</button>

                            {openDropdown === i && (
                              <div style={{
                                position: 'absolute', top: '100%', left: 0, zIndex: 999, minWidth: '280px',
                                backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`,
                                borderRadius: '8px', boxShadow: '0 8px 32px #0008', marginTop: '4px', overflow: 'hidden',
                              }}>
                                {/* Suggestions section */}
                                {p.candidates?.length > 0 && (
                                  <>
                                    <div style={{ padding: '8px 12px', fontSize: '10px', color: THEME.textMuted,
                                      backgroundColor: '#0a0a0a', borderBottom: `1px solid ${THEME.border}`, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                      Suggested matches
                                    </div>
                                    {p.candidates.map(c => (
                                      <div key={c.id} onClick={() => setManualMap(i, c)} style={{
                                        padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${THEME.border}22`,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                      }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                      >
                                        <div>
                                          <div style={{ fontSize: '13px', fontWeight: '600', color: THEME.textMain }}>{c.name}</div>
                                          <div style={{ fontSize: '10px', color: THEME.textMuted, marginTop: '1px' }}>
                                            stock: {c.current_qty} · {(HINT_LABELS[c.hint]||{label:c.hint}).label}
                                          </div>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: scoreColor(c.score),
                                          backgroundColor: scoreColor(c.score)+'22', padding: '2px 8px', borderRadius: '10px' }}>
                                          {c.score}%
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                )}
                                {/* All materials section */}
                                <div style={{ padding: '8px 12px', fontSize: '10px', color: THEME.textMuted,
                                  backgroundColor: '#0a0a0a', borderTop: `1px solid ${THEME.border}`, borderBottom: `1px solid ${THEME.border}`, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                  All materials
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                  {p.all_existing?.map(m => (
                                    <div key={m.id} onClick={() => setManualMap(i, m)} style={{
                                      padding: '9px 14px', cursor: 'pointer', borderBottom: `1px solid ${THEME.border}11`,
                                      display: 'flex', justifyContent: 'space-between',
                                    }}
                                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <span style={{ fontSize: '13px', color: THEME.textMain }}>{m.name}</span>
                                      <span style={{ fontSize: '11px', color: THEME.textMuted }}>qty: {m.current_qty}</span>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ padding: '8px 12px', borderTop: `1px solid ${THEME.border}` }}>
                                  <button onClick={() => setOpenDD(null)} style={{
                                    width: '100%', padding: '6px', fontSize: '12px', backgroundColor: 'transparent',
                                    border: `1px solid ${THEME.border}`, borderRadius: '4px', color: THEME.textMuted, cursor: 'pointer',
                                  }}>Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Skip / restore */}
                          <button onClick={() => setRowAction(i, isSkip ? (p.matched_id ? 'update_name' : 'create') : 'skip')} style={{
                            fontSize: '11px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
                            border: `1px solid ${THEME.border}`, backgroundColor: 'transparent',
                            color: isSkip ? THEME.accentEmerald : THEME.textMuted,
                          }}>{isSkip ? '↩' : 'Skip'}</button>

                          {/* Status badge */}
                          <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', 
                            ...(isUpdate ? { backgroundColor: `${THEME.accentEmerald}18`, color: THEME.accentEmerald } :
                               isSuggest ? { backgroundColor: `${THEME.accentAmber}18`, color: THEME.accentAmber } :
                               isCreate  ? { backgroundColor: `${THEME.accentPurple}18`, color: THEME.accentPurple } :
                               { backgroundColor: '#ffffff10', color: THEME.textMuted })
                          }}>
                            {isUpdate ? '↑ Update' : isSuggest ? '⚠ Review' : isCreate ? '＋ New' : '— Skip'}
                          </span>
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
              ...STYLES.button(loading ? '#374151' : THEME.accentEmerald), flex: 2, opacity: loading ? 0.7 : 1,
            }}>{loading ? '⏳ Saving...' : `✅ Confirm & Import ${activeRows} rows`}</button>
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
  const [matMsg, setMatMsg] = useState(null);
  const [conMsg, setConMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // material id pending confirm
  const [deleteMsg, setDeleteMsg] = useState(null);

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

  const handleDelete = async (id) => {
    setDeleteMsg(null);
    try {
      await axios.delete(`${API_BASE}/api/materials/${id}`);
      setDeleteConfirm(null);
      await syncSystemData();
      setDeleteMsg({ type: 'success', text: 'Material removed from stock.' });
    } catch (err) {
      setDeleteConfirm(null);
      setDeleteMsg({ type: 'error', text: err.response?.data?.error || 'Delete failed.' });
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '28px' }}>Asset Registry</h2>

      {/* Excel import */}
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

      {/* Materials table with delete */}
      <div style={STYLES.box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={STYLES.label}>All Materials ({materials.length})</div>
          {deleteMsg && <div style={{ ...msgStyle(deleteMsg.type), fontSize: '12px' }}>{deleteMsg.text}</div>}
        </div>

        {/* Delete confirm banner */}
        {deleteConfirm && (() => {
          const m = materials.find(x => x.id === deleteConfirm);
          return (
            <div style={{ backgroundColor: `${THEME.accentCrimson}12`, border: `1px solid ${THEME.accentCrimson}44`,
              borderRadius: '8px', padding: '14px 18px', marginBottom: '16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', color: THEME.accentCrimson, fontSize: '13px' }}>
                  Remove "{m?.name}" from stock?
                </div>
                <div style={{ fontSize: '12px', color: THEME.textMuted, marginTop: '3px' }}>
                  This permanently deletes the material record. Active loans will block deletion.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                <button onClick={() => handleDelete(deleteConfirm)} style={{
                  padding: '8px 18px', borderRadius: '6px', border: 'none',
                  backgroundColor: THEME.accentCrimson, color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                }}>Yes, Remove</button>
                <button onClick={() => setDeleteConfirm(null)} style={{
                  padding: '8px 18px', borderRadius: '6px', border: `1px solid ${THEME.border}`,
                  backgroundColor: 'transparent', color: THEME.textMuted, fontSize: '13px', cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          );
        })()}

        <table style={STYLES.table}>
          <thead>
            <tr>
              <th style={STYLES.th}>ID</th>
              <th style={STYLES.th}>Name</th>
              <th style={STYLES.th}>Category</th>
              <th style={STYLES.th}>In Stock</th>
              <th style={{ ...STYLES.th, textAlign: 'right' }}>Remove</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0
              ? <tr><td colSpan={5} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No materials registered</td></tr>
              : materials.map(m => (
                <tr key={m.id} style={{ opacity: deleteConfirm === m.id ? 0.4 : 1, transition: 'opacity 0.15s' }}>
                  <td style={STYLES.td}>{m.id}</td>
                  <td style={STYLES.td}><strong>{m.name}</strong></td>
                  <td style={STYLES.td}>{m.category || '—'}</td>
                  <td style={{ ...STYLES.td, color: Number(m.quantity) === 0 ? THEME.accentCrimson : THEME.accentEmerald, fontWeight: '700' }}>
                    {m.quantity}
                  </td>
                  <td style={{ ...STYLES.td, textAlign: 'right' }}>
                    <button onClick={() => { setDeleteConfirm(m.id); setDeleteMsg(null); }} style={{
                      padding: '5px 12px', borderRadius: '5px', border: `1px solid ${THEME.accentCrimson}55`,
                      backgroundColor: `${THEME.accentCrimson}10`, color: THEME.accentCrimson,
                      fontSize: '12px', cursor: 'pointer', fontWeight: '600',
                    }}>🗑 Remove</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Contractors table */}
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
