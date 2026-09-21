<script setup lang="ts">
import type { RouteMapData } from '../../data/routeMaps/west'

const props = defineProps<{
  data: RouteMapData
  itineraryName: string
}>()

const { t } = useI18n()

const root = ref<HTMLElement | null>(null)
const mapwrap = ref<HTMLElement | null>(null)
const daysEl = ref<HTMLElement | null>(null)
const cardEl = ref<HTMLElement | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)

const pinned = ref(false)
const activeDay = ref(-1)

let cleanup: Array<() => void> = []

onMounted(async () => {
  track('view_route_map', { itinerary_name: props.itineraryName })

  const d3 = await import('d3')
  const wrap = mapwrap.value
  const svgRoot = svgEl.value
  const card = cardEl.value
  const daysRoot = daysEl.value
  const host = root.value

  if (!wrap || !svgRoot || !card || !daysRoot || !host) {
    return
  }

  const mapWrap = wrap
  const dayCard = card
  const dayList = daysRoot
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const svg = d3.select(svgRoot)
  const DAYS = props.data.days
  const WPTS = props.data.waypoints
  const NAMES = props.data.names
  const GEO = props.data.geo

  let proj: d3.GeoProjection
  let routeEl: SVGPathElement
  let routeLen = 0
  let stopS: Array<number> = []
  let yachtG: d3.Selection<SVGGElement, unknown, null, undefined>
  let yachtL = 0
  let targetL = 0
  let drawing = true
  let raf = 0
  let drawRaf = 0
  let hideT = 0
  let firstBuilt = false
  let lastW = wrap.clientWidth
  let lastH = wrap.clientHeight

  function placeYacht(length: number): void {
    const L = Math.max(1, Math.min(routeLen - 1, length))
    const p = routeEl.getPointAtLength(L)
    yachtG.attr('transform', `translate(${p.x},${p.y})`)
  }

  function idleYacht(): void {
    cancelAnimationFrame(raf)
    let last = performance.now()

    function loop(now: number): void {
      const dt = Math.min(50, now - last)
      last = now
      yachtL += (targetL - yachtL) * (1 - Math.exp(-dt / 280))
      placeYacht(yachtL + (reduced ? 0 : Math.sin(now / 700) * 1.2))
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
  }

  function startDraw(): void {
    const DUR = 11000
    const t0 = performance.now()
    const revealed = new Set<number>()

    function frame(now: number): void {
      const t = Math.min(1, (now - t0) / DUR)
      const e = d3.easeCubicInOut(t)
      const drawn = routeLen * e
      routeEl.style.strokeDashoffset = String(routeLen - drawn)
      yachtL = drawn
      targetL = routeLen
      placeYacht(yachtL)
      svg.selectAll<SVGGElement, typeof DAYS[number]>('.stop').each(function (_, i) {
        const stopAt = stopS[i] ?? 0
        if (!revealed.has(i) && drawn >= stopAt - 2) {
          revealed.add(i)
          d3.select(this).transition().duration(500).style('opacity', 1)
        }
      })
      if (t < 1) {
        drawRaf = requestAnimationFrame(frame)
      } else {
        drawing = false
        svg.selectAll('.stop').style('opacity', 1)
        if (activeDay.value >= 0) {
          targetL = stopS[activeDay.value] ?? routeLen
        }
        idleYacht()
      }
    }

    drawRaf = requestAnimationFrame(frame)
  }

  function unfocus(force = false): void {
    if (pinned.value && !force) {
      return
    }

    window.clearTimeout(hideT)
    hideT = window.setTimeout(() => {
      pinned.value = false
      activeDay.value = -1
      dayCard.classList.remove('show')
      dayCard.setAttribute('aria-hidden', 'true')
      dayList.querySelectorAll('.dayrow').forEach((row) => {
        row.classList.remove('active')
        row.setAttribute('aria-pressed', 'false')
      })
      svg.selectAll('.stop').classed('on', false).selectAll('.dot').attr('r', 5.5)
      if (!drawing) {
        targetL = routeLen
      }
    }, 140)
  }

  function focusDay(i: number, pin = false): void {
    window.clearTimeout(hideT)
    if (pin) {
      pinned.value = true
    }
    activeDay.value = i
    const day = DAYS[i]
    if (!day) {
      return
    }
    dayList.querySelectorAll('.dayrow').forEach((row, k) => {
      row.classList.toggle('active', k === i)
      row.setAttribute('aria-pressed', String(pinned.value && k === i))
    })
    dayCard.setAttribute('aria-hidden', 'false')
    svg.selectAll('.stop').classed('on', (_, k) => k === i)
    svg.selectAll('.stop').each(function () {
      const on = d3.select(this).classed('on')
      d3.select(this).select('.dot').attr('r', on ? 8 : 5.5)
    })
    if (!drawing) {
      targetL = stopS[i] ?? routeLen
    }
    const sites = (day.am ? `<b>AM</b>${day.am}<br>` : '') + (day.pm ? `<b>PM</b>${day.pm}` : '')
    dayCard.innerHTML = `<div class="cday">Day ${day.d} · ${day.wd}</div><h2>${day.title}</h2>
      <div class="sites">${sites}</div><p>${day.desc}</p>
      <div class="tags">${day.wild.map(w => `<span class="tag w">${w}</span>`).join('')}${day.acts.map(a => `<span class="tag">${a}</span>`).join('')}</div>`
    const p = proj([day.lon, day.lat]) as [number, number]
    const W = mapWrap.clientWidth
    const H = mapWrap.clientHeight
    dayCard.classList.add('show')
    const cw = Math.min(308, W - 24)
    const ch = dayCard.offsetHeight || 260
    dayCard.style.width = `${cw}px`
    let x = p[0] + 26
    let y = p[1] - ch / 2
    if (x + cw > W - 18) {
      x = p[0] - cw - 26
    }
    if (x < 12) {
      x = 12
    }
    y = Math.max(12, Math.min(H - ch - 12, y))
    dayCard.style.left = `${x}px`
    dayCard.style.top = `${y}px`
  }

  function buildRail(): void {
    dayList.replaceChildren()
    DAYS.forEach((day, i) => {
      const btn = document.createElement('button')
      btn.className = 'dayrow'
      btn.type = 'button'
      btn.dataset.i = String(i)
      btn.setAttribute('aria-label', t('map.dayAria', { n: day.d, wd: day.wd, title: day.title }))
      btn.innerHTML = `<span class="n">${day.d}</span><span class="t">${day.title}<small>${day.wd}</small></span>`
      btn.addEventListener('mouseenter', () => focusDay(i))
      btn.addEventListener('mouseleave', () => unfocus())
      btn.addEventListener('focus', () => focusDay(i))
      btn.addEventListener('blur', () => unfocus())
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (pinned.value && activeDay.value === i) {
          unfocus(true)
        } else {
          focusDay(i, true)
        }
      })
      dayList.appendChild(btn)
    })
  }

  function build(animate: boolean): void {
    cancelAnimationFrame(raf)
    cancelAnimationFrame(drawRaf)
    svg.selectAll('*').remove()
    const W = mapWrap.clientWidth
    const H = mapWrap.clientHeight
    if (W < 10 || H < 10) {
      return
    }

    const g = {
      grat: svg.append('g'),
      land: svg.append('g'),
      names: svg.append('g'),
      route: svg.append('g'),
      stops: svg.append('g'),
      yacht: svg.append('g').attr('id', 'yacht')
    }
    yachtG = g.yacht
    yachtG.append('circle').attr('class', 'wake').attr('r', 14)
    yachtG.append('circle').attr('class', 'plate').attr('r', 12.5)
    yachtG.append('path').attr('class', 'mark').attr('fill-rule', 'evenodd')
      .attr('transform', 'translate(-10,-5.3) scale(0.03333)')
      .attr('d', 'M8.3,306.3C39.8,262.9 52.4,246.3 79.1,213.0C147.0,128.3 221.2,54.7 274.9,18.6C298.8,2.5 301.0,2.5 324.1,17.7C392.9,63.3 489.1,165.6 578.8,288.5L594.9,310.5L547.7,310.8C521.8,310.9 500.3,310.7 499.8,310.2C499.4,309.8 493.6,300.0 487.0,288.6C453.4,230.6 427.6,192.4 392.5,148.5C347.9,92.8 313.1,56.5 302.2,54.4C291.3,52.3 263.7,79.3 213.8,140.7C173.3,190.6 144.8,232.8 105.8,301.0L100.4,310.5L52.6,310.8L4.8,311.0L8.3,306.3ZM182.5,308.8C190.4,282.8 222.9,212.3 243.9,175.8C267.6,134.5 293.1,100.0 300.0,100.0C306.9,100.0 332.4,134.5 356.1,175.8C377.1,212.3 409.6,282.8 417.5,308.8L418.1,311.0L300.0,311.0L181.9,311.0L182.5,308.8Z')

    const narrow = W < 640
    const frame = { type: 'MultiPoint', coordinates: [[-92.15, -1.62], [-88.95, 0.75]] }
    proj = d3.geoMercator().fitExtent(
      [[narrow ? 16 : 30, narrow ? 24 : 40], [W - (narrow ? 16 : 40), H - (narrow ? 24 : 56)]],
      frame as d3.GeoPermissibleObjects
    )
    const pathGen = d3.geoPath(proj)
    g.grat.append('path').attr('class', 'grat').attr('d', pathGen(d3.geoGraticule().step([0.5, 0.5])()))
    g.land.append('path').attr('class', 'island').attr('d', pathGen(GEO as d3.GeoPermissibleObjects))
    g.names.selectAll('text').data(NAMES).join('text').attr('class', 'iname')
      .attr('x', d => proj([d[1], d[2]])?.[0] ?? 0)
      .attr('y', d => proj([d[1], d[2]])?.[1] ?? 0)
      .text(d => d[0])

    const pts = WPTS.map(p => proj([p[0], p[1]]) as [number, number])
    const line = d3.line<[number, number]>().curve(d3.curveCatmullRom.alpha(0.6))
    g.route.append('path').attr('class', 'routeghost').attr('d', line(pts))
    routeEl = g.route.append('path').attr('class', 'route').attr('d', line(pts)).node() as SVGPathElement
    routeLen = routeEl.getTotalLength()
    routeEl.style.strokeDasharray = String(routeLen)
    routeEl.style.strokeDashoffset = (animate && !reduced) ? String(routeLen) : '0'

    const stopIdx = WPTS
      .map((p, i) => (p[2] !== undefined ? { day: p[2], i } : null))
      .filter((row): row is { day: number, i: number } => row !== null)
    stopS = new Array(DAYS.length).fill(0)
    const SAMPLES = 800
    const samples: Array<[number, DOMPoint]> = []
    for (let k = 0; k <= SAMPLES; k += 1) {
      const L = routeLen * k / SAMPLES
      samples.push([L, routeEl.getPointAtLength(L)])
    }
    stopIdx.forEach(({ day, i }) => {
      const target = pts[i]
      if (!target) {
        return
      }
      let best = 1e9
      let bestL = 0
      for (const [L, q] of samples) {
        const dd = (q.x - target[0]) ** 2 + (q.y - target[1]) ** 2
        if (dd < best) {
          best = dd
          bestL = L
        }
      }
      stopS[day] = bestL
    })

    const stopSel = g.stops.selectAll('g').data(DAYS).join('g').attr('class', 'stop')
      .attr('transform', (d) => {
        const p = proj([d.lon, d.lat]) as [number, number]
        return `translate(${p[0]},${p[1]})`
      })
      .style('opacity', (animate && !reduced) ? 0 : 1)
    stopSel.append('circle').attr('class', 'halo').attr('r', 9)
    stopSel.append('circle').attr('class', 'dot').attr('r', 5.5)
    stopSel.append('text').attr('class', 'dnum').attr('y', -15).text(d => d.d)
    stopSel
      .on('mouseenter', (_, d) => focusDay(DAYS.indexOf(d)))
      .on('mouseleave', () => unfocus())
      .on('click', (e, d) => {
        e.stopPropagation()
        focusDay(DAYS.indexOf(d), true)
      })

    if (!firstBuilt) {
      buildRail()
      firstBuilt = true
    }

    if (animate && !reduced) {
      drawing = true
      startDraw()
    } else {
      drawing = false
      yachtL = targetL = activeDay.value >= 0 ? (stopS[activeDay.value] ?? routeLen) : routeLen
      placeYacht(yachtL)
      idleYacht()
    }
  }

  function boot(): void {
    if (mapWrap.clientWidth < 10 || mapWrap.clientHeight < 10) {
      requestAnimationFrame(boot)
      return
    }
    build(true)
  }

  boot()

  const onResize = (): void => {
    const W = mapWrap.clientWidth
    const H = mapWrap.clientHeight
    if (!firstBuilt || (W === lastW && H === lastH)) {
      return
    }
    lastW = W
    lastH = H
    build(false)
  }

  let rsT = 0
  const onResizeDebounced = (): void => {
    window.clearTimeout(rsT)
    rsT = window.setTimeout(onResize, 200)
  }

  const onWrapClick = (): void => {
    if (pinned.value) {
      unfocus(true)
    }
  }
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && pinned.value) {
      unfocus(true)
    }
  }

  window.addEventListener('resize', onResizeDebounced)
  mapWrap.addEventListener('click', onWrapClick)
  document.addEventListener('keydown', onKey)

  cleanup = [
    () => window.removeEventListener('resize', onResizeDebounced),
    () => mapWrap.removeEventListener('click', onWrapClick),
    () => document.removeEventListener('keydown', onKey),
    () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(drawRaf)
    }
  ]
})

onUnmounted(() => {
  cleanup.forEach(fn => fn())
})
</script>

<template>
  <div
    ref="root"
    class="route-map"
  >
    <div class="stage">
      <div class="rail">
        <div class="eyebrow">
          {{ t('map.eyebrow') }}
        </div>
        <h1>{{ data.title }}</h1>
        <div class="sub">
          <template
            v-for="(line, i) in data.sub"
            :key="line"
          >
            {{ line }}<br v-if="i < data.sub.length - 1">
          </template>
        </div>
        <div
          ref="daysEl"
          class="days"
          role="list"
          :aria-label="t('map.daysAria')"
        />
        <div class="railfoot">
          <div class="sub foot">
            {{ t('map.foot') }}
          </div>
        </div>
      </div>
      <div
        ref="mapwrap"
        class="mapwrap"
      >
        <svg
          ref="svgEl"
          class="map"
        />
        <div
          ref="cardEl"
          class="card"
          role="dialog"
          aria-live="polite"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
</template>
