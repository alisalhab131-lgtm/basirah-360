import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  MapPin,
  Users,
  Package,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronLeft,
  Download,
  Trash2,
  Activity,
  Search,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import {
  API_BASE,
  THEME,
  CONDITION_COLORS,
  STYLES,
} from '../utils/theme';

/* ============================================================================
   HELPERS
============================================================================ */

const num = (value) => Number(value || 0);

const returnQty = (r) => num(r?.quantity);

const safeName = (value, fallback = 'Unknown') => {
  const text = String(value || '').trim();
  return text || fallback;
};

const pct = (numerator, denominator) =>
  denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

const pct1 = (numerator, denominator) =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

const clamp = (value, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const riskLabel = (score) => {
  if (score >= 75) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 30) return 'MODERATE';
  return 'LOW';
};

const riskColor = (score) => {
  if (score >= 75) return THEME.accentCrimson;
  if (score >= 55) return THEME.accentCrimson;
  if (score >= 30) return THEME.accentAmber;
  return THEME.accentEmerald;
};

const statusColor = (status) => {
  if (status === 'CRITICAL' || status === 'HIGH') return THEME.accentCrimson;
  if (status === 'MODERATE') return THEME.accentAmber;
  return THEME.accentEmerald;
};

const BADGE = (color, label) => (
  <span
    style={{
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
      borderRadius: '6px',
      padding: '3px 9px',
      fontSize: '10px',
      fontWeight: '800',
      letterSpacing: '0.3px',
      display: 'inline-block',
    }}
  >
    {label}
  </span>
);

const msgStyle = (type) => ({
  padding: '10px 14px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: '500',
  backgroundColor:
    type === 'success'
      ? `${THEME.accentEmerald}18`
      : `${THEME.accentCrimson}18`,
  color:
    type === 'success'
      ? THEME.accentEmerald
      : THEME.accentCrimson,
  border: `1px solid ${
    type === 'success'
      ? THEME.accentEmerald
      : THEME.accentCrimson
  }44`,
});

const chartTooltipStyle = {
  backgroundColor: THEME.cardBg,
  borderColor: THEME.border,
  color: '#fff',
};

const sectionTitleStyle = {
  ...STYLES.label,
  marginBottom: '14px',
  fontSize: '12px',
  fontWeight: '800',
  letterSpacing: '0.4px',
};

/* ============================================================================
   TRANSLATIONS (EN / AR / FR)
============================================================================ */

