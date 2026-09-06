import React from 'react';
import {
  LayoutGrid,
  Package,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle,
  Wrench,
  XCircle,
  TrendingUp,
  Users,
  MapPin,
  ShieldAlert,
  Activity,
  ChevronRight,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';

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
  Legend
} from 'recharts';

import {
  THEME,
  CONDITION_COLORS,
  STYLES
} from '../utils/theme';


/* =========================================================
   SAFE THEME FALLBACKS
========================================================= */

const safeTheme = THEME || {
  cardBg: '#1e293b',
  border: '#334155',
  textMain: '#ffffff',
  textMuted: '#94a3b8',
  accentBlue: '#3b82f6',
  accentEmerald: '#10b981',
  accentAmber: '#f59e0b',
  accentCrimson: '#ef4444',
  accentPurple: '#8b5cf6',
  accentCyan: '#06b6d4'
};

const safeStyles = STYLES || {
  box: {
    backgroundColor: safeTheme.cardBg,
    border: `1px solid ${safeTheme.border}`,
    padding: '20px',
    borderRadius: '12px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '700',
    color: safeTheme.textMain,
    marginBottom: '12px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '10px',
    color: safeTheme.textMuted,
    fontSize: '12px',
    borderBottom: `1px solid ${safeTheme.border}`
  },
  td: {
    padding: '10px',
    fontSize: '13px',
    color: safeTheme.textMain,
    borderBottom: `1px solid ${safeTheme.border}`
  }
};

const safeConditionColors = CONDITION_COLORS || {
  Good: '#10b981',
  Worn: '#f59e0b',
  Damaged: '#ef4444'
};


/* =========================================================
   EXECUTIVE DASHBOARD STYLES
========================================================= */

const dashboardStyles = `
  @keyframes executivePulse {
    0% {
      box-shadow: 0 0 0 rgba(220,38,38,0);
    }
    50% {
      box-shadow: 0 0 18px rgba(220,38,38,0.22);
    }
    100% {
      box-shadow: 0 0 0 rgba(220,38,38,0);
    }
  }

  .executive-alert {
    animation: executivePulse 2s infinite ease-in-out;
  }

  .executive-clickable {
    transition:
      transform 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease;
  }

  .executive-clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(0,0,0,0.18);
  }

  .executive-row {
    transition: background-color 0.15s ease;
  }

  .executive-row:hover {
    background-color: rgba(59,130,246,0.06) !important;
  }
`;


/* =========================================================
   KPI CARD
========================================================= */

