#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Catalyze org slide master — navy + gold, data + story layouts.
//
//   node scripts/build-catalyze-master.mjs [outPath]
//     default: working/Catalyze_Master.bento.html
//     release: site/templates/catalyze/index.html  →  bento.page/templates/catalyze
//
// Carries template:true — every open mints a fresh deck. Layouts live in
// doc.layouts and appear under "This document" in Apply layout / New slide.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outPath = process.argv[2] ?? join(root, 'working/Catalyze_Master.bento.html')
const shell = readFileSync(join(root, 'slides/dist-single/Bento_Slides.bento.html'), 'utf8')

const fontSrc = readFileSync(join(root, 'slides/src/fontdata.ts'), 'utf8')
const font = (name) => fontSrc.match(new RegExp(`export const ${name}\\s*=\\s*'(data:[^']+)'`))[1]
const FRAUNCES = font('FRAUNCES_900')
const INSTRUMENT = font('INSTRUMENT_VAR')
const FR = 'Fraunces, Georgia, serif'
const IN = "'Instrument Sans', 'Helvetica Neue', sans-serif"
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace"

// ——— Catalyze brand tokens ———————————————————————————————————————————
const NAVY = '#0C1B33'
const GOLD = '#C9A962'
const WHITE = '#F5F6F8'
const INK = '#0E1A2B'
const CREAM = '#FAF7F2'
const SLATE = 'rgba(14,26,43,0.58)'
const MIST = 'rgba(245,246,248,0.62)'
const FOOT_DARK = 'rgba(245,246,248,0.45)'
const FOOT_LIGHT = 'rgba(14,26,43,0.42)'

// ——— builders ————————————————————————————————————————————————————————
let uid = 0
const nid = (p) => `${p}-${(++uid).toString(36)}`

const text = (o) => ({
  id: o.id ?? nid('t'), type: 'text', x: o.x, y: o.y, w: o.w, h: o.h,
  rotation: o.rotation ?? 0, opacity: o.opacity ?? 1,
  html: o.html ?? '', fontSize: o.fontSize ?? 24, fontFamily: o.fontFamily ?? IN,
  fontWeight: o.fontWeight ?? 400, color: o.color ?? INK,
  align: o.align ?? 'left', valign: o.valign ?? 'top', lineHeight: o.lineHeight ?? 1.3,
  ...(o.placeholder != null ? { placeholder: o.placeholder } : {}),
  ...(o.role ? { role: o.role } : {}),
  ...(o.letterSpacing != null ? { letterSpacing: o.letterSpacing } : {}),
  ...(o.fx ? { fx: o.fx } : {}),
})

const shape = (kind, o) => ({
  id: o.id ?? nid('s'), type: 'shape', shape: kind, x: o.x, y: o.y, w: o.w, h: o.h,
  rotation: o.rotation ?? 0, opacity: o.opacity ?? 1,
  fill: o.fill ?? '#000', stroke: o.stroke ?? 'none', strokeWidth: o.strokeWidth ?? 0,
  radius: o.radius ?? 0,
  ...(o.fillGradient ? { fillGradient: o.fillGradient } : {}),
})

const chart = (o) => ({
  id: o.id ?? nid('c'), type: 'chart', x: o.x, y: o.y, w: o.w, h: o.h,
  rotation: 0, opacity: 1, preset: o.preset ?? 'bar', option: o.option,
})

const img = (o) => ({
  id: o.id ?? nid('im'), type: 'image', x: o.x, y: o.y, w: o.w, h: o.h,
  rotation: o.rotation ?? 0, opacity: o.opacity ?? 1,
  src: o.src ?? '', fit: o.fit ?? 'cover', radius: o.radius ?? 0,
})

const tableEl = (o) => ({
  id: o.id ?? nid('tb'), type: 'table', x: o.x, y: o.y, w: o.w, h: o.h,
  rotation: 0, opacity: 1,
  columns: o.columns ?? [1, 1, 1],
  header: o.header ?? true,
  rows: o.rows,
  style: o.style ?? {},
})

/** Layout placeholder text — empty html, dimmed prompt in the editor. */
const ph = (id, placeholder, { x, y, w, h }, extra = {}) =>
  text({ id, x, y, w, h, placeholder, html: '', ...extra })

