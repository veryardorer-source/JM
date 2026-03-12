import { useState, useEffect } from 'react'

function NumInput({ value, onChange, style, placeholder }) {
  const [str, setStr] = useState(value > 0 ? String(value) : '')
  useEffect(() => {
    if (value > 0 && Number(str) !== value) setStr(String(value))
    if (value === 0 && str !== '' && str !== '0') setStr('')
  }, [value])
  return (
    <input
      type="number" min="0" step="0.01"
      value={str}
      placeholder={placeholder}
      style={style}
      onChange={e => {
        setStr(e.target.value)
        const n = parseFloat(e.target.value)
        onChange(!isNaN(n) && n >= 0 ? n : 0)
      }}
    />
  )
}
import { useStore } from '../store/useStore.js'
import { FINISH_TYPES, SEOKGO, MDF, HAPAN, WALLPAPER, TILE, FLOORING, TEX, INSULATION, WRAPPING_WIDTHS } from '../data/materials.js'

const OJINGEO_LIST = HAPAN.filter(h => h.type === '오징어')
import { calcSurfaceCost, getSurfaceDimensions } from '../utils/surfaceCost.js'
import { calcFilmSections } from '../utils/calculations.js'
import { calcMoldingEA } from '../utils/molding.js'

const DIR_TO_MOLD = {
  wallA: '벽A', wallB: '벽B', wallC: '벽C', wallD: '벽D',
  wallN: '벽A', wallS: '벽B', wallE: '벽C', wallW: '벽D',
}
const DIR_LABEL = {
  wallA: '벽A', wallB: '벽B', wallC: '벽C', wallD: '벽D',
  wallN: '벽A', wallS: '벽B', wallE: '벽C', wallW: '벽D',
  floor: '바닥', ceiling: '천장',
}

