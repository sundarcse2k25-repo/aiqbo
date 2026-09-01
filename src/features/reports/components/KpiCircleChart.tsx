import type { KPIResult, KPICategory, KPIStatus } from '../types/monthlyPerformance.types'

interface Props {
  kpis: Record<KPICategory, KPIResult[]>
  categoryLabels: Record<KPICategory, string>
}

const STATUS_COLOR: Record<KPIStatus, string> = {
  positive: '#16a34a',
  negative: '#dc2626',
  neutral: '#94a3b8',
  unavailable: '#e2e8f0',
}

const STATUS_GLYPH: Record<KPIStatus, string> = {
  positive: '+',
  negative: '×',
  neutral: '•',
  unavailable: '',
}

const SIZE = 900
const CX = SIZE / 2
const CY = SIZE / 2
const RING_OUTER = 110
const RING_INNER = 85
const KPI_RADIUS = 260
const LABEL_RADIUS = KPI_RADIUS + 16
const CATEGORY_LABEL_RADIUS = 430
const SQUARE = 14
const GAP_DEGREES = 4

function polar(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** SVG arc path for a ring segment between two angles (used for the center donut). */
function ringArcPath(cx: number, cy: number, rOuter: number, rInner: number, startDeg: number, endDeg: number): string {
  const large = endDeg - startDeg > 180 ? 1 : 0
  const p1 = polar(cx, cy, rOuter, startDeg)
  const p2 = polar(cx, cy, rOuter, endDeg)
  const p3 = polar(cx, cy, rInner, endDeg)
  const p4 = polar(cx, cy, rInner, startDeg)
  return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y} Z`
}

/** Shortens a KPI name for radial display, e.g. "Return on Capital Employed (ROCE)" -> "ROCE". */
function shortLabel(name: string): string {
  const parenMatch = name.match(/\(([^)]+)\)\s*$/)
  if (parenMatch) return parenMatch[1]
  return name
}

/**
 * "KPI Results" circular dashboard, in the spirit of Fathom's radial KPI
 * chart: a center ring summarizing overall status, with every KPI placed
 * around it grouped by category and colored by status, each with a visible
 * radial label (not hover-only).
 *
 * IMPORTANT DIFFERENCE FROM FATHOM'S OWN CHART: Fathom's ring compares each
 * KPI to a budgeted TARGET ("on track" / "off track"). This project has no
 * target/budget data anywhere in the domain model, so inventing that
 * distinction would mean fabricating thresholds — something this project
 * has explicitly avoided throughout. This chart instead uses the KPI's
 * already-computed `status` (its month-over-month trend direction), which
 * is real, already-validated data. The labeling below says "trend", never
 * "on track", to keep that distinction honest.
 */
export default function KpiCircleChart({ kpis, categoryLabels }: Props) {
  const categories = Object.keys(kpis) as KPICategory[]
  const flat = categories.flatMap((cat) => kpis[cat].map((k) => ({ ...k, category: cat })))
  const total = flat.length

  const positive = flat.filter((k) => k.status === 'positive').length
  const negative = flat.filter((k) => k.status === 'negative').length
  const neutral = flat.filter((k) => k.status === 'neutral').length
  const unavailable = flat.filter((k) => k.status === 'unavailable').length
  const scored = positive + negative + neutral
  const positivePercent = scored > 0 ? Math.round((positive / scored) * 100) : 0

  // Allocate each category a slice of the circle proportional to its KPI count.
  let cursor = 0
  const categoryRanges = categories.map((cat) => {
    const count = kpis[cat].length
    const span = total > 0 ? (count / total) * 360 : 0
    const range = { category: cat, start: cursor + GAP_DEGREES / 2, end: cursor + span - GAP_DEGREES / 2, mid: cursor + span / 2, count }
    cursor += span
    return range
  })

  // Center donut: positive share, negative+neutral share, unavailable share (as one grey ring segment at the end).
  const donutSegments: { color: string; startDeg: number; endDeg: number }[] = []
  if (scored > 0) {
    const positiveSpan = (positive / total) * 360
    const otherScoredSpan = ((negative + neutral) / total) * 360
    donutSegments.push({ color: STATUS_COLOR.positive, startDeg: 0, endDeg: positiveSpan })
    donutSegments.push({ color: '#f59e0b', startDeg: positiveSpan, endDeg: positiveSpan + otherScoredSpan })
  }
  if (unavailable > 0) {
    donutSegments.push({ color: STATUS_COLOR.unavailable, startDeg: 360 - (unavailable / total) * 360, endDeg: 360 })
  }

  return (
    <figure style={{ margin: 0 }}>
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`KPI results: ${positivePercent}% trending positive out of ${scored} scored KPIs, ${unavailable} not available, grouped by category around a ring`} style={{ width: '100%', height: 'auto' }}>
          {/* Category arc bands (faint background wedges) */}
          {categoryRanges.map((r) => (
            <path
              key={r.category}
              d={ringArcPath(CX, CY, KPI_RADIUS + 22, KPI_RADIUS - 22, r.start, r.end)}
              fill="currentColor"
              opacity={0.04}
            />
          ))}

          {/* Center donut ring: overall status mix */}
          {donutSegments.map((seg, i) => (
            <path key={i} d={ringArcPath(CX, CY, RING_OUTER, RING_INNER, seg.startDeg, seg.endDeg)} fill={seg.color} />
          ))}
          {scored === 0 && <circle cx={CX} cy={CY} r={(RING_OUTER + RING_INNER) / 2} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={RING_OUTER - RING_INNER} />}

          {/* Center text */}
          <text x={CX} y={CY - 6} textAnchor="middle" fontSize={34} fontWeight={700} fill="currentColor">{positivePercent}%</text>
          <text x={CX} y={CY + 18} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.65}>TRENDING POSITIVE</text>

          {/* KPI status markers + visible radial labels */}
          {flat.map((kpi) => {
            const range = categoryRanges.find((r) => r.category === kpi.category)!
            const indexInCategory = kpis[kpi.category].findIndex((k) => k.key === kpi.key)
            const count = range.count
            const t = count <= 1 ? 0.5 : indexInCategory / (count - 1)
            const angle = range.start + t * (range.end - range.start)
            const squarePos = polar(CX, CY, KPI_RADIUS, angle)
            const labelPos = polar(CX, CY, LABEL_RADIUS, angle)
            const color = STATUS_COLOR[kpi.status]

            // Radial label orientation: flip + right-anchor on the left half
            // of the circle so text never renders upside down.
            const flip = angle > 180
            const rotateDeg = flip ? angle + 90 : angle - 90
            const anchor = flip ? 'end' : 'start'

            return (
              <g key={kpi.key}>
                <line x1={squarePos.x} y1={squarePos.y} x2={labelPos.x} y2={labelPos.y} stroke="currentColor" strokeOpacity={0.15} />
                <g transform={`translate(${squarePos.x - SQUARE / 2}, ${squarePos.y - SQUARE / 2})`}>
                  <title>{`${kpi.name}: ${kpi.status === 'unavailable' ? 'N/A' : kpi.status}`}</title>
                  <rect width={SQUARE} height={SQUARE} rx={3} fill={color} />
                  {STATUS_GLYPH[kpi.status] && (
                    <text x={SQUARE / 2} y={SQUARE / 2 + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#ffffff">
                      {STATUS_GLYPH[kpi.status]}
                    </text>
                  )}
                </g>
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  transform={`rotate(${rotateDeg}, ${labelPos.x}, ${labelPos.y})`}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fontSize={12}
                  fill="currentColor"
                >
                  {shortLabel(kpi.name)}
                </text>
              </g>
            )
          })}

          {/* Category labels */}
          {categoryRanges.map((r) => {
            const pos = polar(CX, CY, CATEGORY_LABEL_RADIUS, r.mid)
            const onLeft = r.mid > 180
            return (
              <text
                key={r.category}
                x={pos.x}
                y={pos.y}
                textAnchor={onLeft ? 'end' : r.mid === 0 || r.mid === 360 ? 'middle' : 'start'}
                fontSize={12}
                fontWeight={700}
                letterSpacing={0.5}
                fill="currentColor"
                opacity={0.8}
              >
                {categoryLabels[r.category].toUpperCase()}
              </text>
            )
          })}
        </svg>
      </div>

      <figcaption style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
        {scored} KPIs scored by trend ({positive} positive, {negative} negative, {neutral} neutral) · {unavailable} not available.
      </figcaption>

      <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '0.75rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: STATUS_COLOR.positive, borderRadius: 2, marginRight: 4 }} />Positive trend</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: STATUS_COLOR.negative, borderRadius: 2, marginRight: 4 }} />Negative trend</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: STATUS_COLOR.neutral, borderRadius: 2, marginRight: 4 }} />Neutral / flat</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: STATUS_COLOR.unavailable, borderRadius: 2, marginRight: 4 }} />N/A</span>
      </div>
    </figure>
  )
}
