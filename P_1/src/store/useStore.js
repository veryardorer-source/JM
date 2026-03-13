import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaultSurface = (label, direction) => ({
  id: `${direction}_${Date.now()}_${Math.random()}`,
  label,
  direction, // floor | ceiling | wallA | wallB | wallC | wallD | wallExtra
  finishType: 'none',        // 마감재 타입 키
  finishMaterialId: '',      // 선택된 마감재 ID
  seokgoType: 'sg_normal',   // 석고보드 종류
  mdfId: 'mdf_9',            // MDF 종류
  filmPricePerM: 5000,       // 필름 m당 기본 단가
  filmSections: [],          // 필름 구간 목록
  wallType: 'normal',        // 'normal' | 'partition' (칸막이벽)
  hapanId: 'hp_normal_11',   // 합판 종류 (칸막이벽용)
  insulationType: 'none',    // 흡음재 종류
  moldings: [],              // 랩핑평판 (면별)
  enabled: true,
})

const createRoom = (name) => {
  const id = `room_${Date.now()}`
  return {
    id,
    name,
    widthM: 0,
    depthM: 0,
    heightM: 2.4,     // 마감 천장 높이
    slabHeightM: 0,   // 기존(슬라브) 높이 (0 = 미입력)
    doors: [],
    lightings: [],
    moldings: [],
    surfaces: [
      defaultSurface('바닥', 'floor'),
      defaultSurface('천장', 'ceiling'),
      defaultSurface('벽A', 'wallA'),
      defaultSurface('벽B', 'wallB'),
      defaultSurface('벽C', 'wallC'),
      defaultSurface('벽D', 'wallD'),
    ],
  }
}

// 전체 항목(실 외) 기본 구성
const DEFAULT_GLOBAL_ITEMS = [
  // 가설작업
  { id: 'gi_setup_1',   trade: '가설작업', name: '먹메김 및 보양',    spec: '',   unit: '㎡',  qty: 0, matUnitPrice: 150,  labUnitPrice: 1800, expUnitPrice: 0,   enabled: true, remark: '자동계산 권장' },
  { id: 'gi_setup_2',   trade: '가설작업', name: '폐기물처리',          spec: '',   unit: '식',  qty: 1, matUnitPrice: 0,    labUnitPrice: 0,    expUnitPrice: 400000, enabled: true, remark: '' },
  { id: 'gi_setup_3',   trade: '가설작업', name: '현장정리 및 정돈',   spec: '',   unit: '㎡',  qty: 0, matUnitPrice: 350,  labUnitPrice: 800,  expUnitPrice: 0,   enabled: true, remark: '자동계산 권장' },
  { id: 'gi_setup_4',   trade: '가설작업', name: '준공청소',             spec: '',   unit: '㎡',  qty: 0, matUnitPrice: 500,  labUnitPrice: 4000, expUnitPrice: 0,   enabled: true, remark: '자동계산 권장' },
  // 설비작업
  { id: 'gi_plumb_1',  trade: '설비작업', name: '배수배관작업',         spec: '',   unit: '식',  qty: 1, matUnitPrice: 0,    labUnitPrice: 0,    expUnitPrice: 0,   enabled: true, remark: '' },
  { id: 'gi_plumb_2',  trade: '설비작업', name: '급수배관작업',         spec: '',   unit: '식',  qty: 1, matUnitPrice: 0,    labUnitPrice: 0,    expUnitPrice: 0,   enabled: true, remark: '' },
  { id: 'gi_plumb_3',  trade: '설비작업', name: '환풍기',               spec: '',   unit: 'EA',  qty: 0, matUnitPrice: 45000, labUnitPrice: 0,   expUnitPrice: 0,   enabled: false, remark: '' },
  // 전기통신작업
  { id: 'gi_elec_1',   trade: '전기통신작업', name: '전선 HIV 2.5SQ',  spec: '',   unit: 'M',   qty: 0, matUnitPrice: 550,  labUnitPrice: 0,    expUnitPrice: 0,   enabled: true, remark: '' },
  { id: 'gi_elec_2',   trade: '전기통신작업', name: '난연CD관 16MM',    spec: '',   unit: 'M',   qty: 0, matUnitPrice: 300,  labUnitPrice: 0,    expUnitPrice: 0,   enabled: true, remark: '' },
  { id: 'gi_elec_3',   trade: '전기통신작업', name: '전열기구(콘센트/스위치)', spec: '', unit: '식', qty: 1, matUnitPrice: 0, labUnitPrice: 0,  expUnitPrice: 0,   enabled: true, remark: '' },
  { id: 'gi_elec_4',   trade: '전기통신작업', name: '분전함',           spec: '',   unit: '식',  qty: 0, matUnitPrice: 0,    labUnitPrice: 0,    expUnitPrice: 0,   enabled: false, remark: '' },
  { id: 'gi_elec_5',   trade: '전기통신작업', name: '부자재',           spec: '',   unit: '식',  qty: 1, matUnitPrice: 0,    labUnitPrice: 0,    expUnitPrice: 0,   enabled: true, remark: '' },
  { id: 'gi_elec_6',   trade: '전기통신작업', name: '노무비',           spec: '인', unit: '인',  qty: 0, matUnitPrice: 0,    labUnitPrice: 280000, expUnitPrice: 20000, enabled: true, remark: '' },
  // 소방작업
  { id: 'gi_fire_1',   trade: '소방작업', name: '감지기',              spec: '',   unit: 'EA',  qty: 0, matUnitPrice: 6000, labUnitPrice: 0,    expUnitPrice: 0,   enabled: false, remark: '' },
  { id: 'gi_fire_2',   trade: '소방작업', name: 'S/P 헤드',            spec: '',   unit: 'EA',  qty: 0, matUnitPrice: 6500, labUnitPrice: 0,    expUnitPrice: 0,   enabled: false, remark: '' },
  { id: 'gi_fire_3',   trade: '소방작업', name: '피난유도등',          spec: '',   unit: 'EA',  qty: 0, matUnitPrice: 22000, labUnitPrice: 0,   expUnitPrice: 0,   enabled: false, remark: '' },
]

