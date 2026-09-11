import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Download,
} from 'lucide-react';
import axios from 'axios';
import {
  API_BASE,
  THEME,
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

const clamp = (value, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const riskLabel = (score) => {
  if (score >= 75) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 30) return 'MODERATE';
  return 'LOW';
};

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

  const [deleteMsg, setDeleteMsg] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

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
     SITE, CONTRACTOR, & MATERIAL ANALYTICS (RISK SCORING)
  ========================================================================== */

  const siteStats = useMemo(() => {
    const grouped = {};
    loans.forEach((loan) => {
      const site = safeName(loan.site_name);
      if (!grouped[site]) {
        grouped[site] = { name: site, loaned: 0, overdue: 0, remaining: 0 };
      }
      grouped[site].loaned += num(loan.quantity);
      grouped[site].remaining += remainingQty(loan);
      if (isOverdue(loan)) grouped[site].overdue += remainingQty(loan);
    });
    return Object.values(grouped).map((site) => ({
      ...site,
      risk: site.overdue > 0 ? 'HIGH' : 'LOW',
    }));
  }, [loans, returns]);

  const contractorStats = useMemo(() => {
    return contractors.map((c) => ({
      ...c,
      risk: 'LOW',
    }));
  }, [contractors]);

  const materialStats = useMemo(() => {
    return materials.map((m) => ({
      ...m,
      risk: 'LOW',
    }));
  }, [materials]);

  const highRiskSites = siteStats.filter((s) => s.risk === 'HIGH' || s.risk === 'CRITICAL');
  const highRiskContractors = contractorStats.filter((c) => c.risk === 'HIGH' || c.risk === 'CRITICAL');
  const highRiskMaterials = materialStats.filter((m) => m.risk === 'HIGH' || m.risk === 'CRITICAL');
  const managementAttention = highRiskSites.length + highRiskContractors.length + highRiskMaterials.length;

  /* ==========================================================================
     PDF EXPORT — SELECTABLE KPI REPORT
  ========================================================================== */

  const EXPORT_KPI_CATALOG = [
    { id: 'gross_deployed', label: t('grossDeployed'), value: totalLoanedQty },
    { id: 'recovered', label: t('recovered'), value: `${totalReturnedQty} (${globalRecoveryRate}%)` },
    { id: 'field_exposure', label: t('fieldExposure'), value: `${totalRemainingQty} (${unrecoveredRate}%)` },
    { id: 'overdue_exposure', label: t('overdueExposure'), value: `${totalOverdueQty} (${overdueRate}%)` },
    { id: 'material_health', label: t('materialHealth'), value: `${globalHealthRate}%` },
    { id: 'damage_rate', label: t('damageRate'), value: `${globalDamageRate}% (${globalDamagedQty})` },
    { id: 'worn_rate', label: t('wornRate'), value: `${globalWornRate}%` },
    { id: 'high_risk_sites', label: t('highRiskSites'), value: highRiskSites.length },
    { id: 'high_risk_contractors', label: t('highRiskContractors'), value: highRiskContractors.length },
    { id: 'high_risk_materials', label: t('highRiskMaterials'), value: highRiskMaterials.length },
    { id: 'management_attention', label: t('managementAttentionCount'), value: managementAttention },
    { id: 'trend_chart', label: t('trendChartLabel'), value: null, isTable: true },
  ];

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
    try {
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const margin = 12;
      const usableW = W - margin * 2;

      const C = {
        bg: [10, 10, 10],
        card: [20, 20, 20],
        border: [48, 48, 48],
        text: [245, 245, 245],
        muted: [155, 155, 155],
        blue: [59, 130, 246],
        green: [34, 197, 94],
      };

      const fill = (rgb) => doc.setFillColor(...rgb);
      const stroke = (rgb) => doc.setDrawColor(...rgb);
      const text = (rgb) => doc.setTextColor(...rgb);

      const rect = (x, y, w, h, radius = 3, color = C.card) => {
        fill(color);
        stroke(C.border);
        doc.roundedRect(x, y, w, h, radius, radius, 'FD');
      };

      const pageBackground = () => {
        fill(C.bg);
        doc.rect(0, 0, W, H, 'F');
      };

      const header = (title, subtitle = '') => {
        pageBackground();
        text(C.text);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(title, margin, 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        text(C.muted);
        if (subtitle) doc.text(subtitle, margin, 21);
        doc.text(`Generated ${new Date().toLocaleString()}`, W - margin, 15, { align: 'right' });
        doc.text('BASIRAH 360 • MANAGEMENT ANALYTICS', W - margin, 21, { align: 'right' });
      };

      const addFooter = (pageNo) => {
        text(C.muted);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`Basirah 360 Analytics • Page ${pageNo}`, margin, H - 7);
      };

      const selected = EXPORT_KPI_CATALOG.filter((k) => selectedKpiIds.includes(k.id));
      const selectedMetric = (id, fallbackLabel, fallbackValue) => {
        const k = selected.find((x) => x.id === id);
        return k || { id, label: fallbackLabel, value: fallbackValue };
      };

      const kpis = [
        selectedMetric('gross_deployed', 'Gross Deployed', totalLoanedQty),
        selectedMetric('recovered', 'Recovered', `${totalReturnedQty} (${globalRecoveryRate}%)`),
        selectedMetric('field_exposure', 'Field Exposure', `${totalRemainingQty} (${unrecoveredRate}%)`),
        selectedMetric('overdue_exposure', 'Overdue Exposure', `${totalOverdueQty} (${overdueRate}%)`),
        selectedMetric('material_health', 'Material Health', `${globalHealthRate}%`),
        selectedMetric('damage_rate', 'Damage Rate', `${globalDamageRate}% (${globalDamagedQty})`),
        selectedMetric('worn_rate', 'Worn Rate', `${globalWornRate}%`),
        selectedMetric('high_risk_sites', 'High Risk Sites', highRiskSites.length),
        selectedMetric('high_risk_contractors', 'High Risk Contractors', highRiskContractors.length),
        selectedMetric('high_risk_materials', 'High Risk Materials', highRiskMaterials.length),
        selectedMetric('management_attention', 'Management Attention Count', managementAttention),
      ].filter((k) => selectedKpiIds.includes(k.id));

      // Render KPI cards on Page 1
      header('Executive Analytics Report', 'Customized KPI and Performance Summary');

      let startY = 28;
      let cardW = (usableW - 12) / 4; // 4 columns
      let cardH = 22;
      let gap = 4;

      kpis.forEach((kpi, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const x = margin + col * (cardW + gap);
        const y = startY + row * (cardH + gap);

        if (y + cardH > H - 15) {
          doc.addPage();
          header('Executive Analytics Report (Cont.)', 'Customized KPI and Performance Summary');
          startY = 28 - (y + cardH - (H - 15));
        }

        rect(x, y, cardW, cardH, 2, C.card);
        
        text(C.muted);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(String(kpi.label || '').toUpperCase(), x + 4, y + 7);

        text(C.text);
        doc.setFontSize(13);
        doc.text(String(kpi.value ?? '0'), x + 4, y + 16);
      });

      // Check if Trend Chart is selected
      const includeTrend = selectedKpiIds.includes('trend_chart');
      if (includeTrend && trendData.length > 0) {
        doc.addPage();
        header('Deployment & Return Trend', 'Last 6 Months Performance Overview');
        
        const chartY = 32;
        const chartW = usableW;
        const chartH = 65;
        rect(margin, chartY, chartW, chartH, 3, C.card);

        text(C.text);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('MONTHLY DEPLOYMENT VS RETURN', margin + 6, chartY + 10);

        const maxVal = Math.max(...trendData.map(d => Math.max(d.deployed, d.returned, d.damaged)), 10);
        const plotX = margin + 10;
        const plotY = chartY + 50;
        const plotW = chartW - 20;
        const plotH = 32;
        const barGroupW = plotW / trendData.length;

        trendData.forEach((m, i) => {
          const bx = plotX + i * barGroupW + 6;
          const depH = (m.deployed / maxVal) * plotH;
          const retH = (m.returned / maxVal) * plotH;

          // Deployed bar (Blue)
          fill(C.blue);
          doc.rect(bx, plotY - depH, 6, depH, 'F');

          // Returned bar (Green)
          fill(C.green);
          doc.rect(bx + 7, plotY - retH, 6, retH, 'F');

          // Month Label
          text(C.muted);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.text(m.month, bx, plotY + 5);
        });
      }

      // Add page numbers
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        addFooter(p);
      }

      doc.save(`basirah-360-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
      setShowExportModal(false);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  /* ==========================================================================
     COMPONENT RENDER
  ========================================================================== */

  return (
    <div dir={dir} style={{ padding: '24px', color: '#fff', backgroundColor: THEME.bg, minHeight: '100vh' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
            {t('kpiAnalytics')}
          </h1>
          <p style={{ color: THEME.textMuted, fontSize: '13px', margin: 0, maxWidth: '650px' }}>
            {t('headerSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Language Selector */}
          <div style={{ display: 'flex', background: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '3px' }}>
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                style={{
                  background: language === lang.code ? THEME.primary : 'transparent',
                  color: language === lang.code ? '#fff' : THEME.textMuted,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Export PDF Button */}
          <button
            onClick={() => setShowExportModal(true)}
            style={{
              backgroundColor: THEME.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Download size={16} />
            {t('exportPdf')}
          </button>
        </div>
      </div>

      {/* Delete Feedback Message */}
      {deleteMsg && (
        <div style={{ marginBottom: '20px' }}>
          <div style={msgStyle(deleteMsg.type)}>{deleteMsg.text}</div>
        </div>
      )}

      {/* KPI Summary Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '18px' }}>
          <div style={{ color: THEME.textMuted, fontSize: '11px', fontWeight: '800', marginBottom: '8px' }}>{t('grossDeployed').toUpperCase()}</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{totalLoanedQty}</div>
        </div>

        <div style={{ backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '18px' }}>
          <div style={{ color: THEME.textMuted, fontSize: '11px', fontWeight: '800', marginBottom: '8px' }}>{t('recovered').toUpperCase()}</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: THEME.accentEmerald }}>{totalReturnedQty} ({globalRecoveryRate}%)</div>
        </div>

        <div style={{ backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '18px' }}>
          <div style={{ color: THEME.textMuted, fontSize: '11px', fontWeight: '800', marginBottom: '8px' }}>{t('fieldExposure').toUpperCase()}</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: THEME.accentAmber }}>{totalRemainingQty} ({unrecoveredRate}%)</div>
        </div>

        <div style={{ backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '18px' }}>
          <div style={{ color: THEME.textMuted, fontSize: '11px', fontWeight: '800', marginBottom: '8px' }}>{t('overdueExposure').toUpperCase()}</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: THEME.accentCrimson }}>{totalOverdueQty} ({overdueRate}%)</div>
        </div>
      </div>

      {/* Trend Chart Section */}
      <div style={{ backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
        <div style={sectionTitleStyle}>{t('trendTitle')}</div>
        {hasTrendData ? (
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="month" stroke={THEME.textMuted} fontSize={12} />
                <YAxis stroke={THEME.textMuted} fontSize={12} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
                <Bar dataKey="deployed" fill={THEME.primary} name={t('deployed')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="returned" fill={THEME.accentEmerald} name={t('returned')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="damaged" fill={THEME.accentCrimson} name={t('damaged')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: THEME.textMuted, fontSize: '13px' }}>
            {t('noTrendData')}
          </div>
        )}
      </div>

      {/* EXPORT CUSTOMIZATION MODAL */}
      {showExportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: THEME.cardBg,
            border: `1px solid ${THEME.border}`,
            borderRadius: '16px',
            width: '90%',
            maxWidth: '540px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '800' }}>{t('exportModalTitle')}</h3>
            <p style={{ color: THEME.textMuted, fontSize: '13px', margin: '0 0 20px 0' }}>{t('exportModalSubtitle')}</p>

            {/* Select All / Clear Quick Actions */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button
                onClick={() => setSelectedKpiIds(EXPORT_KPI_CATALOG.map((k) => k.id))}
                style={{ background: 'transparent', border: `1px solid ${THEME.border}`, color: THEME.primary, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
              >
                {t('selectAll')}
              </button>
              <button
                onClick={() => setSelectedKpiIds([])}
                style={{ background: 'transparent', border: `1px solid ${THEME.border}`, color: THEME.textMuted, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
              >
                {t('clear')}
              </button>
            </div>

            {/* Checkbox Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '260px', overflowY: 'auto', marginBottom: '24px', paddingRight: '4px' }}>
              {EXPORT_KPI_CATALOG.map((kpi) => {
                const checked = selectedKpiIds.includes(kpi.id);
                return (
                  <div
                    key={kpi.id}
                    onClick={() => toggleKpiSelection(kpi.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: checked ? `${THEME.primary}18` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${checked ? THEME.primary : THEME.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      style={{ cursor: 'pointer', accentColor: THEME.primary }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: checked ? '#fff' : THEME.textMuted }}>
                      {kpi.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  background: 'transparent',
                  color: THEME.textMuted,
                  border: `1px solid ${THEME.border}`,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleGeneratePdf}
                disabled={selectedKpiIds.length === 0}
                style={{
                  background: selectedKpiIds.length > 0 ? THEME.primary : THEME.border,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: selectedKpiIds.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                {t('generatePdf')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}