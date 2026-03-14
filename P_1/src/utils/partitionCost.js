// ─────────────────────────────────────────────
// 칸막이벽 합판 연결재 계산
// - 각재/석고/마감재는 각 실의 A/B/C/D 벽면에서 각각 계산
// - 여기서는 두 면의 각재를 연결하는 합판만 계산
//
// 구조: [사무실 각재28] ← 합판 연결재 → [대표실 각재28]
// 세로상 450mm 간격마다 80mm폭 합판 조각 삽입
// 1장(1220×2440) → 80mm폭 재단 시 15줄
// 높이 ≤ 2440mm → 1줄 = 1개소
// ─────────────────────────────────────────────
import { HAPAN } from '../data/materials.js'

export function calcPartitionHapanSheets(lengthM, heightM) {
  const lengthMm = lengthM * 1000
  const heightMm = heightM * 1000
  if (lengthMm <= 0 || heightMm <= 0) return { positions: 0, sheets: 0 }
  const positions     = Math.floor(lengthMm / 450) + 1
  const stripsPerSheet = Math.floor(1220 / 80)             // 15 (80mm폭 재단)
  const piecesPerStrip = Math.floor(2440 / heightMm) || 1  // 보통 1
  const piecesPerSheet = stripsPerSheet * piecesPerStrip
  return { positions, sheets: Math.ceil(positions / piecesPerSheet) }
}

export function calcPartitionCost(room, partition) {
  const lengthM = partition.lengthM || 0
  const heightM = partition.heightM > 0 ? partition.heightM : (room.heightM || 2.4)
  if (lengthM <= 0 || heightM <= 0) return { items: [], total: 0 }

  const { positions, sheets } = calcPartitionHapanSheets(lengthM, heightM)
  if (sheets <= 0) return { items: [], total: 0 }

  const hapan = HAPAN.find(h => h.id === partition.hapanId) || HAPAN[0]
  const cost  = sheets * hapan.pricePerSheet

  const items = [{
    name: hapan.name,
    spec: `80mm폭 세로연결재 × ${positions}개소`,
    qty: sheets, unit: '장', unitPrice: hapan.pricePerSheet, cost,
  }]

  return { items, total: cost }
}