export const useStore = create(
  persist(
    (set, get) => ({
  // 프로젝트 정보
  project: {
    siteName: '',
    clientName: '',
    manager: '',
    date: new Date().toISOString().slice(0, 10),
  },
  setProject: (fields) =>
    set((s) => ({ project: { ...s.project, ...fields } })),

  // 전체 항목 (실 외 공통 공종)
  globalItems: DEFAULT_GLOBAL_ITEMS,

  addGlobalItem: () =>
    set((s) => ({
      globalItems: [...s.globalItems, {
        id: `gi_custom_${Date.now()}`,
        trade: '기타', name: '', spec: '', unit: '식',
        qty: 1, matUnitPrice: 0, labUnitPrice: 0, expUnitPrice: 0,
        enabled: true, remark: '',
      }],
    })),

  updateGlobalItem: (id, fields) =>
    set((s) => ({
      globalItems: s.globalItems.map(gi => gi.id === id ? { ...gi, ...fields } : gi),
    })),

  deleteGlobalItem: (id) =>
    set((s) => ({
      globalItems: s.globalItems.filter(gi => gi.id !== id),
    })),

  // 실(Room) 목록
  rooms: [],

  addRoom: () =>
    set((s) => ({
      rooms: [...s.rooms, createRoom(`실 ${s.rooms.length + 1}`)],
    })),

  updateRoom: (roomId, fields) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, ...fields } : r
      ),
    })),

  deleteRoom: (roomId) =>
    set((s) => ({ rooms: s.rooms.filter((r) => r.id !== roomId) })),

  duplicateRoom: (roomId) =>
    set((s) => {
      const room = s.rooms.find((r) => r.id === roomId)
      if (!room) return s
      const newRoom = {
        ...JSON.parse(JSON.stringify(room)),
        id: `room_${Date.now()}`,
        name: room.name + ' (복사)',
        surfaces: room.surfaces.map((sf) => ({
          ...sf,
          id: `${sf.direction}_${Date.now()}_${Math.random()}`,
        })),
      }
      const idx = s.rooms.findIndex((r) => r.id === roomId)
      const next = [...s.rooms]
      next.splice(idx + 1, 0, newRoom)
      return { rooms: next }
    }),

  // 추가 벽 추가
  addWall: (roomId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          surfaces: [...r.surfaces, {
            ...defaultSurface(`벽${String.fromCharCode(69 + r.surfaces.filter(sf => sf.direction === 'wallExtra').length)}`, 'wallExtra'),
            extraWidthM: 0,
            extraHeightM: 0,
          }],
        }
      ),
    })),

  // 면 삭제 (추가 벽용)
  deleteSurface: (roomId, surfaceId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          surfaces: r.surfaces.filter(sf => sf.id !== surfaceId),
        }
      ),
    })),

  // 면(Surface) 업데이트
  updateSurface: (roomId, surfaceId, fields) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId
          ? r
          : {
              ...r,
              surfaces: r.surfaces.map((sf) =>
                sf.id !== surfaceId ? sf : { ...sf, ...fields }
              ),
            }
      ),
    })),

  // 도어 추가/수정/삭제
  addDoor: (roomId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          doors: [...(r.doors || []), {
            id: `door_${Date.now()}_${Math.random()}`,
            type: '방문',
            widthM: 0.9,
            heightM: 2.1,
            qty: 1,
            unitPrice: 0,
          }],
        }
      ),
    })),

  updateDoor: (roomId, doorId, fields) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          doors: r.doors.map((d) => d.id !== doorId ? d : { ...d, ...fields }),
        }
      ),
    })),

  deleteDoor: (roomId, doorId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          doors: r.doors.filter((d) => d.id !== doorId),
        }
      ),
    })),

  // 조명
  addLighting: (roomId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          lightings: [...(r.lightings || []), {
            id: `light_${Date.now()}_${Math.random()}`,
            type: '매입등 3"',
            spec: '',
            qty: 1,
            lengthM: 0,
          }],
        }
      ),
    })),

  updateLighting: (roomId, lightingId, fields) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          lightings: (r.lightings || []).map((l) =>
            l.id !== lightingId ? l : { ...l, ...fields }
          ),
        }
      ),
    })),

  deleteLighting: (roomId, lightingId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          lightings: (r.lightings || []).filter((l) => l.id !== lightingId),
        }
      ),
    })),

  // 랩핑평판 (몰딩) — 면(surface) 단위
  addMolding: (roomId, sfId, moldType) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          surfaces: r.surfaces.map((sf) =>
            sf.id !== sfId ? sf : {
              ...sf,
              moldings: [...(sf.moldings || []), {
                id: `mold_${Date.now()}_${Math.random()}`,
                moldType,
                widthMm: moldType === '걸레받이' ? 80 : moldType === '천정몰딩' ? 30 : 60,
                lengthM: 0,        // 창틀몰딩/유리칠판 수동입력용
                itemWidthM: 0,
                itemHeightM: 0,
                qty: 1,
              }],
            }
          ),
        }
      ),
    })),

  updateMolding: (roomId, sfId, moldingId, fields) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          surfaces: r.surfaces.map((sf) =>
            sf.id !== sfId ? sf : {
              ...sf,
              moldings: (sf.moldings || []).map((m) =>
                m.id !== moldingId ? m : { ...m, ...fields }
              ),
            }
          ),
        }
      ),
    })),

  deleteMolding: (roomId, sfId, moldingId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          surfaces: r.surfaces.map((sf) =>
            sf.id !== sfId ? sf : {
              ...sf,
              moldings: (sf.moldings || []).filter((m) => m.id !== moldingId),
            }
          ),
        }
      ),
    })),

  // 개구부 추가/삭제
  addOpening: (roomId, surfaceId, opening) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId
          ? r
          : {
              ...r,
              surfaces: r.surfaces.map((sf) =>
                sf.id !== surfaceId
                  ? sf
                  : {
                      ...sf,
                      openings: [
                        ...sf.openings,
                        { id: `op_${Date.now()}`, ...opening },
                      ],
                    }
              ),
            }
      ),
    })),

  deleteOpening: (roomId, surfaceId, openingId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId
          ? r
          : {
              ...r,
              surfaces: r.surfaces.map((sf) =>
                sf.id !== surfaceId
                  ? sf
                  : {
                      ...sf,
                      openings: sf.openings.filter((o) => o.id !== openingId),
                    }
              ),
            }
      ),
    })),

  // 필름 구간 추가
  addFilmSection: (roomId, surfaceId, section) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          surfaces: r.surfaces.map((sf) =>
            sf.id !== surfaceId ? sf : {
              ...sf,
              filmSections: [...sf.filmSections, { id: `fs_${Date.now()}_${Math.random()}`, ...section }],
            }
          ),
        }
      ),
    })),

  // 필름 구간 수정
  updateFilmSection: (roomId, surfaceId, sectionId, fields) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          surfaces: r.surfaces.map((sf) =>
            sf.id !== surfaceId ? sf : {
              ...sf,
              filmSections: sf.filmSections.map((sec) =>
                sec.id !== sectionId ? sec : { ...sec, ...fields }
              ),
            }
          ),
        }
      ),
    })),

  // 필름 구간 삭제
  deleteFilmSection: (roomId, surfaceId, sectionId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          surfaces: r.surfaces.map((sf) =>
            sf.id !== surfaceId ? sf : {
              ...sf,
              filmSections: sf.filmSections.filter((sec) => sec.id !== sectionId),
            }
          ),
        }
      ),
    })),
  }),
  {
    name: 'interior-estimate-store',
    version: 3,
    migrate: (state, version) => {
      if (version < 2) {
        const dirMap   = { wallN: 'wallA', wallS: 'wallB', wallE: 'wallC', wallW: 'wallD' }
        const labelMap = { '벽(북)': '벽A', '벽(남)': '벽B', '벽(동)': '벽C', '벽(서)': '벽D' }
        state.rooms = (state.rooms || []).map(room => ({
          ...room,
          slabHeightM: room.slabHeightM ?? 0,
          surfaces: (room.surfaces || []).map(sf => ({
            ...sf,
            direction: dirMap[sf.direction] ?? sf.direction,
            label: labelMap[sf.label] ?? sf.label,
          })),
        }))
      }
      if (version < 3) {
        // moldings를 room → surface로 이동 (기존 room 단위 몰딩은 초기화)
        state.rooms = (state.rooms || []).map(room => ({
          ...room,
          moldings: undefined,
          surfaces: (room.surfaces || []).map(sf => ({
            ...sf,
            moldings: sf.moldings ?? [],
          })),
        }))
      }
      return state
    },
  }
)
)