function ExecutiveKpi({
  icon: Icon = Activity,
  label,
  value,
  subtitle,
  color,
  onClick,
  alert = false,
  trend
}) {
  return (
    <div
      onClick={onClick}
      className={`executive-clickable ${alert ? 'executive-alert' : ''}`}
      style={{
        backgroundColor: safeTheme.cardBg,
        border: `1px solid ${
          alert
            ? safeTheme.accentCrimson
            : safeTheme.border
        }`,
        borderRadius: '14px',
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        minHeight: '112px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          backgroundColor: alert
            ? safeTheme.accentCrimson
            : color
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: alert
              ? `${safeTheme.accentCrimson}20`
              : `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon
            size={20}
            color={
              alert
                ? safeTheme.accentCrimson
                : color
            }
          />
        </div>

        {onClick && (
          <ChevronRight
            size={17}
            color={safeTheme.textMuted}
          />
        )}
      </div>

      <div style={{ marginTop: '12px' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: '700',
            color: safeTheme.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: '5px',
            fontSize: '27px',
            lineHeight: 1,
            fontWeight: '800',
            color: alert
              ? safeTheme.accentCrimson
              : safeTheme.textMain
          }}
        >
          {value}
        </div>

        {subtitle && (
          <div
            style={{
              marginTop: '7px',
              fontSize: '11px',
              color: alert
                ? safeTheme.accentCrimson
                : safeTheme.textMuted
            }}
          >
            {subtitle}
          </div>
        )}

        {trend && (
          <div
            style={{
              marginTop: '5px',
              fontSize: '11px',
              fontWeight: '600',
              color: trend.color || safeTheme.accentEmerald
            }}
          >
            {trend.text}
          </div>
        )}
      </div>
    </div>
  );
}


/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  onAction
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        marginBottom: '16px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}
      >
        {Icon && (
          <Icon
            size={18}
            color={safeTheme.accentBlue}
            style={{ marginTop: '2px' }}
          />
        )}

        <div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: '750',
              color: safeTheme.textMain
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: '11px',
                color: safeTheme.textMuted,
                marginTop: '4px'
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {action && (
        <button
          onClick={onAction}
          style={{
            background: 'transparent',
            border: 'none',
            color: safeTheme.accentBlue,
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {action}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  children,
  type = 'neutral'
}) {
  const palette = {
    good: {
      bg: `${safeTheme.accentEmerald}18`,
      color: safeTheme.accentEmerald
    },
    warning: {
      bg: `${safeTheme.accentAmber}18`,
      color: safeTheme.accentAmber
    },
    danger: {
      bg: `${safeTheme.accentCrimson}18`,
      color: safeTheme.accentCrimson
    },
    neutral: {
      bg: `${safeTheme.accentBlue}18`,
      color: safeTheme.accentBlue
    }
  };

  const p = palette[type] || palette.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: '6px',
        backgroundColor: p.bg,
        color: p.color,
        fontSize: '10px',
        fontWeight: '750',
        whiteSpace: 'nowrap'
      }}
    >
      {children}
    </span>
  );
}


/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function DashboardPage({
  materials = [],
  contractors = [],
  loans = [],
  returns = [],
  getLoanRemainingQty = () => 0,
  navigateToAssets = () => {}
}) {

  const now = new Date();

  /* =======================================================
     SAFE DATA
  ======================================================= */

  const safeMaterials =
    Array.isArray(materials) ? materials : [];

  const safeContractors =
    Array.isArray(contractors) ? contractors : [];

  const safeLoans =
    Array.isArray(loans) ? loans : [];

  const safeReturns =
    Array.isArray(returns) ? returns : [];

  const safeGetRemaining =
    typeof getLoanRemainingQty === 'function'
      ? getLoanRemainingQty
      : () => 0;


  /* =======================================================
     EXECUTIVE INVENTORY KPIs

     IMPORTANT:
     These variables are intentionally Dashboard-specific.
     We do NOT use "totalStock" to avoid ambiguity with
     Analytics calculations.
  ======================================================= */

  const dashboardAvailableUnits =
    safeMaterials.reduce(
      (sum, material) =>
        sum +
        Number(
          material?.quantity ??
          material?.qty ??
          material?.stock_quantity ??
          0
        ),
      0
    );

  const dashboardDeployedUnits =
    safeLoans.reduce(
      (sum, loan) =>
        sum +
        Math.max(
          0,
          Number(
            safeGetRemaining(loan?.id) || 0
          )
        ),
      0
    );

  const dashboardGrossStock =
    dashboardAvailableUnits +
    dashboardDeployedUnits;

  const dashboardUtilization =
    dashboardGrossStock > 0
      ? Math.round(
          (dashboardDeployedUnits /
            dashboardGrossStock) *
            100
        )
      : 0;


  /* =======================================================
     OVERDUE EXPOSURE
  ======================================================= */

  const overdueLoans = safeLoans.filter((loan) => {
    const remaining = Number(
      safeGetRemaining(loan?.id) || 0
    );

    if (
      remaining <= 0 ||
      !loan?.expected_return_date
    ) {
      return false;
    }

    const date =
      new Date(loan.expected_return_date);

    return (
      !isNaN(date.getTime()) &&
      date < now
    );
  });

  const overdueUnits =
    overdueLoans.reduce(
      (sum, loan) =>
        sum +
        Math.max(
          0,
          Number(
            safeGetRemaining(loan?.id) || 0
          )
        ),
      0
    );


  /* =======================================================
     SEVERE OVERDUE EXPOSURE > 14 DAYS
  ======================================================= */

  const severeOverdueLoans =
    overdueLoans.filter((loan) => {
      const date =
        new Date(loan.expected_return_date);

      const days =
        (now - date) /
        (1000 * 60 * 60 * 24);

      return days > 14;
    });

  const severeOverdueUnits =
    severeOverdueLoans.reduce(
      (sum, loan) =>
        sum +
        Math.max(
          0,
          Number(
            safeGetRemaining(loan?.id) || 0
          )
        ),
      0
    );


  /* =======================================================
     RETURN CONDITION INTELLIGENCE
  ======================================================= */

  const returnQuantity = (item) =>
    Number(
      item?.quantity ??
      item?.qty ??
      0
    );

  const dashboardGoodReturns =
    safeReturns
      .filter(
        (r) =>
          String(r?.returned_condition || '')
            .toLowerCase() === 'good'
      )
      .reduce(
        (sum, r) =>
          sum + returnQuantity(r),
        0
      );

  const dashboardWornReturns =
    safeReturns
      .filter(
        (r) =>
          String(r?.returned_condition || '')
            .toLowerCase() === 'worn'
      )
      .reduce(
        (sum, r) =>
          sum + returnQuantity(r),
        0
      );

  const dashboardDamagedReturns =
    safeReturns
      .filter(
        (r) =>
          String(r?.returned_condition || '')
            .toLowerCase() === 'damaged'
      )
      .reduce(
        (sum, r) =>
          sum + returnQuantity(r),
        0
      );

  const dashboardReturnedUnits =
    safeReturns.reduce(
      (sum, r) =>
        sum + returnQuantity(r),
      0
    );

  const returnConditionHealth =
    dashboardReturnedUnits > 0
      ? Math.round(
          (dashboardGoodReturns /
            dashboardReturnedUnits) *
            100
        )
      : 100;


  /* =======================================================
     ACTIVE SITES
  ======================================================= */

  const siteAggregates =
    safeLoans.reduce((acc, loan) => {

      const remaining =
        Math.max(
          0,
          Number(
            safeGetRemaining(loan?.id) || 0
          )
        );

      if (
        remaining <= 0 ||
        !loan?.site_name
      ) {
        return acc;
      }

      const site =
        String(loan.site_name).trim();

      if (!acc[site]) {
        acc[site] = {
          name: site,
          deployed: 0,
          overdue: 0,
          activeLoans: 0
        };
      }

      acc[site].deployed += remaining;
      acc[site].activeLoans += 1;

      const expectedDate =
        loan?.expected_return_date
          ? new Date(
              loan.expected_return_date
            )
          : null;

      const isOverdue =
        expectedDate &&
        !isNaN(expectedDate.getTime()) &&
        expectedDate < now;

      if (isOverdue) {
        acc[site].overdue += remaining;
      }

      return acc;

    }, {});


  const siteChartData =
    Object.values(siteAggregates)
      .sort(
        (a, b) =>
          b.deployed - a.deployed
      );


  const activeSiteCount =
    siteChartData.length;


  /* =======================================================
     CONTRACTOR HEALTH
  ======================================================= */

  const contractorHealth =
    safeContractors
      .map((contractor) => {

        const contractorLoans =
          safeLoans.filter(
            (loan) =>
              String(
                loan?.contractor_id
              ) ===
              String(contractor?.id)
          );

        const loanIds =
          contractorLoans.map(
            (loan) => loan?.id
          );

        const loanedUnits =
          contractorLoans.reduce(
            (sum, loan) =>
              sum +
              Number(
                loan?.quantity || 0
              ),
            0
          );

        const contractorReturns =
          safeReturns.filter((item) =>
            loanIds.includes(
              Number(item?.loan_id)
            )
          );

        const returnedUnits =
          contractorReturns.reduce(
            (sum, item) =>
              sum +
              returnQuantity(item),
            0
          );

        const goodUnits =
          contractorReturns
            .filter(
              (item) =>
                String(
                  item?.returned_condition || ''
                ).toLowerCase() === 'good'
            )
            .reduce(
              (sum, item) =>
                sum + returnQuantity(item),
              0
            );

        const outstandingUnits =
          Math.max(
            0,
            loanedUnits -
              returnedUnits
          );

        const returnCompliance =
          loanedUnits > 0
            ? Math.round(
                (returnedUnits /
                  loanedUnits) *
                  100
              )
            : 100;

        const conditionHealth =
          returnedUnits > 0
            ? Math.round(
                (goodUnits /
                  returnedUnits) *
                  100
              )
            : 100;

        const riskScore =
          Math.round(
            returnCompliance * 0.6 +
            conditionHealth * 0.4
          );

        let risk = 'good';

        if (riskScore < 50) {
          risk = 'danger';
        } else if (riskScore < 80) {
          risk = 'warning';
        }

        return {
          id:
            contractor?.id ??
            `contractor-${Math.random()}`,
          name:
            contractor?.contact_person ||
            contractor?.name ||
            'Unknown Contact',
          company:
            contractor?.company_name ||
            contractor?.company ||
            'N/A',
          loanedUnits,
          returnedUnits,
          outstandingUnits,
          returnCompliance,
          conditionHealth,
          riskScore,
          risk
        };

      })
      .filter(
        (item) =>
          item.loanedUnits > 0
      )
      .sort(
        (a, b) =>
          a.riskScore -
          b.riskScore
      );


  const highRiskContractors =
    contractorHealth.filter(
      (item) =>
        item.risk === 'danger'
    );


  /* =======================================================
     CONDITION DATA
  ======================================================= */

  const conditionData = [
    {
      name: 'Good',
      value: dashboardGoodReturns
    },
    {
      name: 'Worn',
      value: dashboardWornReturns
    },
    {
      name: 'Damaged',
      value: dashboardDamagedReturns
    }
  ].filter(
    (item) =>
      item.value > 0
  );


  /* =======================================================
     MANAGEMENT ACTIONS
  ======================================================= */

  const managementActions = [];

  if (severeOverdueUnits > 0) {
    managementActions.push({
      priority: 'Critical',
      type: 'danger',
      icon: AlertTriangle,
      title: 'Critical overdue exposure',
      description:
        `${severeOverdueUnits} units remain deployed more than 14 days past expected return.`,
      action: 'Review overdue assets',
      filter: 'OVERDUE'
    });
  }

  if (dashboardDamagedReturns > 0) {
    managementActions.push({
      priority: 'High',
      type: 'danger',
      icon: Wrench,
      title: 'Damaged equipment',
      description:
        `${dashboardDamagedReturns} returned units require repair or disposition review.`,
      action: 'Review damaged assets',
      filter: 'DAMAGED'
    });
  }

  if (dashboardUtilization >= 90) {
    managementActions.push({
      priority: 'High',
      type: 'warning',
      icon: Target,
      title: 'High inventory utilization',
      description:
        `Inventory utilization has reached ${dashboardUtilization}%.`,
      action: 'Review inventory',
      filter: 'AVAILABLE'
    });
  }

  if (highRiskContractors.length > 0) {
    managementActions.push({
      priority: 'High',
      type: 'warning',
      icon: ShieldAlert,
      title: 'Contractor risk exposure',
      description:
        `${highRiskContractors.length} contractors have a low operational health score.`,
      action: 'Review contractors',
      filter: 'CONTRACTORS'
    });
  }


  /* =======================================================
     NAVIGATION
  ======================================================= */

  const goTo =
    (filter) => {
      if (
        typeof navigateToAssets ===
        'function'
      ) {
        navigateToAssets(filter);
      }
    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div>

      <style>
        {dashboardStyles}
      </style>


      {/* ===================================================
          EXECUTIVE HEADER
      =================================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          gap: '20px',
          flexWrap: 'wrap'
        }}
      >

        <div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              marginBottom: '6px'
            }}
          >
            <Activity
              size={20}
              color={safeTheme.accentBlue}
            />

            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: safeTheme.accentBlue
              }}
            >
              Executive Operations
            </span>
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: '26px',
              fontWeight: '800',
              color: safeTheme.textMain
            }}
          >
            Inventory Command Center
          </h2>

          <p
            style={{
              margin:
                '7px 0 0',
              fontSize: '12px',
              color: safeTheme.textMuted
            }}
          >
            Executive view of inventory position,
            deployment exposure and operational risk.
          </p>

        </div>


        <div
          style={{
            textAlign: 'right',
            color: safeTheme.textMuted,
            fontSize: '11px'
          }}
        >

          <div
            style={{
              fontWeight: '700',
              color: safeTheme.textMain
            }}
          >
            {now.toLocaleDateString(
              'en-GB',
              {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }
            )}
          </div>

          <div
            style={{
              marginTop: '4px'
            }}
          >
            Live operational snapshot
          </div>

        </div>

      </div>


      {/* ===================================================
          EXECUTIVE KPI GRID
      =================================================== */}

      <SectionHeader
        icon={BarChart3}
        title="Executive performance indicators"
        subtitle="Click any KPI to investigate the underlying inventory records."
      />


      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '26px'
        }}
      >

        <ExecutiveKpi
          icon={LayoutGrid}
          label="Gross Inventory Position"
          value={dashboardGrossStock.toLocaleString()}
          subtitle="Total physical units accounted for"
          color={safeTheme.accentBlue}
          onClick={() => goTo('ALL')}
        />

        <ExecutiveKpi
          icon={Package}
          label="Available Reserve"
          value={dashboardAvailableUnits.toLocaleString()}
          subtitle="Units currently available"
          color={safeTheme.accentEmerald}
          onClick={() => goTo('AVAILABLE')}
        />

        <ExecutiveKpi
          icon={ArrowLeftRight}
          label="Field Deployment"
          value={dashboardDeployedUnits.toLocaleString()}
          subtitle="Units currently deployed"
          color={safeTheme.accentAmber}
          onClick={() => goTo('LENDED')}
        />

        <ExecutiveKpi
          icon={TrendingUp}
          label="Utilization Rate"
          value={`${dashboardUtilization}%`}
          subtitle="Deployment as % of gross inventory"
          color={safeTheme.accentPurple}
          onClick={() => goTo('LENDED')}
        />

        <ExecutiveKpi
          icon={Clock}
          label="Overdue Exposure"
          value={overdueUnits.toLocaleString()}
          subtitle={`${overdueLoans.length} overdue loans`}
          color={safeTheme.accentAmber}
          onClick={() => goTo('OVERDUE')}
          alert={overdueUnits > 0}
        />

        <ExecutiveKpi
          icon={ShieldAlert}
          label="Critical Exposure"
          value={severeOverdueUnits.toLocaleString()}
          subtitle="Units overdue >14 days"
          color={safeTheme.accentCrimson}
          onClick={() => goTo('OVERDUE')}
          alert={severeOverdueUnits > 0}
        />

        <ExecutiveKpi
          icon={Wrench}
          label="Damage Exposure"
          value={dashboardDamagedReturns.toLocaleString()}
          subtitle="Returned damaged units"
          color={safeTheme.accentCrimson}
          onClick={() => goTo('DAMAGED')}
          alert={dashboardDamagedReturns > 0}
        />

        <ExecutiveKpi
          icon={Users}
          label="Active Contractors"
          value={safeContractors.length.toLocaleString()}
          subtitle={`${highRiskContractors.length} high-risk custodians`}
          color={safeTheme.accentCyan}
          onClick={() => goTo('CONTRACTORS')}
        />

      </div>


      {/* ===================================================
          OPERATIONAL SNAPSHOT
      =================================================== */}

      <SectionHeader
        icon={Activity}
        title="Operational snapshot"
        subtitle="Current inventory health and deployment footprint."
      />


      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
          marginBottom: '26px'
        }}
      >

        <div
          className="executive-clickable"
          onClick={() => goTo('AVAILABLE')}
          style={{
            ...safeStyles.box,
            cursor: 'pointer'
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '11px',
                  color: safeTheme.textMuted,
                  textTransform: 'uppercase',
                  fontWeight: '700'
                }}
              >
                Reserve Coverage
              </div>

              <div
                style={{
                  marginTop: '7px',
                  fontSize: '25px',
                  fontWeight: '800',
                  color: safeTheme.textMain
                }}
              >
                {dashboardGrossStock > 0
                  ? Math.round(
                      (dashboardAvailableUnits /
                        dashboardGrossStock) *
                        100
                    )
                  : 0}
                %
              </div>

            </div>

            <Package
              size={20}
              color={safeTheme.accentEmerald}
            />

          </div>

          <div
            style={{
              marginTop: '12px',
              height: '6px',
              backgroundColor: safeTheme.border,
              borderRadius: '99px',
              overflow: 'hidden'
            }}
          >

            <div
              style={{
                width: `${
                  dashboardGrossStock > 0
                    ? (
                        dashboardAvailableUnits /
                        dashboardGrossStock
                      ) * 100
                    : 0
                }%`,
                height: '100%',
                backgroundColor:
                  safeTheme.accentEmerald
              }}
            />

          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: safeTheme.textMuted
            }}
          >
            {dashboardAvailableUnits.toLocaleString()}
            {' '}available of{' '}
            {dashboardGrossStock.toLocaleString()}
          </div>

        </div>


        <div
          className="executive-clickable"
          onClick={() => goTo('OVERDUE')}
          style={{
            ...safeStyles.box,
            cursor: 'pointer'
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '11px',
                  color: safeTheme.textMuted,
                  textTransform: 'uppercase',
                  fontWeight: '700'
                }}
              >
                Recovery Exposure
              </div>

              <div
                style={{
                  marginTop: '7px',
                  fontSize: '25px',
                  fontWeight: '800',
                  color:
                    overdueUnits > 0
                      ? safeTheme.accentAmber
                      : safeTheme.accentEmerald
                }}
              >
                {dashboardDeployedUnits > 0
                  ? Math.round(
                      (overdueUnits /
                        dashboardDeployedUnits) *
                        100
                    )
                  : 0}
                %
              </div>

            </div>

            <Clock
              size={20}
              color={
                overdueUnits > 0
                  ? safeTheme.accentAmber
                  : safeTheme.accentEmerald
              }
            />

          </div>

          <div
            style={{
              marginTop: '12px',
              height: '6px',
              backgroundColor: safeTheme.border,
              borderRadius: '99px',
              overflow: 'hidden'
            }}
          >

            <div
              style={{
                width: `${
                  dashboardDeployedUnits > 0
                    ? Math.min(
                        100,
                        (
                          overdueUnits /
                          dashboardDeployedUnits
                        ) * 100
                      )
                    : 0
                }%`,
                height: '100%',
                backgroundColor:
                  overdueUnits > 0
                    ? safeTheme.accentAmber
                    : safeTheme.accentEmerald
              }}
            />

          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: safeTheme.textMuted
            }}
          >
            {overdueUnits.toLocaleString()}
            {' '}overdue of{' '}
            {dashboardDeployedUnits.toLocaleString()}
            {' '}deployed
          </div>

        </div>


        <div
          className="executive-clickable"
          onClick={() => goTo('DAMAGED')}
          style={{
            ...safeStyles.box,
            cursor: 'pointer'
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '11px',
                  color: safeTheme.textMuted,
                  textTransform: 'uppercase',
                  fontWeight: '700'
                }}
              >
                Return Quality
              </div>

              <div
                style={{
                  marginTop: '7px',
                  fontSize: '25px',
                  fontWeight: '800',
                  color:
                    returnConditionHealth >= 80
                      ? safeTheme.accentEmerald
                      : safeTheme.accentAmber
                }}
              >
                {returnConditionHealth}%
              </div>

            </div>

            <CheckCircle
              size={20}
              color={
                returnConditionHealth >= 80
                  ? safeTheme.accentEmerald
                  : safeTheme.accentAmber
              }
            />

          </div>

          <div
            style={{
              marginTop: '12px',
              fontSize: '11px',
              color: safeTheme.textMuted
            }}
          >
            Good-condition share of returned units
          </div>

        </div>


        <div
          className="executive-clickable"
          onClick={() => goTo('SITES')}
          style={{
            ...safeStyles.box,
            cursor: 'pointer'
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '11px',
                  color: safeTheme.textMuted,
                  textTransform: 'uppercase',
                  fontWeight: '700'
                }}
              >
                Deployment Footprint
              </div>

              <div
                style={{
                  marginTop: '7px',
                  fontSize: '25px',
                  fontWeight: '800',
                  color: safeTheme.textMain
                }}
              >
                {activeSiteCount}
              </div>

            </div>

            <MapPin
              size={20}
              color={safeTheme.accentCyan}
            />

          </div>

          <div
            style={{
              marginTop: '12px',
              fontSize: '11px',
              color: safeTheme.textMuted
            }}
          >
            Active sites currently holding inventory
          </div>

        </div>

      </div>


      {/* ===================================================
          MANAGEMENT ATTENTION
      =================================================== */}

      {managementActions.length > 0 && (

        <div
          style={{
            ...safeStyles.box,
            marginBottom: '26px',
            borderColor:
              safeTheme.accentAmber
          }}
        >

          <SectionHeader
            icon={ShieldAlert}
            title="Management attention required"
            subtitle="Priority exceptions requiring operational review."
          />

          <div
            style={{
              display: 'grid',
              gap: '9px'
            }}
          >

            {managementActions.map(
              (item, index) => {

                const Icon =
                  item.icon;

                return (
                  <div
                    key={`${item.title}-${index}`}
                    className="executive-clickable"
                    onClick={() =>
                      goTo(item.filter)
                    }
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '36px 1fr auto',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '9px',
                      border:
                        `1px solid ${safeTheme.border}`,
                      cursor: 'pointer'
                    }}
                  >

                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          item.type === 'danger'
                            ? `${safeTheme.accentCrimson}18`
                            : `${safeTheme.accentAmber}18`
                      }}
                    >

                      <Icon
                        size={17}
                        color={
                          item.type === 'danger'
                            ? safeTheme.accentCrimson
                            : safeTheme.accentAmber
                        }
                      />

                    </div>


                    <div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >

                        <strong
                          style={{
                            fontSize: '12px',
                            color: safeTheme.textMain
                          }}
                        >
                          {item.title}
                        </strong>

                        <StatusBadge
                          type={item.type}
                        >
                          {item.priority}
                        </StatusBadge>

                      </div>

                      <div
                        style={{
                          marginTop: '4px',
                          fontSize: '11px',
                          color: safeTheme.textMuted
                        }}
                      >
                        {item.description}
                      </div>

                    </div>


                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        color: safeTheme.accentBlue,
                        fontSize: '11px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.action}
                      <ChevronRight
                        size={14}
                      />
                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      )}


      {/* ===================================================
          SITE DEPLOYMENT + RETURN QUALITY
      =================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1.45fr) minmax(0, 1fr)',
          gap: '18px',
          marginBottom: '26px'
        }}
      >

        {/* SITE DEPLOYMENT */}

        <div
          style={safeStyles.box}
        >

          <SectionHeader
            icon={MapPin}
            title="Deployment by site"
            subtitle="Highest inventory concentration across active locations."
            action="View sites"
            onAction={() =>
              goTo('SITES')
            }
          />

          {siteChartData.length === 0 ? (

            <div
              style={{
                height: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: safeTheme.textMuted,
                fontSize: '12px'
              }}
            >
              No active site deployments.
            </div>

          ) : (

            <div
              style={{
                width: '100%',
                height: '300px'
              }}
            >

              <ResponsiveContainer>
                <BarChart
                  data={
                    siteChartData.slice(0, 10)
                  }
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 30
                  }}
                  onClick={(state) => {

                    const index =
                      state?.activeTooltipIndex;

                    if (
                      index === undefined ||
                      index === null
                    ) {
                      return;
                    }

                    const site =
                      siteChartData[
                        Number(index)
                      ];

                    if (site?.name) {
                      goTo(
                        `SITE:${site.name}`
                      );
                    }

                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={
                      safeTheme.border
                    }
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    stroke={
                      safeTheme.textMuted
                    }
                    tick={{
                      fontSize: 10
                    }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />

                  <YAxis
                    stroke={
                      safeTheme.textMuted
                    }
                    tick={{
                      fontSize: 10
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        safeTheme.cardBg,
                      borderColor:
                        safeTheme.border,
                      color:
                        safeTheme.textMain,
                      borderRadius:
                        '8px'
                    }}
                  />

                  <Bar
                    dataKey="deployed"
                    name="Deployed units"
                    fill={
                      safeTheme.accentBlue
                    }
                    radius={
                      [4, 4, 0, 0]
                    }
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>

          )}

          {siteChartData.length > 10 && (

            <div
              style={{
                marginTop: '5px',
                fontSize: '10px',
                color: safeTheme.textMuted,
                textAlign: 'center'
              }}
            >
              Showing top 10 sites.
              Click a site or "View sites"
              for the full drill-down.
            </div>

          )}

        </div>


        {/* RETURN CONDITION */}

        <div
          style={safeStyles.box}
        >

          <SectionHeader
            icon={Activity}
            title="Return condition quality"
            subtitle="Condition profile of recovered equipment."
            action="View returns"
            onAction={() =>
              goTo('RETURNS')
            }
          />

          {conditionData.length === 0 ? (

            <div
              style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: safeTheme.textMuted,
                fontSize: '12px'
              }}
            >
              No return records available.
            </div>

          ) : (

            <div
              style={{
                width: '100%',
                height: '300px'
              }}
            >

              <ResponsiveContainer>

                <PieChart>

                  <Pie
                    data={conditionData}
                    cx="50%"
                    cy="46%"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(entry) => {

                      if (
                        entry?.name
                      ) {
                        goTo(
                          `RETURN_CONDITION:${entry.name}`
                        );
                      }

                    }}
                  >

                    <Cell
                      fill={
                        safeConditionColors.Good
                      }
                    />

                    <Cell
                      fill={
                        safeConditionColors.Worn
                      }
                    />

                    <Cell
                      fill={
                        safeConditionColors.Damaged
                      }
                    />

                  </Pie>

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        safeTheme.cardBg,
                      borderColor:
                        safeTheme.border,
                      color:
                        safeTheme.textMain
                    }}
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                  />

                </PieChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>

      </div>


      {/* ===================================================
          CONTRACTOR RISK MATRIX
      =================================================== */}

      <div
        style={{
          ...safeStyles.box,
          marginBottom: '26px'
        }}
      >

        <SectionHeader
          icon={Users}
          title="Contractor operational health"
          subtitle="Custodians ranked by return compliance and equipment condition."
          action="View contractors"
          onAction={() =>
            goTo('CONTRACTORS')
          }
        />

        {contractorHealth.length === 0 ? (

          <div
            style={{
              padding: '30px',
              textAlign: 'center',
              color: safeTheme.textMuted,
              fontSize: '12px'
            }}
          >
            No contractor activity available.
          </div>

        ) : (

          <div
            style={{
              overflowX: 'auto'
            }}
          >

            <table
              style={safeStyles.table}
            >

              <thead>

                <tr>

                  <th
                    style={safeStyles.th}
                  >
                    Contractor
                  </th>

                  <th
                    style={safeStyles.th}
                  >
                    Company
                  </th>

                  <th
                    style={safeStyles.th}
                  >
                    Deployed
                  </th>

                  <th
                    style={safeStyles.th}
                  >
                    Outstanding
                  </th>

                  <th
                    style={safeStyles.th}
                  >
                    Return compliance
                  </th>

                  <th
                    style={safeStyles.th}
                  >
                    Condition health
                  </th>

                  <th
                    style={safeStyles.th}
                  >
                    Risk score
                  </th>

                  <th
                    style={safeStyles.th}
                  >
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {contractorHealth
                  .slice(0, 10)
                  .map(
                    (contractor) => (

                      <tr
                        key={contractor.id}
                        className="executive-row"
                        onClick={() =>
                          goTo(
                            `CONTRACTOR:${contractor.id}`
                          )
                        }
                        style={{
                          cursor:
                            'pointer',
                          backgroundColor:
                            contractor.risk ===
                            'danger'
                              ? 'rgba(220,38,38,0.045)'
                              : 'transparent'
                        }}
                      >

                        <td
                          style={safeStyles.td}
                        >
                          <strong>
                            {contractor.name}
                          </strong>
                        </td>

                        <td
                          style={safeStyles.td}
                        >
                          {contractor.company}
                        </td>

                        <td
                          style={safeStyles.td}
                        >
                          {contractor.loanedUnits}
                        </td>

                        <td
                          style={{
                            ...safeStyles.td,
                            color:
                              contractor.outstandingUnits >
                              0
                                ? safeTheme.accentAmber
                                : safeTheme.textMain,
                            fontWeight:
                              contractor.outstandingUnits >
                              0
                                ? '700'
                                : '400'
                          }}
                        >
                          {contractor.outstandingUnits}
                        </td>

                        <td
                          style={safeStyles.td}
                        >
                          {contractor.returnCompliance}%
                        </td>

                        <td
                          style={safeStyles.td}
                        >
                          {contractor.conditionHealth}%
                        </td>

                        <td
                          style={safeStyles.td}
                        >
                          <strong>
                            {contractor.riskScore}%
                          </strong>
                        </td>

                        <td
                          style={safeStyles.td}
                        >

                          <StatusBadge
                            type={
                              contractor.risk
                            }
                          >
                            {contractor.risk ===
                            'danger'
                              ? 'HIGH RISK'
                              : contractor.risk ===
                                'warning'
                              ? 'WATCH'
                              : 'HEALTHY'}
                          </StatusBadge>

                        </td>

                      </tr>

                    )
                  )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ===================================================
          EXECUTIVE FOOTER / DRILL DOWN
      =================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '10px'
        }}
      >

        <button
          onClick={() =>
            goTo('ALL')
          }
          className="executive-clickable"
          style={{
            border:
              `1px solid ${safeTheme.border}`,
            backgroundColor:
              safeTheme.cardBg,
            color:
              safeTheme.textMain,
            borderRadius: '10px',
            padding: '13px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >

          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: '700'
            }}
          >
            <LayoutGrid
              size={16}
              color={
                safeTheme.accentBlue
              }
            />
            Full inventory
          </span>

          <ChevronRight
            size={15}
            color={
              safeTheme.textMuted
            }
          />

        </button>


        <button
          onClick={() =>
            goTo('OVERDUE')
          }
          className="executive-clickable"
          style={{
            border:
              `1px solid ${safeTheme.border}`,
            backgroundColor:
              safeTheme.cardBg,
            color:
              safeTheme.textMain,
            borderRadius: '10px',
            padding: '13px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >

          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: '700'
            }}
          >
            <AlertTriangle
              size={16}
              color={
                safeTheme.accentCrimson
              }
            />
            Overdue actions
          </span>

          <ChevronRight
            size={15}
            color={
              safeTheme.textMuted
            }
          />

        </button>


        <button
          onClick={() =>
            goTo('RETURNS')
          }
          className="executive-clickable"
          style={{
            border:
              `1px solid ${safeTheme.border}`,
            backgroundColor:
              safeTheme.cardBg,
            color:
              safeTheme.textMain,
            borderRadius: '10px',
            padding: '13px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >

          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: '700'
            }}
          >
            <CheckCircle
              size={16}
              color={
                safeTheme.accentEmerald
              }
            />
            Returns intelligence
          </span>

          <ChevronRight
            size={15}
            color={
              safeTheme.textMuted
            }
          />

        </button>


        <button
          onClick={() =>
            goTo('CONTRACTORS')
          }
          className="executive-clickable"
          style={{
            border:
              `1px solid ${safeTheme.border}`,
            backgroundColor:
              safeTheme.cardBg,
            color:
              safeTheme.textMain,
            borderRadius: '10px',
            padding: '13px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >

          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: '700'
            }}
          >
            <Users
              size={16}
              color={
                safeTheme.accentCyan
              }
            />
            Contractor intelligence
          </span>

          <ChevronRight
            size={15}
            color={
              safeTheme.textMuted
            }
          />

        </button>

      </div>

    </div>
  );
}