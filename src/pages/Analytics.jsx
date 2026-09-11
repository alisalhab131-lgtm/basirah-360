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
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react';
import {
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
    exportPdfReport: 'DOWNLOAD FILTERED PDF REPORT',
    exportSubtitle: 'Select operational filters and choose KPIs to include in your executive PDF export.',
    siteFilter: 'SITE',
    materialFilter: 'MATERIAL',
    contractorFilter: 'CONTRACTOR',
    allSites: 'All Sites',
    allMaterials: 'All Materials',
    allContractors: 'All Contractors',
    matchingRecords: (loansCount, returnsCount) => `${loansCount} matching loan(s), ${returnsCount} matching return(s).`,
    downloadPdfBtn: 'Download PDF Report',
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
    selectAll: 'Select all',
    clear: 'Clear',
    deployed: 'Deployed',
    returned: 'Returned',
    damaged: 'Damaged',
  },
  ar: {
    dir: 'rtl',
    kpiAnalytics: 'تحليلات مؤشرات الأداء',
    headerSubtitle:
      'رؤية تنفيذية شاملة لاستخدام المواد، والتعرض في المواقع، وأداء المقاولين، والمخاطر التشغيلية.',
    exportPdfReport: 'تنزيل تقرير PDF المصفى',
    exportSubtitle: 'حدد المرشحات التشغيلية واختر المؤشرات لتضمينها في تصدير تقرير PDF التنفيذي.',
    siteFilter: 'الموقع',
    materialFilter: 'المادة',
    contractorFilter: 'المقاول',
    allSites: 'جميع المواقع',
    allMaterials: 'جميع المواد',
    allContractors: 'جميع المقاولون',
    matchingRecords: (loansCount, returnsCount) => `${loansCount} استعارة مطابقة، ${returnsCount} إرجاع مطابق.`,
    downloadPdfBtn: 'تنزيل تقرير PDF',
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
    selectAll: 'تحديد الكل',
    clear: 'مسح',
    deployed: 'تم النشر',
    returned: 'تم الإرجاع',
    damaged: 'تالف',
  },
  fr: {
    dir: 'ltr',
    kpiAnalytics: 'Analyse des indicateurs clés',
    headerSubtitle:
      "Visibilité exécutive sur l'utilisation des matériaux, l'exposition des sites, la performance des sous-traitants et les risques opérationnels.",
    exportPdfReport: 'TÉLÉCHARGER LE RAPPORT PDF FILTRÉ',
    exportSubtitle: 'Sélectionnez les filtres et les KPI à inclure dans votre export PDF exécutif.',
    siteFilter: 'SITE',
    materialFilter: 'MATÉRIAU',
    contractorFilter: 'SOUS-TRAITANT',
    allSites: 'Tous les sites',
    allMaterials: 'Tous les matériaux',
    allContractors: 'Tous les sous-traitants',
    matchingRecords: (loansCount, returnsCount) => `${loansCount} prêt(s) correspondant(s), ${returnsCount} retour(s) correspondant(s).`,
    downloadPdfBtn: 'Télécharger le rapport PDF',
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
    selectAll: 'Tout sélectionner',
    clear: 'Effacer',
    deployed: 'Déployé',
    returned: 'Retourné',
    damaged: 'Endommagé',
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
}) {
  const [language, setLanguage] = useState('en');
  const t = (key, ...args) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    const val = dict[key] || TRANSLATIONS.en[key];
    return typeof val === 'function' ? val(...args) : val || key;
  };
  const dir = TRANSLATIONS[language]?.dir || 'ltr';

  /* Filter States */
  const [filterSite, setFilterSite] = useState('ALL');
  const [filterMaterial, setFilterMaterial] = useState('ALL');
  const [filterContractor, setFilterContractor] = useState('ALL');

  /* Unique options for dropdowns */
  const availableSites = useMemo(() => {
    const set = new Set();
    loans.forEach((l) => { if (l.site_name) set.add(l.site_name); });
    return Array.from(set);
  }, [loans]);

  /* Filtered Loans & Returns based on user selection */
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      if (filterSite !== 'ALL' && safeName(l.site_name) !== filterSite) return false;
      if (filterMaterial !== 'ALL' && safeName(l.material_name || l.name) !== filterMaterial) return false;
      if (filterContractor !== 'ALL' && safeName(l.contractor_name) !== filterContractor) return false;
      return true;
    });
  }, [loans, filterSite, filterMaterial, filterContractor]);

  const filteredReturns = useMemo(() => {
    const validLoanIds = new Set(filteredLoans.map((l) => num(l.id)));
    return returns.filter((r) => validLoanIds.has(num(r.loan_id)));
  }, [returns, filteredLoans]);

  /* Remaining quantity calculation */
  const remainingQty = (loan) => {
    try {
      if (typeof getLoanRemainingQty === 'function') {
        return Math.max(0, num(getLoanRemainingQty(loan.id)));
      }
    } catch (e) {}
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

  /* Calculations based on filtered datasets */
  const totalLoanedQty = useMemo(() => filteredLoans.reduce((sum, l) => sum + num(l.quantity), 0), [filteredLoans]);
  const totalReturnedQty = useMemo(() => filteredReturns.reduce((sum, r) => sum + returnQty(r), 0), [filteredReturns]);
  const totalRemainingQty = useMemo(() => filteredLoans.reduce((sum, l) => sum + remainingQty(l), 0), [filteredLoans, filteredReturns]);
  const totalOverdueQty = useMemo(() => filteredLoans.reduce((sum, l) => sum + (isOverdue(l) ? remainingQty(l) : 0), 0), [filteredLoans, filteredReturns]);

  const globalGoodQty = useMemo(() => filteredReturns.filter((r) => r.returned_condition === 'Good').reduce((sum, r) => sum + returnQty(r), 0), [filteredReturns]);
  const globalWornQty = useMemo(() => filteredReturns.filter((r) => r.returned_condition === 'Worn').reduce((sum, r) => sum + returnQty(r), 0), [filteredReturns]);
  const globalDamagedQty = useMemo(() => filteredReturns.filter((r) => r.returned_condition === 'Damaged').reduce((sum, r) => sum + returnQty(r), 0), [filteredReturns]);

  const globalConditionTotal = globalGoodQty + globalWornQty + globalDamagedQty;
  const globalRecoveryRate = pct(totalReturnedQty, totalLoanedQty);
  const globalDamageRate = pct(globalDamagedQty, globalConditionTotal);
  const globalWornRate = pct(globalWornQty, globalConditionTotal);
  const globalHealthRate = pct(globalGoodQty, globalConditionTotal);
  const overdueRate = pct(totalOverdueQty, totalRemainingQty);
  const unrecoveredRate = pct(totalRemainingQty, totalLoanedQty);

  const highRiskSites = [];
  const highRiskContractors = [];
  const highRiskMaterials = [];
  const managementAttention = 0;

  /* Trend data for charts */
  const trendData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(key);
    }
    const buckets = {};
    months.forEach((key) => {
      const [y, m] = key.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      buckets[key] = { month: label, deployed: 0, returned: 0, damaged: 0 };
    });
    filteredLoans.forEach((loan) => {
      const d = new Date(loan.loan_date || loan.issue_date || loan.created_at || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (buckets[key]) buckets[key].deployed += num(loan.quantity);
    });
    filteredReturns.forEach((record) => {
      const d = new Date(record.return_date || record.created_at || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (buckets[key]) {
        const q = returnQty(record);
        buckets[key].returned += q;
        if (record.returned_condition === 'Damaged') buckets[key].damaged += q;
      }
    });
    return months.map((k) => buckets[k]);
  }, [filteredLoans, filteredReturns]);

  /* ==========================================================================
     PDF EXPORT CATALOG & SELECTION
  ========================================================================== */

  const EXPORT_KPI_CATALOG = [
    { id: 'gross_deployed', label: t('grossDeployed'), value: totalLoanedQty },
    { id: 'recovered', label: t('recovered'), value: `${totalReturnedQty} (${globalRecoveryRate}%)` },
    { id: 'field_exposure', label: t('fieldExposure'), value: `${totalRemainingQty} (${unrecoveredRate}%)` },
    { id: 'overdue_exposure', label: t('overdueExposure'), value: `${totalOverdueQty} (${overdueRate}%)` },
    { id: 'material_health', label: t('materialHealth'), value: `${globalHealthRate}%` },
    { id: 'damage_rate', label: t('damageRate'), value: `${globalDamageRate}% (${globalDamagedQty})` },
    { id: 'worn_rate', label: t('wornRate'), value: `${globalWornRate}%` },
    { id: 'trend_chart', label: t('trendChartLabel'), value: null, isTable: true },
  ];

  const [selectedKpiIds, setSelectedKpiIds] = useState(
    EXPORT_KPI_CATALOG.map((k) => k.id)
  );

  const toggleKpiSelection = (id) => {
    setSelectedKpiIds((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const handleGeneratePdf = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

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
        doc.setFontSize(18);
        doc.text(title, margin, 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        text(C.muted);
        if (subtitle) doc.text(subtitle, margin, 21);
        doc.text(`Generated ${new Date().toLocaleString()}`, W - margin, 15, { align: 'right' });
        doc.text(`Filter: Site [${filterSite}] • Material [${filterMaterial}]`, W - margin, 21, { align: 'right' });
      };

      const selected = EXPORT_KPI_CATALOG.filter((k) => selectedKpiIds.includes(k.id));

      header('Executive Filtered Analytics Report', 'Customized KPI and Performance Summary');

      let startY = 28;
      let cardW = (usableW - 12) / 4;
      let cardH = 22;
      let gap = 4;

      selected.filter(k => !k.isTable).forEach((kpi, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const x = margin + col * (cardW + gap);
        const y = startY + row * (cardH + gap);

        rect(x, y, cardW, cardH, 2, C.card);
        text(C.muted);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(String(kpi.label || '').toUpperCase(), x + 4, y + 7);

        text(C.text);
        doc.setFontSize(13);
        doc.text(String(kpi.value ?? '0'), x + 4, y + 16);
      });

      doc.save(`filtered-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <div dir={dir} style={{ padding: '24px', color: '#fff', backgroundColor: THEME.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px 0' }}>{t('kpiAnalytics')}</h1>
          <p style={{ color: THEME.textMuted, fontSize: '13px', margin: 0, maxWidth: '650px' }}>{t('headerSubtitle')}</p>
        </div>

        {/* Language switcher */}
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
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* ==========================================================================
         FILTERED PDF REPORT & KPI SELECTION SECTION (Replaces old Excel card)
      ========================================================================== */}
      <div style={{ backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <FileText size={18} color={THEME.primary} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff' }}>{t('exportPdfReport')}</h3>
        </div>
        <p style={{ color: THEME.textMuted, fontSize: '13px', margin: '0 0 20px 0' }}>{t('exportSubtitle')}</p>

        {/* Filter Dropdowns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: THEME.textMuted, marginBottom: '6px' }}>{t('siteFilter')}</label>
            <select
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              style={{ width: '100%', backgroundColor: THEME.bg, border: `1px solid ${THEME.border}`, color: '#fff', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', cursor: 'pointer' }}
            >
              <option value="ALL">{t('allSites')}</option>
              {availableSites.map((site) => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: THEME.textMuted, marginBottom: '6px' }}>{t('materialFilter')}</label>
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
              style={{ width: '100%', backgroundColor: THEME.bg, border: `1px solid ${THEME.border}`, color: '#fff', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', cursor: 'pointer' }}
            >
              <option value="ALL">{t('allMaterials')}</option>
              {materials.map((m) => (
                <option key={m.id || m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: THEME.textMuted, marginBottom: '6px' }}>{t('contractorFilter')}</label>
            <select
              value={filterContractor}
              onChange={(e) => setFilterContractor(e.target.value)}
              style={{ width: '100%', backgroundColor: THEME.bg, border: `1px solid ${THEME.border}`, color: '#fff', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', cursor: 'pointer' }}
            >
              <option value="ALL">{t('allContractors')}</option>
              {contractors.map((c) => (
                <option key={c.id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Select Checkboxes for PDF */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.textMuted }}>Select KPIs to include in PDF:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setSelectedKpiIds(EXPORT_KPI_CATALOG.map(k => k.id))} style={{ background: 'none', border: 'none', color: THEME.primary, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>{t('selectAll')}</button>
              <span style={{ color: THEME.border }}>|</span>
              <button onClick={() => setSelectedKpiIds([])} style={{ background: 'none', border: 'none', color: THEME.textMuted, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>{t('clear')}</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {EXPORT_KPI_CATALOG.map((kpi) => {
              const checked = selectedKpiIds.includes(kpi.id);
              return (
                <label
                  key={kpi.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: checked ? `${THEME.primary}18` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${checked ? THEME.primary : THEME.border}`,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleKpiSelection(kpi.id)}
                    style={{ cursor: 'pointer', accentColor: THEME.primary }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: checked ? '#fff' : THEME.textMuted }}>
                    {kpi.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: `1px solid ${THEME.border}`, paddingTop: '16px' }}>
          <div style={{ fontSize: '13px', color: THEME.textMuted, fontWeight: '600' }}>
            {t('matchingRecords', filteredLoans.length, filteredReturns.length)}
          </div>

          <button
            onClick={handleGeneratePdf}
            disabled={selectedKpiIds.length === 0 || filteredLoans.length === 0}
            style={{
              backgroundColor: selectedKpiIds.length > 0 && filteredLoans.length > 0 ? THEME.primary : THEME.border,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: selectedKpiIds.length > 0 && filteredLoans.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Download size={16} />
            {t('downloadPdfBtn')}
          </button>
        </div>
      </div>

      {/* Trend Chart */}
      <div style={{ backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '24px' }}>
        <div style={sectionTitleStyle}>{t('trendChartLabel')}</div>
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
      </div>
    </div>
  );
}