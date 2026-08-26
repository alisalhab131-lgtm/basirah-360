import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { API_BASE, THEME, STYLES } from '../utils/theme';

// ─── tiny helpers ──────────────────────────────────────────────────────────
const msgStyle = (type) => ({
  padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
  backgroundColor: type === 'success' ? `${THEME.accentEmerald}18` : `${THEME.accentCrimson}18`,
  color: type === 'success' ? THEME.accentEmerald : THEME.accentCrimson,
  border: `1px solid ${type === 'success' ? THEME.accentEmerald : THEME.accentCrimson}44`,
});

// ─── ExcelUploadPanel ──────────────────────────────────────────────────────
function ExcelUploadPanel({ syncSystemData }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);   // array of normalised rows
  const [status, setStatus] = useState(null);      // { type, text }
  const [report, setReport] = useState(null);      // server response summary
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  // ── parse file client-side for preview ──────────────────────────────────
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setReport(null);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        // show first 8 rows as preview
        setPreview(rows.slice(0, 8));
      } catch {
        setStatus({ type: 'error', text: 'Could not read file for preview.' });
      }
    };
    reader.readAsArrayBuffer(f);
  };

  // ── download sample template ─────────────────────────────────────────────
  const downloadTemplate = () => {
    const sample = [
      { 'Material Name': 'Steel Pipe 2-inch', Category: 'Structural', Quantity: 100, Barcode: '' },
      { 'Material Name': 'Safety Helmet', Category: 'PPE', Quantity: 50, Barcode: '' },
      { 'Material Name': 'Concrete Mix 40kg', Category: 'Civil', Quantity: 200, Barcode: '' },
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sample);
    XLSX.utils.book_append_sheet(wb, ws, 'Materials');
    XLSX.writeFile(wb, 'basirah_materials_template.xlsx');
  };

  // ── upload to backend ────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    setReport(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await axios.post(`${API_BASE}/api/materials/upload-excel`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReport(data);
      setStatus({ type: 'success', text: data.message });
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
      await syncSystemData();
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Upload failed.' });
    } finally {
      setLoading(false);
    }
  };

  const dropZoneStyle = {
    border: `2px dashed ${file ? THEME.accentEmerald : THEME.border}`,
    borderRadius: '10px',
    padding: '32px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: file ? `${THEME.accentEmerald}08` : '#0a0a0a',
    transition: 'all 0.2s',
  };

  return (
    <div style={STYLES.box}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ ...STYLES.label, fontSize: '13px', marginBottom: '4px' }}>Bulk Import via Excel</div>
          <div style={{ fontSize: '12px', color: THEME.textMuted }}>
            Upload an .xlsx or .xls file — headers are auto-detected and normalised.
          </div>
        </div>
        <button
          onClick={downloadTemplate}
          style={{
            padding: '8px 16px', borderRadius: '6px', border: `1px solid ${THEME.border}`,
            backgroundColor: 'transparent', color: THEME.textMuted, fontSize: '12px',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          ↓ Download Template
        </button>
      </div>

      {/* Drop zone / file picker */}
      <div style={dropZoneStyle} onClick={() => inputRef.current?.click()}>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        {file ? (
          <>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
            <div style={{ color: THEME.accentEmerald, fontWeight: '600', fontSize: '14px' }}>{file.name}</div>
            <div style={{ color: THEME.textMuted, fontSize: '12px', marginTop: '4px' }}>
              {(file.size / 1024).toFixed(1)} KB — click to change
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
            <div style={{ color: THEME.textMain, fontWeight: '600', fontSize: '14px' }}>Click to select Excel file</div>
            <div style={{ color: THEME.textMuted, fontSize: '12px', marginTop: '4px' }}>
              Accepts .xlsx or .xls — any column order, Arabic or English headers
            </div>
          </>
        )}
      </div>

      {/* Client-side preview */}
      {preview && preview.length > 0 && (
        <div style={{ marginTop: '18px' }}>
          <div style={{ ...STYLES.label, marginBottom: '10px' }}>
            Preview (first {preview.length} rows)
          </div>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
            <table style={{ ...STYLES.table, marginTop: 0 }}>
              <thead>
                <tr>
                  {Object.keys(preview[0]).map((h) => (
                    <th key={h} style={STYLES.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} style={{ ...STYLES.td, fontSize: '12px' }}>
                        {String(v) || <span style={{ color: THEME.textMuted }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '11px', color: THEME.textMuted, marginTop: '6px' }}>
            The server will auto-detect columns, title-case categories, fill missing barcodes, and merge duplicates.
          </div>
        </div>
      )}

      {/* Status message */}
      {status && <div style={{ ...msgStyle(status.type), marginTop: '16px' }}>{status.text}</div>}

      {/* Import report */}
      {report && (
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
          {[
            { label: 'Total Rows', value: report.summary.total_rows, color: THEME.textMain },
            { label: 'Imported', value: report.summary.inserted, color: THEME.accentEmerald },
            { label: 'Skipped', value: report.summary.skipped, color: THEME.accentAmber },
            { label: 'Errors', value: report.summary.errors, color: THEME.accentCrimson },
          ].map((s) => (
            <div key={s.label} style={{
              backgroundColor: '#0a0a0a', border: `1px solid ${THEME.border}`,
              borderRadius: '8px', padding: '14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: THEME.textMuted, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Errors detail */}
      {report?.errors?.length > 0 && (
        <div style={{ marginTop: '12px', backgroundColor: `${THEME.accentCrimson}10`, border: `1px solid ${THEME.accentCrimson}33`, borderRadius: '8px', padding: '14px' }}>
          <div style={{ ...STYLES.label, color: THEME.accentCrimson, marginBottom: '8px' }}>Row errors</div>
          {report.errors.map((e, i) => (
            <div key={i} style={{ fontSize: '12px', color: THEME.textMuted, marginBottom: '4px' }}>
              Row {e.row} — <strong style={{ color: THEME.textMain }}>{e.name}</strong>: {e.reason}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            ...STYLES.button(loading ? '#374151' : THEME.accentBlue),
            marginTop: '16px',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '⏳ Importing...' : `⬆ Import "${file.name}" into Materials`}
        </button>
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

  // ── Auto-refresh polling for background updates (e.g. OneDrive) ──────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof syncSystemData === 'function') {
        syncSystemData();
      }
    }, 10000); // Refreshes every 10 seconds

    return () => clearInterval(interval);
  }, [syncSystemData]);
  // ─────────────────────────────────────────────────────────────────────────

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/materials`, {
        name: newMaterialForm.name,
        category: newMaterialForm.category,
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
        company_name: newContractorForm.company_name,
        phone: '0500000000',
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

      {/* ── Excel bulk import ── */}
      <ExcelUploadPanel syncSystemData={syncSystemData} />

      {/* ── Manual entry forms ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '32px' }}>
        <div style={STYLES.box}>
          <div style={{ ...STYLES.label, fontSize: '13px', marginBottom: '20px' }}>Register New Material</div>
          <form onSubmit={handleAddMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={STYLES.label}>Material Name</label>
              <input style={STYLES.input} value={newMaterialForm.name}
                onChange={e => setNewMaterialForm({ ...newMaterialForm, name: e.target.value })}
                required placeholder="e.g. Steel Pipe 2-inch" />
            </div>
            <div>
              <label style={STYLES.label}>Category</label>
              <input style={STYLES.input} value={newMaterialForm.category}
                onChange={e => setNewMaterialForm({ ...newMaterialForm, category: e.target.value })}
                required placeholder="e.g. Structural" />
            </div>
            <div>
              <label style={STYLES.label}>Initial Quantity</label>
              <input type="number" style={STYLES.input} value={newMaterialForm.quantity}
                onChange={e => setNewMaterialForm({ ...newMaterialForm, quantity: e.target.value })}
                required placeholder="e.g. 500" min="1" />
            </div>
            {matMsg && <div style={msgStyle(matMsg.type)}>{matMsg.text}</div>}
            <button type="submit" style={STYLES.button(THEME.accentBlue)}>Add Material</button>
          </form>
        </div>

        <div style={STYLES.box}>
          <div style={{ ...STYLES.label, fontSize: '13px', marginBottom: '20px' }}>Register New Contractor</div>
          <form onSubmit={handleAddContractor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={STYLES.label}>Contact Person</label>
              <input style={STYLES.input} value={newContractorForm.contact_person}
                onChange={e => setNewContractorForm({ ...newContractorForm, contact_person: e.target.value })}
                required placeholder="e.g. Ahmed Al-Rashid" />
            </div>
            <div>
              <label style={STYLES.label}>Company Name</label>
              <input style={STYLES.input} value={newContractorForm.company_name}
                onChange={e => setNewContractorForm({ ...newContractorForm, company_name: e.target.value })}
                required placeholder="e.g. Gulf Construction LLC" />
            </div>
            {conMsg && <div style={msgStyle(conMsg.type)}>{conMsg.text}</div>}
            <button type="submit" style={STYLES.button(THEME.accentEmerald)}>Add Contractor</button>
          </form>
        </div>
      </div>

      {/* ── Tables ── */}
      <div style={STYLES.box}>
        <div style={{ ...STYLES.label, marginBottom: '16px' }}>All Materials ({materials.length})</div>
        <table style={STYLES.table}>
          <thead>
            <tr>
              <th style={STYLES.th}>ID</th>
              <th style={STYLES.th}>Name</th>
              <th style={STYLES.th}>Category</th>
              <th style={STYLES.th}>In Stock</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0
              ? <tr><td colSpan={4} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No materials registered</td></tr>
              : materials.map(m => (
                <tr key={m.id}>
                  <td style={STYLES.td}>{m.id}</td>
                  <td style={STYLES.td}><strong>{m.name}</strong></td>
                  <td style={STYLES.td}>{m.category || '—'}</td>
                  <td style={{ ...STYLES.td, color: Number(m.quantity) === 0 ? THEME.accentCrimson : THEME.accentEmerald, fontWeight: '700' }}>
                    {m.quantity}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div style={STYLES.box}>
        <div style={{ ...STYLES.label, marginBottom: '16px' }}>All Contractors ({contractors.length})</div>
        <table style={STYLES.table}>
          <thead>
            <tr>
              <th style={STYLES.th}>ID</th>
              <th style={STYLES.th}>Contact Person</th>
              <th style={STYLES.th}>Company</th>
            </tr>
          </thead>
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