import React from 'react';
import { BarChart3, Bot, HardHat, Package, RotateCcw, ShieldCheck, TrendingUp } from 'lucide-react';
import { THEME } from '../utils/theme';

const navItems = [
  { id: 'dashboard',            icon: BarChart3,  label: 'Telemetry Dashboard' },
  { id: 'analytics',            icon: TrendingUp, label: 'KPI Analytics' },
  { id: 'materials',            icon: Package,    label: 'Asset Registry' },
  { id: 'returns_page',         icon: RotateCcw,  label: 'Recovery Ops' },
  { id: 'construction_finance', icon: HardHat,    label: 'Construction Finance' },
  { id: 'asset_chatbot',        icon: Bot,        label: 'Asset Intelligence' },
];

export default function Sidebar({ currentPage, setCurrentPage, clearFilters, onLogout }) {
  const navLink = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
    color: isActive ? THEME.accentBlue : THEME.textMuted,
    border: `1px solid ${isActive ? 'rgba(37, 99, 235, 0.2)' : 'transparent'}`,
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '14px',
    width: '100%',
  });

  return (
    <div style={{
      width: '260px',
      minWidth: '260px',
      backgroundColor: THEME.cardBg,
      borderRight: `1px solid ${THEME.border}`,
      padding: '28px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      minHeight: '100vh',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        marginBottom: '36px', paddingBottom: '20px',
        borderBottom: `1px solid ${THEME.border}`,
      }}>
        <ShieldCheck size={26} color={THEME.accentBlue} />
        <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: THEME.textMain }}>
          BASIRAH <span style={{ color: THEME.accentBlue }}>360</span>
        </h3>
      </div>

      {navItems.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          style={navLink(currentPage === id)}
          onClick={() => { setCurrentPage(id); if (id === 'dashboard' && clearFilters) clearFilters(); }}
        >
          <Icon size={17} /> {label}
        </button>
      ))}

      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: `1px solid ${THEME.border}` }}>
        <button onClick={onLogout} style={{ ...navLink(false), color: THEME.accentCrimson, width: '100%' }}>
          Logout
        </button>
      </div>
    </div>
  );
}
