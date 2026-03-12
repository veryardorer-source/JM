import { WRAPPING_BOARD_LENGTH_M } from '../data/materials.js'

export function calcMoldingLengthM(molding, room) {
  switch (molding.moldType) {
    case '걸레받이': {
      if (!molding.autoCalc) return molding.customLengthM || 0
      const doorDeduction = (room.doors || []).reduce((sum, d) => sum + (d.widthM || 0), 0)
      return Math.max(0, (room.widthM + room.depthM) * 2 - doorDeduction)
    }
    case '천정몰딩': {
      if (!molding.autoCalc) return molding.customLengthM || 0
      return (room.widthM + room.depthM) * 2
    }
    case '벽A':
    case '벽B':
    case '벽(북)':
    case '벽(남)': {
      if (!molding.autoCalc) return molding.customLengthM || 0
      return room.widthM || 0
    }
    case '벽C':
    case '벽D':
    case '벽(동)':
    case '벽(서)': {
      if (!molding.autoCalc) return molding.customLengthM || 0
      return room.depthM || 0
    }
    case '창틀몰딩':
    case '유리칠판테두리': {
      return ((molding.itemWidthM || 0) + (molding.itemHeightM || 0)) * 2 * (molding.qty || 1)
    }
    default:
      return molding.customLengthM || 0
  }
}

export function calcMoldingEA(lengthM) {
  if (lengthM <= 0) return 0
  return Math.ceil((lengthM / WRAPPING_BOARD_LENGTH_M) * 1.05)
}
