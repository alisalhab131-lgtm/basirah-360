export const API_BASE = 'https://basirah-backend-1.onrender.com';

export const THEME = {
  bg: '#0a0a0a',
  cardBg: '#121212',
  border: '#262626',
  textMain: '#f5f5f5',
  textMuted: '#a3a3a3',
  accentBlue: '#2563eb',
  accentEmerald: '#059669',
  accentAmber: '#d97706',
  accentCrimson: '#dc2626',
  accentPurple: '#7c3aed',
  accentCyan: '#0891b2',
};

export const CONDITION_COLORS = {
  Good: THEME.accentEmerald,
  Worn: THEME.accentAmber,
  Damaged: THEME.accentCrimson,
};

export const STYLES = {
  box: {
    backgroundColor: THEME.cardBg,
    border: `1px solid ${THEME.border}`,
    padding: '28px',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '11px',
    color: THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '6px',
    border: `1px solid ${THEME.border}`,
    backgroundColor: '#0a0a0a',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: (color) => ({
    width: '100%',
    padding: '14px',
    backgroundColor: color,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
  }),
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: {
    color: THEME.textMuted,
    padding: '14px 16px',
    textAlign: 'left',
    borderBottom: `1px solid ${THEME.border}`,
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase',
  },
  td: {
    padding: '14px 16px',
    borderBottom: `1px solid ${THEME.border}`,
    color: '#f5f5f5',
    fontSize: '14px',
  },
  customSelect: {
    control: (p) => ({ ...p, backgroundColor: '#0a0a0a', borderColor: THEME.border, color: '#fff', padding: '4px' }),
    menu: (p) => ({ ...p, backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}` }),
    singleValue: (p) => ({ ...p, color: '#fff' }),
    option: (p, s) => ({ ...p, backgroundColor: s.isFocused ? THEME.accentBlue : 'transparent', color: '#fff' }),
  },
};