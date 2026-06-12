import React, { useState, useEffect } from 'react';
import axios from 'axios';

import LoginPage from './pages/Login.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import AnalyticsPage from './pages/Analytics.jsx';
import MaterialsPage from './pages/Materials.jsx';
import RecoveryPage from './pages/Recovery.jsx';
import Sidebar from './components/Sidebar.jsx';

import { API_BASE, THEME } from './utils/theme.js';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const [materials, setMaterials] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loans, setLoans] = useState([]);
  const [returns, setReturns] = useState([]);

  const syncSystemData = async () => {
    try {
      const [matRes, conRes, loanRes, retRes] = await Promise.all([
        axios.get(`${API_BASE}/api/materials`),
        axios.get(`${API_BASE}/api/contractors`),
        axios.get(`${API_BASE}/api/loans`),
        axios.get(`${API_BASE}/api/returns`).catch(() => ({ data: [] })),
      ]);
      setMaterials(matRes.data || []);
      setContractors(conRes.data || []);
      setLoans(loanRes.data || []);
      setReturns(retRes.data || []);
    } catch (err) {
      console.error('Data sync error:', err);
    }
  };

  useEffect(() => {
    if (token) syncSystemData();
  }, [token]);

  const getLoanRemainingQty = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return 0;
    if (loan.status === 'Returned') return 0;
    return Number(loan.quantity || 0);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    window.location.href = '/login';
  };

  if (!token) {
    return <LoginPage setToken={setToken} />;
  }

  const sharedProps = { materials, contractors, loans, returns, getLoanRemainingQty, syncSystemData };

  return (
    <div style={{
      fontFamily: '"Inter", sans-serif',
      backgroundColor: THEME.bg,
      color: THEME.textMain,
      minHeight: '100vh',
      display: 'flex',
    }}>
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />
      <div style={{ flex: 1, padding: '40px 48px', overflowY: 'auto', maxWidth: '1400px' }}>
        {currentPage === 'dashboard' && <DashboardPage {...sharedProps} />}
        {currentPage === 'analytics' && <AnalyticsPage {...sharedProps} />}
        {currentPage === 'materials' && <MaterialsPage {...sharedProps} />}
        {currentPage === 'returns_page' && <RecoveryPage {...sharedProps} />}
      </div>
    </div>
  );
}