/** Shared chrome: wordmark + footer tokens. */
const chrome = (mode = 'light') => {
  const onDark = mode === 'dark'
  return [
    text({
      id: 'cat-logo', x: 96, y: 44, w: 220, h: 32,
      html: 'Catalyze', fontSize: 17, fontWeight: 800,
      color: onDark ? GOLD : NAVY, letterSpacing: 2.5, fontFamily: IN,
    }),
    text({
      id: 'cat-footer', x: 96, y: 672, w: 1088, h: 24,
      html: '{{company}} · {{page:2}} / {{pages}}',
      fontSize: 11, fontWeight: 600, letterSpacing: 2,
      color: onDark ? FOOT_DARK : FOOT_LIGHT, align: 'right', fontFamily: MONO,
    }),
  ]
}

const bar = (id, x, y, w, h, fill = GOLD) =>
  shape('rect', { id, x, y, w, h, fill, radius: h > 6 ? 0 : 2 })

const layout = (id, name, background, elements, transition = 'fade') => ({
  id, name, background, transition, notes: '', elements,
})

const SAMPLE_CHART = {
  grid: { left: 44, right: 16, top: 20, bottom: 32 },
  color: [GOLD],
  xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
  yAxis: { type: 'value' },
  tooltip: { trigger: 'axis' },
  series: [{ type: 'bar', data: [12, 19, 24, 31], itemStyle: { color: GOLD }, barWidth: 64 }],
}

const TABLE_STYLE = {
  headerBg: NAVY, headerColor: WHITE, color: INK,
  borderColor: 'rgba(14,26,43,0.15)', borderWidth: 1,
  cellPadX: 12, cellPadY: 10, fontSize: 15, zebra: true,
  zebraColor: 'rgba(12,27,51,0.04)',
}

