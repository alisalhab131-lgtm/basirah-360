import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE, THEME, STYLES } from '../utils/theme';

export default function MaterialsPage({ materials, contractors, syncSystemData }) {
  const [newMaterialForm, setNewMaterialForm] = useState({ name: '', category: '', quantity: '' });
  const [newContractorForm, setNewContractorForm] = useState({ contact_person: '', company_name: '' });
  const [matMsg, setMatMsg] = useState(null);
  const [conMsg, setConMsg] = useState(null);

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

  const msgStyle = (type) => ({
    padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
    backgroundColor: type === 'success' ? `${THEME.accentEmerald}18` : `${THEME.accentCrimson}18`,
    color: type === 'success' ? THEME.accentEmerald : THEME.accentCrimson,
    border: `1px solid ${type === 'success' ? THEME.accentEmerald : THEME.accentCrimson}44`,
  });

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '28px' }}>Asset Registry</h2>
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

      <div style={STYLES.box}>
        <div style={{ ...STYLES.label, marginBottom: '16px' }}>All Materials ({materials.length})</div>
        <table style={STYLES.table}>
          <thead><tr><th style={STYLES.th}>ID</th><th style={STYLES.th}>Name</th><th style={STYLES.th}>Category</th><th style={STYLES.th}>In Stock</th></tr></thead>
          <tbody>
            {materials.length === 0
              ? <tr><td colSpan={4} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No materials registered</td></tr>
              : materials.map(m => (
                <tr key={m.id}>
                  <td style={STYLES.td}>{m.id}</td><td style={STYLES.td}><strong>{m.name}</strong></td>
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
                  <td style={STYLES.td}>{c.id}</td><td style={STYLES.td}><strong>{c.contact_person}</strong></td>
                  <td style={STYLES.td}>{c.company_name}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}