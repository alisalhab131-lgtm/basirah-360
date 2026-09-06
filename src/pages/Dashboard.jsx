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
  MapPin
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

import { THEME, CONDITION_COLORS, STYLES } from '../utils/theme';

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
   ALERT ANIMATION
========================================================= */

const alertAnimationStyles = `
  @keyframes flashRed {
    0% {
      border-color: rgba(220, 38, 38, 0.4);
      box-shadow: 0 0 0px rgba(220, 38, 38, 0);
    }

    50% {
      border-color: rgba(220, 38, 38, 1);
      box-shadow: 0 0 14px rgba(220, 38, 38, 0.6);
    }

    100% {
      border-color: rgba(220, 38, 38, 0.4);
      box-shadow: 0 0 0px rgba(220, 38, 38, 0);
    }
  }

  .flash-alert-card {
    animation: flashRed 1.5s infinite ease-in-out !important;
    background-color: rgba(220, 38, 38, 0.08) !important;
  }
`;

/* =========================================================
   KPI CARD
========================================================= */

function KpiCard({
  icon: Icon = AlertTriangle,
  label = '',
  value = 0,
  color = '#3b82f6',
  onClick,
  subtitle,
  isAlert
}) {
  return (
    <div
      onClick={onClick}
      className={isAlert ? 'flash-alert-card' : ''}
      style={{
        backgroundColor: safeTheme.cardBg,
        border: `1px solid ${
          isAlert
            ? safeTheme.accentCrimson
            : safeTheme.border
        }`,
        padding: '20px 24px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          backgroundColor: isAlert
            ? `${safeTheme.accentCrimson}25`
            : `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon
          size={22}
          color={
            isAlert
              ? safeTheme.accentCrimson
              : color
          }
        />
      </div>

      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: '600',
            color: safeTheme.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '4px'
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: '26px',
            fontWeight: '700',
            color: isAlert
              ? safeTheme.accentCrimson
              : safeTheme.textMain,
            lineHeight: 1
          }}
        >
          {value}
        </div>

        {subtitle && (
          <div
            style={{
              fontSize: '12px',
              color: isAlert
                ? safeTheme.accentCrimson
                : safeTheme.textMuted,
              marginTop: '4px',
              fontWeight: isAlert ? '600' : '400'
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD PAGE
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
     1. SAFE DATA WRAPPERS
  ======================================================= */

  const safeMaterials = Array.isArray(materials)
    ? materials
    : [];

  const safeContractors = Array.isArray(contractors)
    ? contractors
    : [];

  const safeLoans = Array.isArray(loans)
    ? loans
    : [];

  const safeReturns = Array.isArray(returns)
    ? returns
    : [];

  const safeGetRem =
    typeof getLoanRemainingQty === 'function'
      ? getLoanRemainingQty
      : () => 0;

  /* =======================================================
     2. DASHBOARD STOCK CALCULATIONS

     IMPORTANT:
     These variables intentionally have Dashboard-specific
     names so they cannot be confused with Analytics variables.
  ======================================================= */

  const dashboardAvailable = safeMaterials.reduce(
    (total, material) =>
      total + Number(material?.quantity || 0),
    0
  );

  const dashboardDeployed = safeLoans.reduce(
    (total, loan) =>
      total + Number(safeGetRem(loan?.id) || 0),
    0
  );

  const dashboardTotalStock =
    dashboardAvailable + dashboardDeployed;

  const dashboardUtilizationRate =
    dashboardTotalStock > 0
      ? Math.round(
          (dashboardDeployed / dashboardTotalStock) * 100
        )
      : 0;

  /* =======================================================
     3. OVERDUE & GHOST ASSETS
  ======================================================= */

  const overdueLoans = safeLoans.filter((loan) => {
    const remaining = Number(
      safeGetRem(loan?.id) || 0
    );

    if (
      remaining <= 0 ||
      !loan?.expected_return_date
    ) {
      return false;
    }

    const date = new Date(
      loan.expected_return_date
    );

    return (
      !isNaN(date.getTime()) &&
      date < now
    );
  });

  const severeOverdueLoans = safeLoans.filter(
    (loan) => {
      const remaining = Number(
        safeGetRem(loan?.id) || 0
      );

      if (
        remaining <= 0 ||
        !loan?.expected_return_date
      ) {
        return false;
      }

      const date = new Date(
        loan.expected_return_date
      );

      if (isNaN(date.getTime())) {
        return false;
      }

      const daysOverdue =
        (now - date) /
        (1000 * 60 * 60 * 24);

      return daysOverdue > 14;
    }
  );

  const severeOverdueQty =
    severeOverdueLoans.reduce(
      (total, loan) =>
        total +
        Number(
          safeGetRem(loan?.id) || 0
        ),
      0
    );

  /* =======================================================
     4. RETURNS / MATERIAL CONDITIONS
  ======================================================= */

  const returnQty = (item) =>
    Number(item?.quantity || 0);

  const totalGoodQty =
    safeReturns
      .filter(
        (item) =>
          item?.returned_condition === 'Good'
      )
      .reduce(
        (total, item) =>
          total + returnQty(item),
        0
      );

  const totalWornQty =
    safeReturns
      .filter(
        (item) =>
          item?.returned_condition === 'Worn'
      )
      .reduce(
        (total, item) =>
          total + returnQty(item),
        0
      );

  const totalDamagedQty =
    safeReturns
      .filter(
        (item) =>
          item?.returned_condition === 'Damaged'
      )
      .reduce(
        (total, item) =>
          total + returnQty(item),
        0
      );

  const totalReturnedQty =
    safeReturns.reduce(
      (total, item) =>
        total + returnQty(item),
      0
    );

  /* =======================================================
     5. SITE DEPLOYMENT AGGREGATES
  ======================================================= */

  const siteChartData = Object.values(
    safeLoans.reduce((accumulator, loan) => {
      const remaining = Number(
        safeGetRem(loan?.id) || 0
      );

      if (
        remaining <= 0 ||
        !loan?.site_name
      ) {
        return accumulator;
      }

      const site = String(
        loan.site_name
      ).trim();

      if (!accumulator[site]) {
        accumulator[site] = {
          name: site,
          active: 0,
          overdue: 0
        };
      }

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
        accumulator[site].overdue +=
          remaining;
      } else {
        accumulator[site].active +=
          remaining;
      }

      return accumulator;
    }, {})
  );

  /* =======================================================
     6. CONDITION CHART DATA
  ======================================================= */

  const conditionData = [
    {
      name: 'Good',
      value: totalGoodQty
    },
    {
      name: 'Worn',
      value: totalWornQty
    },
    {
      name: 'Damaged',
      value: totalDamagedQty
    }
  ].filter(
    (item) => item.value > 0
  );

  /* =======================================================
     7. CONTRACTOR HEALTH MATRIX
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
              String(
                contractor?.id
              )
          );

        const loanIds =
          contractorLoans.map(
            (loan) => loan?.id
          );

        const loaned =
          contractorLoans.reduce(
            (total, loan) =>
              total +
              Number(
                loan?.quantity || 0
              ),
            0
          );

        const contractorReturns =
          safeReturns.filter(
            (item) =>
              loanIds.includes(
                Number(item?.loan_id)
              )
          );

        const returnedQty =
          contractorReturns.reduce(
            (total, item) =>
              total +
              returnQty(item),
            0
          );

        const goodQty =
          contractorReturns
            .filter(
              (item) =>
                item?.returned_condition ===
                'Good'
            )
            .reduce(
              (total, item) =>
                total +
                returnQty(item),
              0
            );

        const stillOut = Math.max(
          0,
          loaned - returnedQty
        );

        const returnComplianceRate =
          loaned > 0
            ? Math.round(
                (returnedQty /
                  loaned) *
                  100
              )
            : 100;

        const conditionRate =
          returnedQty > 0
            ? Math.round(
                (goodQty /
                  returnedQty) *
                  100
              )
            : 100;

        const compositeScore =
          Math.round(
            returnComplianceRate *
              0.6 +
              conditionRate *
              0.4
          );

        return {
          id:
            contractor?.id ||
            Math.random(),

          name:
            contractor?.contact_person ||
            'Unknown Contact',

          company:
            contractor?.company_name ||
            'N/A',

          loaned,

          returnedQty,

          stillOut,

          returnComplianceRate,

          conditionRate,

          compositeScore,

          isHighRisk:
            compositeScore < 50 ||
            (
              stillOut > 15 &&
              returnComplianceRate < 40
            )
        };
      })
      .filter(
        (contractor) =>
          contractor.loaned > 0
      )
      .sort(
        (a, b) =>
          a.compositeScore -
          b.compositeScore
      )
      .slice(0, 8);

  /* =======================================================
     8. NAVIGATION
  ======================================================= */

  const goTo = (filter) => {
    if (
      typeof navigateToAssets ===
      'function'
    ) {
      navigateToAssets(filter);
    }
  };

  /* =======================================================
     9. RENDER
  ======================================================= */

  return (
    <div>
      <style>
        {alertAnimationStyles}
      </style>

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px'
        }}
      >
        <h2
          style={{
            fontSize: '22px',
            fontWeight: '700',
            margin: 0,
            color: safeTheme.textMain
          }}
        >
          Telemetry Dashboard
        </h2>

        <div
          style={{
            fontSize: '12px',
            color: safeTheme.textMuted
          }}
        >
          {now.toLocaleDateString(
            'en-GB',
            {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }
          )}
        </div>
      </div>

      {/* =================================================
          PRIMARY STOCK KPIs
      ================================================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <KpiCard
          icon={LayoutGrid}
          label="Total Stock"
          value={dashboardTotalStock}
          color={safeTheme.accentBlue}
          onClick={() =>
            goTo('ALL')
          }
        />

        <KpiCard
          icon={Package}
          label="Vault Reserve"
          value={dashboardAvailable}
          color={safeTheme.accentEmerald}
          onClick={() =>
            goTo('AVAILABLE')
          }
        />

        <KpiCard
          icon={ArrowLeftRight}
          label="Active Deployments"
          value={dashboardDeployed}
          color={safeTheme.accentAmber}
          onClick={() =>
            goTo('LENDED')
          }
        />

        <KpiCard
          icon={AlertTriangle}
          label="Ghost Assets (>14d)"
          value={`${severeOverdueQty} units`}
          color={safeTheme.accentCrimson}
          isAlert={
            severeOverdueQty > 0
          }
          onClick={() =>
            goTo('OVERDUE')
          }
          subtitle={`${severeOverdueLoans.length} unrecovered critical loans`}
        />
      </div>

      {/* =================================================
          SECONDARY KPIs
      ================================================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <KpiCard
          icon={TrendingUp}
          label="Utilization Rate"
          value={`${dashboardUtilizationRate}%`}
          color={safeTheme.accentPurple}
          subtitle={`${dashboardDeployed} of ${dashboardTotalStock} units out`}
        />

        <KpiCard
          icon={AlertTriangle}
          label="Total Overdue"
          value={overdueLoans.length}
          color={safeTheme.accentAmber}
          subtitle="Loans past expected return"
          onClick={() =>
            goTo('OVERDUE')
          }
        />

        <KpiCard
          icon={CheckCircle}
          label="Good Returns (qty)"
          value={totalGoodQty}
          color={safeTheme.accentEmerald}
          subtitle="Returned in good condition"
        />

        <KpiCard
          icon={Wrench}
          label="Worn Returns (qty)"
          value={totalWornQty}
          color={safeTheme.accentAmber}
          subtitle="Needs service review"
        />

        <KpiCard
          icon={XCircle}
          label="Damaged Returns (qty)"
          value={totalDamagedQty}
          color={safeTheme.accentCrimson}
          subtitle="Requires repair or scrap"
        />

        <KpiCard
          icon={Users}
          label="Contractors"
          value={safeContractors.length}
          color={safeTheme.accentCyan}
          subtitle="Registered custodians"
        />

        <KpiCard
          icon={MapPin}
          label="Active Sites"
          value={siteChartData.length}
          color={safeTheme.accentAmber}
          subtitle="Sites with deployments"
        />

        <KpiCard
          icon={Package}
          label="Total Returned (qty)"
          value={totalReturnedQty}
          color={safeTheme.accentBlue}
          subtitle="All-time recoveries"
        />
      </div>

      {/* =================================================
          CHARTS
      ================================================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}
      >
        {/* SITE DEPLOYMENT CHART */}

        <div style={safeStyles.box}>
          <div style={safeStyles.label}>
            Deployments by Site
          </div>

          <div
            style={{
              width: '100%',
              height: 280
            }}
          >
            <ResponsiveContainer>
              <BarChart
                data={siteChartData}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    safeTheme.border
                  }
                />

                <XAxis
                  dataKey="name"
                  stroke={
                    safeTheme.textMuted
                  }
                  tick={{
                    fontSize: 11
                  }}
                />

                <YAxis
                  stroke={
                    safeTheme.textMuted
                  }
                  tick={{
                    fontSize: 11
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      safeTheme.cardBg,
                    borderColor:
                      safeTheme.border,
                    color: '#fff'
                  }}
                />

                <Legend />

                <Bar
                  dataKey="active"
                  name="Active"
                  fill={
                    safeTheme.accentAmber
                  }
                  stackId="a"
                />

                <Bar
                  dataKey="overdue"
                  name="Overdue"
                  fill={
                    safeTheme.accentCrimson
                  }
                  stackId="a"
                  radius={[
                    4,
                    4,
                    0,
                    0
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RETURN CONDITION CHART */}

        <div style={safeStyles.box}>
          <div style={safeStyles.label}>
            Return Condition Mix
          </div>

          <div
            style={{
              width: '100%',
              height: 280
            }}
          >
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={conditionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({
                    name,
                    percent
                  }) =>
                    `${name} ${(
                      percent * 100
                    ).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  <Cell
                    fill={
                      safeConditionColors.Good ||
                      '#10b981'
                    }
                  />

                  <Cell
                    fill={
                      safeConditionColors.Worn ||
                      '#f59e0b'
                    }
                  />

                  <Cell
                    fill={
                      safeConditionColors.Damaged ||
                      '#ef4444'
                    }
                  />
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      safeTheme.cardBg,
                    borderColor:
                      safeTheme.border,
                    color: '#fff'
                  }}
                />

                <Legend
                  verticalAlign="bottom"
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* =================================================
          CONTRACTOR HEALTH MATRIX
      ================================================= */}

      <div style={safeStyles.box}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px'
          }}
        >
          <Users
            size={16}
            color={
              safeTheme.accentCyan
            }
          />

          <div
            style={{
              ...safeStyles.label,
              marginBottom: 0
            }}
          >
            Contractor Risk & Health Matrix
          </div>
        </div>

        <p
          style={{
            fontSize: '12px',
            color: safeTheme.textMuted,
            marginBottom: '14px'
          }}
        >
          Ranked by risk profile.
          High-risk custodians with
          poor return compliance or
          unreturned volume are
          highlighted.
        </p>

        <table
          style={
            safeStyles.table
          }
        >
          <thead>
            <tr>
              <th style={safeStyles.th}>
                Contractor
              </th>

              <th style={safeStyles.th}>
                Company
              </th>

              <th style={safeStyles.th}>
                Loaned
              </th>

              <th style={safeStyles.th}>
                Returned
              </th>

              <th style={safeStyles.th}>
                Still Out
              </th>

              <th style={safeStyles.th}>
                Return Rate
              </th>

              <th style={safeStyles.th}>
                Condition Health
              </th>

              <th style={safeStyles.th}>
                Risk Score
              </th>
            </tr>
          </thead>

          <tbody>
            {contractorHealth.length ===
            0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    ...safeStyles.td,
                    textAlign:
                      'center',
                    color:
                      safeTheme.textMuted
                  }}
                >
                  No contractor activity
                  yet
                </td>
              </tr>
            ) : (
              contractorHealth.map(
                (contractor) => (
                  <tr
                    key={
                      contractor.id
                    }
                    style={{
                      backgroundColor:
                        contractor.isHighRisk
                          ? 'rgba(220, 38, 38, 0.06)'
                          : 'transparent'
                    }}
                  >
                    <td
                      style={
                        safeStyles.td
                      }
                    >
                      <strong>
                        {
                          contractor.name
                        }
                      </strong>
                    </td>

                    <td
                      style={
                        safeStyles.td
                      }
                    >
                      {
                        contractor.company
                      }
                    </td>

                    <td
                      style={
                        safeStyles.td
                      }
                    >
                      {
                        contractor.loaned
                      }
                    </td>

                    <td
                      style={
                        safeStyles.td
                      }
                    >
                      {
                        contractor.returnedQty
                      }
                    </td>

                    <td
                      style={{
                        ...safeStyles.td,
                        color:
                          contractor.stillOut >
                          0
                            ? safeTheme.accentAmber
                            : safeTheme.textMain
                      }}
                    >
                      {
                        contractor.stillOut
                      }
                    </td>

                    <td
                      style={
                        safeStyles.td
                      }
                    >
                      {
                        contractor.returnComplianceRate
                      }%
                    </td>

                    <td
                      style={
                        safeStyles.td
                      }
                    >
                      {
                        contractor.conditionRate
                      }%
                    </td>

                    <td
                      style={
                        safeStyles.td
                      }
                    >
                      <span
                        style={{
                          fontWeight:
                            '700',
                          padding:
                            '2px 8px',
                          borderRadius:
                            '4px',

                          backgroundColor:
                            contractor.compositeScore >=
                            80
                              ? 'rgba(16, 185, 129, 0.15)'
                              : contractor.compositeScore >=
                                50
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(220, 38, 38, 0.2)',

                          color:
                            contractor.compositeScore >=
                            80
                              ? safeTheme.accentEmerald
                              : contractor.compositeScore >=
                                50
                              ? safeTheme.accentAmber
                              : safeTheme.accentCrimson
                        }}
                      >
                        {
                          contractor.compositeScore
                        }%

                        {' '}

                        {contractor.isHighRisk
                          ? '(HIGH RISK)'
                          : ''}
                      </span>
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