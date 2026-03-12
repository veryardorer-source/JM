import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import SurfaceRow from './SurfaceRow.jsx'
import { calcSurfaceCost } from '../utils/surfaceCost.js'

export default function RoomCard({ room }) {
  const { updateRoom, deleteRoom, duplicateRoom } = useStore()
  const [collapsed, setCollapsed] = useState(false)

  const roomTotal = room.surfaces.reduce((sum, sf) => {
    const r = calcSurfaceCost(room, sf)
    return sum + (r?.total || 0)
  }, 0)

  const upd = (fields) => updateRoom(room.id, fields)

  return (
    <div style={styles.card}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button onClick={() => setCollapsed(!collapsed)} style={styles.collapseBtn}>
          {collapsed ? '▶' : '▼'}
        </button>
        <input
          value={room.name}
          onChange={e => upd({ name: e.target.value })}
          style={styles.nameInput}
        />
        <div style={styles.dims}>
          <DimField label="가로(m)" value={room.widthM} onChange={v => upd({ widthM: v })} />
          <span style={styles.x}>×</span>
          <DimField label="세로(m)" value={room.depthM} onChange={v => upd({ depthM: v })} />
          <span style={styles.x}>× H</span>
          <DimField label="높이(m)" value={room.heightM} onChange={v => upd({ heightM: v })} />
        </div>
        <div style={styles.actions}>
          <span style={styles.total}>{roomTotal.toLocaleString()}원</span>
          <button onClick={() => duplicateRoom(room.id)} style={styles.btnGray} title="복사">복사</button>
          <button onClick={() => deleteRoom(room.id)} style={styles.btnRed} title="삭제">삭제</button>
        </div>
      </div>

      {/* 면 목록 */}
      {!collapsed && (
        <div style={styles.surfaces}>
          <div style={styles.surfaceHeader}>
            <span style={{ width: 110 }}>면</span>
            <span style={{ width: 140 }}>마감재 종류</span>
            <span style={{ flex: 1 }}>세부 설정</span>
            <span style={{ width: 80 }}>개구부</span>
            <span style={{ width: 120, textAlign: 'right' }}>금액</span>
          </div>
          {room.surfaces.map(sf => (
            <SurfaceRow key={sf.id} room={room} sf={sf} />
          ))}
          <div style={styles.subtotal}>
            <span>소계</span>
            <span style={styles.subtotalNum}>{roomTotal.toLocaleString()}원</span>
          </div>
        </div>
      )}
    </div>
  )
}

function DimField({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ fontSize: 9, color: '#aaa' }}>{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value || ''}
        placeholder="0"
        onChange={e => onChange(Number(e.target.value))}
        style={styles.dimInput}
      />
    </label>
  )
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    boxShadow: '0 1px 6px rgba(0,0,0,0.09)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: '#f0f4fa',
    borderBottom: '1px solid #dde4f0',
    flexWrap: 'wrap',
  },
  collapseBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, color: '#1e4078', padding: 0,
  },
  nameInput: {
    fontSize: 14, fontWeight: 700, color: '#1e4078',
    border: 'none', background: 'transparent',
    borderBottom: '1px solid #c8d4e8',
    padding: '2px 4px', width: 120,
    outline: 'none',
  },
  dims: { display: 'flex', alignItems: 'center', gap: 4 },
  x: { fontSize: 13, color: '#888' },
  dimInput: {
    width: 60, textAlign: 'center',
    border: '1px solid #d0d7e3', borderRadius: 4,
    padding: '4px 4px', fontSize: 13,
  },
  actions: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 },
  total: { fontSize: 14, fontWeight: 700, color: '#1e4078' },
  btnGray: {
    fontSize: 11, padding: '3px 10px',
    background: '#eef2f8', border: '1px solid #c8d4e8',
    borderRadius: 4, cursor: 'pointer', color: '#555',
  },
  btnRed: {
    fontSize: 11, padding: '3px 10px',
    background: '#fee', border: '1px solid #fcc',
    borderRadius: 4, cursor: 'pointer', color: '#c00',
  },
  surfaces: { padding: '10px 12px' },
  surfaceHeader: {
    display: 'flex', gap: 8, fontSize: 11, color: '#999',
    fontWeight: 600, padding: '0 10px 6px',
    borderBottom: '1px solid #eee', marginBottom: 6,
  },
  subtotal: {
    display: 'flex', justifyContent: 'space-between',
    padding: '8px 10px', marginTop: 6,
    borderTop: '2px solid #dde4f0',
    fontSize: 13, fontWeight: 700, color: '#1e4078',
  },
  subtotalNum: { fontSize: 14 },
}
