import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import {
  MapPin, Users, Package, AlertTriangle, ShieldAlert,
  TrendingUp, Download, Activity, SlidersHorizontal,
  Check, X, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { API_BASE, THEME, CONDITION_COLORS, STYLES } from '../utils/theme';

const num = (v) => Number(v || 0);
const qty = (r) => num(r?.quantity);
const nameOf = (v, fallback = 'Unknown') => {
  const s = String(v ?? '').trim();
  return s || fallback;
};
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

const riskLabel = (score) => {
  if (score >= 75) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 30) return 'MODERATE';
  return 'LOW';
};

const riskBucket = (score) => {
  if (score >= 75) return 'Critical';
  if (score >= 55) return 'High Risk';
  if (score >= 30) return 'Attention';
  return 'Normal';
};

const riskColor = (score) => {
  if (score >= 55) return THEME.accentCrimson;
  if (score >= 30) return THEME.accentAmber;
  return THEME.accentEmerald;
};

const tooltipStyle = {
  backgroundColor: THEME.cardBg,
  borderColor: THEME.border,
  color: '#fff',
};

const sectionTitle = {
  ...STYLES.label,
  marginBottom: 14,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.4px',
};

const TRANSLATIONS = {
  en: {
    title: 'Interactive Analytics',
    subtitle: 'Build the exact analysis you need, then export only the selected KPIs and charts.',
    analysis: 'Analysis',
    site: 'Site',
    contractor: 'Contractor',
    material: 'Material',
    allSites: 'All Sites',
    allContractors: 'All Contractors',
    allMaterials: 'All Materials',
    condition: 'Condition',
    allConditions: 'All',
    risk: 'Risk',
    allRisk: 'All',
    normal: 'Normal',
    attention: 'Attention',
    highRisk: 'High Risk',
    critical: 'Critical',
    selectKpis: 'Select KPIs',
    selectCharts: 'Select Charts',
    selectAll: 'Select all',
    clear: 'Clear',
    export: 'Download PDF Report',
    reportPreview: 'Report configuration',
    totalStock: 'Total Stock',
    deployed: 'Currently Deployed',
    available: 'Available',
    utilization: 'Utilization',
    returned: 'Returned Qty',
    damaged: 'Damaged Qty',
    damageRate: 'Damage Rate',
    overdue: 'Overdue Qty',
    criticalExposure: 'Critical Exposure',
    recoveryRisk: 'Recovery / Loss Risk',
    recoveryRate: 'Recovery Rate',
    goodQty: 'Good Returns',
    wornQty: 'Worn Returns',
    conditionChart: 'Return Condition',
    performanceChart: 'Performance Ranking',
    riskChart: 'Risk Exposure',
    trendChart: 'Deployment & Return Trend',
    noData: 'No data matches the current selection.',
    reset: 'Reset filters',
    live: 'Live filtered analysis',
  },
  ar: {
    title: 'التحليلات التفاعلية',
    subtitle: 'أنشئ التحليل المطلوب ثم صدّر مؤشرات الأداء والرسوم التي اخترتها فقط.',
    analysis: 'التحليل',
    site: 'الموقع',
    contractor: 'المقاول',
    material: 'المادة',
    allSites: 'كل المواقع',
    allContractors: 'كل المقاولين',
    allMaterials: 'كل المواد',
    condition: 'الحالة',
    allConditions: 'الكل',
    risk: 'المخاطر',
    allRisk: 'الكل',
    normal: 'طبيعي',
    attention: 'يتطلب انتباه',
    highRisk: 'مخاطر عالية',
    critical: 'حرج',
    selectKpis: 'اختر مؤشرات الأداء',
    selectCharts: 'اختر الرسوم',
    selectAll: 'تحديد الكل',
    clear: 'مسح',
    export: 'تحميل تقرير PDF',
    reportPreview: 'إعداد التقرير',
    totalStock: 'إجمالي المخزون',
    deployed: 'قيد الاستخدام',
    available: 'متاح',
    utilization: 'نسبة الاستخدام',
    returned: 'الكمية المرتجعة',
    damaged: 'الكمية التالفة',
    damageRate: 'معدل التلف',
    overdue: 'الكمية المتأخرة',
    criticalExposure: 'التعرض الحرج',
    recoveryRisk: 'مخاطر الاسترجاع / الفقد',
    recoveryRate: 'نسبة الاسترجاع',
    goodQty: 'مرتجع جيد',
    wornQty: 'مرتجع مستهلك',
    conditionChart: 'حالة المرتجعات',
    performanceChart: 'ترتيب الأداء',
    riskChart: 'التعرض للمخاطر',
    trendChart: 'اتجاه الاستخدام والإرجاع',
    noData: 'لا توجد بيانات مطابقة للاختيار الحالي.',
    reset: 'إعادة ضبط',
    live: 'تحليل مباشر حسب الفلاتر',
  },
  fr: {
    title: 'Analytique interactive',
    subtitle: "Construisez l'analyse souhaitée puis exportez uniquement les KPI et graphiques sélectionnés.",
    analysis: 'Analyse',
    site: 'Site',
    contractor: 'Sous-traitant',
    material: 'Matériau',
    allSites: 'Tous les sites',
    allContractors: 'Tous les sous-traitants',
    allMaterials: 'Tous les matériaux',
    condition: 'État',
    allConditions: 'Tous',
    risk: 'Risque',
    allRisk: 'Tous',
    normal: 'Normal',
    attention: 'Attention',
    highRisk: 'Risque élevé',
    critical: 'Critique',
    selectKpis: 'Choisir les KPI',
    selectCharts: 'Choisir les graphiques',
    selectAll: 'Tout sélectionner',
    clear: 'Effacer',
    export: 'Télécharger le rapport PDF',
    reportPreview: 'Configuration du rapport',
    totalStock: 'Stock total',
    deployed: 'Actuellement déployé',
    available: 'Disponible',
    utilization: 'Utilisation',
    returned: 'Qté retournée',
    damaged: 'Qté endommagée',
    damageRate: 'Taux de dommage',
    overdue: 'Qté en retard',
    criticalExposure: 'Exposition critique',
    recoveryRisk: 'Risque de récupération / perte',
    recoveryRate: 'Taux de récupération',
    goodQty: 'Retours bons',
    wornQty: 'Retours usés',
    conditionChart: 'État des retours',
    performanceChart: 'Classement de performance',
    riskChart: 'Exposition au risque',
    trendChart: 'Tendance déploiement / retour',
    noData: 'Aucune donnée ne correspond à la sélection actuelle.',
    reset: 'Réinitialiser',
    live: 'Analyse filtrée en direct',
  },
};

