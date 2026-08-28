/**
 * src/pages/Materials.jsx  (FULL EDIT + DELETE VERSION)
 *
 * Adds on top of the previous version:
 *   1. Inline edit for materials  (name, category, quantity, barcode)
 *   2. Inline edit for contractors (contact_person, company_name, phone, email)
 *   3. Safe delete for contractors (same block/cascade/soft modal as materials,
 *      since contractors are linked to loans too)
 *
 * Everything else (Excel import, sync bar, download, add-forms) is unchanged.
 */

import React, { useState, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { API_BASE, THEME, STYLES } from '../utils/theme';

// ─── Shared style helpers ──────────────────────────────────────────────────
const msgStyle = (type) => ({
  padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
  backgroundColor: type === 'success' ? `${THEME.accentEmerald}18` : `${THEME.accentCrimson}18`,
  color: type === 'success' ? THEME.accentEmerald : THEME.accentCrimson,
  border: `1px solid ${type === 'success' ? THEME.accentEmerald : THEME.accentCrimson}44`,
});

const HINT_LABELS = {
  'exact barcode': { label: '⬛ Barcode',  color: THEME.accentBlue },
  exact:           { label: '✓ Exact',     color: THEME.accentEmerald },
  substring:       { label: '⊂ Contains',  color: THEME.accentEmerald },
  initialism:      { label: '🔤 Initials', color: THEME.accentCyan },
  abbreviation:    { label: '✂ Abbrev',   color: THEME.accentCyan },
  'partial words': { label: '≈ Partial',   color: THEME.accentAmber },
  spelling:        { label: '~ Spelling',  color: THEME.accentAmber },
};
const scoreColor = (s) => s >= 90 ? THEME.accentEmerald : s >= 75 ? THEME.accentCyan : THEME.accentAmber;

const inlineInput = {
  padding: '6px 8px', border: `1px solid ${THEME.accentBlue}`, borderRadius: '4px',
  fontSize: '13px', width: '100%', background: '#0a0a0a', color: THEME.textMain,
};

const smallBtn = (bg, color) => ({
  padding: '5px 10px', borderRadius: '5px', border: `1px solid ${bg}55`,
  backgroundColor: `${bg}10`, color, fontSize: '12px', cursor: 'pointer', fontWeight: '600',
});

// ─── OneDrive Sync Status Bar ─────────────────────────────────────────────
function SyncStatusBar() {
  const [status, setStatus]     = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [msg, setMsg]           = useState('');

  const trigger = async (direction) => {
    setStatus('syncing');
    setMsg(`${direction === 'pull' ? 'Pulling from' : 'Pushing to'} OneDrive…`);
    try {
      const { data } = await axios.post(`${API_BASE}/api/materials/sync/${direction}`);
      setStatus('ok');
      setLastSync(new Date());
      setMsg(direction === 'pull'
        ? `Pulled — ${data.upserted || 0} updated, ${data.created || 0} new`
        : `Pushed ${data.pushed || 0} rows to Excel`);
    } catch (err) {
      setStatus('error');
      setMsg(err.response?.data?.error || 'Sync failed');
    }
  };

  const statusColor = status === 'ok' ? THEME.accentEmerald : status === 'error' ? THEME.accentCrimson : status === 'syncing' ? THEME.accentAmber : THEME.textMuted;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
      backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`,
      borderRadius: '10px', padding: '14px 20px', marginBottom: '24px',
    }}>
      <div style={{
        width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
        backgroundColor: statusColor,
        boxShadow: status === 'syncing' ? `0 0 0 3px ${THEME.accentAmber}44` : 'none',
      }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: THEME.textMain }}>
          📊 OneDrive INV.xlsx — Live Sync
        </span>
        {msg && <span style={{ fontSize: '12px', color: statusColor, marginLeft: '10px' }}>{msg}</span>}
        {lastSync && <span style={{ fontSize: '11px', color: THEME.textMuted, marginLeft: '10px' }}>Last: {lastSync.toLocaleTimeString()}</span>}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => trigger('pull')} disabled={status === 'syncing'} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: `1px solid ${THEME.accentCyan}`, backgroundColor: `${THEME.accentCyan}18`, color: THEME.accentCyan, cursor: status === 'syncing' ? 'not-allowed' : 'pointer', opacity: status === 'syncing' ? 0.6 : 1 }}>↓ Pull</button>
        <button onClick={() => trigger('push')} disabled={status === 'syncing'} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: `1px solid ${THEME.accentEmerald}`, backgroundColor: `${THEME.accentEmerald}18`, color: THEME.accentEmerald, cursor: status === 'syncing' ? 'not-allowed' : 'pointer', opacity: status === 'syncing' ? 0.6 : 1 }}>↑ Push</button>
      </div>
    </div>
  );
}

// ─── Generalised Delete Modal (materials OR contractors) ─────────────────
function DeleteModal({ target, loading, onConfirm, onCancel }) {
  const { name, linkedLoans = [], entityType } = target;
  const hasLoans = linkedLoans.length > 0;
  const label = entityType === 'contractor' ? 'contractor' : 'material';

  const overlayStyle = { position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' };
  const boxStyle = { backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '28px', maxWidth: '500px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' };
  const stratBtn = (color, outline = false) => ({ width: '100%', padding: '13px 16px', borderRadius: '8px', border: outline ? `1px solid ${color}` : 'none', backgroundColor: outline ? 'transparent' : color, color: outline ? color : '#fff', fontWeight: '700', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '3px', opacity: loading ? 0.6 : 1 });

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={boxStyle}>
        <div style={{ fontSize: '16px', fontWeight: '800', color: THEME.accentCrimson, marginBottom: '8px' }}>
          {hasLoans ? '⚠ Active Loans Detected' : '🗑 Confirm Removal'}
        </div>
        <div style={{ fontSize: '14px', color: THEME.textMain, marginBottom: '18px' }}>
          <strong>"{name}"</strong>
          {hasLoans
            ? ` has ${linkedLoans.length} active loan${linkedLoans.length > 1 ? 's' : ''}. Choose how to proceed:`
            : ` will be permanently removed from the ${label} registry.`}
        </div>

        {hasLoans && (
          <div style={{ backgroundColor: '#0a0a0a', border: `1px solid ${THEME.border}`, borderRadius: '8px', marginBottom: '18px', overflow: 'hidden' }}>
            <div style={{ padding: '7px 12px', fontSize: '10px', color: THEME.textMuted, backgroundColor: '#0d0d0d', borderBottom: `1px solid ${THEME.border}`, textTransform: 'uppercase', letterSpacing: '1px' }}>Active loans</div>
            {linkedLoans.slice(0, 4).map(l => (
              <div key={l.id} style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}22`, display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: THEME.textMain }}>{l.company_name || l.contact_person || l.material_name}</span>
                <span style={{ color: THEME.textMuted }}>qty {l.quantity} · {l.status}</span>
              </div>
            ))}
            {linkedLoans.length > 4 && <div style={{ padding: '7px 12px', fontSize: '11px', color: THEME.textMuted }}>+ {linkedLoans.length - 4} more</div>}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {hasLoans ? (
            <>
              <button onClick={() => onConfirm('cascade')} disabled={loading} style={stratBtn(THEME.accentCrimson)}>
                <span>🗑 Delete {label} + all its loans permanently</span>
                <span style={{ fontSize: '11px', opacity: 0.75, fontWeight: '400' }}>All linked loan records will be erased</span>
              </button>
              <button onClick={() => onConfirm('soft')} disabled={loading} style={stratBtn(THEME.accentAmber)}>
                <span>📦 Archive — cancel loans, hide {label}</span>
                <span style={{ fontSize: '11px', opacity: 0.75, fontWeight: '400' }}>Loans marked Cancelled, {label} hidden</span>
              </button>
              <button onClick={onCancel} disabled={loading} style={stratBtn(THEME.border, true)}>
                <span style={{ color: THEME.textMuted }}>Cancel — keep {label} as-is</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onConfirm('block')} disabled={loading} style={stratBtn(THEME.accentCrimson)}>
                <span>{loading ? 'Removing…' : '✓ Yes, remove permanently'}</span>
              </button>
              <button onClick={onCancel} disabled={loading} style={stratBtn(THEME.border, true)}>
                <span style={{ color: THEME.textMuted }}>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ExcelImportPanel (unchanged) ──────────────────────────────────────────
function ExcelImportPanel({ syncSystemData }) {
  const [file, setFile]           = useState(null);
  const [plan, setPlan]           = useState(null);
  const [summary, setSummary]     = useState(null);
  const [status, setStatus]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [openDropdown, setOpenDD] = useState(null);
  const inputRef = useRef();

  const downloadTemplate = () => {
    const sample = [
      { 'Material Name': 'Steel Pipe 2-inch', Category: 'Structural', Quantity: 100, Barcode: '' },
      { 'Material Name': 'Safety Helmet',     Category: 'PPE',        Quantity: 50,  Barcode: '' },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sample), 'Materials');
    XLSX.writeFile(wb, 'basirah_materials_template.xlsx');
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true); setStatus(null); setPlan(null); setSummary(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await axios.post(`${API_BASE}/api/materials/preview-excel`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPlan(data.plan.map(p => ({ ...p })));
      setSummary({ total: data.total, to_update: data.to_update, to_create: data.to_create, suggestions: data.suggestions });
    } catch (err) { setStatus({ type: 'error', text: err.response?.data?.error || 'Failed to analyse file.' }); }
    finally { setLoading(false); }
  };

  const setRowAction = (i, action) => setPlan(p => p.map((r, idx) => idx === i ? {...r, action} : r));

  const setManualMap = (i, material) => {
    setPlan(p => p.map((r, idx) => idx !== i ? r : { ...r, action: 'manual_map', matched_id: material.id, matched_name: material.name, matched_current_qty: material.current_qty, matched_new_qty: material.current_qty + r.excel_quantity, match_score: null, match_hint: 'manual' }));
    setOpenDD(null);
  };

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
    } catch (err) { setStatus({ type: 'error', text: err.response?.data?.error || 'Commit failed.' }); }
    finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setPlan(null); setSummary(null); setStatus(null); if (inputRef.current) inputRef.current.value = ''; };
  const activeRows = plan ? plan.filter(p => p.action !== 'skip').length : 0;

  return (
    <div style={STYLES.box}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: THEME.textMain, marginBottom: '4px' }}>📊 Bulk Import via Excel</div>
          <div style={{ fontSize: '12px', color: THEME.textMuted }}>Intelligent auto-mapping — detects abbreviations, initials, spelling variants.</div>
        </div>
        <button onClick={downloadTemplate} style={{ padding: '8px 16px', borderRadius: '6px', border: `1px solid ${THEME.border}`, backgroundColor: 'transparent', color: THEME.textMuted, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>↓ Template</button>
      </div>

      {!plan && (
        <>
          <div onClick={() => inputRef.current?.click()} style={{ border: `2px dashed ${file ? THEME.accentEmerald : THEME.border}`, borderRadius: '10px', padding: '28px 24px', textAlign: 'center', cursor: 'pointer', backgroundColor: file ? `${THEME.accentEmerald}08` : '#0a0a0a' }}>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => { setFile(e.target.files[0]); setStatus(null); }} />
            {file ? (
              <><div style={{ fontSize: '26px', marginBottom: '6px' }}>📄</div><div style={{ color: THEME.accentEmerald, fontWeight: '600', fontSize: '14px' }}>{file.name}</div></>
            ) : (
              <><div style={{ fontSize: '28px', marginBottom: '6px' }}>📂</div><div style={{ color: THEME.textMain, fontWeight: '600', fontSize: '14px' }}>Click to select Excel file</div></>
            )}
          </div>
          {file && <button onClick={handlePreview} disabled={loading} style={{ ...STYLES.button(loading ? '#374151' : THEME.accentBlue), marginTop: '14px', opacity: loading ? 0.7 : 1 }}>{loading ? '⏳ Analysing...' : '🔍 Analyse & Smart-Map'}</button>}
        </>
      )}

      {status && <div style={{ ...msgStyle(status.type), marginTop: '14px' }}>{status.text}</div>}

      {summary && !plan && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginTop: '14px' }}>
          {[{ label:'Updated', value:summary.updated??summary.to_update, color:THEME.accentEmerald }, { label:'Created', value:summary.created??summary.to_create, color:THEME.accentAmber }, { label:'Skipped', value:summary.skipped??0, color:THEME.textMuted }].map(s => (
            <div key={s.label} style={{ backgroundColor: '#0a0a0a', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: THEME.textMuted, marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {plan && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[
              { label:`${plan.filter(p=>['update_name','update_barcode','manual_map'].includes(p.action)).length} updating`, color:THEME.accentEmerald },
              { label:`${plan.filter(p=>p.action==='suggest').length} need review`, color:THEME.accentAmber },
              { label:`${plan.filter(p=>p.action==='create').length} new`, color:THEME.accentPurple },
              { label:`${plan.filter(p=>p.action==='skip').length} skipped`, color:THEME.textMuted },
            ].map(c => <span key={c.label} style={{ fontSize:'12px', fontWeight:'600', color:c.color, backgroundColor:c.color+'18', border:`1px solid ${c.color}44`, padding:'4px 12px', borderRadius:'20px' }}>{c.label}</span>)}
          </div>
          <div style={{ overflowX:'auto', borderRadius:'8px', border:`1px solid ${THEME.border}` }}>
            <table style={{ ...STYLES.table, marginTop:0, minWidth:'900px' }}>
              <thead>
                <tr style={{ backgroundColor:'#0d0d0d' }}>
                  <th style={STYLES.th}>Excel Name</th><th style={STYLES.th}>Qty</th><th style={STYLES.th}>Auto-Mapped To</th>
                  <th style={STYLES.th}>Match</th><th style={STYLES.th}>Stock Change</th><th style={{ ...STYLES.th, minWidth:'260px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((p, i) => {
                  const isUpdate=(['update_name','update_barcode','manual_map'].includes(p.action)), isSuggest=p.action==='suggest', isCreate=p.action==='create', isSkip=p.action==='skip';
                  const hint=HINT_LABELS[p.match_hint]||{ label:p.match_hint, color:THEME.textMuted };
                  return (
                    <tr key={i} style={{ opacity:isSkip?0.4:1, backgroundColor:isSuggest?`${THEME.accentAmber}08`:'transparent' }}>
                      <td style={STYLES.td}><strong style={{ color:isSkip?THEME.textMuted:THEME.textMain }}>{p.excel_name}</strong></td>
                      <td style={{ ...STYLES.td, color:THEME.accentBlue, fontWeight:'700' }}>+{p.excel_quantity}</td>
                      <td style={STYLES.td}>{p.matched_name?<span style={{ color:THEME.textMain, fontWeight:'600' }}>{p.matched_name}</span>:<span style={{ color:THEME.textMuted, fontStyle:'italic' }}>— new —</span>}</td>
                      <td style={STYLES.td}>{p.match_score!=null&&p.matched_name?<span style={{ fontSize:'12px', fontWeight:'700', padding:'2px 8px', borderRadius:'10px', backgroundColor:scoreColor(p.match_score)+'22', color:scoreColor(p.match_score) }}>{p.match_score}%</span>:'—'}</td>
                      <td style={STYLES.td}>{(isUpdate||isSuggest)?p.matched_current_qty!=null?<span style={{ color:THEME.accentEmerald, fontWeight:'700' }}>{p.matched_current_qty} → {p.matched_new_qty}</span>:null:isCreate?<span style={{ color:THEME.accentPurple, fontWeight:'700' }}>{p.excel_quantity} (new)</span>:'—'}</td>
                      <td style={STYLES.td}>
                        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                          {isSuggest&&<button onClick={()=>setRowAction(i,'update_name')} style={smallBtn(THEME.accentEmerald, THEME.accentEmerald)}>✓ Confirm</button>}
                          {(isUpdate||isSuggest)&&<button onClick={()=>setRowAction(i,'create')} style={smallBtn(THEME.accentAmber, THEME.accentAmber)}>+ New</button>}
                          <div style={{ position:'relative' }}>
                            <button onClick={()=>setOpenDD(openDropdown===i?null:i)} style={smallBtn(THEME.accentCyan, THEME.accentCyan)}>🔗 Map</button>
                            {openDropdown===i&&<div style={{ position:'absolute', top:'100%', left:0, zIndex:999, minWidth:'260px', backgroundColor:THEME.cardBg, border:`1px solid ${THEME.border}`, borderRadius:'8px', boxShadow:'0 8px 32px #0008', marginTop:'4px', overflow:'hidden' }}>
                              <div style={{ maxHeight:'200px', overflowY:'auto' }}>{p.all_existing?.map(m=><div key={m.id} onClick={()=>setManualMap(i,m)} style={{ padding:'9px 14px', cursor:'pointer', borderBottom:`1px solid ${THEME.border}11`, display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:'13px', color:THEME.textMain }}>{m.name}</span><span style={{ fontSize:'11px', color:THEME.textMuted }}>{m.current_qty}</span></div>)}</div>
                              <div style={{ padding:'8px 12px', borderTop:`1px solid ${THEME.border}` }}><button onClick={()=>setOpenDD(null)} style={{ width:'100%', padding:'6px', fontSize:'12px', backgroundColor:'transparent', border:`1px solid ${THEME.border}`, borderRadius:'4px', color:THEME.textMuted, cursor:'pointer' }}>Cancel</button></div>
                            </div>}
                          </div>
                          <button onClick={()=>setRowAction(i,isSkip?(p.matched_id?'update_name':'create'):'skip')} style={smallBtn(THEME.border, isSkip?THEME.accentEmerald:THEME.textMuted)}>{isSkip?'↩':'Skip'}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:'12px', marginTop:'16px' }}>
            <button onClick={handleCommit} disabled={loading} style={{ ...STYLES.button(loading?'#374151':THEME.accentEmerald), flex:2, opacity:loading?0.7:1 }}>{loading?'⏳ Saving...':`✅ Confirm & Import ${activeRows} rows`}</button>
            <button onClick={reset} style={{ ...STYLES.button('transparent'), flex:1, border:`1px solid ${THEME.border}`, color:THEME.textMuted }}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main MaterialsPage ─────────────────────────────────────────────────
export default function MaterialsPage({ materials, contractors, syncSystemData }) {
  const [newMaterialForm,   setNewMaterialForm]   = useState({ name:'', category:'', quantity:'' });
  const [newContractorForm, setNewContractorForm] = useState({ contact_person:'', company_name:'', phone:'', email:'' });
  const [matMsg,    setMatMsg]    = useState(null);
  const [conMsg,    setConMsg]    = useState(null);
  const [deleteMsg, setDeleteMsg] = useState(null);

  // Delete modal state (shared between materials and contractors)
  const [deleteTarget,  setDeleteTarget]  = useState(null); // { id, name, linkedLoans, entityType }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Inline edit state: materials ──────────────────────────────────────
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [editMaterialForm,  setEditMaterialForm]  = useState({ name:'', category:'', quantity:'', barcode:'' });
  const [editMatSaving,     setEditMatSaving]     = useState(false);

  // ── Inline edit state: contractors ────────────────────────────────────
  const [editingContractorId, setEditingContractorId] = useState(null);
  const [editContractorForm,  setEditContractorForm]  = useState({ contact_person:'', company_name:'', phone:'', email:'' });
  const [editConSaving,       setEditConSaving]       = useState(false);

  // ── Download registry ──────────────────────────────────────────────────
  const handleDownload = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/materials/export`);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Assets Registry');
      XLSX.writeFile(wb, `Basirah_Assets_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (err) { setDeleteMsg({ type:'error', text:'Export failed: ' + (err.response?.data?.error || err.message) }); }
  };

  // ── Add material / contractor ──────────────────────────────────────────
  const handleAddMaterial = async (e) => {
    e.preventDefault(); setMatMsg(null);
    try {
      await axios.post(`${API_BASE}/api/materials`, { name:newMaterialForm.name, category:newMaterialForm.category, quantity:parseInt(newMaterialForm.quantity), barcode:'BR-'+Math.floor(100000+Math.random()*900000) });
      setNewMaterialForm({ name:'', category:'', quantity:'' });
      await syncSystemData();
      setMatMsg({ type:'success', text:'Asset registered successfully.' });
    } catch (err) { setMatMsg({ type:'error', text:err.response?.data?.error||'Failed to register asset.' }); }
  };

  const handleAddContractor = async (e) => {
    e.preventDefault(); setConMsg(null);
    try {
      await axios.post(`${API_BASE}/api/contractors`, { contact_person:newContractorForm.contact_person, company_name:newContractorForm.company_name, phone:newContractorForm.phone||'0500000000', email:newContractorForm.email||'' });
      setNewContractorForm({ contact_person:'', company_name:'', phone:'', email:'' });
      await syncSystemData();
      setConMsg({ type:'success', text:'Contractor registered successfully.' });
    } catch (err) { setConMsg({ type:'error', text:err.response?.data?.error||'Failed to save contractor.' }); }
  };

  // ── Material inline edit handlers ──────────────────────────────────────
  const startEditMaterial = (m) => {
    setEditingMaterialId(m.id);
    setEditMaterialForm({ name: m.name, category: m.category || '', quantity: m.quantity, barcode: m.barcode || '' });
  };
  const cancelEditMaterial = () => { setEditingMaterialId(null); };
  const saveEditMaterial = async (id) => {
    setEditMatSaving(true);
    try {
      await axios.put(`${API_BASE}/api/materials/${id}`, {
        name: editMaterialForm.name,
        category: editMaterialForm.category,
        quantity: parseInt(editMaterialForm.quantity) || 0,
        barcode: editMaterialForm.barcode,
      });
      setEditingMaterialId(null);
      await syncSystemData();
      setMatMsg({ type: 'success', text: 'Material updated.' });
    } catch (err) {
      setMatMsg({ type: 'error', text: err.response?.data?.error || 'Update failed.' });
    } finally { setEditMatSaving(false); }
  };

  // ── Contractor inline edit handlers ────────────────────────────────────
  const startEditContractor = (c) => {
    setEditingContractorId(c.id);
    setEditContractorForm({ contact_person: c.contact_person || '', company_name: c.company_name || '', phone: c.phone || '', email: c.email || '' });
  };
  const cancelEditContractor = () => { setEditingContractorId(null); };
  const saveEditContractor = async (id) => {
    setEditConSaving(true);
    try {
      await axios.put(`${API_BASE}/api/contractors/${id}`, {
        contact_person: editContractorForm.contact_person,
        company_name: editContractorForm.company_name,
        phone: editContractorForm.phone,
        email: editContractorForm.email,
      });
      setEditingContractorId(null);
      await syncSystemData();
      setConMsg({ type: 'success', text: 'Contractor updated.' });
    } catch (err) {
      setConMsg({ type: 'error', text: err.response?.data?.error || 'Update failed.' });
    } finally { setEditConSaving(false); }
  };

  // ── Delete: materials ───────────────────────────────────────────────────
  const handleDeleteMaterialClick = async (material) => {
    setDeleteMsg(null); setDeleteLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/materials/${material.id}/loan-check`);
      setDeleteTarget({ id: material.id, name: material.name, linkedLoans: data.loans || [], entityType: 'material' });
    } catch (err) {
      setDeleteMsg({ type:'error', text:err.response?.data?.error||'Could not check loans.' });
    } finally { setDeleteLoading(false); }
  };

  // ── Delete: contractors ─────────────────────────────────────────────────
  const handleDeleteContractorClick = async (contractor) => {
    setDeleteMsg(null); setDeleteLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/contractors/${contractor.id}/loan-check`);
      setDeleteTarget({ id: contractor.id, name: contractor.company_name || contractor.contact_person, linkedLoans: data.loans || [], entityType: 'contractor' });
    } catch (err) {
      setDeleteMsg({ type:'error', text:err.response?.data?.error||'Could not check loans.' });
    } finally { setDeleteLoading(false); }
  };

  // ── Execute delete (shared for both types) ──────────────────────────────
  const handleDeleteConfirm = async (strategy) => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const endpoint = deleteTarget.entityType === 'contractor' ? 'contractors' : 'materials';
      await axios.delete(`${API_BASE}/api/${endpoint}/${deleteTarget.id}?strategy=${strategy}`);
      setDeleteTarget(null);
      await syncSystemData();
      setDeleteMsg({ type:'success', text: strategy==='cascade'?'Deleted, along with its loans.':strategy==='soft'?'Archived, loans cancelled.':'Removed.' });
    } catch (err) {
      setDeleteTarget(null);
      setDeleteMsg({ type:'error', text:err.response?.data?.error||'Delete failed.' });
    } finally { setDeleteLoading(false); }
  };

  return (
    <div>
      {/* Header row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px' }}>
        <div>
          <h2 style={{ fontSize:'22px', fontWeight:'700', margin:0 }}>Asset Registry</h2>
          <p style={{ margin:'4px 0 0', fontSize:'13px', color:THEME.textMuted }}>{materials.length} materials · {contractors.length} contractors</p>
        </div>
        <button onClick={handleDownload} style={{ ...STYLES.button(THEME.accentEmerald), width:'auto', padding:'12px 22px', display:'inline-flex', alignItems:'center', gap:'8px', fontSize:'13px' }}>
          ↓ Download Registry (.xlsx)
        </button>
      </div>

      <SyncStatusBar />

      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <ExcelImportPanel syncSystemData={syncSystemData} />

      {/* Manual forms */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'28px', marginBottom:'32px' }}>
        <div style={STYLES.box}>
          <div style={{ ...STYLES.label, fontSize:'13px', marginBottom:'20px' }}>Register New Material</div>
          <form onSubmit={handleAddMaterial} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div><label style={STYLES.label}>Material Name</label><input style={STYLES.input} value={newMaterialForm.name} onChange={e=>setNewMaterialForm({...newMaterialForm,name:e.target.value})} required placeholder="e.g. Steel Pipe 2-inch" /></div>
            <div><label style={STYLES.label}>Category</label><input style={STYLES.input} value={newMaterialForm.category} onChange={e=>setNewMaterialForm({...newMaterialForm,category:e.target.value})} required placeholder="e.g. Structural" /></div>
            <div><label style={STYLES.label}>Initial Quantity</label><input type="number" style={STYLES.input} value={newMaterialForm.quantity} onChange={e=>setNewMaterialForm({...newMaterialForm,quantity:e.target.value})} required placeholder="e.g. 500" min="1" /></div>
            {matMsg&&<div style={msgStyle(matMsg.type)}>{matMsg.text}</div>}
            <button type="submit" style={STYLES.button(THEME.accentBlue)}>Add Material</button>
          </form>
        </div>
        <div style={STYLES.box}>
          <div style={{ ...STYLES.label, fontSize:'13px', marginBottom:'20px' }}>Register New Contractor</div>
          <form onSubmit={handleAddContractor} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div><label style={STYLES.label}>Contact Person</label><input style={STYLES.input} value={newContractorForm.contact_person} onChange={e=>setNewContractorForm({...newContractorForm,contact_person:e.target.value})} required placeholder="e.g. Ahmed Al-Rashid" /></div>
            <div><label style={STYLES.label}>Company Name</label><input style={STYLES.input} value={newContractorForm.company_name} onChange={e=>setNewContractorForm({...newContractorForm,company_name:e.target.value})} required placeholder="e.g. Gulf Construction LLC" /></div>
            <div><label style={STYLES.label}>Phone</label><input style={STYLES.input} value={newContractorForm.phone} onChange={e=>setNewContractorForm({...newContractorForm,phone:e.target.value})} placeholder="05XXXXXXXX" /></div>
            <div><label style={STYLES.label}>Email</label><input style={STYLES.input} value={newContractorForm.email} onChange={e=>setNewContractorForm({...newContractorForm,email:e.target.value})} placeholder="optional" /></div>
            {conMsg&&<div style={msgStyle(conMsg.type)}>{conMsg.text}</div>}
            <button type="submit" style={STYLES.button(THEME.accentEmerald)}>Add Contractor</button>
          </form>
        </div>
      </div>

      {/* Materials table with inline edit */}
      <div style={{ ...STYLES.box, marginBottom: '32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div style={STYLES.label}>All Materials ({materials.length})</div>
          {deleteMsg&&<div style={{ ...msgStyle(deleteMsg.type), fontSize:'12px' }}>{deleteMsg.text}</div>}
        </div>
        <table style={STYLES.table}>
          <thead>
            <tr>
              <th style={STYLES.th}>ID</th>
              <th style={STYLES.th}>Name</th>
              <th style={STYLES.th}>Category</th>
              <th style={STYLES.th}>In Stock</th>
              <th style={STYLES.th}>Barcode</th>
              <th style={{ ...STYLES.th, textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.length===0
              ?<tr><td colSpan={6} style={{ ...STYLES.td, textAlign:'center', color:THEME.textMuted }}>No materials registered</td></tr>
              :materials.map(m=>{
                const isEditing = editingMaterialId === m.id;
                return (
                  <tr key={m.id}>
                    <td style={STYLES.td}>{m.id}</td>
                    <td style={STYLES.td}>
                      {isEditing
                        ? <input style={inlineInput} value={editMaterialForm.name} onChange={e=>setEditMaterialForm({...editMaterialForm, name:e.target.value})} />
                        : <strong>{m.name}</strong>}
                    </td>
                    <td style={STYLES.td}>
                      {isEditing
                        ? <input style={inlineInput} value={editMaterialForm.category} onChange={e=>setEditMaterialForm({...editMaterialForm, category:e.target.value})} />
                        : (m.category || '—')}
                    </td>
                    <td style={{ ...STYLES.td, color: !isEditing && Number(m.quantity)===0 ? THEME.accentCrimson : THEME.accentEmerald, fontWeight:'700' }}>
                      {isEditing
                        ? <input type="number" style={inlineInput} value={editMaterialForm.quantity} onChange={e=>setEditMaterialForm({...editMaterialForm, quantity:e.target.value})} />
                        : m.quantity}
                    </td>
                    <td style={{ ...STYLES.td, fontFamily: 'monospace', fontSize: '12px', color: THEME.textMuted }}>
                      {isEditing
                        ? <input style={inlineInput} value={editMaterialForm.barcode} onChange={e=>setEditMaterialForm({...editMaterialForm, barcode:e.target.value})} />
                        : (m.barcode || '—')}
                    </td>
                    <td style={{ ...STYLES.td, textAlign:'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button onClick={() => saveEditMaterial(m.id)} disabled={editMatSaving} style={smallBtn(THEME.accentEmerald, THEME.accentEmerald)}>{editMatSaving ? '...' : '✓ Save'}</button>
                          <button onClick={cancelEditMaterial} disabled={editMatSaving} style={smallBtn(THEME.border, THEME.textMuted)}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button onClick={() => startEditMaterial(m)} style={smallBtn(THEME.accentBlue, THEME.accentBlue)}>✎ Edit</button>
                          <button onClick={()=>handleDeleteMaterialClick(m)} disabled={deleteLoading} style={smallBtn(THEME.accentCrimson, THEME.accentCrimson)}>🗑 Remove</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Contractors table with inline edit + delete */}
      <div style={STYLES.box}>
        <div style={{ ...STYLES.label, marginBottom:'16px' }}>All Contractors ({contractors.length})</div>
        <table style={STYLES.table}>
          <thead>
            <tr>
              <th style={STYLES.th}>ID</th>
              <th style={STYLES.th}>Contact Person</th>
              <th style={STYLES.th}>Company</th>
              <th style={STYLES.th}>Phone</th>
              <th style={STYLES.th}>Email</th>
              <th style={{ ...STYLES.th, textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contractors.length===0
              ?<tr><td colSpan={6} style={{ ...STYLES.td, textAlign:'center', color:THEME.textMuted }}>No contractors registered</td></tr>
              :contractors.map(c=>{
                const isEditing = editingContractorId === c.id;
                return (
                  <tr key={c.id}>
                    <td style={STYLES.td}>{c.id}</td>
                    <td style={STYLES.td}>
                      {isEditing
                        ? <input style={inlineInput} value={editContractorForm.contact_person} onChange={e=>setEditContractorForm({...editContractorForm, contact_person:e.target.value})} />
                        : <strong>{c.contact_person}</strong>}
                    </td>
                    <td style={STYLES.td}>
                      {isEditing
                        ? <input style={inlineInput} value={editContractorForm.company_name} onChange={e=>setEditContractorForm({...editContractorForm, company_name:e.target.value})} />
                        : c.company_name}
                    </td>
                    <td style={STYLES.td}>
                      {isEditing
                        ? <input style={inlineInput} value={editContractorForm.phone} onChange={e=>setEditContractorForm({...editContractorForm, phone:e.target.value})} />
                        : (c.phone || '—')}
                    </td>
                    <td style={STYLES.td}>
                      {isEditing
                        ? <input style={inlineInput} value={editContractorForm.email} onChange={e=>setEditContractorForm({...editContractorForm, email:e.target.value})} />
                        : (c.email || '—')}
                    </td>
                    <td style={{ ...STYLES.td, textAlign:'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button onClick={() => saveEditContractor(c.id)} disabled={editConSaving} style={smallBtn(THEME.accentEmerald, THEME.accentEmerald)}>{editConSaving ? '...' : '✓ Save'}</button>
                          <button onClick={cancelEditContractor} disabled={editConSaving} style={smallBtn(THEME.border, THEME.textMuted)}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button onClick={() => startEditContractor(c)} style={smallBtn(THEME.accentBlue, THEME.accentBlue)}>✎ Edit</button>
                          <button onClick={()=>handleDeleteContractorClick(c)} disabled={deleteLoading} style={smallBtn(THEME.accentCrimson, THEME.accentCrimson)}>🗑 Remove</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