// ═══════════════════════════════════════════════════════════════════════
// 14 layouts — story arc (1–7) + data arc (8–14)
// ═══════════════════════════════════════════════════════════════════════
function catalyzeLayouts() {
  return [
    // 1 · Cover
    layout('layout-cat-cover', 'Cover', NAVY, [
      ...chrome('dark'),
      bar('cat-bar', 96, 130, 200, 4),
      ph('cat-title', 'Presentation title', { x: 90, y: 160, w: 1000, h: 200 },
        { fontSize: 72, fontWeight: 800, color: WHITE, lineHeight: 1.02, role: 'title', fontFamily: FR }),
      ph('cat-subtitle', 'Subtitle or event name', { x: 96, y: 380, w: 800, h: 56 },
        { fontSize: 22, color: MIST, role: 'subtitle', lineHeight: 1.4 }),
      ph('cat-kicker', 'DATE · VENUE', { x: 96, y: 480, w: 600, h: 28 },
        { fontSize: 12, fontWeight: 700, letterSpacing: 4, color: GOLD, role: 'kicker' }),
    ], 'none'),

    // 2 · Section divider
    layout('layout-cat-section', 'Section divider', NAVY, [
      ...chrome('dark'),
      ph('cat-kicker', 'SECTION 01', { x: 96, y: 280, w: 400, h: 32 },
        { fontSize: 13, fontWeight: 700, letterSpacing: 4, color: GOLD, role: 'kicker' }),
      bar('cat-bar', 96, 320, 72, 6),
      ph('cat-title', 'Section title', { x: 90, y: 340, w: 1000, h: 120 },
        { fontSize: 56, fontWeight: 800, color: WHITE, role: 'title', fontFamily: FR, lineHeight: 1.05 }),
    ]),

    // 3 · Thesis / manifesto
    layout('layout-cat-thesis', 'Thesis', CREAM, [
      ...chrome('light'),
      bar('cat-bar', 96, 120, 8, 380),
      ph('cat-title', 'One bold statement — two or three lines max', { x: 130, y: 140, w: 980, h: 360 },
        { fontSize: 52, fontWeight: 900, color: INK, role: 'title', fontFamily: FR, lineHeight: 1.12 }),
      ph('cat-body', 'Optional supporting line', { x: 130, y: 540, w: 700, h: 40 },
        { fontSize: 17, color: SLATE, role: 'body' }),
    ]),

    // 4 · Story + image
    layout('layout-cat-story-image', 'Story + image', CREAM, [
      ...chrome('light'),
      ph('cat-title', 'Story headline', { x: 96, y: 100, w: 560, h: 100 },
        { fontSize: 40, fontWeight: 800, color: INK, role: 'title', fontFamily: FR, lineHeight: 1.08 }),
      ph('cat-body', 'Supporting narrative — two or three short paragraphs', { x: 96, y: 220, w: 560, h: 380 },
        { fontSize: 18, color: SLATE, role: 'body', lineHeight: 1.65 }),
      shape('rect', { id: 'cat-img-frame', x: 700, y: 80, w: 484, h: 560, fill: 'rgba(12,27,51,0.06)', radius: 8, stroke: 'rgba(12,27,51,0.12)', strokeWidth: 1 }),
      img({ id: 'cat-image', x: 708, y: 88, w: 468, h: 544, radius: 6 }),
      ph('cat-caption', 'Image caption', { x: 700, y: 648, w: 484, h: 24 },
        { fontSize: 11, color: FOOT_LIGHT, align: 'center', letterSpacing: 1 }),
    ]),

    // 5 · Quote
    layout('layout-cat-quote', 'Quote', WHITE, [
      ...chrome('light'),
      bar('cat-bar', 160, 200, 4, 320),
      ph('cat-body', 'Pull quote — what someone said or the line you want remembered', { x: 200, y: 220, w: 880, h: 220 },
        { fontSize: 36, fontWeight: 600, color: INK, role: 'body', fontFamily: FR, lineHeight: 1.35, valign: 'middle' }),
      ph('cat-subtitle', '— Attribution, role', { x: 200, y: 480, w: 600, h: 36 },
        { fontSize: 16, fontWeight: 600, color: SLATE, role: 'subtitle' }),
    ]),

    // 6 · Three beats
    layout('layout-cat-three-beats', 'Three beats', WHITE, [
      ...chrome('light'),
      ph('cat-title', 'Slide title', { x: 96, y: 88, w: 900, h: 56 },
        { fontSize: 36, fontWeight: 800, color: INK, role: 'title' }),
      bar('cat-bar', 96, 152, 1088, 2, 'rgba(14,26,43,0.12)'),
      ...[0, 1, 2].flatMap((i) => {
        const x = 96 + i * 376
        return [
          shape('rect', { id: `cat-beat-${i}`, x, y: 200, w: 336, h: 400, radius: 10, fill: WHITE, stroke: 'rgba(14,26,43,0.1)', strokeWidth: 1 }),
          bar(`cat-beat-bar-${i}`, x + 24, 230, 40, 4),
          ph(`cat-beat-title-${i}`, `Beat ${i + 1} title`, { x: x + 24, y: 252, w: 288, h: 40 },
            { fontSize: 20, fontWeight: 800, color: INK, role: i === 0 ? 'title' : undefined }),
          ph(`cat-beat-body-${i}`, 'One or two sentences', { x: x + 24, y: 300, w: 288, h: 260 },
            { fontSize: 16, color: SLATE, lineHeight: 1.55, role: i === 0 ? 'body' : undefined }),
        ]
      }),
    ]),

    // 7 · Close / CTA
    layout('layout-cat-close', 'Close', NAVY, [
      ...chrome('dark'),
      bar('cat-bar', 96, 200, 1088, 4),
      ph('cat-title', 'Closing headline', { x: 90, y: 240, w: 1100, h: 160 },
        { fontSize: 64, fontWeight: 800, color: WHITE, role: 'title', fontFamily: FR, lineHeight: 1.05, align: 'center' }),
      ph('cat-subtitle', 'Next step · contact · thank you', { x: 140, y: 430, w: 1000, h: 40 },
        { fontSize: 18, fontWeight: 600, color: MIST, role: 'subtitle', align: 'center', letterSpacing: 1 }),
    ], 'morph'),

    // 8 · Chart + insight
    layout('layout-cat-chart', 'Chart + insight', WHITE, [
      ...chrome('light'),
      ph('cat-title', 'Chart title', { x: 96, y: 88, w: 900, h: 52 },
        { fontSize: 32, fontWeight: 800, color: INK, role: 'title' }),
      bar('cat-bar', 96, 148, 1088, 2, 'rgba(14,26,43,0.1)'),
      chart({ id: 'cat-chart', x: 96, y: 180, w: 720, h: 420, preset: 'bar', option: SAMPLE_CHART }),
      ph('cat-body', 'Key insight — one sentence the chart proves', { x: 860, y: 260, w: 320, h: 200 },
        { fontSize: 20, fontWeight: 600, color: INK, role: 'body', lineHeight: 1.5, valign: 'middle' }),
    ]),

    // 9 · Big number / KPI
    layout('layout-cat-kpi', 'Big number', NAVY, [
      ...chrome('dark'),
      ph('cat-kicker', 'METRIC LABEL', { x: 96, y: 200, w: 500, h: 28 },
        { fontSize: 12, fontWeight: 700, letterSpacing: 4, color: GOLD, role: 'kicker' }),
      ph('cat-title', '42', { x: 90, y: 250, w: 600, h: 180 },
        { fontSize: 120, fontWeight: 900, color: WHITE, role: 'title', fontFamily: IN, lineHeight: 1, fx: { countUp: true } }),
      ph('cat-body', 'What this number means — units, period, context', { x: 96, y: 440, w: 520, h: 80 },
        { fontSize: 20, color: MIST, role: 'body', lineHeight: 1.5 }),
      bar('cat-bar', 720, 220, 4, 280),
      ph('cat-subtitle', 'Supporting detail or comparison', { x: 760, y: 280, w: 420, h: 160 },
        { fontSize: 17, color: MIST, role: 'subtitle', lineHeight: 1.65, valign: 'middle' }),
    ]),

    // 10 · Chart comparison (two metrics)
    layout('layout-cat-chart-compare', 'Chart comparison', WHITE, [
      ...chrome('light'),
      ph('cat-title', 'Comparison title', { x: 96, y: 88, w: 900, h: 48 },
        { fontSize: 32, fontWeight: 800, color: INK, role: 'title' }),
      chart({ id: 'cat-chart-left', x: 96, y: 170, w: 520, h: 440, preset: 'bar', option: {
        ...SAMPLE_CHART,
        xAxis: { type: 'category', data: ['A', 'B', 'C', 'D'] },
        series: [{ type: 'bar', data: [8, 14, 11, 19], itemStyle: { color: NAVY }, barWidth: 48 }],
      } }),
      chart({ id: 'cat-chart-right', x: 664, y: 170, w: 520, h: 440, preset: 'line', option: {
        grid: { left: 44, right: 16, top: 20, bottom: 32 },
        color: [GOLD],
        xAxis: { type: 'category', data: ['A', 'B', 'C', 'D'] },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: [10, 16, 22, 28], lineStyle: { width: 3, color: GOLD }, symbolSize: 8 }],
      } }),
      ph('cat-body', 'Left: before · Right: after', { x: 96, y: 628, w: 1088, h: 28 },
        { fontSize: 13, color: SLATE, align: 'center', role: 'body' }),
    ]),

    // 11 · Table
    layout('layout-cat-table', 'Table', WHITE, [
      ...chrome('light'),
      ph('cat-title', 'Table title', { x: 96, y: 88, w: 900, h: 48 },
        { fontSize: 32, fontWeight: 800, color: INK, role: 'title' }),
      tableEl({
        id: 'cat-table', x: 96, y: 160, w: 1088, h: 480,
        columns: [2, 1, 1, 1],
        rows: [
          { cells: [{ html: 'Category', bold: true }, { html: 'Q1', bold: true }, { html: 'Q2', bold: true }, { html: 'Q3', bold: true }] },
          { cells: [{ html: 'Row one' }, { html: '—' }, { html: '—' }, { html: '—' }] },
          { cells: [{ html: 'Row two' }, { html: '—' }, { html: '—' }, { html: '—' }] },
          { cells: [{ html: 'Row three' }, { html: '—' }, { html: '—' }, { html: '—' }] },
          { cells: [{ html: 'Row four' }, { html: '—' }, { html: '—' }, { html: '—' }] },
        ],
        style: TABLE_STYLE,
      }),
    ]),

    // 12 · Before / after
    layout('layout-cat-before-after', 'Before / after', CREAM, [
      ...chrome('light'),
      ph('cat-title', 'Before and after', { x: 96, y: 88, w: 900, h: 48 },
        { fontSize: 32, fontWeight: 800, color: INK, role: 'title' }),
      shape('rect', { id: 'cat-before-box', x: 96, y: 170, w: 520, h: 460, radius: 10, fill: WHITE, stroke: 'rgba(14,26,43,0.1)', strokeWidth: 1 }),
      ph('cat-before-label', 'BEFORE', { x: 120, y: 190, w: 200, h: 24 },
        { fontSize: 11, fontWeight: 700, letterSpacing: 4, color: SLATE }),
      ph('cat-before-body', 'Describe the starting state', { x: 120, y: 230, w: 472, h: 360 },
        { fontSize: 18, color: INK, lineHeight: 1.6, role: 'body' }),
      shape('rect', { id: 'cat-after-box', x: 664, y: 170, w: 520, h: 460, radius: 10, fill: NAVY }),
      ph('cat-after-label', 'AFTER', { x: 688, y: 190, w: 200, h: 24 },
        { fontSize: 11, fontWeight: 700, letterSpacing: 4, color: GOLD }),
      ph('cat-after-body', 'Describe the outcome', { x: 688, y: 230, w: 472, h: 360 },
        { fontSize: 18, color: WHITE, lineHeight: 1.6, role: 'subtitle' }),
    ]),

    // 13 · Timeline / roadmap
    layout('layout-cat-timeline', 'Timeline', WHITE, [
      ...chrome('light'),
      ph('cat-title', 'Roadmap', { x: 96, y: 88, w: 900, h: 48 },
        { fontSize: 32, fontWeight: 800, color: INK, role: 'title' }),
      bar('cat-bar', 96, 380, 1088, 3, 'rgba(14,26,43,0.12)'),
      ...['Now', 'Q2', 'Q3', 'Q4'].flatMap((label, i) => {
        const x = 120 + i * 280
        return [
          shape('ellipse', { id: `cat-mile-${i}`, x: x + 100, y: 360, w: 44, h: 44, fill: i === 0 ? GOLD : WHITE, stroke: NAVY, strokeWidth: 2 }),
          ph(`cat-mile-label-${i}`, label, { x: x, y: 420, w: 244, h: 28 },
            { fontSize: 14, fontWeight: 800, color: INK, align: 'center' }),
          ph(`cat-mile-body-${i}`, 'Milestone', { x: x, y: 456, w: 244, h: 120 },
            { fontSize: 15, color: SLATE, align: 'center', lineHeight: 1.45 }),
        ]
      }),
    ]),

    // 14 · KPI row (summary metrics)
    layout('layout-cat-kpi-row', 'KPI row', NAVY, [
      ...chrome('dark'),
      ph('cat-title', 'Summary metrics', { x: 96, y: 88, w: 900, h: 48 },
        { fontSize: 32, fontWeight: 800, color: WHITE, role: 'title' }),
      ...[['24%', 'Growth'], ['$4.2M', 'Revenue'], ['89', 'Clients'], ['12', 'Markets']].flatMap(([num, lbl], i) => {
        const x = 96 + i * 288
        return [
          shape('rect', { id: `cat-kpi-box-${i}`, x, y: 200, w: 264, h: 380, radius: 8, fill: 'rgba(245,246,248,0.06)', stroke: 'rgba(201,169,98,0.25)', strokeWidth: 1 }),
          ph(`cat-kpi-num-${i}`, num, { x, y: 300, w: 264, h: 80 },
            { fontSize: 48, fontWeight: 900, color: GOLD, align: 'center', fontFamily: IN }),
          ph(`cat-kpi-lbl-${i}`, lbl, { x, y: 390, w: 264, h: 36 },
            { fontSize: 14, fontWeight: 600, color: MIST, align: 'center', letterSpacing: 2 }),
        ]
      }),
    ]),
  ]
}

