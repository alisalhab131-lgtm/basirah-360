export default function App() {
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import React, { useState, useEffect, useCallback } from 'react';
import axios from "axios";
import { 
  Package, ArrowLeftRight, BarChart3, AlertTriangle, 
  LayoutGrid, RotateCcw, ShieldCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Cell, PieChart, Pie, Legend
} from 'recharts';
import Select from 'react-select';

const API_BASE = 'https://basirah-backend-1.onrender.com';
export default function App() {  
  const [token, setToken] = useState(localStorage.getItem("token"));  
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [materials, setMaterials] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loans, setLoans] = useState([]);
  const [returns, setReturns] = useState([]);

  const [dashboardCardFilter, setDashboardCardFilter] = useState('ALL'); 
  const [activeDrillDown, setActiveDrillDown] = useState({ active: false, type: null, value: null });

  const [loanForm, setLoanForm] = useState({ material_id: null, contractor_id: null, quantity: '', expected_return_date: '', site_name: '' });
  const [newMaterialForm, setNewMaterialForm] = useState({ name: '', category: '', quantity: '' });
  const [newContractorForm, setNewContractorForm] = useState({ contact_person: '', company_name: '' });

  const [selectedActiveLoan, setSelectedActiveLoan] = useState(null);
  const [returnQuantity, setReturnQuantity] = useState('');
  const [returnCondition, setReturnCondition] = useState('Good');
  const [dropdownResetKey, setDropdownResetKey] = useState(0);

  // ✅ FIX: stable function for useEffect dependency safety
  const syncSystemData = useCallback(async () => {
    try {
      const [matRes, conRes, loanRes] = await Promise.all([
        axios.get(`${API_BASE}/api/materials`),
        axios.get(`${API_BASE}/api/contractors`),
        axios.get(`${API_BASE}/api/loans`)
      ]);

      const retRes = await axios.get(`${API_BASE}/api/returns`)
        .catch(() => ({ data: [] }));

      setMaterials(matRes.data || []);
      setContractors(conRes.data || []);
      setLoans(loanRes.data || []);
      setReturns(retRes.data || []);

    } catch (err) {
      console.error("Data syncing error:", err);
    }
  }, []);

  useEffect(() => {
    syncSystemData();
  }, [syncSystemData]);

  // SAFE NUMBER HELPERS
  const n = (v) => Number(v ?? 0);

  const totalAvailable = materials.reduce((acc, curr) => acc + n(curr.quantity), 0);

  const getLoanRemainingQty = (loanId) => {
    const loanObj = loans.find(l => l.id === loanId);
    if (!loanObj) return 0;

    const totalReturned = returns
      .filter(r => n(r.loan_id) === n(loanId))
      .reduce((sum, r) => sum + n(r.returned_quantity), 0);

    return Math.max(0, n(loanObj.quantity) - totalReturned);
  };

  const totalLended = loans.reduce((acc, curr) => acc + getLoanRemainingQty(curr.id), 0);
  const totalStock = totalAvailable + totalLended;

  const criticalOverdueCount = loans.filter(l => {
    const remaining = getLoanRemainingQty(l.id);
    const due = new Date(l.expected_return_date);
    return remaining > 0 && !isNaN(due) && due < new Date();
  }).length;

  const totalGoodStock = returns.filter(r => r.returned_condition === 'Good')
    .reduce((s, r) => s + n(r.returned_quantity), 0);

  const totalWornStock = returns.filter(r => r.returned_condition === 'Worn')
    .reduce((s, r) => s + n(r.returned_quantity), 0);

  const totalDamagedStock = returns.filter(r => r.returned_condition === 'Damaged')
    .reduce((s, r) => s + n(r.returned_quantity), 0);

  const THEME = {
    bg: '#0a0a0a',
    cardBg: '#121212',
    border: '#262626',
    textMain: '#f5f5f5',
    textMuted: '#a3a3a3',
    accentBlue: '#2563eb',
    accentEmerald: '#059669',
    accentAmber: '#d97706',
    accentCrimson: '#dc2626'
  };

  const CONDITION_COLORS = {
    Good: THEME.accentEmerald,
    Worn: THEME.accentAmber,
    Damaged: THEME.accentCrimson
  };

  const activeTrailsOptions = loans
    .filter(l => getLoanRemainingQty(l.id) > 0)
    .map(l => ({
      value: l.id,
      label: `[${l.site_name || 'General'}] ${l.material_name} — ${getLoanRemainingQty(l.id)} Remaining`
    }));

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedActiveLoan) return alert('Select a loan');

    const id = selectedActiveLoan.value;
    const qty = n(returnQuantity);
    const max = getLoanRemainingQty(id);

    if (qty <= 0 || qty > max) return alert('Invalid quantity');

    try {
      await axios.post(`${API_BASE}/api/returns`, {
        loan_id: id,
        returned_quantity: qty,
        returned_condition: returnCondition
      });

      setSelectedActiveLoan(null);
      setReturnQuantity('');
      setDropdownResetKey(k => k + 1);
      await syncSystemData();
      alert('Success');

    } catch (err) {
      alert('Error');
    }
  };

  const handleAddMaterialSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/materials`, {
        name: newMaterialForm.name,
        category: newMaterialForm.category,
        quantity: n(newMaterialForm.quantity),
        barcode: "BR-" + Math.floor(100000 + Math.random() * 900000)
      });

      setNewMaterialForm({ name: '', category: '', quantity: '' });
      await syncSystemData();
    } catch (err) {
      alert('Failed');
    }
  };

  const handleAddContractorSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/contractors`, {
        contact_person: newContractorForm.contact_person,
        company_name: newContractorForm.company_name,
        phone: '0500000000'
      });

      setNewContractorForm({ contact_person: '', company_name: '' });
      await syncSystemData();

    } catch (err) {
      alert('Failed');
    }
  };

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/loans`, {
        material_id: n(loanForm.material_id),
        contractor_id: n(loanForm.contractor_id),
        quantity: n(loanForm.quantity),
        expected_return_date: loanForm.expected_return_date,
        site_name: loanForm.site_name
      });

      setLoanForm({ material_id: null, contractor_id: null, quantity: '', expected_return_date: '', site_name: '' });
      await syncSystemData();

    } catch (err) {
      alert('Dispatch failed');
    }
  };
return (
  <Routes>

    {/* LOGIN PAGE */}
    <Route
      path="/login"
      element={<Login setToken={setToken} />}
    />

    {/* PROTECTED APP */}
    <Route
      path="/"
      element={
        token ? (
          <div>
            {/* 🔥 PASTE YOUR OLD FULL UI HERE */}
          </div>
        ) : (
          <Navigate to="/login" replace />
        )
      }
    />

  </Routes>
);
}