const KPI_CATALOG = [
  ['total_stock', 'totalStock'],
  ['deployed', 'deployed'],
  ['available', 'available'],
  ['utilization', 'utilization'],
  ['returned', 'returned'],
  ['damaged', 'damaged'],
  ['damage_rate', 'damageRate'],
  ['overdue', 'overdue'],
  ['critical_exposure', 'criticalExposure'],
  ['recovery_risk', 'recoveryRisk'],
  ['recovery_rate', 'recoveryRate'],
  ['good_qty', 'goodQty'],
  ['worn_qty', 'wornQty'],
];

const CHART_CATALOG = [
  ['condition', 'conditionChart'],
  ['performance', 'performanceChart'],
  ['risk', 'riskChart'],
  ['trend', 'trendChart'],
];

export default function AnalyticsPage({
  materials = [],
  contractors = [],
  loans = [],
  returns = [],
  getLoanRemainingQty,
  syncSystemData,
  navigateToAssets = null,
}) {
  const [language, setLanguage] = useState('en');
  const t = (key) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
  const dir = TRANSLATIONS[language]?.dir || (language === 'ar' ? 'rtl' : 'ltr');

  const [analysis, setAnalysis] = useState('site');
  const [siteFilter, setSiteFilter] = useState('All');
  const [contractorFilter, setContractorFilter] = useState('All');
  const [materialFilter, setMaterialFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  const [selectedKpis, setSelectedKpis] = useState(
    KPI_CATALOG.slice(0, 10).map(([id]) => id)
  );
  const [selectedCharts, setSelectedCharts] = useState(['performance', 'condition', 'risk', 'trend']);
  const [exporting, setExporting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(null);

  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeContractors = Array.isArray(contractors) ? contractors : [];
  const safeLoans = Array.isArray(loans) ? loans : [];
  const safeReturns = Array.isArray(returns) ? returns : [];

  const contractorName = (id) => {
    const c = safeContractors.find((x) => String(x.id) === String(id));
    return nameOf(c?.company_name || c?.contact_person, id ? `Contractor ${id}` : 'Unknown');
  };

  const remainingQty = (loan) => {
    try {
      if (typeof getLoanRemainingQty === 'function') {
        return Math.max(0, num(getLoanRemainingQty(loan?.id)));
      }
    } catch (_) {}
    const returned = safeReturns
      .filter((r) => num(r.loan_id) === num(loan?.id))
      .reduce((s, r) => s + qty(r), 0);
    return Math.max(0, num(loan?.quantity) - returned);
  };

  const overdue = (loan) => {
    if (!loan?.expected_return_date || remainingQty(loan) <= 0) return false;
    const d = new Date(loan.expected_return_date);
    return !Number.isNaN(d.getTime()) && d < new Date();
  };

  const siteOptions = useMemo(
    () => [...new Set(safeLoans.map((l) => String(l.site_name || '').trim()).filter(Boolean))].sort(),
    [safeLoans]
  );

  const contractorOptions = useMemo(
    () => safeContractors.map((c) => ({
      id: c.id,
      label: nameOf(c.company_name || c.contact_person, `Contractor ${c.id}`),
    })).sort((a, b) => a.label.localeCompare(b.label)),
    [safeContractors]
  );

  const materialOptions = useMemo(
    () => safeMaterials.map((m) => ({
      id: m.id,
      label: nameOf(m.name, `Material ${m.id}`),
    })).sort((a, b) => a.label.localeCompare(b.label)),
    [safeMaterials]
  );

  const materialById = useMemo(() => {
    const map = new Map();
    safeMaterials.forEach((m) => map.set(String(m.id), m));
    return map;
  }, [safeMaterials]);

  const loanMaterialName = (loan) => {
    if (loan?.material_name) return nameOf(loan.material_name);
    return nameOf(materialById.get(String(loan?.material_id))?.name, `Material ${loan?.material_id ?? 'Unknown'}`);
  };

  const filteredLoans = useMemo(() => safeLoans.filter((loan) => {
    if (siteFilter !== 'All' && nameOf(loan.site_name) !== siteFilter) return false;
    if (contractorFilter !== 'All' && String(loan.contractor_id) !== String(contractorFilter)) return false;
    if (materialFilter !== 'All' && String(loan.material_id) !== String(materialFilter)) return false;
    return true;
  }), [safeLoans, siteFilter, contractorFilter, materialFilter]);

  const filteredLoanIds = useMemo(() => new Set(filteredLoans.map((l) => num(l.id))), [filteredLoans]);

  const filteredReturns = useMemo(() => safeReturns.filter((r) => {
    if (!filteredLoanIds.has(num(r.loan_id))) return false;
    if (conditionFilter !== 'All' && String(r.returned_condition || '') !== conditionFilter) return false;
    return true;
  }), [safeReturns, filteredLoanIds, conditionFilter]);

  const scopedLoansForCondition = useMemo(() => {
    if (conditionFilter === 'All') return filteredLoans;
    const loanIds = new Set(filteredReturns.map((r) => num(r.loan_id)));
    return filteredLoans.filter((l) => loanIds.has(num(l.id)));
  }, [filteredLoans, filteredReturns, conditionFilter]);

  const siteStats = useMemo(() => {
    const groups = {};
    scopedLoansForCondition.forEach((loan) => {
      const key = nameOf(loan.site_name);
      if (!groups[key]) groups[key] = { name: key, issued: 0, active: 0, overdue: 0, returned: 0, damaged: 0 };
      groups[key].issued += num(loan.quantity);
      groups[key].active += remainingQty(loan);
      if (overdue(loan)) groups[key].overdue += remainingQty(loan);
    });
    filteredReturns.forEach((r) => {
      const loan = safeLoans.find((l) => num(l.id) === num(r.loan_id));
      const key = nameOf(r.site_name || loan?.site_name);
      if (!groups[key]) groups[key] = { name: key, issued: 0, active: 0, overdue: 0, returned: 0, damaged: 0 };
      groups[key].returned += qty(r);
      if (r.returned_condition === 'Damaged') groups[key].damaged += qty(r);
    });
    return Object.values(groups).map((x) => {
      const conditionTotal = x.returned;
      const recovery = pct(x.returned, x.issued);
      const damage = pct(x.damaged, conditionTotal);
      const overdueRate = pct(x.overdue, x.active);
      const exposure = pct(x.active, x.issued);
      const score = Math.round(clamp(
        exposure * 0.35 + overdueRate * 0.25 + damage * 0.25 + (100 - recovery) * 0.15
      ));
      return { ...x, recovery, damage, overdueRate, exposure, score, risk: riskBucket(score) };
    }).sort((a, b) => b.active - a.active);
  }, [scopedLoansForCondition, filteredReturns, safeLoans]);

  const contractorStats = useMemo(() => {
    return contractorOptions.map((c) => {
      const cLoans = scopedLoansForCondition.filter((l) => String(l.contractor_id) === String(c.id));
      const ids = new Set(cLoans.map((l) => num(l.id)));
      const cReturns = filteredReturns.filter((r) => ids.has(num(r.loan_id)));
      const issued = cLoans.reduce((s, l) => s + num(l.quantity), 0);
      const active = cLoans.reduce((s, l) => s + remainingQty(l), 0);
      const overdueQty = cLoans.reduce((s, l) => s + (overdue(l) ? remainingQty(l) : 0), 0);
      const returned = cReturns.reduce((s, r) => s + qty(r), 0);
      const damaged = cReturns.filter((r) => r.returned_condition === 'Damaged').reduce((s, r) => s + qty(r), 0);
      const recovery = pct(returned, issued);
      const damage = pct(damaged, returned);
      const overdueRate = pct(overdueQty, active);
      const exposure = pct(active, issued);
      const score = Math.round(clamp(exposure * 0.35 + overdueRate * 0.25 + damage * 0.25 + (100 - recovery) * 0.15));
      return {
        id: c.id, name: c.label, issued, active, overdue: overdueQty, returned, damaged,
        recovery, damage, overdueRate, exposure, score, risk: riskBucket(score),
      };
    }).filter((x) => x.issued > 0 || x.returned > 0);
  }, [contractorOptions, scopedLoansForCondition, filteredReturns]);

  const materialStats = useMemo(() => {
    const groups = {};
    scopedLoansForCondition.forEach((loan) => {
      const id = String(loan.material_id ?? loan.material_name ?? 'Unknown');
      if (!groups[id]) groups[id] = {
        id, name: loanMaterialName(loan), issued: 0, active: 0, overdue: 0,
        returned: 0, damaged: 0, good: 0, worn: 0
      };
      groups[id].issued += num(loan.quantity);
      groups[id].active += remainingQty(loan);
      if (overdue(loan)) groups[id].overdue += remainingQty(loan);
    });
    filteredReturns.forEach((r) => {
      const id = String(r.material_id ?? r.material_name ?? 'Unknown');
      if (!groups[id]) groups[id] = {
        id, name: nameOf(r.material_name, `Material ${r.material_id ?? 'Unknown'}`),
        issued: 0, active: 0, overdue: 0, returned: 0, damaged: 0, good: 0, worn: 0
      };
      groups[id].returned += qty(r);
      if (r.returned_condition === 'Damaged') groups[id].damaged += qty(r);
      if (r.returned_condition === 'Good') groups[id].good += qty(r);
      if (r.returned_condition === 'Worn') groups[id].worn += qty(r);
    });
    return Object.values(groups).map((x) => {
      const recovery = pct(x.returned, x.issued);
      const damage = pct(x.damaged, x.returned);
      const overdueRate = pct(x.overdue, x.active);
      const exposure = pct(x.active, x.issued);
      const score = Math.round(clamp(exposure * 0.35 + overdueRate * 0.25 + damage * 0.25 + (100 - recovery) * 0.15));
      return { ...x, recovery, damage, overdueRate, exposure, score, risk: riskBucket(score) };
    }).sort((a, b) => b.active - a.active);
  }, [scopedLoansForCondition, filteredReturns, materialById]);

  const selectedStats = useMemo(() => {
    if (analysis === 'site') {
      const x = siteStats.find((s) => s.name === siteFilter);
      if (siteFilter !== 'All' && x) return x;
    }
    if (analysis === 'contractor') {
      const x = contractorStats.find((s) => String(s.id) === String(contractorFilter));
      if (contractorFilter !== 'All' && x) return x;
    }
    if (analysis === 'material') {
      const x = materialStats.find((s) => String(s.id) === String(materialFilter));
      if (materialFilter !== 'All' && x) return x;
    }
    return null;
  }, [analysis, siteFilter, contractorFilter, materialFilter, siteStats, contractorStats, materialStats]);

  const availableStock = useMemo(() => {
    const relevantMaterialIds = new Set(
      scopedLoansForCondition.map((l) => String(l.material_id)).filter(Boolean)
    );
    if (materialFilter !== 'All') relevantMaterialIds.add(String(materialFilter));

    return safeMaterials
      .filter((m) => relevantMaterialIds.size === 0 || relevantMaterialIds.has(String(m.id)))
      .reduce((s, m) => s + num(m.quantity), 0);
  }, [safeMaterials, scopedLoansForCondition, materialFilter]);

  const deployedQty = useMemo(
    () => scopedLoansForCondition.reduce((s, l) => s + remainingQty(l), 0),
    [scopedLoansForCondition]
  );
  const returnedQty = useMemo(() => filteredReturns.reduce((s, r) => s + qty(r), 0), [filteredReturns]);
  const damagedQty = useMemo(
    () => filteredReturns.filter((r) => r.returned_condition === 'Damaged').reduce((s, r) => s + qty(r), 0),
    [filteredReturns]
  );
  const goodQty = useMemo(
    () => filteredReturns.filter((r) => r.returned_condition === 'Good').reduce((s, r) => s + qty(r), 0),
    [filteredReturns]
  );
  const wornQty = useMemo(
    () => filteredReturns.filter((r) => r.returned_condition === 'Worn').reduce((s, r) => s + qty(r), 0),
    [filteredReturns]
  );
  const overdueQty = useMemo(
    () => scopedLoansForCondition.reduce((s, l) => s + (overdue(l) ? remainingQty(l) : 0), 0),
    [scopedLoansForCondition]
  );
  const totalStock = availableStock + deployedQty;
  const utilization = pct(deployedQty, totalStock);
  const recoveryRate = pct(returnedQty, returnedQty + deployedQty);
  const damageRate = pct(damagedQty, returnedQty);
  const exposureRate = pct(deployedQty, totalStock);
  const selectedRiskScore = selectedStats?.score ?? (
    analysis === 'site'
      ? Math.max(0, ...siteStats.map((x) => x.score))
      : analysis === 'contractor'
        ? Math.max(0, ...contractorStats.map((x) => x.score))
        : Math.max(0, ...materialStats.map((x) => x.score))
  );
  const criticalExposure = useMemo(() => {
    const source = analysis === 'site' ? siteStats : analysis === 'contractor' ? contractorStats : materialStats;
    return source.filter((x) => x.score >= 75).reduce((s, x) => s + x.active, 0);
  }, [analysis, siteStats, contractorStats, materialStats]);
  const recoveryLossRisk = Math.round(clamp(
    exposureRate * 0.45 + pct(overdueQty, deployedQty) * 0.35 + damageRate * 0.20
  ));

  const kpiValues = {
    total_stock: totalStock,
    deployed: deployedQty,
    available: availableStock,
    utilization: `${utilization}%`,
    returned: returnedQty,
    damaged: damagedQty,
    damage_rate: `${damageRate}%`,
    overdue: overdueQty,
    critical_exposure: criticalExposure,
    recovery_risk: `${recoveryLossRisk}%`,
    recovery_rate: `${recoveryRate}%`,
    good_qty: goodQty,
    worn_qty: wornQty,
  };

  const kpiColors = {
    total_stock: THEME.accentBlue,
    deployed: THEME.accentAmber,
    available: THEME.accentEmerald,
    utilization: THEME.accentBlue,
    returned: THEME.accentEmerald,
    damaged: THEME.accentCrimson,
    damage_rate: damageRate > 20 ? THEME.accentCrimson : THEME.accentAmber,
    overdue: THEME.accentCrimson,
    critical_exposure: THEME.accentCrimson,
    recovery_risk: recoveryLossRisk >= 55 ? THEME.accentCrimson : THEME.accentAmber,
    recovery_rate: THEME.accentEmerald,
    good_qty: CONDITION_COLORS.Good,
    worn_qty: CONDITION_COLORS.Worn,
  };

  const performanceData = useMemo(() => {
    const source = analysis === 'site'
      ? siteStats.map((x) => ({ ...x, name: x.name }))
      : analysis === 'contractor'
        ? contractorStats
        : materialStats;
    return source
      .filter((x) => riskFilter === 'All' || x.risk === riskFilter)
      .slice(0, 10)
      .map((x) => ({
        ...x,
        display: nameOf(x.name, 'Unknown').slice(0, 18),
      }));
  }, [analysis, siteStats, contractorStats, materialStats, riskFilter]);

  const riskData = useMemo(
    () => [...performanceData].sort((a, b) => b.score - a.score).slice(0, 10),
    [performanceData]
  );

  const conditionData = [
    { name: 'Good', value: goodQty },
    { name: 'Worn', value: wornQty },
    { name: 'Damaged', value: damagedQty },
  ].filter((x) => x.value > 0);

  const trendData = useMemo(() => {
    const buckets = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.push({
        key,
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        deployed: 0,
        returned: 0,
        damaged: 0,
      });
    }
    const index = new Map(buckets.map((b, i) => [b.key, i]));
    scopedLoansForCondition.forEach((l) => {
      const raw = l.loan_date || l.issue_date || l.created_at || l.start_date;
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        const b = index.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (b !== undefined) buckets[b].deployed += num(l.quantity);
      }
    });
    filteredReturns.forEach((r) => {
      const d = new Date(r.return_date || r.created_at);
      if (!Number.isNaN(d.getTime())) {
        const b = index.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (b !== undefined) {
          buckets[b].returned += qty(r);
          if (r.returned_condition === 'Damaged') buckets[b].damaged += qty(r);
        }
      }
    });
    return buckets;
  }, [scopedLoansForCondition, filteredReturns]);

  const toggle = (setter) => (id) => setter((prev) => (
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  ));

  const resetFilters = () => {
    setSiteFilter('All');
    setContractorFilter('All');
    setMaterialFilter('All');
    setConditionFilter('All');
    setRiskFilter('All');
  };

  const drillToAssets = (type, value, extra = {}) => {
    const payload = { type, value, ...extra };
    if (typeof navigateToAssets === 'function') {
      navigateToAssets(payload);
      return;
    }
    window.dispatchEvent(new CustomEvent('basirah-asset-drilldown', { detail: payload }));
  };

  const deleteReturn = async (id) => {
    if (!window.confirm('Delete this return record? The quantity restored to stock will be reversed.')) return;
    try {
      await axios.delete(`${API_BASE}/api/returns/${id}`);
      if (typeof syncSystemData === 'function') await syncSystemData();
      setDeleteMsg({ type: 'success', text: 'Return deleted successfully.' });
    } catch (e) {
      setDeleteMsg({ type: 'error', text: e?.response?.data?.error || 'Failed to delete return.' });
    }
  };

  const drawPdfBarChart = (doc, title, rows, valueKey, labelKey = 'name', maxValue = null) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const left = 14;
    const top = 34;
    const chartWidth = pageWidth - 28;
    const rowH = 9;
    const maxRows = Math.min(rows.length, 10);
    const max = maxValue || Math.max(1, ...rows.slice(0, maxRows).map((r) => num(r[valueKey])));
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(title, left, top);
    rows.slice(0, maxRows).forEach((r, i) => {
      const y = top + 9 + i * rowH;
      const label = String(r[labelKey] ?? 'Unknown').slice(0, 22);
      const value = num(r[valueKey]);
      const barW = max > 0 ? (value / max) * (chartWidth - 70) : 0;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(label, left, y);
      doc.rect(left + 58, y - 4.5, chartWidth - 70, 4, 'S');
      if (barW > 0) doc.rect(left + 58, y - 4.5, barW, 4, 'F');
      doc.text(String(value), left + chartWidth - 10, y);
    });
    return top + 16 + maxRows * rowH;
  };

  const handleGeneratePdf = async () => {
    if (selectedKpis.length === 0 && selectedCharts.length === 0) return;
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule.autoTable;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, pageWidth, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('BASIRAH 360 — ANALYTICS REPORT', 14, 11);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`${analysis.toUpperCase()} ANALYSIS • ${new Date().toLocaleString()}`, 14, 18);
      doc.setTextColor(0, 0, 0);

      const filterText = [
        `Site: ${siteFilter === 'All' ? 'All' : siteFilter}`,
        `Contractor: ${contractorFilter === 'All' ? 'All' : contractorName(contractorFilter)}`,
        `Material: ${materialFilter === 'All' ? 'All' : nameOf(materialById.get(String(materialFilter))?.name, materialFilter)}`,
        `Condition: ${conditionFilter}`,
        `Risk: ${riskFilter}`,
      ].join('  |  ');

      doc.setFontSize(8);
      doc.text(filterText.slice(0, 180), 14, 30);
      let y = 39;

      const selected = KPI_CATALOG
        .filter(([id]) => selectedKpis.includes(id))
        .map(([id, key]) => [t(key), String(kpiValues[id])]);

      if (selected.length) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Selected KPIs', 14, y);
        y += 3;
        autoTable(doc, {
          startY: y,
          head: [['KPI', 'Value']],
          body: selected,
          theme: 'grid',
          margin: { left: 14, right: 14 },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] },
        });
        y = doc.lastAutoTable.finalY + 9;
      }

      const newPage = () => {
        doc.addPage();
        doc.setTextColor(0, 0, 0);
        return 20;
      };

      for (const chartId of selectedCharts) {
        if (y > pageHeight - 75) y = newPage();
        if (chartId === 'condition') {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(t('conditionChart'), 14, y);
          y += 6;
          autoTable(doc, {
            startY: y,
            head: [['Condition', 'Quantity', 'Share']],
            body: [
              ['Good', goodQty, `${pct(goodQty, returnedQty)}%`],
              ['Worn', wornQty, `${pct(wornQty, returnedQty)}%`],
              ['Damaged', damagedQty, `${pct(damagedQty, returnedQty)}%`],
            ],
            theme: 'striped',
            margin: { left: 14, right: 14 },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] },
          });
          y = doc.lastAutoTable.finalY + 9;
        }
        if (chartId === 'performance') {
          y = drawPdfBarChart(doc, t('performanceChart'), performanceData, 'active', 'name');
          y += 8;
        }
        if (chartId === 'risk') {
          y = drawPdfBarChart(doc, t('riskChart'), riskData, 'score', 'name', 100);
          y += 8;
        }
        if (chartId === 'trend') {
          if (y > pageHeight - 85) y = newPage();
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(t('trendChart'), 14, y);
          y += 6;
          autoTable(doc, {
            startY: y,
            head: [['Month', 'Deployed', 'Returned', 'Damaged']],
            body: trendData.map((m) => [m.month, m.deployed, m.returned, m.damaged]),
            theme: 'grid',
            margin: { left: 14, right: 14 },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] },
          });
          y = doc.lastAutoTable.finalY + 9;
        }
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(110, 110, 110);
        doc.text(`Basirah 360 • Page ${i} of ${pageCount}`, 14, pageHeight - 8);
      }

      const safe = (v) => String(v).replace(/[^a-z0-9_-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      doc.save(`Basirah360_Analytics_${safe(analysis)}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
      window.alert('PDF export failed. Make sure jspdf and jspdf-autotable are installed.');
    } finally {
      setExporting(false);
    }
  };

  const KpiCard = ({ id, label, value, color }) => (
    <button
      type="button"
      onClick={() => {
        if (id === 'deployed') drillToAssets('deployed', null, {
          site: siteFilter, contractor: contractorFilter, material: materialFilter
        });
        else if (id === 'overdue') drillToAssets('overdue', null, {
          site: siteFilter, contractor: contractorFilter, material: materialFilter
        });
        else if (id === 'damaged' || id === 'damage_rate') drillToAssets('condition', 'Damaged', {
          site: siteFilter, contractor: contractorFilter, material: materialFilter
        });
      }}
      style={{
        ...STYLES.box,
        marginBottom: 0,
        padding: 16,
        textAlign: 'left',
        cursor: ['deployed', 'overdue', 'damaged', 'damage_rate'].includes(id) ? 'pointer' : 'default',
        borderTop: `2px solid ${color || THEME.border}`,
        backgroundColor: THEME.cardBg,
      }}
    >
      <div style={{ ...STYLES.label, fontSize: 10 }}>{label}</div>
      <div style={{ fontSize: 25, fontWeight: 900, color: color || THEME.textMain, marginTop: 5 }}>
        {value}
      </div>
    </button>
  );

  const FilterSelect = ({ label, value, onChange, children }) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ ...STYLES.label, fontSize: 10 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...STYLES.input,
          marginBottom: 0,
          minWidth: 170,
          background: THEME.cardBg,
          color: THEME.textMain,
        }}
      >
        {children}
      </select>
    </label>
  );

  return (
    <div dir={dir}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 18, flexWrap: 'wrap', marginBottom: 20
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 25, fontWeight: 900 }}>{t('title')}</h2>
          <p style={{ margin: '6px 0 0', color: THEME.textMuted, fontSize: 13, maxWidth: 700 }}>
            {t('subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.textMuted, fontSize: 11 }}>
            <Activity size={14} /> {t('live')}
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '8px 10px', borderRadius: 8, border: `1px solid ${THEME.border}`,
              background: THEME.cardBg, color: THEME.textMain
            }}
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="fr">Français</option>
          </select>
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={exporting || (selectedKpis.length === 0 && selectedCharts.length === 0)}
            style={{
              ...STYLES.button(THEME.accentBlue),
              width: 'auto',
              padding: '9px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              opacity: exporting ? 0.6 : 1,
            }}
          >
            <Download size={14} /> {exporting ? 'Generating…' : t('export')}
          </button>
        </div>
      </div>

      <div style={{
        ...STYLES.box, marginBottom: 22, padding: 18,
        border: `1px solid ${THEME.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <SlidersHorizontal size={16} color={THEME.accentBlue} />
          <div style={sectionTitle}>{t('analysis')}</div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
          gap: 12
        }}>
          <FilterSelect label={t('analysis')} value={analysis} onChange={setAnalysis}>
            <option value="site">{t('site')}</option>
            <option value="contractor">{t('contractor')}</option>
            <option value="material">{t('material')}</option>
          </FilterSelect>

          <FilterSelect label={t('site')} value={siteFilter} onChange={setSiteFilter}>
            <option value="All">{t('allSites')}</option>
            {siteOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>

          <FilterSelect label={t('contractor')} value={contractorFilter} onChange={setContractorFilter}>
            <option value="All">{t('allContractors')}</option>
            {contractorOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </FilterSelect>

          <FilterSelect label={t('material')} value={materialFilter} onChange={setMaterialFilter}>
            <option value="All">{t('allMaterials')}</option>
            {materialOptions.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </FilterSelect>

          <FilterSelect label={t('condition')} value={conditionFilter} onChange={setConditionFilter}>
            <option value="All">{t('allConditions')}</option>
            <option value="Good">Good</option>
            <option value="Worn">Worn</option>
            <option value="Damaged">Damaged</option>
          </FilterSelect>

          <FilterSelect label={t('risk')} value={riskFilter} onChange={setRiskFilter}>
            <option value="All">{t('allRisk')}</option>
            <option value="Normal">{t('normal')}</option>
            <option value="Attention">{t('attention')}</option>
            <option value="High Risk">{t('highRisk')}</option>
            <option value="Critical">{t('critical')}</option>
          </FilterSelect>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          style={{
            marginTop: 14, border: 'none', background: 'transparent',
            color: THEME.accentBlue, cursor: 'pointer', fontSize: 11, fontWeight: 700
          }}
        >
          {t('reset')}
        </button>
      </div>

      <div style={{ ...STYLES.box, marginBottom: 22 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 12, flexWrap: 'wrap', marginBottom: 14
        }}>
          <div style={sectionTitle}>{t('selectKpis')}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setSelectedKpis(KPI_CATALOG.map(([id]) => id))}
              style={{ border: 'none', background: 'transparent', color: THEME.accentBlue, cursor: 'pointer', fontSize: 11 }}>
              {t('selectAll')}
            </button>
            <button type="button" onClick={() => setSelectedKpis([])}
              style={{ border: 'none', background: 'transparent', color: THEME.textMuted, cursor: 'pointer', fontSize: 11 }}>
              {t('clear')}
            </button>
          </div>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 9
        }}>
          {KPI_CATALOG.map(([id, labelKey]) => {
            const checked = selectedKpis.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(setSelectedKpis)(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '10px 11px',
                  borderRadius: 8, border: `1px solid ${checked ? THEME.accentBlue : THEME.border}`,
                  background: checked ? `${THEME.accentBlue}16` : 'transparent',
                  color: THEME.textMain, cursor: 'pointer', textAlign: 'left'
                }}
              >
                <span style={{
                  width: 17, height: 17, borderRadius: 4,
                  border: `1px solid ${checked ? THEME.accentBlue : THEME.border}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: checked ? THEME.accentBlue : 'transparent'
                }}>
                  {checked && <Check size={12} color="#fff" />}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{t(labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={sectionTitle}>{t('title')}</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))',
          gap: 12
        }}>
          {selectedKpis.map((id) => {
            const labelKey = KPI_CATALOG.find(([x]) => x === id)?.[1];
            if (!labelKey) return null;
            return <KpiCard key={id} id={id} label={t(labelKey)} value={kpiValues[id]} color={kpiColors[id]} />;
          })}
        </div>
        {selectedKpis.length === 0 && (
          <div style={{ ...STYLES.box, color: THEME.textMuted, fontSize: 12 }}>
            Select at least one KPI for the dashboard/report.
          </div>
        )}
      </div>

      <div style={{ ...STYLES.box, marginBottom: 22 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 12, flexWrap: 'wrap', marginBottom: 14
        }}>
          <div style={sectionTitle}>{t('selectCharts')}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setSelectedCharts(CHART_CATALOG.map(([id]) => id))}
              style={{ border: 'none', background: 'transparent', color: THEME.accentBlue, cursor: 'pointer', fontSize: 11 }}>
              {t('selectAll')}
            </button>
            <button type="button" onClick={() => setSelectedCharts([])}
              style={{ border: 'none', background: 'transparent', color: THEME.textMuted, cursor: 'pointer', fontSize: 11 }}>
              {t('clear')}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
          {CHART_CATALOG.map(([id, key]) => {
            const checked = selectedCharts.includes(id);
            return (
              <button key={id} type="button" onClick={() => toggle(setSelectedCharts)(id)}
                style={{
                  padding: '8px 11px', borderRadius: 8,
                  border: `1px solid ${checked ? THEME.accentBlue : THEME.border}`,
                  background: checked ? `${THEME.accentBlue}16` : 'transparent',
                  color: THEME.textMain, cursor: 'pointer', fontSize: 11, fontWeight: 700
                }}>
                {checked ? '✓ ' : ''}{t(key)}
              </button>
            );
          })}
        </div>
      </div>

      {selectedCharts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))',
          gap: 18,
          marginBottom: 22
        }}>
          {selectedCharts.includes('performance') && (
            <div style={STYLES.box}>
              <div style={sectionTitle}>{t('performanceChart')}</div>
              {performanceData.length ? (
                <div style={{ height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={performanceData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                      <XAxis type="number" stroke={THEME.textMuted} />
                      <YAxis type="category" dataKey="display" width={120} stroke={THEME.textMuted} tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v, n === 'active' ? 'Currently deployed' : n]} />
                      <Bar
                        dataKey="active" name="Currently deployed" fill={THEME.accentBlue} radius={[0, 4, 4, 0]}
                        onClick={(data) => {
                          const p = data?.payload;
                          if (!p) return;
                          if (analysis === 'site') drillToAssets('site', p.name);
                          if (analysis === 'contractor') drillToAssets('contractor', p.id);
                          if (analysis === 'material') drillToAssets('material', p.id);
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div style={{ color: THEME.textMuted, fontSize: 12 }}>{t('noData')}</div>}
            </div>
          )}

          {selectedCharts.includes('condition') && (
            <div style={STYLES.box}>
              <div style={sectionTitle}>{t('conditionChart')}</div>
              {conditionData.length ? (
                <div style={{ height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={conditionData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={65} outerRadius={105}>
                        {conditionData.map((x) => <Cell key={x.name} fill={CONDITION_COLORS[x.name]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <div style={{ color: THEME.textMuted, fontSize: 12 }}>{t('noData')}</div>}
            </div>
          )}

          {selectedCharts.includes('risk') && (
            <div style={STYLES.box}>
              <div style={sectionTitle}>{t('riskChart')}</div>
              {riskData.length ? (
                <div style={{ height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={riskData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                      <XAxis type="number" domain={[0, 100]} stroke={THEME.textMuted} />
                      <YAxis type="category" dataKey="display" width={120} stroke={THEME.textMuted} tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}/100`, 'Risk score']} />
                      <Bar
                        dataKey="score" name="Risk score" fill={THEME.accentCrimson} radius={[0, 4, 4, 0]}
                        onClick={(data) => {
                          const p = data?.payload;
                          if (!p) return;
                          if (analysis === 'site') drillToAssets('site', p.name, { risk: p.risk });
                          if (analysis === 'contractor') drillToAssets('contractor', p.id, { risk: p.risk });
                          if (analysis === 'material') drillToAssets('material', p.id, { risk: p.risk });
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div style={{ color: THEME.textMuted, fontSize: 12 }}>{t('noData')}</div>}
            </div>
          )}

          {selectedCharts.includes('trend') && (
            <div style={STYLES.box}>
              <div style={sectionTitle}>{t('trendChart')}</div>
              <div style={{ height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={trendData} margin={{ left: 0, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                    <XAxis dataKey="month" stroke={THEME.textMuted} />
                    <YAxis stroke={THEME.textMuted} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="deployed" name="Deployed" stroke={THEME.accentBlue} strokeWidth={2} />
                    <Line type="monotone" dataKey="returned" name="Returned" stroke={THEME.accentEmerald} strokeWidth={2} />
                    <Line type="monotone" dataKey="damaged" name="Damaged" stroke={THEME.accentCrimson} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {deleteMsg && (
        <div style={{
          ...STYLES.box, marginBottom: 18,
          borderColor: deleteMsg.type === 'success' ? THEME.accentEmerald : THEME.accentCrimson,
          color: deleteMsg.type === 'success' ? THEME.accentEmerald : THEME.accentCrimson
        }}>
          {deleteMsg.text}
        </div>
      )}

      <div style={{ ...STYLES.box, marginBottom: 30 }}>
        <div style={sectionTitle}>Selected Analysis Summary</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10
        }}>
          <div><span style={STYLES.label}>Analysis</span><div>{analysis}</div></div>
          <div><span style={STYLES.label}>Filtered Loans</span><div>{filteredLoans.length}</div></div>
          <div><span style={STYLES.label}>Filtered Returns</span><div>{filteredReturns.length}</div></div>
          <div><span style={STYLES.label}>Risk Status</span><div style={{ color: riskColor(selectedRiskScore), fontWeight: 800 }}>{riskLabel(selectedRiskScore)}</div></div>
        </div>
      </div>
    </div>
  );
}