/** Starter slides: a guide + one filled example cover. */
function starterSlides() {
  const guide = {
    id: 'slide-guide', name: 'Master guide', background: WHITE, transition: 'fade',
    notes: 'Catalyze slide master. Delete this slide once you are oriented. New slides: use the + gap menu or New slide → pick a layout under "This document". Apply layout: Slide panel → Apply layout. Story slides alternate with data slides for best pacing.',
    elements: [
      ...chrome('light'),
      text({ id: 'cat-title', x: 96, y: 100, w: 900, h: 56, html: 'Catalyze slide master', fontSize: 40, fontWeight: 800, color: INK, role: 'title' }),
      bar('cat-bar', 96, 168, 160, 4),
      text({
        id: 'cat-body', x: 96, y: 200, w: 1000, h: 420,
        html: '<b>14 layouts</b> under <i>This document</i> when you add or apply a slide:<br><br>'
          + '<b>Story</b> — Cover · Section · Thesis · Story + image · Quote · Three beats · Close<br>'
          + '<b>Data</b> — Chart + insight · Big number · Chart comparison · Table · Before/after · Timeline · KPI row<br><br>'
          + 'Footer tokens: <code>{{company}}</code> <code>{{page:2}}</code> <code>{{pages}}</code> — set Document properties in About.<br>'
          + 'Alternate story and data slides. Use morph on Cover → Section → Close.',
        fontSize: 17, color: SLATE, lineHeight: 1.65, role: 'body',
      }),
    ],
  }

  const exampleCover = {
    id: 'slide-example-cover', name: 'Example cover', background: NAVY, transition: 'fade',
    notes: 'Example cover — duplicate and edit, or delete and start from layouts.',
    elements: [
      ...chrome('dark'),
      bar('cat-bar', 96, 130, 200, 4),
      text({ id: 'cat-title', x: 90, y: 160, w: 1000, h: 200, html: 'Data tells the story.', fontSize: 72, fontWeight: 800, color: WHITE, lineHeight: 1.02, role: 'title', fontFamily: FR }),
      text({ id: 'cat-subtitle', x: 96, y: 380, w: 800, h: 56, html: 'Catalyze quarterly review', fontSize: 22, color: MIST, role: 'subtitle' }),
      text({ id: 'cat-kicker', x: 96, y: 480, w: 600, h: 28, html: '{{date}} · CONFIDENTIAL', fontSize: 12, fontWeight: 700, letterSpacing: 4, color: GOLD, role: 'kicker' }),
    ],
  }

  return [guide, exampleCover]
}