export default function SurfaceRow({ room, sf, updateFn }) {
  const { updateSurface, addFilmSection, updateFilmSection, deleteFilmSection } = useStore()

  const upd = (fields) => updateFn ? updateFn(fields) : updateSurface(room.id, sf.id, fields)
  const result = calcSurfaceCost(room, sf)
  const { areaSqm } = getSurfaceDimensions(room, sf)

  const isCeiling = sf.direction === 'ceiling'
  const isFloor = sf.direction === 'floor'
  const isPartition = sf.direction === 'wall_custom'
  const isWall = !isFloor && !isCeiling
  const moldType = DIR_TO_MOLD[sf.direction]

  return (
    <>
    <div style={styles.row}>
      {/* 면 라벨 */}
      <div style={styles.labelCell}>
        <label style={styles.checkRow}>
          <input type="checkbox" checked={sf.enabled}
            onChange={e => upd({ enabled: e.target.checked })} />
          {isPartition ? (
            <input value={sf.name || ''} onChange={e => upd({ name: e.target.value })}
              style={styles.partNameInput} />
          ) : (
            <span style={{ fontWeight: 600, fontSize: 13, color: '#1e4078' }}>{DIR_LABEL[sf.direction] || sf.label}</span>
          )}
        </label>
        {isPartition && (
          <div style={styles.partDims}>
            <NumInput value={sf.widthM} onChange={v => upd({ widthM: v })}
              placeholder="폭(m)" style={styles.partDimInput} />
            <span style={{ fontSize: 10, color: '#aaa' }}>×</span>
            <NumInput value={sf.heightM} onChange={v => upd({ heightM: v })}
              placeholder={`H${room.heightM}m`} style={styles.partDimInput} />
          </div>
        )}
        <span style={styles.areaBadge}>{areaSqm.toFixed(2)}㎡</span>
      </div>

      {/* 마감재 타입 선택 */}
      <div style={styles.cell}>
        <select value={sf.finishType} onChange={e => upd({ finishType: e.target.value })} style={styles.select}>
          {FINISH_TYPES.filter(ft => {
            if (isFloor) return ['flooring', 'tile', 'none'].includes(ft.id)
            if (isCeiling) return ['wallpaper', 'paint', 'tex', 'none'].includes(ft.id)
            return !['tex', 'flooring'].includes(ft.id)
          }).map(ft => (
            <option key={ft.id} value={ft.id}>{ft.label}</option>
          ))}
        </select>
      </div>

      {/* 마감재 세부 선택 */}
      <div style={styles.detailCell}>
        {sf.finishType === 'wallpaper' && (
          <select value={sf.finishMaterialId} onChange={e => upd({ finishMaterialId: e.target.value })} style={styles.select}>
            {WALLPAPER.filter(w => isCeiling ? w.forCeiling : !w.forCeiling).map(w => (
              <option key={w.id} value={w.id}>{w.name} ({w.pricePerRoll.toLocaleString()}원/롤)</option>
            ))}
          </select>
        )}
        {sf.finishType === 'tile' && (
          <select value={sf.finishMaterialId} onChange={e => upd({ finishMaterialId: e.target.value })} style={styles.select}>
            {TILE.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.pricePerBox.toLocaleString()}원/BOX)</option>
            ))}
          </select>
        )}
        {sf.finishType === 'flooring' && (
          <select value={sf.finishMaterialId} onChange={e => upd({ finishMaterialId: e.target.value })} style={styles.select}>
            {FLOORING.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.pricePerUnit.toLocaleString()}원/{f.unit})</option>
            ))}
          </select>
        )}
        {sf.finishType === 'tex' && (
          <div style={styles.filmOptions}>
            <label style={styles.inlineLabel}>텍스 규격
              <select value={sf.finishMaterialId} onChange={e => upd({ finishMaterialId: e.target.value })} style={styles.selectSm}>
                {TEX.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label style={styles.inlineLabel}>단가(원/BOX)
              <input type="number" min="0" value={sf.texPricePerBox || ''}
                placeholder="단가 입력"
                onChange={e => upd({ texPricePerBox: Number(e.target.value) })}
                style={styles.inputSm} />
            </label>
          </div>
        )}
        {sf.finishType === 'film' && (
          <FilmSectionEditor room={room} sf={sf}
            addFilmSection={addFilmSection}
            updateFilmSection={updateFilmSection}
            deleteFilmSection={deleteFilmSection}
            upd={upd} />
        )}
        {sf.finishType === 'paint' && (
          <label style={styles.inlineLabel}>도장 단가(원/㎡)
            <input type="number" min="0" value={sf.paintPricePerSqm || ''}
              placeholder="단가 입력"
              onChange={e => upd({ paintPricePerSqm: Number(e.target.value) })}
              style={styles.inputSm} />
          </label>
        )}
        {['wallpaper', 'paint', 'tile'].includes(sf.finishType) && (
          <label style={styles.inlineLabel}>석고보드
            <select value={sf.seokgoType}
              onChange={e => upd({ seokgoType: e.target.value })}
              style={styles.selectSm}
              disabled={sf.finishType === 'tile'}>
              {SEOKGO.map(s => <option key={s.id} value={s.id}>{s.name.replace('900×1800×', '')}</option>)}
            </select>
          </label>
        )}
        {/* 천장 목공 (각재+석고) */}
        {isCeiling && sf.finishType !== 'none' && (
          <label style={{ ...styles.inlineLabel, cursor: 'pointer' }}>목공
            <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!sf.ceilingCarpentry}
                onChange={e => upd({ ceilingCarpentry: e.target.checked })} />
              <span style={{ fontSize: 11, color: '#555' }}>각재+석고</span>
            </label>
          </label>
        )}
        {isCeiling && sf.ceilingCarpentry && (
          <label style={styles.inlineLabel}>석고보드
            <select value={sf.seokgoType} onChange={e => upd({ seokgoType: e.target.value })} style={styles.selectSm}>
              {SEOKGO.map(s => <option key={s.id} value={s.id}>{s.name.replace('900×1800×', '')}</option>)}
            </select>
          </label>
        )}
        {isCeiling && sf.ceilingCarpentry && (
          <label style={styles.inlineLabel}>칸막이합판
            <select
              value={sf.ceilingHapanEnabled ? (sf.ceilingHapanId || 'hp_normal_11') : 'none'}
              onChange={e => upd(e.target.value === 'none'
                ? { ceilingHapanEnabled: false }
                : { ceilingHapanEnabled: true, ceilingHapanId: e.target.value }
              )}
              style={styles.selectSm}>
              <option value="none">없음</option>
              {HAPAN.filter(h => h.type !== '오징어').map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </label>
        )}

        {/* 오징어합판 (바닥 제외) */}
        {sf.finishType !== 'none' && !isFloor && (
          <label style={styles.inlineLabel}>오징어합판
            <select value={sf.ojingeoEnabled ? (sf.ojingeoId || 'hp_squid_4') : 'none'}
              onChange={e => upd(e.target.value === 'none'
                ? { ojingeoEnabled: false }
                : { ojingeoEnabled: true, ojingeoId: e.target.value }
              )}
              style={styles.selectSm}>
              <option value="none">없음</option>
              {OJINGEO_LIST.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </label>
        )}
        {sf.ojingeoEnabled && !isFloor && (
          <label style={styles.inlineLabel}>수량(장)<span style={{ fontSize: 9, color: '#bbb' }}>0=자동</span>
            <input type="number" min="0" step="1"
              value={sf.ojingeoQty || ''}
              placeholder="자동"
              onChange={e => upd({ ojingeoQty: Number(e.target.value) })}
              style={{ ...styles.inputSm, width: 55 }} />
          </label>
        )}

        {/* 템파보드 / 루버 (벽지·도장, 천장·벽 공통) */}
        {!isFloor && ['wallpaper', 'paint'].includes(sf.finishType) && (
          <label style={styles.inlineLabel}>장식재
            <select value={sf.decorType || 'none'}
              onChange={e => upd({ decorType: e.target.value })}
              style={styles.selectSm}>
              <option value="none">없음</option>
              <option value="tempboard">템파보드</option>
              <option value="louver">루버</option>
              <option value="stainless">스테인리스</option>
              <option value="tile">타일</option>
              <option value="custom">직접입력</option>
            </select>
          </label>
        )}
        {!isFloor && ['wallpaper', 'paint'].includes(sf.finishType) && sf.decorType && sf.decorType !== 'none' && (
          <>
            {sf.decorType === 'custom' && (
              <label style={styles.inlineLabel}>자재명
                <input
                  value={sf.decorCustomName || ''}
                  placeholder="자재명 입력"
                  onChange={e => upd({ decorCustomName: e.target.value })}
                  style={{ ...styles.inputSm, width: 90 }} />
              </label>
            )}
            <label style={styles.inlineLabel}>면적(㎡)
              <input type="number" min="0" step="0.01"
                value={sf.decorSqm || ''}
                placeholder="0"
                onChange={e => upd({ decorSqm: Number(e.target.value) })}
                style={styles.inputSm} />
            </label>
            <label style={styles.inlineLabel}>단가(원/㎡)
              <input type="number" min="0"
                value={sf.decorPricePerSqm || ''}
                placeholder="0"
                onChange={e => upd({ decorPricePerSqm: Number(e.target.value) })}
                style={styles.inputSm} />
            </label>
          </>
        )}

        {/* 벽 구조 (벽면만) */}
        {isWall && sf.finishType !== 'none' && (
          <label style={styles.inlineLabel}>벽 구조
            <select value={sf.wallType || 'normal'} onChange={e => upd({ wallType: e.target.value })} style={styles.selectSm}>
              <option value="normal">일반벽</option>
              <option value="partition">칸막이벽 (합판)</option>
              <option value="lightweight">경량벽체</option>
            </select>
          </label>
        )}
        {isWall && sf.wallType === 'lightweight' && (
          <>
            <label style={styles.inlineLabel}>스터드 간격
              <select value={sf.lgStudSpacingMm || 406} onChange={e => upd({ lgStudSpacingMm: Number(e.target.value) })} style={styles.selectSm}>
                <option value={406}>400mm</option>
                <option value={610}>600mm</option>
              </select>
            </label>
            <label style={styles.inlineLabel}>런너 단가(원/m)
              <input type="number" min="0" value={sf.lgRunnerPrice || ''} placeholder="0"
                onChange={e => upd({ lgRunnerPrice: Number(e.target.value) })}
                style={styles.inputSm} />
            </label>
            <label style={styles.inlineLabel}>스터드 단가(원/EA)
              <input type="number" min="0" value={sf.lgStudPrice || ''} placeholder="0"
                onChange={e => upd({ lgStudPrice: Number(e.target.value) })}
                style={styles.inputSm} />
            </label>
          </>
        )}
        {isWall && sf.wallType === 'partition' && (
          <label style={styles.inlineLabel}>합판 종류
            <select value={sf.hapanId || 'hp_normal_11'} onChange={e => upd({ hapanId: e.target.value })} style={styles.selectSm}>
              {HAPAN.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </label>
        )}
        {/* 흡음재 옵션 (벽면만) */}
        {isWall && sf.finishType !== 'none' && (
          <label style={styles.inlineLabel}>흡음재
            <select value={sf.insulationType || 'none'} onChange={e => upd({ insulationType: e.target.value })} style={styles.selectSm}>
              <option value="none">없음</option>
              {INSULATION.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>
        )}
      </div>

      {/* 금액 */}
      <div style={styles.costCell}>
        {result.total > 0 ? (
          <span style={styles.cost}>{result.total.toLocaleString()}원</span>
        ) : (
          <span style={{ color: '#bbb', fontSize: 12 }}>-</span>
        )}
      </div>
    </div>
    {isWall && !isPartition && moldType && <WallMoldingSubRow room={room} moldType={moldType} />}
    {isPartition && <PartitionMoldingSubRow room={room} partition={sf} />}
    </>
  )
}

// ── 벽면 랩핑평판 서브 행 ────────────────────────────
function WallMoldingSubRow({ room, moldType }) {
  const { addMolding, updateMolding, deleteMolding } = useStore()
  const moldings = (room.moldings || []).filter(m => m.moldType === moldType)
  const wallLengthM = (moldType === '벽A' || moldType === '벽B') ? room.widthM : room.depthM

  return (
    <div style={wm.wrap}>
      <span style={wm.label}>└ 랩핑평판</span>
      <div style={wm.items}>
        {moldings.map(m => {
          const lengthM = m.autoCalc ? (wallLengthM || 0) : (m.customLengthM || 0)
          const ea = calcMoldingEA(lengthM)
          return (
            <div key={m.id} style={wm.item}>
              <select value={m.widthMm}
                onChange={e => updateMolding(room.id, m.id, { widthMm: Number(e.target.value) })}
                style={wm.select}>
                {WRAPPING_WIDTHS.map(w => <option key={w} value={w}>{w}mm</option>)}
              </select>
              <label style={wm.autoLabel}>
                <input type="checkbox" checked={!!m.autoCalc}
                  onChange={e => updateMolding(room.id, m.id, { autoCalc: e.target.checked })} />
                자동
              </label>
              {!m.autoCalc && (
                <input type="number" min="0" step="0.1"
                  value={m.customLengthM || ''}
                  placeholder="길이(m)"
                  onChange={e => updateMolding(room.id, m.id, { customLengthM: Number(e.target.value) })}
                  style={wm.input} />
              )}
              <span style={wm.result}>
                {lengthM > 0 ? `${lengthM.toFixed(2)}m → ${ea}EA` : '-'}
              </span>
              <button onClick={() => deleteMolding(room.id, m.id)} style={wm.delBtn}>✕</button>
            </div>
          )
        })}
      </div>
      <button onClick={() => addMolding(room.id, moldType)} style={wm.addBtn}>+ 랩핑평판 추가</button>
    </div>
  )
}

const wm = {
  wrap: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 10px 6px 22px', background: '#f5f8ee', borderBottom: '1px solid #e8f0de', flexWrap: 'wrap' },
  label: { fontSize: 11, color: '#5a7a30', fontWeight: 700, whiteSpace: 'nowrap', paddingTop: 4 },
  items: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  item: { display: 'flex', alignItems: 'center', gap: 6 },
  select: { border: '1px solid #c0d4a0', borderRadius: 4, padding: '3px 5px', fontSize: 11, background: '#fff' },
  autoLabel: { fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, color: '#555', cursor: 'pointer' },
  input: { border: '1px solid #c0d4a0', borderRadius: 4, padding: '3px 5px', fontSize: 11, width: 70 },
  result: { fontSize: 11, color: '#3a6010', fontWeight: 600 },
  delBtn: { fontSize: 10, padding: '1px 5px', background: '#fee', border: '1px solid #fcc', borderRadius: 3, cursor: 'pointer', color: '#c00' },
  addBtn: { fontSize: 10, padding: '3px 10px', background: '#eef5e0', border: '1px solid #c0d4a0', borderRadius: 4, cursor: 'pointer', color: '#4a7020', fontWeight: 600, whiteSpace: 'nowrap', alignSelf: 'center' },
}

// ── 가벽 랩핑평판 서브 행 ────────────────────────────
function PartitionMoldingSubRow({ room, partition }) {
  const { addPartitionMolding, updatePartitionMolding, deletePartitionMolding } = useStore()
  const moldings = partition.moldings || []

  return (
    <div style={wm.wrap}>
      <span style={wm.label}>└ 랩핑평판</span>
      <div style={wm.items}>
        {moldings.map(m => {
          const lengthM = m.autoCalc ? (partition.widthM || 0) : (m.customLengthM || 0)
          const ea = calcMoldingEA(lengthM)
          return (
            <div key={m.id} style={wm.item}>
              <select value={m.widthMm}
                onChange={e => updatePartitionMolding(room.id, partition.id, m.id, { widthMm: Number(e.target.value) })}
                style={wm.select}>
                {WRAPPING_WIDTHS.map(w => <option key={w} value={w}>{w}mm</option>)}
              </select>
              <label style={wm.autoLabel}>
                <input type="checkbox" checked={!!m.autoCalc}
                  onChange={e => updatePartitionMolding(room.id, partition.id, m.id, { autoCalc: e.target.checked })} />
                자동
              </label>
              {!m.autoCalc && (
                <input type="number" min="0" step="0.1"
                  value={m.customLengthM || ''}
                  placeholder="길이(m)"
                  onChange={e => updatePartitionMolding(room.id, partition.id, m.id, { customLengthM: Number(e.target.value) })}
                  style={wm.input} />
              )}
              <span style={wm.result}>
                {lengthM > 0 ? `${lengthM.toFixed(2)}m → ${ea}EA` : '-'}
              </span>
              <button onClick={() => deletePartitionMolding(room.id, partition.id, m.id)} style={wm.delBtn}>✕</button>
            </div>
          )
        })}
      </div>
      <button onClick={() => addPartitionMolding(room.id, partition.id)} style={wm.addBtn}>+ 랩핑평판 추가</button>
    </div>
  )
}

// ── 필름 구간 편집기 ────────────────────────────────
function FilmSectionEditor({ room, sf, addFilmSection, updateFilmSection, deleteFilmSection, upd }) {
  const sections = sf.filmSections || []
  const { sectionResults, totalM } = calcFilmSections(sections, room.heightM * 1000, sf.filmPricePerM || 0)
  const [bulkInput, setBulkInput] = useState('')  // "1000, 800, 900, 1000"
  const [globalPattern, setGlobalPattern] = useState(0)

  // 콤마 구분 폭 목록으로 구간 일괄 생성
  const handleBulkGenerate = () => {
    const widths = bulkInput
      .split(/[,\s]+/)
      .map(v => parseInt(v.trim(), 10))
      .filter(v => !isNaN(v) && v > 0)
    if (widths.length === 0) return
    widths.forEach((w, i) => {
      addFilmSection(room.id, sf.id, {
        label: `구간${sections.length + i + 1}`,
        widthMm: w,
        patternRepeatMm: globalPattern,
        heightOverrideMm: 0,
        filmName: '',
        pricePerM: 0,
      })
    })
    setBulkInput('')
  }

  const totalLossM = Math.round(sectionResults.reduce((s, r) => s + r.lossM, 0) * 10) / 10
  const wallTotalMm = sections.reduce((s, sec) => s + (sec.widthMm || 0), 0)
  const wallWidthMm = (sf.direction === 'wallC' || sf.direction === 'wallD')
    ? room.depthM * 1000 : room.widthM * 1000
  const wallDiffMm = wallWidthMm > 0 ? wallTotalMm - wallWidthMm : null

  return (
    <div style={fs.wrap}>
      {/* 공통 설정 */}
      <div style={fs.topRow}>
        <span style={fs.rollBadge}>롤폭 1200mm 고정</span>
        <label style={fs.inlineLabel}>기본 단가(원/m)
          <input type="number" min="0" value={sf.filmPricePerM || ''}
            placeholder="0"
            onChange={e => upd({ filmPricePerM: Number(e.target.value) })}
            style={fs.inputSm} />
        </label>
        <label style={fs.inlineLabel}>MDF 종류
          <select value={sf.mdfId} onChange={e => upd({ mdfId: e.target.value })} style={fs.selectSm}>
            {MDF.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <span style={fs.defaultHint}>※ 구간별 단가 미입력 시 기본 단가 적용</span>
      </div>

      {/* 빠른 입력 */}
      <div style={fs.bulkRow}>
        <span style={fs.bulkLabel}>폭 목록(mm):</span>
        <input
          value={bulkInput}
          onChange={e => setBulkInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleBulkGenerate()}
          placeholder="예) 1000, 800, 900, 1000, 600"
          style={fs.bulkInput}
        />
        <label style={fs.inlineLabel}>공통패턴(mm)
          <input type="number" min="0" value={globalPattern}
            onChange={e => setGlobalPattern(Number(e.target.value))}
            style={{ ...fs.inputSm, width: 60 }} />
        </label>
        <button onClick={handleBulkGenerate} style={fs.btnGenerate}>구간 생성</button>
        {sections.length > 0 && (
          <span style={{
            ...fs.wallSum,
            color: wallDiffMm === null ? '#888'
              : wallDiffMm === 0 ? '#1a7a3a'
              : '#c44000',
            fontWeight: wallDiffMm !== null && wallDiffMm !== 0 ? 700 : 400,
          }}>
            입력 합계: {(wallTotalMm / 1000).toFixed(3)}m
            {wallWidthMm > 0 && ` / 벽 ${(wallWidthMm / 1000).toFixed(3)}m`}
            {wallDiffMm !== null && wallDiffMm !== 0 && (
              <span> ({wallDiffMm > 0 ? '+' : ''}{(wallDiffMm / 1000).toFixed(3)}m)</span>
            )}
            {wallDiffMm === 0 && ' ✓'}
          </span>
        )}
      </div>

      {/* 구간 목록 */}
      {sections.length > 0 && (
        <div style={fs.tableWrap}>
          <table style={fs.table}>
            <thead>
              <tr style={fs.thead}>
                <th style={fs.th}>#</th>
                <th style={{...fs.th, minWidth: 90}}>필름명</th>
                <th style={fs.th}>폭(mm)</th>
                <th style={fs.th}>패턴간격(mm)</th>
                <th style={fs.th}>높이(mm)<br/><span style={{fontWeight:400,fontSize:9}}>0=벽높이</span></th>
                <th style={fs.th}>단가(원/m)<br/><span style={{fontWeight:400,fontSize:9}}>0=기본단가</span></th>
                <th style={fs.th}>소요(m)</th>
                <th style={fs.th}>금액</th>
                <th style={fs.th}>로스(m)</th>
                <th style={fs.th}></th>
              </tr>
            </thead>
            <tbody>
              {sections.map((sec, i) => {
                const res = sectionResults.find(r => r.id === sec.id)
                return (
                  <tr key={sec.id} style={i % 2 === 0 ? fs.trEven : fs.trOdd}>
                    <td style={{ ...fs.td, color: '#aaa', fontSize: 11 }}>{i + 1}</td>
                    <td style={fs.td}>
                      <input value={sec.filmName || ''}
                        onChange={e => updateFilmSection(room.id, sf.id, sec.id, { filmName: e.target.value })}
                        style={{...fs.inputNum, width: 88, textAlign: 'left'}}
                        placeholder="예) 화이트무광" />
                    </td>
                    <td style={fs.td}>
                      <input type="number" min="0" value={sec.widthMm}
                        onChange={e => updateFilmSection(room.id, sf.id, sec.id, { widthMm: Number(e.target.value) })}
                        style={fs.inputNum} />
                    </td>
                    <td style={fs.td}>
                      <input type="number" min="0" value={sec.patternRepeatMm}
                        onChange={e => updateFilmSection(room.id, sf.id, sec.id, { patternRepeatMm: Number(e.target.value) })}
                        style={fs.inputNum} />
                    </td>
                    <td style={fs.td}>
                      <input type="number" min="0" value={sec.heightOverrideMm}
                        onChange={e => updateFilmSection(room.id, sf.id, sec.id, { heightOverrideMm: Number(e.target.value) })}
                        style={fs.inputNum} />
                    </td>
                    <td style={fs.td}>
                      <input type="number" min="0" value={sec.pricePerM || ''}
                        placeholder={sf.filmPricePerM || '0'}
                        onChange={e => updateFilmSection(room.id, sf.id, sec.id, { pricePerM: Number(e.target.value) })}
                        style={fs.inputNum} />
                    </td>
                    <td style={{ ...fs.td, textAlign: 'right', fontWeight: 600, color: '#1e4078' }}>
                      {res ? res.sectionM : '-'}m
                    </td>
                    <td style={{ ...fs.td, textAlign: 'right', fontSize: 11, color: '#333' }}>
                      {res && res.sectionCost > 0 ? Math.round(res.sectionCost).toLocaleString() : '-'}
                    </td>
                    <td style={{ ...fs.td, textAlign: 'right', color: '#e06000', fontSize: 11 }}>
                      {res ? res.lossM : '-'}m
                    </td>
                    <td style={fs.td}>
                      <button onClick={() => deleteFilmSection(room.id, sf.id, sec.id)} style={fs.btnDel}>✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={fs.totalRow}>
            <span style={{ color: '#e06000', fontSize: 11 }}>총 로스: {totalLossM}m</span>
            <span>합계 {totalM}m</span>
            <span style={fs.totalCost}>
              {sectionResults.reduce((s, r) => s + r.sectionCost, 0) > 0
                ? Math.round(sectionResults.reduce((s, r) => s + r.sectionCost, 0)).toLocaleString() + '원'
                : '-'}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={() => addFilmSection(room.id, sf.id, { label: `구간${sections.length + 1}`, widthMm: 600, patternRepeatMm: 0, heightOverrideMm: 0, filmName: '', pricePerM: 0 })}
        style={fs.btnAdd}>
        + 구간 1개 추가
      </button>
    </div>
  )
}

const fs = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 6, width: '100%' },
  topRow: { display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' },
  bulkRow: { display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap', background: '#f5f8ff', padding: '6px 8px', borderRadius: 5 },
  bulkLabel: { fontSize: 11, color: '#555', fontWeight: 600, whiteSpace: 'nowrap' },
  bulkInput: { flex: 1, minWidth: 180, border: '1px solid #b0c4de', borderRadius: 4, padding: '4px 8px', fontSize: 12 },
  btnGenerate: { fontSize: 11, padding: '4px 12px', background: '#2563c0', border: 'none', borderRadius: 4, cursor: 'pointer', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' },
  wallSum: { fontSize: 11, color: '#888', whiteSpace: 'nowrap' },
  rollBadge: {
    fontSize: 11, background: '#dde8f8', color: '#1e4078',
    padding: '3px 8px', borderRadius: 4, fontWeight: 600,
  },
  defaultHint: { fontSize: 10, color: '#aaa', whiteSpace: 'nowrap', alignSelf: 'flex-end' },
  inlineLabel: { display: 'flex', flexDirection: 'column', fontSize: 10, color: '#888', gap: 2 },
  inputSm: { border: '1px solid #d0d7e3', borderRadius: 4, padding: '3px 5px', fontSize: 11, width: 80 },
  selectSm: { border: '1px solid #d0d7e3', borderRadius: 4, padding: '3px 5px', fontSize: 11 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  thead: { background: '#eef2f8' },
  th: { padding: '5px 8px', color: '#555', fontWeight: 700, textAlign: 'center', borderBottom: '1px solid #dde4f0', fontSize: 11 },
  td: { padding: '4px 6px', textAlign: 'center' },
  trEven: { background: '#fff' },
  trOdd: { background: '#fafbfd' },
  inputTiny: { border: '1px solid #d0d7e3', borderRadius: 3, padding: '2px 4px', fontSize: 11, width: 55 },
  inputNum: { border: '1px solid #d0d7e3', borderRadius: 3, padding: '2px 4px', fontSize: 11, width: 60, textAlign: 'right' },
  totalRow: {
    display: 'flex', justifyContent: 'flex-end', gap: 16,
    padding: '5px 8px', background: '#eef2f8', borderRadius: '0 0 4px 4px',
    fontWeight: 700, fontSize: 12, color: '#1e4078',
  },
  totalNum: { fontSize: 13 },
  totalCost: { fontSize: 13, color: '#c44000' },
  btnAdd: {
    fontSize: 11, padding: '4px 12px', background: '#1e4078',
    border: 'none', borderRadius: 4, cursor: 'pointer', color: '#fff',
    alignSelf: 'flex-start',
  },
  btnDel: {
    fontSize: 10, padding: '1px 5px', background: '#fee',
    border: '1px solid #fcc', borderRadius: 3, cursor: 'pointer', color: '#c00',
  },
}

const styles = {
  row: {
    display: 'grid',
    gridTemplateColumns: '110px 140px 1fr 120px',
    gap: 8,
    alignItems: 'start',
    padding: '8px 10px',
    borderBottom: '1px solid #f0f2f5',
    background: '#fafbfd',
    borderRadius: 4,
    marginBottom: 4,
  },
  labelCell: { display: 'flex', flexDirection: 'column', gap: 4 },
  partNameInput: { fontSize: 12, fontWeight: 700, color: '#6a3a8a', border: 'none', borderBottom: '1px solid #c8a0e0', background: 'transparent', width: 80, outline: 'none', padding: '1px 2px' },
  partDims: { display: 'flex', alignItems: 'center', gap: 3 },
  partDimInput: { width: 48, fontSize: 11, border: '1px solid #d0c0e8', borderRadius: 3, padding: '2px 4px', textAlign: 'center' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' },
  areaBadge: {
    fontSize: 11, color: '#888', background: '#eef2f8',
    borderRadius: 3, padding: '1px 5px', width: 'fit-content',
  },
  cell: {},
  detailCell: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  costCell: { textAlign: 'right', paddingTop: 4 },
  cost: { fontSize: 13, fontWeight: 700, color: '#1e4078' },
  select: {
    border: '1px solid #d0d7e3', borderRadius: 4,
    padding: '4px 6px', fontSize: 12, width: '100%',
  },
  selectSm: {
    border: '1px solid #d0d7e3', borderRadius: 4,
    padding: '3px 5px', fontSize: 11,
  },
  inputSm: {
    border: '1px solid #d0d7e3', borderRadius: 4,
    padding: '3px 5px', fontSize: 11, width: 80,
  },
  inputTiny: {
    border: '1px solid #d0d7e3', borderRadius: 4,
    padding: '3px 5px', fontSize: 11, width: 60,
  },
  inlineLabel: { display: 'flex', flexDirection: 'column', fontSize: 10, color: '#888', gap: 2 },
  filmOptions: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  openingCell: { position: 'relative' },
  openingPanel: {
    position: 'absolute', top: 24, left: 0, zIndex: 10,
    background: '#fff', border: '1px solid #d0d7e3',
    borderRadius: 6, padding: 10, minWidth: 220,
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  },
  openingItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 12, padding: '3px 0', borderBottom: '1px solid #f0f2f5',
  },
  openingAdd: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 },
  btnSmall: {
    fontSize: 11, padding: '3px 8px', background: '#eef2f8',
    border: '1px solid #c8d4e8', borderRadius: 4, cursor: 'pointer', color: '#1e4078',
  },
  btnDel: {
    fontSize: 10, padding: '1px 5px', background: '#fee', border: '1px solid #fcc',
    borderRadius: 3, cursor: 'pointer', color: '#c00',
  },
  btnAdd: {
    fontSize: 11, padding: '3px 8px', background: '#1e4078',
    border: 'none', borderRadius: 4, cursor: 'pointer', color: '#fff',
  },
}
