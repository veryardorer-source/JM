'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Takeoff, Wall, FINISH_LIST, LIGHT_PRESETS, PriceRow,
  buildConfig, calcTakeoff, newWall, floorSheets, defaultPerBox,
} from '@/lib/takeoff'
import { fmt } from '@/lib/estimate'

function Num({ value, onChange, w = 'w-20', decimal = true, placeholder }: {
  value: number; onChange: (n: number) => void; w?: string; decimal?: boolean; placeholder?: string
}) {
  const [text, setText] = useState(value ? String(value) : '')
  useEffect(() => { setText(value ? String(value) : '') }, [value])
  return (
    <input value={text} inputMode="decimal" placeholder={placeholder}
      onChange={e => {
        const t = e.target.value.replace(decimal ? /[^\d.]/g : /[^\d]/g, '')
        setText(t)
        onChange(Number(t) || 0)
      }}
      className={`${w} px-1.5 py-1 text-right border border-gray-200 rounded outline-none focus:border-green-400 bg-white`} />
  )
}

export default function TakeoffPanel({ takeoff, onChange, onApply, prices }: {
  takeoff: Takeoff
  onChange: (t: Takeoff) => void
  onApply: (t: Takeoff) => void
  prices: PriceRow[]
}) {
  const t = takeoff
  const cfg = useMemo(() => buildConfig(prices), [prices])
  const r = useMemo(() => calcTakeoff(t, cfg), [t, cfg])
  // 벽 마감 선택지: 기본 + 단가표의 커스텀 판재 (석고/MDF는 도배·필름에 이미 매핑됨)
  const finishOptions = useMemo(() => [
    ...FINISH_LIST,
    ...cfg.plates.map(p => p.name).filter(n => n !== '석고보드' && n !== 'M.D.F' && n !== '방화석고보드'),
  ], [cfg])

  function patchRoom(ri: number, room: Takeoff['rooms'][number]) {
    onChange({ ...t, rooms: t.rooms.map((x, i) => i === ri ? room : x) })
  }
  function patchWall(ri: number, wi: number, p: Partial<Wall>) {
    const room = t.rooms[ri]
    patchRoom(ri, { ...room, walls: room.walls.map((w, i) => i === wi ? { ...w, ...p } : w) })
  }

  const chk = 'accent-green-600 w-3.5 h-3.5'

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4 items-start">
      <div className="min-w-0 space-y-3">
        {/* 설정 */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold text-gray-700">설정</span>
          <label className="flex items-center gap-1.5 text-gray-500">
            각재
            <select value={t.lumber}
              onChange={e => onChange({ ...t, lumber: Number(e.target.value) })}
              className="border border-gray-200 rounded-lg px-2 py-1">
              {cfg.lumbers.map(l => <option key={l.size} value={l.size}>{l.spec} (1단 {l.bundle}개)</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-gray-500">
            기본 층고
            <Num value={t.defH} onChange={n => onChange({ ...t, defH: n })} w="w-14" />m
          </label>
        </div>

        {/* 구역별 벽 */}
        {t.rooms.map((room, ri) => (
          <div key={ri} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
              <input value={room.name} placeholder="구역명 (로비, 회의실1…)"
                onChange={e => patchRoom(ri, { ...room, name: e.target.value })}
                className="font-semibold text-sm bg-transparent outline-none border-b border-transparent focus:border-green-400 flex-1 min-w-0" />
              <button onClick={() => {
                if (!confirm(`"${room.name || '구역'}" 삭제?`)) return
                onChange({ ...t, rooms: t.rooms.filter((_, i) => i !== ri) })
              }} className="text-gray-300 hover:text-red-500 px-1">✕</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-50">
                    <th className="px-2 py-1.5 text-right">길이(mm)</th>
                    <th className="px-1 py-1.5 text-right">높이(m)</th>
                    <th className="px-1 py-1.5">마감</th>
                    <th className="px-1 py-1.5" title="신설 벽 목틀(각재+석고 하지)">목틀</th>
                    <th className="px-1 py-1.5" title="합판 보강">보강</th>
                    <th className="px-1 py-1.5" title="걸레받이/몰딩">걸레받이</th>
                    <th className="w-7"></th>
                  </tr>
                </thead>
                <tbody>
                  {room.walls.map((w, wi) => (
                    <tr key={wi} className="border-b border-gray-50">
                      <td className="px-2 py-1 text-right">
                        <Num value={w.len} onChange={n => patchWall(ri, wi, { len: n })} w="w-24" decimal={false} placeholder="3700" />
                      </td>
                      <td className="px-1 py-1 text-right">
                        <Num value={w.h} onChange={n => patchWall(ri, wi, { h: n })} w="w-14" />
                      </td>
                      <td className="px-1 py-1 text-center">
                        <select value={w.finish} onChange={e => patchWall(ri, wi, { finish: e.target.value })}
                          className="border border-gray-200 rounded px-1 py-1 bg-white">
                          {finishOptions.map(f => <option key={f}>{f}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1 text-center">
                        <input type="checkbox" checked={w.frame} onChange={e => patchWall(ri, wi, { frame: e.target.checked })} className={chk} />
                      </td>
                      <td className="px-1 py-1 text-center">
                        <input type="checkbox" checked={w.reinforce} onChange={e => patchWall(ri, wi, { reinforce: e.target.checked })} className={chk} />
                      </td>
                      <td className="px-1 py-1 text-center">
                        <input type="checkbox" checked={w.base} onChange={e => patchWall(ri, wi, { base: e.target.checked })} className={chk} />
                      </td>
                      <td className="text-center">
                        <button onClick={() => patchRoom(ri, { ...room, walls: room.walls.filter((_, i) => i !== wi) })}
                          className="text-gray-200 hover:text-red-500 px-1">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => patchRoom(ri, { ...room, walls: [...room.walls, newWall(t.defH)] })}
                className="text-xs text-green-600 hover:text-green-700 px-3 py-1.5">+ 벽 추가</button>
            </div>
          </div>
        ))}
        <button onClick={() => onChange({ ...t, rooms: [...t.rooms, { name: '', walls: [newWall(t.defH)] }] })}
          className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-green-400 hover:text-green-600 bg-white">
          + 구역 추가
        </button>

        {/* 바닥 (타일/데코타일) — 가로·세로를 타일 크기로 나눠 방향별 올림 */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">바닥 (타일 · 데코타일)</p>
          {t.floors.length > 0 && (
            <div className="flex items-center gap-2 mb-1 text-[10px] text-gray-400">
              <span className="w-24">구역</span><span className="w-[76px]">종류</span>
              <span className="w-20 text-right">가로(mm)</span><span className="w-20 text-right">세로(mm)</span>
              <span className="w-[60px]">타일</span><span className="w-14 text-right">박스당</span>
              <span className="flex-1 text-right">장수 → 박스</span>
            </div>
          )}
          {t.floors.map((f, fi) => {
            const patchF = (p: Partial<typeof f>) =>
              onChange({ ...t, floors: t.floors.map((x, i) => i === fi ? { ...x, ...p } : x) })
            const sheets = floorSheets(f)
            const boxes = sheets ? Math.ceil(sheets / (f.perBox || defaultPerBox(f.type, f.size))) : 0
            return (
              <div key={fi} className="flex items-center gap-2 mb-1.5 text-xs">
                <input value={f.name} placeholder="구역"
                  onChange={e => patchF({ name: e.target.value })}
                  className="border border-gray-200 rounded px-2 py-1 w-24" />
                <select value={f.type}
                  onChange={e => {
                    const type = e.target.value as typeof f.type
                    patchF({ type, perBox: defaultPerBox(type, f.size) })
                  }}
                  className="border border-gray-200 rounded px-1 py-1 bg-white w-[76px]">
                  <option>타일</option><option>데코타일</option>
                </select>
                <Num value={f.w} onChange={n => patchF({ w: n })} w="w-20" decimal={false} placeholder="6000" />
                <Num value={f.l} onChange={n => patchF({ l: n })} w="w-20" decimal={false} placeholder="4500" />
                <select value={f.size}
                  onChange={e => {
                    const size = Number(e.target.value)
                    patchF({ size, perBox: defaultPerBox(f.type, size) })
                  }}
                  className="border border-gray-200 rounded px-1 py-1 bg-white w-[60px]">
                  <option value={450}>450각</option><option value={600}>600각</option>
                </select>
                <Num value={f.perBox} onChange={n => patchF({ perBox: n })} w="w-14" decimal={false} />
                <span className="flex-1 text-right text-gray-600">
                  {sheets ? <><b>{sheets}</b>장 → <b className="text-green-700">{boxes}</b>박스</> : <span className="text-gray-300">-</span>}
                </span>
                <button onClick={() => onChange({ ...t, floors: t.floors.filter((_, i) => i !== fi) })}
                  className="text-gray-200 hover:text-red-500">✕</button>
              </div>
            )
          })}
          <button onClick={() => onChange({ ...t, floors: [...t.floors, { name: '', type: '데코타일', w: 0, l: 0, size: 450, perBox: 16 }] })}
            className="text-xs text-green-600 hover:text-green-700">+ 바닥 추가</button>
          <p className="text-[10px] text-gray-400 mt-1">장수 = (가로÷타일크기 올림) × (세로÷타일크기 올림). 박스당 기본: 데코 450각 16장 / 600각 9장, 타일 600각 4장 — 제품에 맞게 수정 가능</p>
        </div>

        {/* 천장 도배 */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">천장 도배 면적</p>
          {t.ceils.map((c, ci) => (
            <div key={ci} className="flex items-center gap-2 mb-1.5 text-xs">
              <input value={c.name} placeholder="구역"
                onChange={e => onChange({ ...t, ceils: t.ceils.map((x, i) => i === ci ? { ...x, name: e.target.value } : x) })}
                className="border border-gray-200 rounded px-2 py-1 w-28" />
              <Num value={c.area} onChange={n => onChange({ ...t, ceils: t.ceils.map((x, i) => i === ci ? { ...x, area: n } : x) })} w="w-20" />
              <span className="text-gray-400">㎡</span>
              <button onClick={() => onChange({ ...t, ceils: t.ceils.filter((_, i) => i !== ci) })}
                className="text-gray-200 hover:text-red-500">✕</button>
            </div>
          ))}
          <button onClick={() => onChange({ ...t, ceils: [...t.ceils, { name: '', area: 0 }] })}
            className="text-xs text-green-600 hover:text-green-700">+ 천장 추가</button>
        </div>

        {/* 조명 — 다운라이트: 인치별 개수 / T5·T7: 길이(M) */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">조명</p>
          {t.lights.map((l, li) => {
            const patchL = (p: Partial<typeof l>) =>
              onChange({ ...t, lights: t.lights.map((x, i) => i === li ? { ...x, ...p } : x) })
            const presetIdx = LIGHT_PRESETS.findIndex(p => p.name === l.name && p.spec === l.spec && p.unit === (l.unit || 'EA'))
            const isCustom = presetIdx < 0 || LIGHT_PRESETS[presetIdx].label === '직접 입력'
            return (
              <div key={li} className="flex items-center gap-2 mb-1.5 text-xs">
                <select value={isCustom ? '직접 입력' : LIGHT_PRESETS[presetIdx].label}
                  onChange={e => {
                    const p = LIGHT_PRESETS.find(x => x.label === e.target.value)!
                    patchL(p.label === '직접 입력'
                      ? { name: l.name || '', spec: '', unit: 'EA' }
                      : { name: p.name, spec: p.spec, unit: p.unit })
                  }}
                  className="border border-gray-200 rounded px-1 py-1 bg-white w-36">
                  {LIGHT_PRESETS.map(p => <option key={p.label}>{p.label}</option>)}
                </select>
                {isCustom ? (
                  <>
                    <input value={l.name} placeholder="품명 (펜던트, 벽등…)"
                      onChange={e => patchL({ name: e.target.value })}
                      className="border border-gray-200 rounded px-2 py-1 w-32" />
                    <input value={l.spec} placeholder="규격"
                      onChange={e => patchL({ spec: e.target.value })}
                      className="border border-gray-200 rounded px-2 py-1 flex-1 min-w-0" />
                  </>
                ) : (
                  <span className="flex-1 text-gray-400 truncate">{l.name} {l.spec}</span>
                )}
                <Num value={l.qty} onChange={n => patchL({ qty: n })} w="w-16" decimal={l.unit === 'M'} />
                <span className="text-gray-400 w-6">{(l.unit || 'EA') === 'M' ? 'M' : '개'}</span>
                <button onClick={() => onChange({ ...t, lights: t.lights.filter((_, i) => i !== li) })}
                  className="text-gray-200 hover:text-red-500">✕</button>
              </div>
            )
          })}
          <button onClick={() => onChange({ ...t, lights: [...t.lights, { name: '조명기구', spec: '3인치', qty: 0, unit: 'EA' }] })}
            className="text-xs text-green-600 hover:text-green-700">+ 조명 추가</button>
        </div>
      </div>

      {/* 자재 요약 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 lg:sticky lg:top-4">
        <h2 className="font-bold text-sm text-gray-800 mb-3">자재 산출 결과</h2>
        <div className="space-y-1.5 text-sm">
          <SRow l={`각재 ${t.lumber}×28×28 (1단 ${r.lumberBundle}개)`}
            v={r.lumberTotal ? `${fmt(r.lumberTotal)}개 → ${Math.ceil(r.lumberBundles)}단` : '-'} />
          <SRow l="석고보드 (도배면)" v={r.gypsum ? `${fmt(r.gypsum)}장` : '-'} />
          <SRow l="MDF (필름·도장면)" v={r.mdf ? `${fmt(r.mdf)}장` : '-'} />
          {r.customPlates.map(cp => (
            <SRow key={cp.name} l={cp.name} v={`${fmt(cp.sheets)}장`} />
          ))}
          <SRow l="합판 (보강)" v={r.plywood ? `${fmt(r.plywood)}장` : '-'} />
          <SRow l="걸레받이/몰딩" v={r.baseboard ? `${fmt(r.baseboard)}본` : '-'} />
          <hr className="border-gray-100" />
          <SRow l={`벽지 (${(r.gypsumArea + t.ceils.reduce((s, c) => s + (c.area || 0), 0)).toFixed(1)}㎡)`} v={r.wallpaperRolls ? `${r.wallpaperRolls}롤` : '-'} />
          <SRow l={`필름 (${r.filmArea.toFixed(1)}㎡)`} v={r.filmArea ? `${Math.ceil(r.filmArea)}㎡` : '-'} />
          <SRow l="타일" v={r.tileBoxes ? `${fmt(r.tileSheets)}장 / ${r.tileBoxes}박스` : '-'} />
          <SRow l="데코타일" v={r.decoBoxes ? `${fmt(r.decoSheets)}장 / ${r.decoBoxes}박스` : '-'} />
          <SRow l="조명" v={(() => {
            const ea = t.lights.filter(l => (l.unit || 'EA') === 'EA').reduce((s, l) => s + (l.qty || 0), 0)
            const m = t.lights.filter(l => l.unit === 'M').reduce((s, l) => s + (l.qty || 0), 0)
            const parts = [ea ? `${fmt(ea)}개` : '', m ? `${m}M` : ''].filter(Boolean)
            return parts.length ? parts.join(' + ') : '-'
          })()} />
        </div>
        <button onClick={() => onApply(t)}
          className="mt-4 w-full py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
          견적서에 반영 →
        </button>
        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
          목작업·도배·필름·타일·데코타일·조명 공종의 내역이 생성됩니다.
          같은 이름의 공종이 이미 있으면 교체되고, 단가표의 단가가 자동 적용됩니다.
        </p>
      </div>
    </div>
  )
}

function SRow({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{l}</span>
      <span className={v === '-' ? 'text-gray-300' : 'font-medium text-gray-900'}>{v}</span>
    </div>
  )
}