function buildDoc() {
  uid = 0
  return {
    format: 'bento/slides',
    version: 1,
    title: 'Catalyze — slide master',
    size: { width: 1280, height: 720 },
    template: true,
    meta: { company: 'Catalyze', subject: 'Slide master' },
    theme: {
      background: WHITE,
      color: INK,
      accent: GOLD,
      fontFamily: IN,
      chartPalette: [GOLD, NAVY, '#5A7A9A', '#8FA3BF'],
      table: {
        headerBg: NAVY,
        headerColor: WHITE,
        borderColor: 'rgba(14,26,43,0.15)',
        zebra: true,
        zebraColor: 'rgba(12,27,51,0.04)',
      },
    },
    assets: {
      'font-fraunces': FRAUNCES,
      'font-instrument': INSTRUMENT,
    },
    fonts: [
      { family: 'Fraunces', asset: 'font-fraunces', weight: '900' },
      { family: 'Instrument Sans', asset: 'font-instrument', weight: '100 900' },
    ],
    layouts: catalyzeLayouts(),
    slides: starterSlides(),
    modified: new Date().toISOString(),
  }
}

// ——— splice + write ————————————————————————————————————————————————
const d = buildDoc()
const json = JSON.stringify(d).replace(/</g, '\\u003c')
const blockRe = /<script type="application\/bento\+json" id="bento-doc">[\s\S]*?<\/script>/
const out = shell.replace(blockRe, `<script type="application/bento+json" id="bento-doc">\n${json}\n</scr` + 'ipt>')
if (!out.includes(json.slice(0, 80))) throw new Error('splice failed')
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, out)
console.log(`Catalyze master → ${outPath}`)
console.log(`  ${d.layouts.length} layouts · ${d.slides.length} starter slides · ${Math.round(out.length / 1024)} KB`)