const TRANSLATIONS = {
  en: {
    dir: 'ltr',
    kpiAnalytics: 'KPI Analytics',
    headerSubtitle:
      'Executive visibility into material utilization, site exposure, contractor performance and operational risk.',
    liveAnalytics: 'Live system analytics',
    exportPdf: 'Export PDF Report',
    executiveInventoryPosition: 'EXECUTIVE INVENTORY POSITION',
    managementAttention: 'Management Attention Required',
    reviewNote: 'require review',
    sitesLabel: 'sites',
    contractorsLabel: 'contractors',
    materialsLabel: 'materials',
    trendTitle: 'DEPLOYMENT & RETURN TREND (LAST 6 MONTHS)',
    noTrendData: 'No dated loan/return records yet to build a trend.',
    deployed: 'Deployed',
    returned: 'Returned',
    damaged: 'Damaged',
    overdue: 'Overdue',
    returnedMaterialQuality: 'RETURNED MATERIAL QUALITY',
    grossDeployed: 'Gross Deployed',
    recovered: 'Recovered',
    fieldExposure: 'Field Exposure',
    overdueExposure: 'Overdue Exposure',
    materialHealth: 'Material Health',
    damageRate: 'Damage Rate',
    wornRate: 'Worn Rate',
    highRiskSites: 'High-Risk Sites',
    highRiskContractors: 'High-Risk Contractors',
    highRiskMaterials: 'High-Risk Materials',
    managementAttentionCount: 'Management Attention Count',
    trendChartLabel: 'Deployment / Return Trend (last 6 months)',
    exportModalTitle: 'Export Analytics Report',
    exportModalSubtitle: 'Choose which KPIs to include in the PDF.',
    selectAll: 'Select all',
    clear: 'Clear',
    cancel: 'Cancel',
    generatePdf: 'Generate PDF',
    requiresAttention: 'Requires attention',
    language: 'Language',
  },
  ar: {
    dir: 'rtl',
    kpiAnalytics: 'تحليلات مؤشرات الأداء',
    headerSubtitle:
      'رؤية تنفيذية شاملة لاستخدام المواد، والتعرض في المواقع، وأداء المقاولين، والمخاطر التشغيلية.',
    liveAnalytics: 'تحليلات النظام المباشرة',
    exportPdf: 'تصدير تقرير PDF',
    executiveInventoryPosition: 'الوضع التنفيذي للمخزون',
    managementAttention: 'يتطلب اهتمام الإدارة',
    reviewNote: 'تتطلب المراجعة',
    sitesLabel: 'مواقع',
    contractorsLabel: 'مقاولون',
    materialsLabel: 'مواد',
    trendTitle: 'اتجاه النشر والإرجاع (آخر 6 أشهر)',
    noTrendData: 'لا توجد سجلات استعارة/إرجاع مؤرخة بعد لإنشاء اتجاه.',
    deployed: 'تم النشر',
    returned: 'تم الإرجاع',
    damaged: 'تالف',
    overdue: 'متأخر',
    returnedMaterialQuality: 'جودة المواد المرتجعة',
    grossDeployed: 'إجمالي المنشور',
    recovered: 'المسترجع',
    fieldExposure: 'التعرض الميداني',
    overdueExposure: 'التعرض المتأخر',
    materialHealth: 'سلامة المواد',
    damageRate: 'معدل التلف',
    wornRate: 'معدل التآكل',
    highRiskSites: 'مواقع عالية الخطورة',
    highRiskContractors: 'مقاولون عاليو الخطورة',
    highRiskMaterials: 'مواد عالية الخطورة',
    managementAttentionCount: 'عدد بنود اهتمام الإدارة',
    trendChartLabel: 'اتجاه النشر / الإرجاع (آخر 6 أشهر)',
    exportModalTitle: 'تصدير تقرير التحليلات',
    exportModalSubtitle: 'اختر مؤشرات الأداء المطلوب تضمينها في ملف PDF.',
    selectAll: 'تحديد الكل',
    clear: 'مسح',
    cancel: 'إلغاء',
    generatePdf: 'إنشاء PDF',
    requiresAttention: 'يتطلب المتابعة',
    language: 'اللغة',
  },
  fr: {
    dir: 'ltr',
    kpiAnalytics: 'Analyse des indicateurs clés',
    headerSubtitle:
      "Visibilité exécutive sur l'utilisation des matériaux, l'exposition des sites, la performance des sous-traitants et les risques opérationnels.",
    liveAnalytics: 'Analyses en temps réel',
    exportPdf: 'Exporter le rapport PDF',
    executiveInventoryPosition: 'POSITION EXÉCUTIVE DES STOCKS',
    managementAttention: 'Attention de la direction requise',
    reviewNote: 'nécessitent une revue',
    sitesLabel: 'sites',
    contractorsLabel: 'sous-traitants',
    materialsLabel: 'matériaux',
    trendTitle: 'TENDANCE DÉPLOIEMENT & RETOUR (6 DERNIERS MOIS)',
    noTrendData:
      "Aucun enregistrement daté de prêt/retour pour établir une tendance.",
    deployed: 'Déployé',
    returned: 'Retourné',
    damaged: 'Endommagé',
    overdue: 'En retard',
    returnedMaterialQuality: 'QUALITÉ DU MATÉRIEL RETOURNÉ',
    grossDeployed: 'Déploiement brut',
    recovered: 'Récupéré',
    fieldExposure: 'Exposition terrain',
    overdueExposure: 'Exposition en retard',
    materialHealth: 'État du matériel',
    damageRate: 'Taux de dommage',
    wornRate: "Taux d'usure",
    highRiskSites: 'Sites à haut risque',
    highRiskContractors: 'Sous-traitants à haut risque',
    highRiskMaterials: 'Matériaux à haut risque',
    managementAttentionCount: "Nombre d'alertes direction",
    trendChartLabel: 'Tendance déploiement / retour (6 derniers mois)',
    exportModalTitle: 'Exporter le rapport analytique',
    exportModalSubtitle:
      'Choisissez les indicateurs à inclure dans le PDF.',
    selectAll: 'Tout sélectionner',
    clear: 'Effacer',
    cancel: 'Annuler',
    generatePdf: 'Générer le PDF',
    requiresAttention: 'Nécessite une attention',
    language: 'Langue',
  },
};

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
];

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export default function AnalyticsPage({
  materials = [],
  contractors = [],
  loans = [],
  returns = [],
  getLoanRemainingQty,
  syncSystemData,
}) {
  const [language, setLanguage] = useState('en');
  const t = (key) =>
    (TRANSLATIONS[language] &&
      TRANSLATIONS[language][key]) ||
    TRANSLATIONS.en[key] ||
    key;
  const dir = TRANSLATIONS[language]?.dir || 'ltr';

  const [drillType, setDrillType] = useState(null);
  const [drillValue, setDrillValue] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState(null);

  const [reportSite, setReportSite] = useState('All');
  const [reportMaterial, setReportMaterial] = useState('All');
  const [reportContractor, setReportContractor] = useState('All');

  const [materialSearch, setMaterialSearch] = useState('');

  /* ==========================================================================
     SAFE LOAN REMAINING
  ========================================================================== */

  const remainingQty = (loan) => {
    try {
      if (typeof getLoanRemainingQty === 'function') {
        return Math.max(0, num(getLoanRemainingQty(loan.id)));
      }
    } catch (error) {
      // Fall back safely.
    }

    const returned = returns
      .filter((r) => num(r.loan_id) === num(loan.id))
      .reduce((sum, r) => sum + returnQty(r), 0);

    return Math.max(0, num(loan.quantity) - returned);
  };

  const isOverdue = (loan) =>
    Boolean(
      loan?.expected_return_date &&
        new Date(loan.expected_return_date) < new Date() &&
        remainingQty(loan) > 0
    );

  /* ==========================================================================
     DELETE RETURN
  ========================================================================== */

  const handleDeleteReturn = async (returnId) => {
    if (
      !window.confirm(
        'Delete this return record? The quantity restored to stock will be reversed and the loan may reopen.'
      )
    ) {
      return;
    }

    setDeletingId(returnId);
    setDeleteMsg(null);

    try {
      await axios.delete(`${API_BASE}/api/returns/${returnId}`);

      if (typeof syncSystemData === 'function') {
        await syncSystemData();
      }

      setDeleteMsg({
        type: 'success',
        text: 'Return deleted and reversed successfully.',
      });
    } catch (err) {
      setDeleteMsg({
        type: 'error',
        text:
          err.response?.data?.error ||
          'Failed to delete return.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  /* ==========================================================================
     GLOBAL INVENTORY / MOVEMENT KPIs
  ========================================================================== */

  const totalLoanedQty = useMemo(
    () => loans.reduce((sum, l) => sum + num(l.quantity), 0),
    [loans]
  );

  const totalReturnedQty = useMemo(
    () => returns.reduce((sum, r) => sum + returnQty(r), 0),
    [returns]
  );

  const totalRemainingQty = useMemo(
    () =>
      loans.reduce(
        (sum, loan) => sum + remainingQty(loan),
        0
      ),
    [loans, returns]
  );

  const totalOverdueQty = useMemo(
    () =>
      loans.reduce(
        (sum, loan) =>
          sum + (isOverdue(loan) ? remainingQty(loan) : 0),
        0
      ),
    [loans, returns]
  );

  const globalGoodQty = useMemo(
    () =>
      returns
        .filter((r) => r.returned_condition === 'Good')
        .reduce((sum, r) => sum + returnQty(r), 0),
    [returns]
  );

  const globalWornQty = useMemo(
    () =>
      returns
        .filter((r) => r.returned_condition === 'Worn')
        .reduce((sum, r) => sum + returnQty(r), 0),
    [returns]
  );

  const globalDamagedQty = useMemo(
    () =>
      returns
        .filter((r) => r.returned_condition === 'Damaged')
        .reduce((sum, r) => sum + returnQty(r), 0),
    [returns]
  );

  const globalConditionTotal =
    globalGoodQty +
    globalWornQty +
    globalDamagedQty;

  const globalRecoveryRate = pct(
    totalReturnedQty,
    totalLoanedQty
  );

  const globalDamageRate = pct(
    globalDamagedQty,
    globalConditionTotal
  );

  const globalWornRate = pct(
    globalWornQty,
    globalConditionTotal
  );

  const globalHealthRate = pct(
    globalGoodQty,
    globalConditionTotal
  );

  const overdueRate = pct(
    totalOverdueQty,
    totalRemainingQty
  );

  const unrecoveredRate = pct(
    totalRemainingQty,
    totalLoanedQty
  );

  /* ==========================================================================
     TREND OVER TIME (last 6 months)
     Deployed = loans grouped by their issue date
     Returned / Damaged = returns grouped by their return date
  ========================================================================== */

  const monthKey = (value) => {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, '0')}`;
  };

  const monthLabel = (key) => {
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    });
  };

  const trendData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );
      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`;
      months.push(key);
    }

    const buckets = {};
    months.forEach((key) => {
      buckets[key] = {
        month: monthLabel(key),
        deployed: 0,
        returned: 0,
        damaged: 0,
        overdue: 0,
      };
    });

    loans.forEach((loan) => {
      const key = monthKey(
        loan.loan_date ||
          loan.issue_date ||
          loan.created_at ||
          loan.start_date
      );
      if (key && buckets[key]) {
        buckets[key].deployed += num(loan.quantity);
      }
      if (isOverdue(loan)) {
        const overdueKey =
          monthKey(loan.expected_return_date) &&
          buckets[monthKey(loan.expected_return_date)]
            ? monthKey(loan.expected_return_date)
            : null;
        if (overdueKey) {
          buckets[overdueKey].overdue += remainingQty(
            loan
          );
        }
      }
    });

    returns.forEach((record) => {
      const key = monthKey(
        record.return_date || record.created_at
      );
      if (!key || !buckets[key]) return;
      const q = returnQty(record);
      buckets[key].returned += q;
      if (record.returned_condition === 'Damaged') {
        buckets[key].damaged += q;
      }
    });

    return months.map((key) => buckets[key]);
  }, [loans, returns]);

  const hasTrendData = trendData.some(
    (m) =>
      m.deployed > 0 ||
      m.returned > 0 ||
      m.damaged > 0
  );

  /* ==========================================================================
     PDF EXPORT — SELECTABLE KPI REPORT
  ========================================================================== */

  const EXPORT_KPI_CATALOG = [
    {
      id: 'gross_deployed',
      label: t('grossDeployed'),
      value: totalLoanedQty,
    },
    {
      id: 'recovered',
      label: t('recovered'),
      value: `${totalReturnedQty} (${globalRecoveryRate}%)`,
    },
    {
      id: 'field_exposure',
      label: t('fieldExposure'),
      value: `${totalRemainingQty} (${unrecoveredRate}%)`,
    },
    {
      id: 'overdue_exposure',
      label: t('overdueExposure'),
      value: `${totalOverdueQty} (${overdueRate}%)`,
    },
    {
      id: 'material_health',
      label: t('materialHealth'),
      value: `${globalHealthRate}%`,
    },
    {
      id: 'damage_rate',
      label: t('damageRate'),
      value: `${globalDamageRate}% (${globalDamagedQty})`,
    },
    {
      id: 'worn_rate',
      label: t('wornRate'),
      value: `${globalWornRate}%`,
    },
    {
      id: 'high_risk_sites',
      label: t('highRiskSites'),
      value: highRiskSites.length,
    },
    {
      id: 'high_risk_contractors',
      label: t('highRiskContractors'),
      value: highRiskContractors.length,
    },
    {
      id: 'high_risk_materials',
      label: t('highRiskMaterials'),
      value: highRiskMaterials.length,
    },
    {
      id: 'management_attention',
      label: t('managementAttentionCount'),
      value: managementAttention,
    },
    {
      id: 'trend_chart',
      label: t('trendChartLabel'),
      value: null,
      isTable: true,
    },
  ];

  const [showExportModal, setShowExportModal] = useState(
    false
  );
  const [selectedKpiIds, setSelectedKpiIds] = useState(
    EXPORT_KPI_CATALOG.map((k) => k.id)
  );

  const toggleKpiSelection = (id) => {
    setSelectedKpiIds((prev) =>
      prev.includes(id)
        ? prev.filter((k) => k !== id)
        : [...prev, id]
    );
  };

  const handleGeneratePdf = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTableModule = await import(
      'jspdf-autotable'
    );
    const autoTable = autoTableModule.default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Materials Analytics Report', 14, 18);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(120);
    doc.text(
      `Generated ${new Date().toLocaleString()}`,
      14,
      25
    );
    doc.setTextColor(0);

    let cursorY = 34;

    const selectedKpis = EXPORT_KPI_CATALOG.filter(
      (k) =>
        selectedKpiIds.includes(k.id) && !k.isTable
    );

    if (selectedKpis.length > 0) {
      autoTable(doc, {
        startY: cursorY,
        head: [['KPI', 'Value']],
        body: selectedKpis.map((k) => [
          k.label,
          String(k.value),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 10 },
      });
      cursorY = doc.lastAutoTable.finalY + 12;
    }

    if (
      selectedKpiIds.includes('trend_chart') &&
      hasTrendData
    ) {
      if (cursorY > 250) {
        doc.addPage();
        cursorY = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(
        'Deployment / Return Trend (last 6 months)',
        14,
        cursorY
      );
      cursorY += 6;

      autoTable(doc, {
        startY: cursorY,
        head: [
          ['Month', 'Deployed', 'Returned', 'Damaged', 'Overdue'],
        ],
        body: trendData.map((m) => [
          m.month,
          m.deployed,
          m.returned,
          m.damaged,
          m.overdue,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 10 },
      });
      cursorY = doc.lastAutoTable.finalY + 10;
    }

    doc.save(
      `analytics-report-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`
    );

    setShowExportModal(false);
  };

  /* ==========================================================================
     SITE ANALYTICS
  ========================================================================== */

  const siteStats = useMemo(() => {
    const grouped = {};

    loans.forEach((loan) => {
      const site = safeName(loan.site_name);

      if (!grouped[site]) {
        grouped[site] = {
          name: site,
          loaned: 0,
          returnedQty: 0,
          remaining: 0,
          overdue: 0,
          goodQty: 0,
          wornQty: 0,
          damagedQty: 0,
          loanIds: [],
          materialIds: new Set(),
          contractorIds: new Set(),
        };
      }

      grouped[site].loaned += num(loan.quantity);
      grouped[site].remaining += remainingQty(loan);
      grouped[site].loanIds.push(loan.id);

      if (loan.material_id !== undefined && loan.material_id !== null) {
        grouped[site].materialIds.add(String(loan.material_id));
      }

      if (
        loan.contractor_id !== undefined &&
        loan.contractor_id !== null
      ) {
        grouped[site].contractorIds.add(
          String(loan.contractor_id)
        );
      }

      if (isOverdue(loan)) {
        grouped[site].overdue += remainingQty(loan);
      }
    });

    returns.forEach((record) => {
      const loan = loans.find(
        (l) => num(l.id) === num(record.loan_id)
      );

      const site = safeName(
        record.site_name || loan?.site_name
      );

      if (!grouped[site]) {
        grouped[site] = {
          name: site,
          loaned: 0,
          returnedQty: 0,
          remaining: 0,
          overdue: 0,
          goodQty: 0,
          wornQty: 0,
          damagedQty: 0,
          loanIds: [],
          materialIds: new Set(),
          contractorIds: new Set(),
        };
      }

      const q = returnQty(record);

      grouped[site].returnedQty += q;

      if (record.returned_condition === 'Good') {
        grouped[site].goodQty += q;
      }

      if (record.returned_condition === 'Worn') {
        grouped[site].wornQty += q;
      }

      if (record.returned_condition === 'Damaged') {
        grouped[site].damagedQty += q;
      }
    });

    return Object.values(grouped)
      .map((site) => {
        const conditionTotal =
          site.goodQty +
          site.wornQty +
          site.damagedQty;

        const returnRate = pct(
          site.returnedQty,
          site.loaned
        );

        const recoveryRate = returnRate;

        const damageRate = pct(
          site.damagedQty,
          conditionTotal
        );

        const overdueRate = pct(
          site.overdue,
          site.remaining
        );

        const lossExposureRate = pct(
          site.remaining,
          site.loaned
        );

        const healthRate =
          conditionTotal > 0
            ? pct(site.goodQty, conditionTotal)
            : null;

        /*
          Site Risk Score

          35% unrecovered exposure
          25% overdue exposure
          25% damage rate
          15% poor recovery performance
        */
        const recoveryRisk =
          100 - recoveryRate;

        const riskScore = Math.round(
          clamp(
            lossExposureRate * 0.35 +
              overdueRate * 0.25 +
              damageRate * 0.25 +
              recoveryRisk * 0.15
          )
        );

        return {
          ...site,
          materialCount: site.materialIds.size,
          contractorCount: site.contractorIds.size,
          healthRate,
          returnRate,
          recoveryRate,
          damageRate,
          overdueRate,
          lossExposureRate,
          riskScore,
          risk: riskLabel(riskScore),
        };
      })
      .sort((a, b) => b.loaned - a.loaned);
  }, [loans, returns]);

  /* ==========================================================================
     CONTRACTOR ANALYTICS
  ========================================================================== */

  const contractorStats = useMemo(() => {
    return contractors
      .map((contractor) => {
        const cLoans = loans.filter(
          (loan) =>
            String(loan.contractor_id) ===
            String(contractor.id)
        );

        const loanIds = cLoans.map((loan) => loan.id);

        const loaned = cLoans.reduce(
          (sum, loan) => sum + num(loan.quantity),
          0
        );

        let returnedQty = 0;
        let goodQty = 0;
        let wornQty = 0;
        let damagedQty = 0;

        returns.forEach((record) => {
          if (loanIds.includes(num(record.loan_id))) {
            const q = returnQty(record);

            returnedQty += q;

            if (record.returned_condition === 'Good') {
              goodQty += q;
            }

            if (record.returned_condition === 'Worn') {
              wornQty += q;
            }

            if (record.returned_condition === 'Damaged') {
              damagedQty += q;
            }
          }
        });

        const stillOut = cLoans.reduce(
          (sum, loan) => sum + remainingQty(loan),
          0
        );

        const overdue = cLoans.reduce(
          (sum, loan) =>
            sum +
            (isOverdue(loan) ? remainingQty(loan) : 0),
          0
        );

        const conditionTotal =
          goodQty +
          wornQty +
          damagedQty;

        const returnRate = pct(
          returnedQty,
          loaned
        );

        const damageRate = pct(
          damagedQty,
          conditionTotal
        );

        const overdueRate = pct(
          overdue,
          stillOut
        );

        const lossExposureRate = pct(
          stillOut,
          loaned
        );

        const healthRate =
          conditionTotal > 0
            ? pct(goodQty, conditionTotal)
            : null;

        /*
          Contractor Risk Score

          35% outstanding exposure
          25% overdue exposure
          25% damage rate
          15% poor recovery
        */
        const recoveryRisk =
          100 - returnRate;

        const riskScore = Math.round(
          clamp(
            lossExposureRate * 0.35 +
              overdueRate * 0.25 +
              damageRate * 0.25 +
              recoveryRisk * 0.15
          )
        );

        return {
          ...contractor,
          loaned,
          returnedQty,
          stillOut,
          overdue,
          goodQty,
          wornQty,
          damagedQty,
          healthRate,
          returnRate,
          damageRate,
          overdueRate,
          lossExposureRate,
          riskScore,
          risk: riskLabel(riskScore),
          loanIds,
          sites: [
            ...new Set(
              cLoans
                .map((loan) => loan.site_name)
                .filter(Boolean)
            ),
          ],
        };
      })
      .sort((a, b) => b.loaned - a.loaned);
  }, [contractors, loans, returns]);

  /* ==========================================================================
     MATERIAL ANALYTICS
  ========================================================================== */

  const materialStats = useMemo(() => {
    const grouped = {};

    loans.forEach((loan) => {
      const id = String(
        loan.material_id ??
          loan.material_name ??
          'Unknown'
      );

      if (!grouped[id]) {
        grouped[id] = {
          id,
          materialId: loan.material_id,
          name: safeName(
            loan.material_name,
            'Unknown Material'
          ),
          issued: 0,
          returned: 0,
          active: 0,
          overdue: 0,
          good: 0,
          worn: 0,
          damaged: 0,
          sites: new Set(),
          contractors: new Set(),
          loanIds: [],
        };
      }

      grouped[id].issued += num(loan.quantity);
      grouped[id].active += remainingQty(loan);
      grouped[id].loanIds.push(loan.id);

      if (loan.site_name) {
        grouped[id].sites.add(loan.site_name);
      }

      if (loan.contractor_id !== undefined) {
        grouped[id].contractors.add(
          String(loan.contractor_id)
        );
      }

      if (isOverdue(loan)) {
        grouped[id].overdue += remainingQty(loan);
      }
    });

    returns.forEach((record) => {
      const id = String(
        record.material_id ??
          record.material_name ??
          'Unknown'
      );

      if (!grouped[id]) {
        grouped[id] = {
          id,
          materialId: record.material_id,
          name: safeName(
            record.material_name,
            'Unknown Material'
          ),
          issued: 0,
          returned: 0,
          active: 0,
          overdue: 0,
          good: 0,
          worn: 0,
          damaged: 0,
          sites: new Set(),
          contractors: new Set(),
          loanIds: [],
        };
      }

      const q = returnQty(record);

      grouped[id].returned += q;

      if (record.returned_condition === 'Good') {
        grouped[id].good += q;
      }

      if (record.returned_condition === 'Worn') {
        grouped[id].worn += q;
      }

      if (record.returned_condition === 'Damaged') {
        grouped[id].damaged += q;
      }

      if (record.site_name) {
        grouped[id].sites.add(record.site_name);
      }

      if (record.contact_person) {
        grouped[id].contractors.add(
          record.contact_person
        );
      }
    });

    return Object.values(grouped)
      .map((material) => {
        const conditionTotal =
          material.good +
          material.worn +
          material.damaged;

        const recoveryRate = pct(
          material.returned,
          material.issued
        );

        const damageRate = pct(
          material.damaged,
          conditionTotal
        );

        const overdueRate = pct(
          material.overdue,
          material.active
        );

        const lossExposureRate = pct(
          material.active,
          material.issued
        );

        const healthRate =
          conditionTotal > 0
            ? pct(material.good, conditionTotal)
            : null;

        const riskScore = Math.round(
          clamp(
            lossExposureRate * 0.35 +
              overdueRate * 0.25 +
              damageRate * 0.25 +
              (100 - recoveryRate) * 0.15
          )
        );

        return {
          ...material,
          siteCount: material.sites.size,
          contractorCount:
            material.contractors.size,
          recoveryRate,
          damageRate,
          overdueRate,
          lossExposureRate,
          healthRate,
          riskScore,
          risk: riskLabel(riskScore),
        };
      })
      .sort((a, b) => b.issued - a.issued);
  }, [loans, returns]);

  /* ==========================================================================
     MANAGEMENT ATTENTION
  ========================================================================== */

  const highRiskSites = siteStats.filter(
    (site) =>
      site.risk === 'HIGH' ||
      site.risk === 'CRITICAL'
  );

  const highRiskContractors = contractorStats.filter(
    (contractor) =>
      contractor.risk === 'HIGH' ||
      contractor.risk === 'CRITICAL'
  );

  const highRiskMaterials = materialStats.filter(
    (material) =>
      material.risk === 'HIGH' ||
      material.risk === 'CRITICAL'
  );

  const managementAttention =
    highRiskSites.length +
    highRiskContractors.length +
    highRiskMaterials.length;

  /* ==========================================================================
     TOP RANKINGS
  ========================================================================== */

  const topSitesByDeployment = [...siteStats]
    .sort((a, b) => b.loaned - a.loaned)
    .slice(0, 10);

  const topSitesByLoss = [...siteStats]
    .sort(
      (a, b) =>
        b.remaining - a.remaining
    )
    .slice(0, 10);

  const topSitesByDamage = [...siteStats]
    .filter((site) => site.returnedQty > 0)
    .sort(
      (a, b) =>
        b.damageRate - a.damageRate
    )
    .slice(0, 10);

  const topContractorsByRisk = [
    ...contractorStats,
  ]
    .sort(
      (a, b) =>
        b.riskScore - a.riskScore
    )
    .slice(0, 10);

  const topMaterialsByRisk = [
    ...materialStats,
  ]
    .sort(
      (a, b) =>
        b.riskScore - a.riskScore
    )
    .slice(0, 10);

  const topMaterialsByExposure = [
    ...materialStats,
  ]
    .sort(
      (a, b) =>
        b.active - a.active
    )
    .slice(0, 10);

  /* ==========================================================================
     FILTERED MATERIAL TABLE
  ========================================================================== */

  const filteredMaterials = materialStats.filter(
    (material) =>
      material.name
        .toLowerCase()
        .includes(
          materialSearch.toLowerCase()
        )
  );

  /* ==========================================================================
     DRILL-DOWN DATA
  ========================================================================== */

  const selectedSite =
    drillType === 'site'
      ? siteStats.find(
          (site) =>
            site.name === drillValue
        )
      : null;

  const selectedContractor =
    drillType === 'contractor'
      ? contractorStats.find(
          (contractor) =>
            String(contractor.id) ===
            String(drillValue)
        )
      : null;

  const siteLoanHistory = selectedSite
    ? loans
        .filter(
          (loan) =>
            safeName(loan.site_name) ===
            selectedSite.name
        )
        .map((loan) => {
          const loanReturns =
            returns.filter(
              (r) =>
                num(r.loan_id) ===
                num(loan.id)
            );

          const retQty =
            loanReturns.reduce(
              (sum, r) =>
                sum + returnQty(r),
              0
            );

          return {
            ...loan,
            retQty,
            remaining:
              remainingQty(loan),
            lReturns: loanReturns,
          };
        })
    : [];

  const siteReturnRecords = selectedSite
    ? returns.filter((record) => {
        const loan = loans.find(
          (l) =>
            num(l.id) ===
            num(record.loan_id)
        );

        return (
          safeName(
            record.site_name ||
              loan?.site_name
          ) === selectedSite.name
        );
      })
    : [];

  const contractorLoanHistory =
    selectedContractor
      ? loans
          .filter(
            (loan) =>
              String(loan.contractor_id) ===
              String(
                selectedContractor.id
              )
          )
          .map((loan) => {
            const loanReturns =
              returns.filter(
                (r) =>
                  num(r.loan_id) ===
                  num(loan.id)
              );

            const retQty =
              loanReturns.reduce(
                (sum, r) =>
                  sum + returnQty(r),
                0
              );

            return {
              ...loan,
              retQty,
              remaining:
                remainingQty(loan),
              lReturns: loanReturns,
            };
          })
      : [];

  const contractorReturnRecords =
    selectedContractor
      ? returns.filter((record) =>
          selectedContractor.loanIds.includes(
            num(record.loan_id)
          )
        )
      : [];

  const conditionRecords =
    drillType === 'condition'
      ? returns.filter(
          (record) =>
            record.returned_condition ===
            drillValue
        )
      : [];

  /* ==========================================================================
     SITE × MATERIAL MATRIX
  ========================================================================== */

  const siteMaterialMatrix = useMemo(() => {
    const matrix = {};

    loans.forEach((loan) => {
      const site = safeName(
        loan.site_name
      );

      const material = safeName(
        loan.material_name,
        'Unknown Material'
      );

      if (!matrix[site]) {
        matrix[site] = {};
      }

      matrix[site][material] =
        (matrix[site][material] || 0) +
        num(loan.quantity);
    });

    return matrix;
  }, [loans]);

  /* ==========================================================================
     REPORT GENERATOR
  ========================================================================== */

  const uniqueSites = [
    ...new Set(
      loans
        .map((loan) => loan.site_name)
        .filter(Boolean)
    ),
  ];

  const buildFilteredLoans = () =>
    loans.filter((loan) => {
      if (
        reportSite !== 'All' &&
        safeName(loan.site_name) !==
          reportSite
      ) {
        return false;
      }

      if (
        reportMaterial !== 'All' &&
        String(loan.material_id) !==
          String(reportMaterial)
      ) {
        return false;
      }

      if (
        reportContractor !== 'All' &&
        String(loan.contractor_id) !==
          String(reportContractor)
      ) {
        return false;
      }

      return true;
    });

  const buildFilteredReturns = () => {
    const filteredLoanIds = new Set(
      buildFilteredLoans().map(
        (loan) => loan.id
      )
    );

    return returns.filter((record) =>
      filteredLoanIds.has(
        num(record.loan_id)
      )
    );
  };

  const downloadReport = () => {
    const filteredLoans =
      buildFilteredLoans();

    const filteredReturns =
      buildFilteredReturns();

    const loanSheet = filteredLoans.map(
      (loan) => ({
        Material: loan.material_name,
        Contractor:
          loan.contact_person,
        Company:
          loan.company_name,
        Site:
          loan.site_name || '—',
        'Qty Loaned':
          loan.quantity,
        'Qty Remaining':
          remainingQty(loan),
        'Due Date':
          loan.expected_return_date ||
          '—',
        Status:
          remainingQty(loan) > 0
            ? isOverdue(loan)
              ? 'Overdue'
              : 'Active'
            : 'Closed',
      })
    );

    const returnSheet =
      filteredReturns.map(
        (record) => ({
          Material:
            record.material_name,
          Contractor:
            record.contact_person,
          Site:
            record.site_name ||
            '—',
          'Qty Returned':
            returnQty(record),
          Condition:
            record.returned_condition,
          'Return Date':
            record.return_date,
        })
      );

    const riskSheet =
      materialStats.map((material) => ({
        Material: material.name,
        'Issued Qty':
          material.issued,
        'Returned Qty':
          material.returned,
        'Active Qty':
          material.active,
        'Overdue Qty':
          material.overdue,
        'Damage Rate':
          `${material.damageRate}%`,
        'Recovery Rate':
          `${material.recoveryRate}%`,
        'Loss Exposure':
          `${material.lossExposureRate}%`,
        'Risk Score':
          material.riskScore,
        Risk:
          material.risk,
      }));

    const wb =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        loanSheet.length
          ? loanSheet
          : [{ Note: 'No matching loans' }]
      ),
      'Loans'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        returnSheet.length
          ? returnSheet
          : [{ Note: 'No matching returns' }]
      ),
      'Returns'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        riskSheet.length
          ? riskSheet
          : [{ Note: 'No material analytics' }]
      ),
      'Material Risk'
    );

    const parts = [];

    if (reportSite !== 'All') {
      parts.push(reportSite);
    }

    if (reportContractor !== 'All') {
      const contractor =
        contractors.find(
          (c) =>
            String(c.id) ===
            String(reportContractor)
        );

      if (contractor) {
        parts.push(
          contractor.company_name ||
            contractor.contact_person
        );
      }
    }

    if (reportMaterial !== 'All') {
      const material =
        materials.find(
          (m) =>
            String(m.id) ===
            String(reportMaterial)
        );

      if (material) {
        parts.push(material.name);
      }
    }

    const suffix = parts.length
      ? `_${parts
          .join('_')
          .replace(/\s+/g, '-')}`
      : '_All';

    XLSX.writeFile(
      wb,
      `Basirah_Analytics${suffix}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  /* ==========================================================================
     UI COMPONENTS
  ========================================================================== */

  const exitDrill = () => {
    setDrillType(null);
    setDrillValue(null);
  };

  const BackBtn = () => (
    <button
      onClick={exitDrill}
      style={{
        background: 'none',
        border: 'none',
        color: THEME.accentBlue,
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '20px',
        padding: 0,
      }}
    >
      <ChevronLeft size={16} />
      Back to Analytics
    </button>
  );

  const StatGrid = ({ stats }) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(155px, 1fr))',
        gap: '14px',
        marginBottom: '24px',
      }}
    >
      {stats.map((item) => (
        <div
          key={item.label}
          style={{
            ...STYLES.box,
            marginBottom: 0,
            padding: '17px',
          }}
        >
          <div style={STYLES.label}>
            {item.label}
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: '800',
              color:
                item.color ||
                THEME.textMain,
              marginTop: '4px',
            }}
          >
            {item.value}
          </div>

          {item.sub && (
            <div
              style={{
                fontSize: '11px',
                color: THEME.textMuted,
                marginTop: '4px',
              }}
            >
              {item.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const RiskBadge = ({ score }) => {
    const label = riskLabel(score);

    return BADGE(
      riskColor(score),
      label
    );
  };

  const DeleteReturnBtn = ({ id }) => (
    <button
      onClick={() =>
        handleDeleteReturn(id)
      }
      disabled={deletingId === id}
      style={{
        padding: '4px 10px',
        borderRadius: '5px',
        border: `1px solid ${THEME.accentCrimson}55`,
        backgroundColor: `${THEME.accentCrimson}10`,
        color: THEME.accentCrimson,
        fontSize: '11px',
        cursor:
          deletingId === id
            ? 'not-allowed'
            : 'pointer',
        fontWeight: '600',
        opacity:
          deletingId === id ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <Trash2 size={12} />
      {deletingId === id
        ? '...'
        : 'Delete'}
    </button>
  );

  const SectionHeader = ({
    icon,
    title,
    subtitle,
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
      }}
    >
      {icon}

      <div>
        <div
          style={{
            ...sectionTitleStyle,
            marginBottom: 0,
          }}
        >
          {title}
        </div>

        {subtitle && (
          <div
            style={{
              color: THEME.textMuted,
              fontSize: '11px',
              marginTop: '3px',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  /* ==========================================================================
     CONDITION CARDS
  ========================================================================== */

  const ConditionOverviewCards = ({
    good,
    worn,
    damaged,
    total,
  }) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(3, 1fr)',
        gap: '14px',
        marginBottom: '24px',
      }}
    >
      {[
        {
          label: 'Good',
          qty: good,
          color:
            CONDITION_COLORS.Good,
        },
        {
          label: 'Worn',
          qty: worn,
          color:
            CONDITION_COLORS.Worn,
        },
        {
          label: 'Damaged',
          qty: damaged,
          color:
            CONDITION_COLORS.Damaged,
        },
      ].map((condition) => {
        const percentage = pct(
          condition.qty,
          total
        );

        return (
          <div
            key={condition.label}
            onClick={() => {
              setDrillType(
                'condition'
              );
              setDrillValue(
                condition.label
              );
            }}
            style={{
              ...STYLES.box,
              marginBottom: 0,
              padding: '18px',
              cursor: 'pointer',
              border: `1px solid ${condition.color}44`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
              }}
            >
              <div style={STYLES.label}>
                {condition.label} Returns
              </div>

              <ChevronRight
                size={14}
                color={THEME.textMuted}
              />
            </div>

            <div
              style={{
                fontSize: '28px',
                fontWeight: '800',
                color: condition.color,
              }}
            >
              {percentage}%
            </div>

            <div
              style={{
                fontSize: '12px',
                color: THEME.textMuted,
              }}
            >
              {condition.qty} units
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ==========================================================================
     DRILL VIEW: CONDITION
  ========================================================================== */

  if (drillType === 'condition') {
    return (
      <div>
        <BackBtn />

        <h2
          style={{
            fontSize: '22px',
            fontWeight: '700',
            marginBottom: '6px',
          }}
        >
          Returns marked:{' '}
          {drillValue}
        </h2>

        <p
          style={{
            color: THEME.textMuted,
            fontSize: '13px',
            marginBottom: '24px',
          }}
        >
          {
            conditionRecords.length
          }{' '}
          records ·{' '}
          {conditionRecords.reduce(
            (sum, r) =>
              sum + returnQty(r),
            0
          )}{' '}
          units total
        </p>

        {deleteMsg && (
          <div
            style={{
              ...msgStyle(
                deleteMsg.type
              ),
              marginBottom: '16px',
            }}
          >
            {deleteMsg.text}
          </div>
        )}

        <div style={STYLES.box}>
          <table style={STYLES.table}>
            <thead>
              <tr>
                <th style={STYLES.th}>
                  Material
                </th>
                <th style={STYLES.th}>
                  Contractor
                </th>
                <th style={STYLES.th}>
                  Site
                </th>
                <th style={STYLES.th}>
                  Qty Returned
                </th>
                <th style={STYLES.th}>
                  Return Date
                </th>
                <th style={STYLES.th}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {conditionRecords.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      ...STYLES.td,
                      textAlign:
                        'center',
                      color:
                        THEME.textMuted,
                    }}
                  >
                    No records
                  </td>
                </tr>
              ) : (
                conditionRecords.map(
                  (record) => (
                    <tr
                      key={record.id}
                    >
                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          record.material_name
                        }
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          record.contact_person
                        }
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          record.site_name ||
                          '—'
                        }
                      </td>

                      <td
                        style={{
                          ...STYLES.td,
                          fontWeight:
                            '700',
                        }}
                      >
                        {returnQty(
                          record
                        )}
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          record.return_date ||
                          '—'
                        }
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        <DeleteReturnBtn
                          id={
                            record.id
                          }
                        />
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     DRILL VIEW: SITE
  ========================================================================== */

  if (
    drillType === 'site' &&
    !selectedSite
  ) {
    return (
      <div>
        <BackBtn />
        <p style={{ color: THEME.textMuted, fontSize: '13px' }}>
          No site data found for "{String(drillValue)}".
        </p>
      </div>
    );
  }

  if (
    drillType === 'site' &&
    selectedSite
  ) {
    return (
      <div>
        <BackBtn />

        <h2
          style={{
            fontSize: '22px',
            fontWeight: '700',
            marginBottom: '6px',
          }}
        >
          Site:{' '}
          {selectedSite.name}
        </h2>

        <p
          style={{
            color: THEME.textMuted,
            fontSize: '13px',
            marginBottom: '24px',
          }}
        >
          Site utilization,
          material exposure,
          overdue activity and
          return-condition analysis
        </p>

        <StatGrid
          stats={[
            {
              label: 'Deployed',
              value:
                selectedSite.loaned,
              color:
                THEME.accentBlue,
            },
            {
              label: 'Returned',
              value:
                selectedSite.returnedQty,
              color:
                THEME.accentEmerald,
            },
            {
              label: 'Currently Out',
              value:
                selectedSite.remaining,
              color:
                THEME.accentAmber,
            },
            {
              label: 'Overdue',
              value:
                selectedSite.overdue,
              color:
                THEME.accentCrimson,
            },
            {
              label: 'Recovery',
              value: `${selectedSite.recoveryRate}%`,
              color:
                THEME.accentPurple,
            },
            {
              label: 'Damage Rate',
              value: `${selectedSite.damageRate}%`,
              color:
                selectedSite.damageRate >
                20
                  ? THEME.accentCrimson
                  : THEME.accentEmerald,
            },
            {
              label: 'Risk Score',
              value:
                selectedSite.riskScore,
              color:
                riskColor(
                  selectedSite.riskScore
                ),
              sub:
                selectedSite.risk,
            },
            {
              label: 'Materials Used',
              value:
                selectedSite.materialCount,
              color:
                THEME.accentCyan,
            },
          ]}
        />

        <div
          style={{
            ...STYLES.box,
            marginBottom: '20px',
          }}
        >
          <SectionHeader
            icon={
              <ShieldAlert
                size={17}
                color={riskColor(
                  selectedSite.riskScore
                )}
              />
            }
            title="Site Risk Assessment"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            <div>
              <div
                style={STYLES.label}
              >
                Risk Level
              </div>
              <RiskBadge
                score={
                  selectedSite.riskScore
                }
              />
            </div>

            <div>
              <div
                style={STYLES.label}
              >
                Unrecovered Exposure
              </div>
              <strong>
                {
                  selectedSite.remaining
                }{' '}
                units
              </strong>
            </div>

            <div>
              <div
                style={STYLES.label}
              >
                Overdue Exposure
              </div>
              <strong
                style={{
                  color:
                    selectedSite.overdue >
                    0
                      ? THEME.accentCrimson
                      : THEME.textMain,
                }}
              >
                {
                  selectedSite.overdue
                }{' '}
                units
              </strong>
            </div>

            <div>
              <div
                style={STYLES.label}
              >
                Contractors
              </div>
              <strong>
                {
                  selectedSite.contractorCount
                }
              </strong>
            </div>
          </div>
        </div>

        {deleteMsg && (
          <div
            style={{
              ...msgStyle(
                deleteMsg.type
              ),
              marginBottom: '16px',
            }}
          >
            {deleteMsg.text}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '2fr 1fr',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={STYLES.box}>
            <div style={sectionTitleStyle}>
              Material Loan History
            </div>

            <div
              style={{
                overflowX: 'auto',
              }}
            >
              <table
                style={STYLES.table}
              >
                <thead>
                  <tr>
                    <th
                      style={STYLES.th}
                    >
                      Material
                    </th>
                    <th
                      style={STYLES.th}
                    >
                      Contractor
                    </th>
                    <th
                      style={STYLES.th}
                    >
                      Qty
                    </th>
                    <th
                      style={STYLES.th}
                    >
                      Returned
                    </th>
                    <th
                      style={STYLES.th}
                    >
                      Remaining
                    </th>
                    <th
                      style={STYLES.th}
                    >
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {siteLoanHistory.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          ...STYLES.td,
                          textAlign:
                            'center',
                          color:
                            THEME.textMuted,
                        }}
                      >
                        No loans
                      </td>
                    </tr>
                  ) : (
                    siteLoanHistory.map(
                      (loan) => {
                        const overdue =
                          isOverdue(
                            loan
                          );

                        return (
                          <tr
                            key={
                              loan.id
                            }
                          >
                            <td
                              style={
                                STYLES.td
                              }
                            >
                              {
                                loan.material_name
                              }
                            </td>

                            <td
                              style={
                                STYLES.td
                              }
                            >
                              {
                                loan.contact_person
                              }
                            </td>

                            <td
                              style={
                                STYLES.td
                              }
                            >
                              {
                                loan.quantity
                              }
                            </td>

                            <td
                              style={
                                STYLES.td
                              }
                            >
                              {
                                loan.retQty
                              }
                            </td>

                            <td
                              style={
                                STYLES.td
                              }
                            >
                              {
                                loan.remaining
                              }
                            </td>

                            <td
                              style={
                                STYLES.td
                              }
                            >
                              {loan.remaining >
                              0
                                ? BADGE(
                                    overdue
                                      ? THEME.accentCrimson
                                      : THEME.accentAmber,
                                    overdue
                                      ? 'OVERDUE'
                                      : 'OUT'
                                  )
                                : BADGE(
                                    THEME.accentEmerald,
                                    'CLOSED'
                                  )}
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={STYLES.box}>
            <div style={sectionTitleStyle}>
              Return Condition
            </div>

            {selectedSite.returnedQty >
            0 ? (
              <div
                style={{
                  height: 230,
                }}
              >
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: 'Good',
                          value:
                            selectedSite.goodQty,
                        },
                        {
                          name: 'Worn',
                          value:
                            selectedSite.wornQty,
                        },
                        {
                          name: 'Damaged',
                          value:
                            selectedSite.damagedQty,
                        },
                      ].filter(
                        (x) =>
                          x.value > 0
                      )}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell
                        fill={
                          CONDITION_COLORS.Good
                        }
                      />
                      <Cell
                        fill={
                          CONDITION_COLORS.Worn
                        }
                      />
                      <Cell
                        fill={
                          CONDITION_COLORS.Damaged
                        }
                      />
                    </Pie>

                    <Tooltip
                      contentStyle={
                        chartTooltipStyle
                      }
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div
                style={{
                  color:
                    THEME.textMuted,
                  fontSize: '13px',
                  padding:
                    '20px 0',
                }}
              >
                No returns yet.
              </div>
            )}
          </div>
        </div>

        <div style={STYLES.box}>
          <div
            style={sectionTitleStyle}
          >
            Individual Return Records (
            {
              siteReturnRecords.length
            }
            )
          </div>

          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table style={STYLES.table}>
              <thead>
                <tr>
                  <th
                    style={STYLES.th}
                  >
                    Material
                  </th>
                  <th
                    style={STYLES.th}
                  >
                    Contractor
                  </th>
                  <th
                    style={STYLES.th}
                  >
                    Qty
                  </th>
                  <th
                    style={STYLES.th}
                  >
                    Condition
                  </th>
                  <th
                    style={STYLES.th}
                  >
                    Date
                  </th>
                  <th
                    style={STYLES.th}
                  />
                </tr>
              </thead>

              <tbody>
                {siteReturnRecords.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        ...STYLES.td,
                        textAlign:
                          'center',
                        color:
                          THEME.textMuted,
                      }}
                    >
                      No returns yet
                    </td>
                  </tr>
                ) : (
                  siteReturnRecords.map(
                    (record) => (
                      <tr
                        key={
                          record.id
                        }
                      >
                        <td
                          style={
                            STYLES.td
                          }
                        >
                          {
                            record.material_name
                          }
                        </td>

                        <td
                          style={
                            STYLES.td
                          }
                        >
                          {
                            record.contact_person
                          }
                        </td>

                        <td
                          style={{
                            ...STYLES.td,
                            fontWeight:
                              '700',
                          }}
                        >
                          {returnQty(
                            record
                          )}
                        </td>

                        <td
                          style={
                            STYLES.td
                          }
                        >
                          {BADGE(
                            CONDITION_COLORS[
                              record.returned_condition
                            ] ||
                              THEME.textMuted,
                            record.returned_condition ||
                              '—'
                          )}
                        </td>

                        <td
                          style={
                            STYLES.td
                          }
                        >
                          {
                            record.return_date ||
                            '—'
                          }
                        </td>

                        <td
                          style={
                            STYLES.td
                          }
                        >
                          <DeleteReturnBtn
                            id={
                              record.id
                            }
                          />
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     DRILL VIEW: CONTRACTOR
  ========================================================================== */

  if (
    drillType === 'contractor' &&
    !selectedContractor
  ) {
    return (
      <div>
        <BackBtn />
        <p style={{ color: THEME.textMuted, fontSize: '13px' }}>
          No contractor data found for "{String(drillValue)}".
        </p>
      </div>
    );
  }

  if (
    drillType === 'contractor' &&
    selectedContractor
  ) {
    return (
      <div>
        <BackBtn />

        <h2
          style={{
            fontSize: '22px',
            fontWeight: '700',
            marginBottom: '6px',
          }}
        >
          {
            selectedContractor.contact_person
          }{' '}
          —{' '}
          {
            selectedContractor.company_name
          }
        </h2>

        <p
          style={{
            color: THEME.textMuted,
            fontSize: '13px',
            marginBottom: '24px',
          }}
        >
          Sites:{' '}
          {selectedContractor.sites.join(
            ', '
          ) || 'None'}
        </p>

        <StatGrid
          stats={[
            {
              label: 'Issued',
              value:
                selectedContractor.loaned,
              color:
                THEME.accentBlue,
            },
            {
              label: 'Returned',
              value:
                selectedContractor.returnedQty,
              color:
                THEME.accentEmerald,
            },
            {
              label: 'Still Out',
              value:
                selectedContractor.stillOut,
              color:
                THEME.accentAmber,
            },
            {
              label: 'Overdue',
              value:
                selectedContractor.overdue,
              color:
                THEME.accentCrimson,
            },
            {
              label: 'Recovery',
              value: `${selectedContractor.returnRate}%`,
              color:
                THEME.accentPurple,
            },
            {
              label: 'Damage Rate',
              value: `${selectedContractor.damageRate}%`,
              color:
                selectedContractor.damageRate >
                20
                  ? THEME.accentCrimson
                  : THEME.accentEmerald,
            },
            {
              label: 'Risk Score',
              value:
                selectedContractor.riskScore,
              color:
                riskColor(
                  selectedContractor.riskScore
                ),
              sub:
                selectedContractor.risk,
            },
            {
              label: 'Sites',
              value:
                selectedContractor.sites
                  .length,
              color:
                THEME.accentCyan,
            },
          ]}
        />

        <div
          style={{
            ...STYLES.box,
            marginBottom: '20px',
          }}
        >
          <SectionHeader
            icon={
              <ShieldAlert
                size={17}
                color={riskColor(
                  selectedContractor.riskScore
                )}
              />
            }
            title="Contractor Risk Assessment"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            <div>
              <div
                style={STYLES.label}
              >
                Risk Level
              </div>

              <RiskBadge
                score={
                  selectedContractor.riskScore
                }
              />
            </div>

            <div>
              <div
                style={STYLES.label}
              >
                Unrecovered
              </div>

              <strong>
                {
                  selectedContractor.stillOut
                }{' '}
                units
              </strong>
            </div>

            <div>
              <div
                style={STYLES.label}
              >
                Overdue
              </div>

              <strong
                style={{
                  color:
                    selectedContractor.overdue >
                    0
                      ? THEME.accentCrimson
                      : THEME.textMain,
                }}
              >
                {
                  selectedContractor.overdue
                }{' '}
                units
              </strong>
            </div>

            <div>
              <div
                style={STYLES.label}
              >
                Damaged
              </div>

              <strong
                style={{
                  color:
                    selectedContractor.damagedQty >
                    0
                      ? THEME.accentCrimson
                      : THEME.textMain,
                }}
              >
                {
                  selectedContractor.damagedQty
                }{' '}
                units
              </strong>
            </div>
          </div>
        </div>

        {deleteMsg && (
          <div
            style={{
              ...msgStyle(
                deleteMsg.type
              ),
              marginBottom: '16px',
            }}
          >
            {deleteMsg.text}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '2fr 1fr',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={STYLES.box}>
            <div style={sectionTitleStyle}>
              Contractor Loan History
            </div>

            <div
              style={{
                overflowX: 'auto',
              }}
            >
              <table style={STYLES.table}>
                <thead>
                  <tr>
                    <th
                      style={STYLES.th}
                    >
                      Material
                    </th>
                    <th
                      style={STYLES.th}
                    >
                      Site
                    </th>
                    <th
                      style={STYLES.th}
                    >
                      Qty
                    </th>
                    <th
                      style={STYLES.th}
                    >
                      Returned
                    </th>
                    <th
                      style={STYLES.th}
                    >
                      Remaining
                    </th>
                    <th
                      style={STYLES.th}
                    >
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {contractorLoanHistory.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          ...STYLES.td,
                          textAlign:
                            'center',
                          color:
                            THEME.textMuted,
                        }}
                      >
                        No history
                      </td>
                    </tr>
                  ) : (
                    contractorLoanHistory.map(
                      (loan) => (
                        <tr
                          key={
                            loan.id
                          }
                        >
                          <td
                            style={
                              STYLES.td
                            }
                          >
                            {
                              loan.material_name
                            }
                          </td>

                          <td
                            style={
                              STYLES.td
                            }
                          >
                            {
                              loan.site_name ||
                              '—'
                            }
                          </td>

                          <td
                            style={
                              STYLES.td
                            }
                          >
                            {
                              loan.quantity
                            }
                          </td>

                          <td
                            style={
                              STYLES.td
                            }
                          >
                            {
                              loan.retQty
                            }
                          </td>

                          <td
                            style={
                              STYLES.td
                            }
                          >
                            {
                              loan.remaining
                            }
                          </td>

                          <td
                            style={
                              STYLES.td
                            }
                          >
                            {loan.remaining >
                            0
                              ? BADGE(
                                  isOverdue(
                                    loan
                                  )
                                    ? THEME.accentCrimson
                                    : THEME.accentAmber,
                                  isOverdue(
                                    loan
                                  )
                                    ? 'OVERDUE'
                                    : 'OUT'
                                )
                              : BADGE(
                                  THEME.accentEmerald,
                                  'CLOSED'
                                )}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={STYLES.box}>
            <div style={sectionTitleStyle}>
              Return Condition
            </div>

            {selectedContractor.returnedQty >
            0 ? (
              <div
                style={{
                  height: 230,
                }}
              >
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: 'Good',
                          value:
                            selectedContractor.goodQty,
                        },
                        {
                          name: 'Worn',
                          value:
                            selectedContractor.wornQty,
                        },
                        {
                          name: 'Damaged',
                          value:
                            selectedContractor.damagedQty,
                        },
                      ].filter(
                        (x) =>
                          x.value > 0
                      )}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell
                        fill={
                          CONDITION_COLORS.Good
                        }
                      />
                      <Cell
                        fill={
                          CONDITION_COLORS.Worn
                        }
                      />
                      <Cell
                        fill={
                          CONDITION_COLORS.Damaged
                        }
                      />
                    </Pie>

                    <Tooltip
                      contentStyle={
                        chartTooltipStyle
                      }
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div
                style={{
                  color:
                    THEME.textMuted,
                  fontSize: '13px',
                  padding:
                    '20px 0',
                }}
              >
                No returns yet.
              </div>
            )}
          </div>
        </div>

        <div style={STYLES.box}>
          <div
            style={sectionTitleStyle}
          >
            Individual Return Records (
            {
              contractorReturnRecords.length
            }
            )
          </div>

          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table style={STYLES.table}>
              <thead>
                <tr>
                  <th
                    style={STYLES.th}
                  >
                    Material
                  </th>
                  <th
                    style={STYLES.th}
                  >
                    Site
                  </th>
                  <th
                    style={STYLES.th}
                  >
                    Qty
                  </th>
                  <th
                    style={STYLES.th}
                  >
                    Condition
                  </th>
                  <th
                    style={STYLES.th}
                  >
                    Date
                  </th>
                  <th
                    style={STYLES.th}
                  />
                </tr>
              </thead>

              <tbody>
                {contractorReturnRecords.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        ...STYLES.td,
                        textAlign:
                          'center',
                        color:
                          THEME.textMuted,
                      }}
                    >
                      No returns yet
                    </td>
                  </tr>
                ) : (
                  contractorReturnRecords.map(
                    (record) => (
                      <tr
                        key={
                          record.id
                        }
                      >
                        <td
                          style={
                            STYLES.td
                          }
                        >
                          {
                            record.material_name
                          }
                        </td>

                        <td
                          style={
                            STYLES.td
                          }
                        >
                          {
                            record.site_name ||
                            '—'
                          }
                        </td>

                        <td
                          style={{
                            ...STYLES.td,
                            fontWeight:
                              '700',
                          }}
                        >
                          {returnQty(
                            record
                          )}
                        </td>

                        <td
                          style={
                            STYLES.td
                          }
                        >
                          {BADGE(
                            CONDITION_COLORS[
                              record.returned_condition
                            ] ||
                              THEME.textMuted,
                            record.returned_condition ||
                              '—'
                          )}
                        </td>

                        <td
                          style={
                            STYLES.td
                          }
                        >
                          {
                            record.return_date ||
                            '—'
                          }
                        </td>

                        <td
                          style={
                            STYLES.td
                          }
                        >
                          <DeleteReturnBtn
                            id={
                              record.id
                            }
                          />
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     MAIN ANALYTICS PAGE
  ========================================================================== */

  return (
    <div dir={dir}>
      {/* ======================================================================
         HEADER
      ====================================================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '800',
              marginBottom: '6px',
            }}
          >
            {t('kpiAnalytics')}
          </h2>

          <p
            style={{
              color: THEME.textMuted,
              fontSize: '13px',
              margin: 0,
              maxWidth: '520px',
            }}
          >
            {t('headerSubtitle')}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <select
            value={language}
            onChange={(e) =>
              setLanguage(e.target.value)
            }
            aria-label={t('language')}
            style={{
              padding: '7px 10px',
              borderRadius: '8px',
              border: `1px solid ${THEME.border}`,
              backgroundColor: THEME.cardBg,
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option
                key={opt.code}
                value={opt.code}
              >
                {opt.label}
              </option>
            ))}
          </select>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: THEME.textMuted,
            }}
          >
            <Activity size={14} />
            {t('liveAnalytics')}
          </div>

          <button
            onClick={() =>
              setShowExportModal(true)
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1px solid ${THEME.border}`,
              backgroundColor: THEME.cardBg,
              color: '#fff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            {t('exportPdf')}
          </button>
        </div>
      </div>

      {showExportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() =>
            setShowExportModal(false)
          }
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              ...STYLES.box,
              width: '420px',
              maxHeight: '80vh',
              overflowY: 'auto',
              backgroundColor:
                THEME.cardBg,
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: '800',
                marginBottom: '4px',
              }}
            >
              {t('exportModalTitle')}
            </div>

            <div
              style={{
                fontSize: '12px',
                color: THEME.textMuted,
                marginBottom: '16px',
              }}
            >
              {t('exportModalSubtitle')}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginBottom: '10px',
                fontSize: '11px',
              }}
            >
              <span
                style={{
                  cursor: 'pointer',
                  color: THEME.accentBlue,
                }}
                onClick={() =>
                  setSelectedKpiIds(
                    EXPORT_KPI_CATALOG.map(
                      (k) => k.id
                    )
                  )
                }
              >
                {t('selectAll')}
              </span>
              <span
                style={{
                  cursor: 'pointer',
                  color: THEME.textMuted,
                }}
                onClick={() =>
                  setSelectedKpiIds([])
                }
              >
                {t('clear')}
              </span>
            </div>

            {EXPORT_KPI_CATALOG.map((k) => (
              <label
                key={k.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${THEME.border}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedKpiIds.includes(
                    k.id
                  )}
                  onChange={() =>
                    toggleKpiSelection(k.id)
                  }
                />
                <span>{k.label}</span>
                {!k.isTable && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      color: THEME.textMuted,
                      fontSize: '12px',
                    }}
                  >
                    {String(k.value)}
                  </span>
                )}
              </label>
            ))}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '18px',
              }}
            >
              <button
                onClick={() =>
                  setShowExportModal(false)
                }
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${THEME.border}`,
                  backgroundColor: 'transparent',
                  color: THEME.textMuted,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {t('cancel')}
              </button>

              <button
                onClick={handleGeneratePdf}
                disabled={
                  selectedKpiIds.length === 0
                }
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor:
                    THEME.accentBlue,
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor:
                    selectedKpiIds.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    selectedKpiIds.length === 0
                      ? 0.5
                      : 1,
                }}
              >
                {t('generatePdf')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
         EXECUTIVE KPI LAYER
      ====================================================================== */}

      <div style={sectionTitleStyle}>
        {t('executiveInventoryPosition')}
      </div>

      <StatGrid
        stats={[
          {
            label: t('grossDeployed'),
            value: totalLoanedQty,
            color:
              THEME.accentBlue,
            sub: 'Total quantity issued',
          },
          {
            label: t('recovered'),
            value: totalReturnedQty,
            color:
              THEME.accentEmerald,
            sub: `${globalRecoveryRate}%`,
          },
          {
            label: t('fieldExposure'),
            value: totalRemainingQty,
            color:
              THEME.accentAmber,
            sub: `${unrecoveredRate}%`,
          },
          {
            label: t('overdueExposure'),
            value: totalOverdueQty,
            color:
              THEME.accentCrimson,
            sub: `${overdueRate}%`,
          },
          {
            label: t('materialHealth'),
            value: `${globalHealthRate}%`,
            color:
              globalHealthRate >= 80
                ? THEME.accentEmerald
                : THEME.accentAmber,
            sub: '',
          },
          {
            label: t('damageRate'),
            value: `${globalDamageRate}%`,
            color:
              globalDamageRate > 20
                ? THEME.accentCrimson
                : THEME.accentEmerald,
            sub: `${globalDamagedQty}`,
          },
          {
            label: t('highRiskSites'),
            value:
              highRiskSites.length,
            color:
              highRiskSites.length > 0
                ? THEME.accentCrimson
                : THEME.accentEmerald,
            sub: t('requiresAttention'),
          },
          {
            label: t('highRiskContractors'),
            value:
              highRiskContractors.length,
            color:
              highRiskContractors.length >
              0
                ? THEME.accentCrimson
                : THEME.accentEmerald,
            sub: t('requiresAttention'),
          },
        ]}
      />

      {/* ======================================================================
         MANAGEMENT ATTENTION
      ====================================================================== */}

      <div
        style={{
          ...STYLES.box,
          marginBottom: '24px',
          border: `1px solid ${
            managementAttention > 0
              ? THEME.accentCrimson
              : THEME.accentEmerald
          }44`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                backgroundColor:
                  managementAttention >
                  0
                    ? `${THEME.accentCrimson}18`
                    : `${THEME.accentEmerald}18`,
              }}
            >
              {managementAttention >
              0 ? (
                <AlertTriangle
                  size={19}
                  color={
                    THEME.accentCrimson
                  }
                />
              ) : (
                <Activity
                  size={19}
                  color={
                    THEME.accentEmerald
                  }
                />
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '800',
                }}
              >
                {t('managementAttention')}
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: THEME.textMuted,
                  marginTop: '3px',
                }}
              >
                {
                  highRiskSites.length
                }{' '}
                {t('sitesLabel')} ·{' '}
                {
                  highRiskContractors.length
                }{' '}
                {t('contractorsLabel')} ·{' '}
                {
                  highRiskMaterials.length
                }{' '}
                {t('materialsLabel')}{' '}
                {t('reviewNote')}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: '900',
              color:
                managementAttention >
                0
                  ? THEME.accentCrimson
                  : THEME.accentEmerald,
            }}
          >
            {managementAttention}
          </div>
        </div>
      </div>

      {/* ======================================================================
         DEPLOYMENT / RETURN TREND
      ====================================================================== */}

      <div style={sectionTitleStyle}>
        {t('trendTitle')}
      </div>

      <div
        style={{
          ...STYLES.box,
          marginBottom: '24px',
        }}
      >
        {!hasTrendData ? (
          <div
            style={{
              padding: '30px',
              textAlign: 'center',
              color: THEME.textMuted,
              fontSize: '13px',
            }}
          >
            {t('noTrendData')}
          </div>
        ) : (
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={THEME.border}
                />
                <XAxis
                  dataKey="month"
                  stroke={THEME.textMuted}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke={THEME.textMuted}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={
                    chartTooltipStyle
                  }
                />
                <Legend
                  wrapperStyle={{
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="deployed"
                  name={t('deployed')}
                  stroke={THEME.accentBlue}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="returned"
                  name={t('returned')}
                  stroke={THEME.accentEmerald}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="damaged"
                  name={t('damaged')}
                  stroke={THEME.accentCrimson}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="overdue"
                  name={t('overdue')}
                  stroke={THEME.accentAmber}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ======================================================================
         RETURN CONDITION
      ====================================================================== */}

      <div style={sectionTitleStyle}>
        {t('returnedMaterialQuality')}
      </div>

      <ConditionOverviewCards
        good={globalGoodQty}
        worn={globalWornQty}
        damaged={globalDamagedQty}
        total={globalConditionTotal}
      />

      {/* ======================================================================
         SITE INTELLIGENCE
      ====================================================================== */}

      <div style={STYLES.box}>
        <SectionHeader
          icon={
            <MapPin
              size={17}
              color={THEME.accentAmber}
            />
          }
          title="Site Material Control Performance"
          subtitle="Identify where materials are being deployed, retained, damaged or becoming overdue."
        />

        <div
          style={{
            overflowX: 'auto',
          }}
        >
          <table style={STYLES.table}>
            <thead>
              <tr>
                <th style={STYLES.th}>
                  Site
                </th>
                <th style={STYLES.th}>
                  Deployed
                </th>
                <th style={STYLES.th}>
                  Active
                </th>
                <th style={STYLES.th}>
                  Returned
                </th>
                <th style={STYLES.th}>
                  Overdue
                </th>
                <th style={STYLES.th}>
                  Recovery %
                </th>
                <th style={STYLES.th}>
                  Damage %
                </th>
                <th style={STYLES.th}>
                  Loss Exposure
                </th>
                <th style={STYLES.th}>
                  Risk
                </th>
                <th style={STYLES.th} />
              </tr>
            </thead>

            <tbody>
              {siteStats.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      ...STYLES.td,
                      textAlign:
                        'center',
                      color:
                        THEME.textMuted,
                    }}
                  >
                    No site data yet.
                  </td>
                </tr>
              ) : (
                siteStats.map(
                  (site) => (
                    <tr
                      key={
                        site.name
                      }
                      style={{
                        cursor:
                          'pointer',
                      }}
                      onClick={() => {
                        setDrillType(
                          'site'
                        );
                        setDrillValue(
                          site.name
                        );
                      }}
                    >
                      <td
                        style={
                          STYLES.td
                        }
                      >
                        <strong>
                          {
                            site.name
                          }
                        </strong>
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {site.loaned}
                      </td>

                      <td
                        style={{
                          ...STYLES.td,
                          color:
                            site.remaining >
                            0
                              ? THEME.accentAmber
                              : THEME.textMain,
                          fontWeight:
                            site.remaining >
                            0
                              ? '700'
                              : '400',
                        }}
                      >
                        {
                          site.remaining
                        }
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          site.returnedQty
                        }
                      </td>

                      <td
                        style={{
                          ...STYLES.td,
                          color:
                            site.overdue >
                            0
                              ? THEME.accentCrimson
                              : THEME.textMain,
                          fontWeight:
                            site.overdue >
                            0
                              ? '700'
                              : '400',
                        }}
                      >
                        {site.overdue}
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {site.recoveryRate}%
                      </td>

                      <td
                        style={{
                          ...STYLES.td,
                          color:
                            site.damageRate >
                            20
                              ? THEME.accentCrimson
                              : site.damageRate >
                                10
                              ? THEME.accentAmber
                              : THEME.accentEmerald,
                          fontWeight:
                            '700',
                        }}
                      >
                        {
                          site.damageRate
                        }%
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          site.lossExposureRate
                        }%
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        <RiskBadge
                          score={
                            site.riskScore
                          }
                        />
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        <ChevronRight
                          size={14}
                          color={
                            THEME.textMuted
                          }
                        />
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================================
         SITE CHARTS
      ====================================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 1fr',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={STYLES.box}>
          <div style={sectionTitleStyle}>
            Top Sites by Material Deployment
          </div>

          <div
            style={{
              height:
                Math.max(
                  250,
                  topSitesByDeployment.length *
                    34
                ),
            }}
          >
            <ResponsiveContainer>
              <BarChart
                data={
                  topSitesByDeployment
                }
                layout="vertical"
                margin={{
                  left: 10,
                  right: 20,
                  top: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    THEME.border
                  }
                />

                <XAxis
                  type="number"
                  stroke={
                    THEME.textMuted
                  }
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  stroke={
                    THEME.textMuted
                  }
                  tick={{
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={
                    chartTooltipStyle
                  }
                />

                <Bar
                  dataKey="loaned"
                  name="Deployed Qty"
                  fill={
                    THEME.accentBlue
                  }
                  radius={[
                    0, 4, 4, 0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={STYLES.box}>
          <div style={sectionTitleStyle}>
            Sites by Unrecovered Exposure
          </div>

          <div
            style={{
              height:
                Math.max(
                  250,
                  topSitesByLoss.length *
                    34
                ),
            }}
          >
            <ResponsiveContainer>
              <BarChart
                data={topSitesByLoss}
                layout="vertical"
                margin={{
                  left: 10,
                  right: 20,
                  top: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    THEME.border
                  }
                />

                <XAxis
                  type="number"
                  stroke={
                    THEME.textMuted
                  }
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  stroke={
                    THEME.textMuted
                  }
                  tick={{
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={
                    chartTooltipStyle
                  }
                />

                <Bar
                  dataKey="remaining"
                  name="Unrecovered Qty"
                  fill={
                    THEME.accentCrimson
                  }
                  radius={[
                    0, 4, 4, 0,
                  ]}
                  onClick={(data) => {
                    const siteName =
                      data?.payload?.name;
                    if (siteName) {
                      setDrillType(
                        'site'
                      );
                      setDrillValue(
                        siteName
                      );
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ======================================================================
         SITE DAMAGE
      ====================================================================== */}

      <div style={STYLES.box}>
        <SectionHeader
          icon={
            <AlertTriangle
              size={17}
              color={
                THEME.accentCrimson
              }
            />
          }
          title="Sites with Highest Damage Rate"
          subtitle="Use this ranking to identify where material handling or operational conditions require investigation."
        />

        <div
          style={{
            overflowX: 'auto',
          }}
        >
          <table style={STYLES.table}>
            <thead>
              <tr>
                <th style={STYLES.th}>
                  Rank
                </th>
                <th style={STYLES.th}>
                  Site
                </th>
                <th style={STYLES.th}>
                  Returned
                </th>
                <th style={STYLES.th}>
                  Damaged
                </th>
                <th style={STYLES.th}>
                  Damage Rate
                </th>
                <th style={STYLES.th}>
                  Health Rate
                </th>
                <th style={STYLES.th}>
                  Risk
                </th>
              </tr>
            </thead>

            <tbody>
              {topSitesByDamage.map(
                (site, index) => (
                  <tr
                    key={
                      site.name
                    }
                    style={{
                      cursor:
                        'pointer',
                    }}
                    onClick={() => {
                      setDrillType(
                        'site'
                      );
                      setDrillValue(
                        site.name
                      );
                    }}
                  >
                    <td
                      style={
                        STYLES.td
                      }
                    >
                      {index + 1}
                    </td>

                    <td
                      style={
                        STYLES.td
                      }
                    >
                      <strong>
                        {
                          site.name
                        }
                      </strong>
                    </td>

                    <td
                      style={
                        STYLES.td
                      }
                    >
                      {
                        site.returnedQty
                      }
                    </td>

                    <td
                      style={{
                        ...STYLES.td,
                        color:
                          THEME.accentCrimson,
                        fontWeight:
                          '700',
                      }}
                    >
                      {
                        site.damagedQty
                      }
                    </td>

                    <td
                      style={{
                        ...STYLES.td,
                        color:
                          riskColor(
                            site.damageRate
                          ),
                        fontWeight:
                          '800',
                      }}
                    >
                      {
                        site.damageRate
                      }%
                    </td>

                    <td
                      style={
                        STYLES.td
                      }
                    >
                      {site.healthRate !==
                      null
                        ? `${site.healthRate}%`
                        : 'N/A'}
                    </td>

                    <td
                      style={
                        STYLES.td
                      }
                    >
                      <RiskBadge
                        score={
                          site.riskScore
                        }
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================================
         CONTRACTOR INTELLIGENCE
      ====================================================================== */}

      <div style={STYLES.box}>
        <SectionHeader
          icon={
            <Users
              size={17}
              color={THEME.accentCyan}
            />
          }
          title="Contractor Operational Risk"
          subtitle="Identify contractors with high outstanding exposure, overdue material and damage rates."
        />

        <div
          style={{
            overflowX: 'auto',
          }}
        >
          <table style={STYLES.table}>
            <thead>
              <tr>
                <th style={STYLES.th}>
                  Contractor
                </th>
                <th style={STYLES.th}>
                  Company
                </th>
                <th style={STYLES.th}>
                  Issued
                </th>
                <th style={STYLES.th}>
                  Still Out
                </th>
                <th style={STYLES.th}>
                  Overdue
                </th>
                <th style={STYLES.th}>
                  Recovery
                </th>
                <th style={STYLES.th}>
                  Damage
                </th>
                <th style={STYLES.th}>
                  Risk
                </th>
                <th style={STYLES.th} />
              </tr>
            </thead>

            <tbody>
              {contractorStats.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      ...STYLES.td,
                      textAlign:
                        'center',
                      color:
                        THEME.textMuted,
                    }}
                  >
                    No contractor
                    data yet.
                  </td>
                </tr>
              ) : (
                contractorStats.map(
                  (contractor) => (
                    <tr
                      key={
                        contractor.id
                      }
                      style={{
                        cursor:
                          'pointer',
                      }}
                      onClick={() => {
                        setDrillType(
                          'contractor'
                        );
                        setDrillValue(
                          contractor.id
                        );
                      }}
                    >
                      <td
                        style={
                          STYLES.td
                        }
                      >
                        <strong>
                          {
                            contractor.contact_person
                          }
                        </strong>
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          contractor.company_name
                        }
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          contractor.loaned
                        }
                      </td>

                      <td
                        style={{
                          ...STYLES.td,
                          color:
                            contractor.stillOut >
                            0
                              ? THEME.accentAmber
                              : THEME.textMain,
                          fontWeight:
                            contractor.stillOut >
                            0
                              ? '700'
                              : '400',
                        }}
                      >
                        {
                          contractor.stillOut
                        }
                      </td>

                      <td
                        style={{
                          ...STYLES.td,
                          color:
                            contractor.overdue >
                            0
                              ? THEME.accentCrimson
                              : THEME.textMain,
                          fontWeight:
                            contractor.overdue >
                            0
                              ? '700'
                              : '400',
                        }}
                      >
                        {
                          contractor.overdue
                        }
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          contractor.returnRate
                        }%
                      </td>

                      <td
                        style={{
                          ...STYLES.td,
                          color:
                            contractor.damageRate >
                            20
                              ? THEME.accentCrimson
                              : THEME.textMain,
                        }}
                      >
                        {
                          contractor.damageRate
                        }%
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        <RiskBadge
                          score={
                            contractor.riskScore
                          }
                        />
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        <ChevronRight
                          size={14}
                          color={
                            THEME.textMuted
                          }
                        />
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================================
         CONTRACTOR RISK CHART
      ====================================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 1fr',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={STYLES.box}>
          <div style={sectionTitleStyle}>
            Contractor Risk Ranking
          </div>

          <div
            style={{
              height:
                Math.max(
                  250,
                  topContractorsByRisk.length *
                    34
                ),
            }}
          >
            <ResponsiveContainer>
              <BarChart
                data={
                  topContractorsByRisk
                }
                layout="vertical"
                margin={{
                  left: 10,
                  right: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    THEME.border
                  }
                />

                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke={
                    THEME.textMuted
                  }
                />

                <YAxis
                  type="category"
                  dataKey="contact_person"
                  width={110}
                  stroke={
                    THEME.textMuted
                  }
                  tick={{
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={
                    chartTooltipStyle
                  }
                  formatter={(value) =>
                    `${value} risk score`
                  }
                />

                <Bar
                  dataKey="riskScore"
                  name="Risk Score"
                  fill={
                    THEME.accentCrimson
                  }
                  radius={[
                    0, 4, 4, 0,
                  ]}
                  onClick={(data) => {
                    const contractorId =
                      data?.payload?.id;
                    if (
                      contractorId !==
                      undefined
                    ) {
                      setDrillType(
                        'contractor'
                      );
                      setDrillValue(
                        contractorId
                      );
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={STYLES.box}>
          <div style={sectionTitleStyle}>
            Contractor Recovery Performance
          </div>

          <div
            style={{
              height: 300,
            }}
          >
            <ResponsiveContainer>
              <BarChart
                data={contractorStats.slice(
                  0,
                  10
                )}
                layout="vertical"
                margin={{
                  left: 10,
                  right: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    THEME.border
                  }
                />

                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke={
                    THEME.textMuted
                  }
                />

                <YAxis
                  type="category"
                  dataKey="contact_person"
                  width={110}
                  stroke={
                    THEME.textMuted
                  }
                  tick={{
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={
                    chartTooltipStyle
                  }
                  formatter={(value) =>
                    `${value}%`
                  }
                />

                <Bar
                  dataKey="returnRate"
                  name="Recovery %"
                  fill={
                    THEME.accentEmerald
                  }
                  radius={[
                    0, 4, 4, 0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ======================================================================
         MATERIAL INTELLIGENCE
      ====================================================================== */}

      <div style={STYLES.box}>
        <SectionHeader
          icon={
            <Package
              size={17}
              color={THEME.accentBlue}
            />
          }
          title="Material Risk & Utilization"
          subtitle="Identify materials with the highest deployment, outstanding exposure, overdue quantity and damage."
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            maxWidth: '420px',
          }}
        >
          <Search
            size={15}
            color={THEME.textMuted}
          />

          <input
            value={materialSearch}
            onChange={(e) =>
              setMaterialSearch(
                e.target.value
              )
            }
            placeholder="Search material..."
            style={{
              ...STYLES.input,
              marginBottom: 0,
            }}
          />
        </div>

        <div
          style={{
            overflowX: 'auto',
          }}
        >
          <table style={STYLES.table}>
            <thead>
              <tr>
                <th style={STYLES.th}>
                  Material
                </th>
                <th style={STYLES.th}>
                  Issued
                </th>
                <th style={STYLES.th}>
                  Active
                </th>
                <th style={STYLES.th}>
                  Returned
                </th>
                <th style={STYLES.th}>
                  Overdue
                </th>
                <th style={STYLES.th}>
                  Recovery %
                </th>
                <th style={STYLES.th}>
                  Damage %
                </th>
                <th style={STYLES.th}>
                  Site Count
                </th>
                <th style={STYLES.th}>
                  Risk
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredMaterials.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      ...STYLES.td,
                      textAlign:
                        'center',
                      color:
                        THEME.textMuted,
                    }}
                  >
                    No material data.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map(
                  (material) => (
                    <tr
                      key={
                        material.id
                      }
                    >
                      <td
                        style={
                          STYLES.td
                        }
                      >
                        <strong>
                          {
                            material.name
                          }
                        </strong>
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          material.issued
                        }
                      </td>

                      <td
                        style={{
                          ...STYLES.td,
                          color:
                            material.active >
                            0
                              ? THEME.accentAmber
                              : THEME.textMain,
                          fontWeight:
                            material.active >
                            0
                              ? '700'
                              : '400',
                        }}
                      >
                        {
                          material.active
                        }
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          material.returned
                        }
                      </td>

                      <td
                        style={{
                          ...STYLES.td,
                          color:
                            material.overdue >
                            0
                              ? THEME.accentCrimson
                              : THEME.textMain,
                        }}
                      >
                        {
                          material.overdue
                        }
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          material.recoveryRate
                        }%
                      </td>

                      <td
                        style={{
                          ...STYLES.td,
                          color:
                            material.damageRate >
                            20
                              ? THEME.accentCrimson
                              : material.damageRate >
                                10
                              ? THEME.accentAmber
                              : THEME.accentEmerald,
                          fontWeight:
                            '700',
                        }}
                      >
                        {
                          material.damageRate
                        }%
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        {
                          material.siteCount
                        }
                      </td>

                      <td
                        style={
                          STYLES.td
                        }
                      >
                        <RiskBadge
                          score={
                            material.riskScore
                          }
                        />
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================================
         MATERIAL RISK / EXPOSURE CHARTS
      ====================================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 1fr',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={STYLES.box}>
          <div style={sectionTitleStyle}>
            Materials with Highest Outstanding Exposure
          </div>

          <div
            style={{
              height: 320,
            }}
          >
            <ResponsiveContainer>
              <BarChart
                data={
                  topMaterialsByExposure
                }
                layout="vertical"
                margin={{
                  left: 10,
                  right: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    THEME.border
                  }
                />

                <XAxis
                  type="number"
                  stroke={
                    THEME.textMuted
                  }
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  stroke={
                    THEME.textMuted
                  }
                  tick={{
                    fontSize: 9,
                  }}
                />

                <Tooltip
                  contentStyle={
                    chartTooltipStyle
                  }
                />

                <Bar
                  dataKey="active"
                  name="Active / Outstanding"
                  fill={
                    THEME.accentAmber
                  }
                  radius={[
                    0, 4, 4, 0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={STYLES.box}>
          <div style={sectionTitleStyle}>
            Highest-Risk Materials
          </div>

          <div
            style={{
              height: 320,
            }}
          >
            <ResponsiveContainer>
              <BarChart
                data={
                  topMaterialsByRisk
                }
                layout="vertical"
                margin={{
                  left: 10,
                  right: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    THEME.border
                  }
                />

                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke={
                    THEME.textMuted
                  }
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  stroke={
                    THEME.textMuted
                  }
                  tick={{
                    fontSize: 9,
                  }}
                />

                <Tooltip
                  contentStyle={
                    chartTooltipStyle
                  }
                  formatter={(value) =>
                    `${value} risk score`
                  }
                />

                <Bar
                  dataKey="riskScore"
                  name="Risk Score"
                  fill={
                    THEME.accentCrimson
                  }
                  radius={[
                    0, 4, 4, 0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ======================================================================
         SITE × MATERIAL MATRIX
      ====================================================================== */}

      <div style={STYLES.box}>
        <SectionHeader
          icon={
            <TrendingUp
              size={17}
              color={THEME.accentPurple}
            />
          }
          title="Material Deployment by Site"
          subtitle="Shows which materials are being deployed to each site. Click a site for detailed history."
        />

        <div
          style={{
            overflowX: 'auto',
          }}
        >
          <table style={STYLES.table}>
            <thead>
              <tr>
                <th style={STYLES.th}>
                  Site
                </th>

                {topMaterialsByExposure
                  .slice(0, 10)
                  .map((material) => (
                    <th
                      key={
                        material.id
                      }
                      style={
                        STYLES.th
                      }
                    >
                      {
                        material.name
                      }
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {siteStats.map(
                (site) => (
                  <tr
                    key={
                      site.name
                    }
                  >
                    <td
                      style={{
                        ...STYLES.td,
                        cursor:
                          'pointer',
                      }}
                      onClick={() => {
                        setDrillType(
                          'site'
                        );
                        setDrillValue(
                          site.name
                        );
                      }}
                    >
                      <strong>
                        {
                          site.name
                        }
                      </strong>
                    </td>

                    {topMaterialsByExposure
                      .slice(0, 10)
                      .map(
                        (
                          material
                        ) => {
                          const quantity =
                            siteMaterialMatrix[
                              site.name
                            ]?.[
                              material.name
                            ] ||
                            0;

                          return (
                            <td
                              key={
                                material.id
                              }
                              style={{
                                ...STYLES.td,
                                fontWeight:
                                  quantity >
                                  0
                                    ? '700'
                                    : '400',
                                color:
                                  quantity >
                                  0
                                    ? THEME.textMain
                                    : THEME.textMuted,
                              }}
                            >
                              {quantity ||
                                '—'}
                            </td>
                          );
                        }
                      )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================================
         REPORT
      ====================================================================== */}

      <div
        style={{
          ...STYLES.box,
          marginTop: '24px',
        }}
      >
        <SectionHeader
          icon={
            <Download
              size={17}
              color={
                THEME.accentEmerald
              }
            />
          }
          title="Download Filtered Analytics Report"
          subtitle="Export operational data for management review."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginBottom: '16px',
          }}
        >
          <div>
            <label style={STYLES.label}>
              Site
            </label>

            <select
              style={STYLES.input}
              value={reportSite}
              onChange={(e) =>
                setReportSite(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Sites
              </option>

              {uniqueSites.map(
                (site) => (
                  <option
                    key={site}
                    value={site}
                  >
                    {site}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label style={STYLES.label}>
              Material
            </label>

            <select
              style={STYLES.input}
              value={reportMaterial}
              onChange={(e) =>
                setReportMaterial(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Materials
              </option>

              {materials.map(
                (material) => (
                  <option
                    key={
                      material.id
                    }
                    value={
                      material.id
                    }
                  >
                    {material.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label style={STYLES.label}>
              Contractor
            </label>

            <select
              style={STYLES.input}
              value={
                reportContractor
              }
              onChange={(e) =>
                setReportContractor(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Contractors
              </option>

              {contractors.map(
                (contractor) => (
                  <option
                    key={
                      contractor.id
                    }
                    value={
                      contractor.id
                    }
                  >
                    {
                      contractor.contact_person
                    }{' '}
                    —{' '}
                    {
                      contractor.company_name
                    }
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div
          style={{
            fontSize: '12px',
            color: THEME.textMuted,
            marginBottom: '14px',
          }}
        >
          {
            buildFilteredLoans()
              .length
          }{' '}
          matching loan(s),{' '}
          {
            buildFilteredReturns()
              .length
          }{' '}
          matching return(s).
        </div>

        <button
          onClick={
            downloadReport
          }
          style={{
            ...STYLES.button(
              THEME.accentEmerald
            ),
            width: 'auto',
            padding:
              '10px 20px',
            display:
              'inline-flex',
            alignItems:
              'center',
            gap: '8px',
          }}
        >
          <Download size={14} />
          Download Analytics Report
        </button>
      </div>
    </div>
  );
}