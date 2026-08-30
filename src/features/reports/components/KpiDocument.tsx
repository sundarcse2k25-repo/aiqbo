import type { KPIExplanation, KPICategory } from '../types/monthlyPerformance.types'

interface Props {
  kpiExplanations: KPIExplanation[]
}

const CATEGORY_LABELS: Record<KPICategory, string> = {
  profitability: 'Profitability',
  liquidity: 'Liquidity',
  efficiency: 'Efficiency',
  leverage: 'Leverage / Solvency',
  growth: 'Growth & Cash Flow',
}

const IMPORTANCE_COLORS: Record<string, string> = {
  CRITICAL: '#991b1b',
  HIGH: '#c2410c',
  MEDIUM: '#1d4ed8',
  LOW: '#64748b',
}

/**
 * KPI Document — a reference guide explaining every KPI the Monthly
 * Performance Report can produce: its formula, what it measures, how to
 * read it, and its editorial importance tier.
 *
 * Presentation-only: reads the same static KPI_EXPLANATIONS metadata the
 * Monthly Performance Report itself uses, so the two never drift apart.
 */
export default function KpiDocument({ kpiExplanations }: Props) {
  const categories: KPICategory[] = ['profitability', 'liquidity', 'efficiency', 'leverage', 'growth']

  return (
    <div className="report-container">
      <h2 className="report-title">KPI Document</h2>
      <p className="report-subtitle">Definitions, formulas, and interpretation for every KPI in the Monthly Performance Report.</p>

      {categories.map((category) => {
        const items = kpiExplanations.filter((k) => k.category === category)
        if (items.length === 0) return null

        return (
          <div key={category} style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>{CATEGORY_LABELS[category]}</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>KPI</th>
                  <th>Formula</th>
                  <th>Description</th>
                  <th>Interpretation</th>
                  <th>Direction</th>
                  <th>Importance</th>
                </tr>
              </thead>
              <tbody>
                {items.map((kpi) => (
                  <tr key={kpi.key}>
                    <td><strong>{kpi.name}</strong></td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{kpi.formula}</td>
                    <td>{kpi.description}</td>
                    <td>{kpi.interpretation}</td>
                    <td>{kpi.direction.replace(/_/g, ' ')}</td>
                    <td>
                      <span
                        className="badge"
                        style={{ backgroundColor: '#f1f5f9', color: IMPORTANCE_COLORS[kpi.importance] }}
                      >
                        {kpi.importance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
