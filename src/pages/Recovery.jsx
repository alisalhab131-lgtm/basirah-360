import React, { useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { API_BASE, THEME, STYLES, CONDITION_COLORS } from '../utils/theme';

export default function RecoveryPage({ materials, contractors, loans, returns, getLoanRemainingQty, syncSystemData }) {
  const [loanForm, setLoanForm] = useState({ material_id: '', contractor_id: '', quantity: '', expected_return_date: '', site_name: '' });
  const [loanMsg, setLoanMsg] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnQuantity, setReturnQuantity] = useState('');
  const [returnMsg, setReturnMsg] = useState(null);
  const [dropdownKey, setDropdownKey] = useState(0);

  const activeLoanOptions = loans
    .filter(l => getLoanRemainingQty(l.id) > 0)
    .map(l => ({
      value: l.id,
      label: `[${l.site_name || 'General'}] ${l.material_name} — ${l.contact_person} (${getLoanRemainingQty(l.id)} remaining)`,
    }));

  const selectedLoanRemaining = selectedLoan ? getLoanRemainingQty(selectedLoan.value) : 0;

  const handleLoanSelect = (opt) => {
    setSelectedLoan(opt);
    // Default the quantity field to the full remaining amount, editable by the user
    setReturnQuantity(opt ? String(getLoanRemainingQty(opt.value)) : '');
    setReturnMsg(null);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoan) { setReturnMsg({ type: 'error', text: 'Please select an active loan.' }); return; }

    const qty = parseInt(returnQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setReturnMsg({ type: 'error', text: 'Enter a quantity greater than 0.' });
      return;
    }
    if (qty > selectedLoanRemaining) {
      setReturnMsg({ type: 'error', text: `Only ${selectedLoanRemaining} units remain on this loan.` });
      return;
    }

    try {
      const { data } = await axios.post(`${API_BASE}/api/returns`, {
        loan_id: selectedLoan.value,
        returned_condition: returnCondition,
        damaged: returnCondition === 'Damaged',
        notes: `Returned in ${returnCondition} condition`,
        returned_quantity: qty,
      });
      setSelectedLoan(null); setReturnCondition('Good'); setReturnQuantity(''); setDropdownKey(k => k + 1);
      await syncSystemData();
      const isFullyClosed = data.loan_status === 'Returned';
      setReturnMsg({
        type: 'success',
        text: isFullyClosed
          ? `Return processed — loan fully closed. ${qty} unit(s) restored to stock.`
          : `Partial return processed — ${qty} unit(s) restored. ${data.remaining_quantity} unit(s) still outstanding on this loan.`,
      });
    } catch (err) {
      setReturnMsg({ type: 'error', text: err.response?.data?.error || 'Failed to process return.' });
    }
  };

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    const selectedMat = materials.find(m => String(m.id) === String(loanForm.material_id));
    if (selectedMat && parseInt(loanForm.quantity) > parseInt(selectedMat.quantity)) {
      setLoanMsg({ type: 'error', text: `Only ${selectedMat.quantity} units available.` }); return;
    }
    try {
      await axios.post(`${API_BASE}/api/loans`, {
        material_id: parseInt(loanForm.material_id), contractor_id: parseInt(loanForm.contractor_id),
        quantity: parseInt(loanForm.quantity), expected_return_date: loanForm.expected_return_date, site_name: loanForm.site_name,
      });
      setLoanForm({ material_id: '', contractor_id: '', quantity: '', expected_return_date: '', site_name: '' });
      await syncSystemData();
      setLoanMsg({ type: 'success', text: 'Dispatch authorized! Stock deducted.' });
    } catch (err) {
      setLoanMsg({ type: 'error', text: err.response?.data?.error || 'Dispatch failed.' });
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
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '28px' }}>Recovery Operations</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '32px' }}>

        <div style={STYLES.box}>
          <div style={{ ...STYLES.label, fontSize: '13px', marginBottom: '20px' }}>Issue / Dispatch Material to Site</div>
          <form onSubmit={handleLoanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div><label style={STYLES.label}>Material</label>
              <select style={STYLES.input} value={loanForm.material_id} onChange={e => setLoanForm({ ...loanForm, material_id: e.target.value })} required>
                <option value="" disabled>Select a material...</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.quantity} in stock)</option>)}
              </select></div>
            <div><label style={STYLES.label}>Contractor</label>
              <select style={STYLES.input} value={loanForm.contractor_id} onChange={e => setLoanForm({ ...loanForm, contractor_id: e.target.value })} required>
                <option value="" disabled>Select a contractor...</option>
                {contractors.map(c => <option key={c.id} value={c.id}>{c.contact_person} — {c.company_name}</option>)}
              </select></div>
            <div><label style={STYLES.label}>Site Name</label>
              <input style={STYLES.input} value={loanForm.site_name} onChange={e => setLoanForm({ ...loanForm, site_name: e.target.value })} required placeholder="e.g. Northern Operations Site A" /></div>
            <div><label style={STYLES.label}>Quantity</label>
              <input type="number" style={STYLES.input} value={loanForm.quantity} onChange={e => setLoanForm({ ...loanForm, quantity: e.target.value })} required placeholder="Amount to dispatch" min="1" /></div>
            <div><label style={STYLES.label}>Expected Return Date</label>
              <input type="date" style={STYLES.input} value={loanForm.expected_return_date} onChange={e => setLoanForm({ ...loanForm, expected_return_date: e.target.value })} required /></div>
            {loanMsg && <div style={msgStyle(loanMsg.type)}>{loanMsg.text}</div>}
            <button type="submit" style={STYLES.button(THEME.accentBlue)}>Authorize Dispatch</button>
          </form>
        </div>

        <div style={STYLES.box}>
          <div style={{ ...STYLES.label, fontSize: '13px', marginBottom: '8px' }}>Process Material Return</div>
          <p style={{ fontSize: '12px', color: THEME.textMuted, marginBottom: '16px', lineHeight: '1.5' }}>
            Select the active loan. Enter how many units are actually being returned — partial returns are supported, the rest stays outstanding on the loan.
          </p>
          <form onSubmit={handleReturnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={STYLES.label}>Active Loan to Return</label>
              <Select key={dropdownKey} options={activeLoanOptions} styles={STYLES.customSelect}
                onChange={handleLoanSelect} placeholder="Search active loans..." isClearable
                noOptionsMessage={() => 'No active loans found'} />
              {activeLoanOptions.length === 0 && <div style={{ fontSize: '12px', color: THEME.textMuted, marginTop: '6px' }}>All loans have been returned.</div>}
            </div>

            {selectedLoan && (() => {
              const loan = loans.find(l => l.id === selectedLoan.value);
              return loan ? (
                <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: `${THEME.accentBlue}0f`, border: `1px solid ${THEME.accentBlue}33`, fontSize: '13px', color: THEME.textMuted }}>
                  <strong style={{ color: THEME.textMain }}>{selectedLoanRemaining} units</strong> still outstanding of <strong style={{ color: THEME.textMain }}>{loan.material_name}</strong> from <strong style={{ color: THEME.textMain }}>{loan.site_name || 'Field'}</strong>
                </div>
              ) : null;
            })()}

            {selectedLoan && (
              <div>
                <label style={STYLES.label}>Quantity to Return</label>
                <input
                  type="number"
                  style={STYLES.input}
                  value={returnQuantity}
                  onChange={e => setReturnQuantity(e.target.value)}
                  min="1"
                  max={selectedLoanRemaining}
                  placeholder={`Up to ${selectedLoanRemaining}`}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: THEME.textMuted }}>Max: {selectedLoanRemaining}</span>
                  <button
                    type="button"
                    onClick={() => setReturnQuantity(String(selectedLoanRemaining))}
                    style={{ fontSize: '11px', color: THEME.accentBlue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: 0 }}
                  >
                    Return all {selectedLoanRemaining}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label style={STYLES.label}>Condition on Return</label>
              <select style={STYLES.input} value={returnCondition} onChange={e => setReturnCondition(e.target.value)}>
                <option value="Good">Good — Ready for re-issue</option>
                <option value="Worn">Worn — Needs service review</option>
                <option value="Damaged">Damaged — Requires repair or scrap</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '6px', backgroundColor: `${CONDITION_COLORS[returnCondition]}11`, border: `1px solid ${CONDITION_COLORS[returnCondition]}33` }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: CONDITION_COLORS[returnCondition] }} />
              <span style={{ fontSize: '12px', color: CONDITION_COLORS[returnCondition], fontWeight: '600' }}>
                {returnCondition === 'Good' && 'Stock will be restored to available inventory'}
                {returnCondition === 'Worn' && 'Stock restored — flagged for service review'}
                {returnCondition === 'Damaged' && 'Stock restored — flagged as damaged/scrap'}
              </span>
            </div>
            {returnMsg && <div style={msgStyle(returnMsg.type)}>{returnMsg.text}</div>}
            <button type="submit" style={STYLES.button(THEME.accentAmber)}>Process Return</button>
          </form>
        </div>
      </div>

      <div style={STYLES.box}>
        <div style={{ ...STYLES.label, marginBottom: '16px' }}>Active Loans</div>
        <table style={STYLES.table}>
          <thead><tr>
            <th style={STYLES.th}>Material</th><th style={STYLES.th}>Contractor</th><th style={STYLES.th}>Site</th>
            <th style={STYLES.th}>Dispatched</th><th style={STYLES.th}>Remaining</th><th style={STYLES.th}>Due Date</th><th style={STYLES.th}>Status</th>
          </tr></thead>
          <tbody>
            {loans.filter(l => getLoanRemainingQty(l.id) > 0).length === 0
              ? <tr><td colSpan={7} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No active loans</td></tr>
              : loans.filter(l => getLoanRemainingQty(l.id) > 0).map(l => {
                const isOverdue = l.expected_return_date && new Date(l.expected_return_date) < new Date();
                const remaining = getLoanRemainingQty(l.id);
                const isPartial = remaining < Number(l.quantity) && remaining > 0;
                return (
                  <tr key={l.id}>
                    <td style={STYLES.td}>{l.material_name}</td><td style={STYLES.td}>{l.contact_person}</td>
                    <td style={STYLES.td}>{l.site_name || '—'}</td><td style={STYLES.td}>{l.quantity}</td>
                    <td style={{ ...STYLES.td, fontWeight: '700', color: THEME.accentAmber }}>{remaining}</td>
                    <td style={STYLES.td}>{l.expected_return_date || '—'}</td>
                    <td style={STYLES.td}>
                      <span style={{ color: isOverdue ? THEME.accentCrimson : THEME.accentEmerald, fontWeight: '700', fontSize: '12px' }}>
                        {isOverdue ? '⚠ OVERDUE' : 'ACTIVE'}
                      </span>
                      {isPartial && <span style={{ marginLeft: '6px', color: THEME.accentCyan, fontWeight: '700', fontSize: '11px' }}>· PARTIAL</span>}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div style={STYLES.box}>
        <div style={{ ...STYLES.label, marginBottom: '16px' }}>Return History ({returns.length})</div>
        <table style={STYLES.table}>
          <thead><tr>
            <th style={STYLES.th}>Material</th><th style={STYLES.th}>Contractor</th>
            <th style={STYLES.th}>Qty Returned</th>
            <th style={STYLES.th}>Return Date</th><th style={STYLES.th}>Condition</th>
          </tr></thead>
          <tbody>
            {returns.length === 0
              ? <tr><td colSpan={5} style={{ ...STYLES.td, textAlign: 'center', color: THEME.textMuted }}>No returns yet</td></tr>
              : returns.map(r => (
                <tr key={r.id}>
                  <td style={STYLES.td}>{r.material_name}</td><td style={STYLES.td}>{r.contact_person}</td>
                  <td style={{ ...STYLES.td, fontWeight: '700', color: THEME.accentEmerald }}>{r.quantity ?? r.loan_quantity ?? '—'}</td>
                  <td style={STYLES.td}>{r.return_date || '—'}</td>
                  <td style={STYLES.td}><span style={{ color: CONDITION_COLORS[r.returned_condition] || THEME.textMuted, fontWeight: '700', fontSize: '12px' }}>{r.returned_condition || '—'}</span></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
