import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaultSurface = (label, direction) => ({
  id: `${direction}_${Date.now()}_${Math.random()}`,
  label,
  direction, // floor | ceiling | wallA | wallB | wallC | wallD
  finishType: 'none',        // 마감재 타입 키
  finishMaterialId: '',      // 선택된 마감재 ID
  seokgoType: 'sg_normal',   // 석고보드 종류
  mdfId: 'mdf_9',            // MDF 종류
  filmPricePerM: 5000,       // 필름 m당 기본 단가
  filmSections: [],          // 필름 구간 목록
  wallType: 'normal',        // 'normal' | 'partition' (칸막이벽)
  hapanId: 'hp_normal_11',   // 합판 종류 (칸막이벽용)
  insulationType: 'none',    // 흡음재 종류
  decorType: 'none',         // 'none' | 'tempboard' | 'louver' | 'stainless' | 'tile' | 'custom'
  decorCustomName: '',       // 직접입력 시 자재명
  decorSqm: 0,               // 장식재 면적(㎡)
  decorPricePerSqm: 0,       // 장식재 단가(원/㎡)
  ojingeoEnabled: false,     // 오징어합판 추가 여부
  ojingeoId: 'hp_squid_4',   // 오징어합판 종류
  ojingeoQty: 0,             // 오징어합판 수량 (0=자동계산)
  lgStudSpacingMm: 406,      // 경량벽체 스터드 간격
  lgRunnerPrice: 0,          // 경량벽체 런너 단가(원/m)
  lgStudPrice: 0,            // 경량벽체 스터드 단가(원/EA)
  ceilingCarpentry: false,   // 천장 목공 (각재+석고) 포함 여부
  ceilingHapanEnabled: false, // 천장 합판 사용 여부
  ceilingHapanId: 'hp_normal_11', // 천장 합판 종류
  enabled: true,
})

const createRoom = (name) => {
  const id = `room_${Date.now()}`
  return {
    id,
    name,
    widthM: 0,
    depthM: 0,
    heightM: 2.4,
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

  // 실(Room) 목록
  rooms: [],

  addPartition: (roomId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          partitions: [...(r.partitions || []), {
            id: `part_${Date.now()}_${Math.random()}`,
            name: `가벽 ${(r.partitions || []).length + 1}`,
            widthM: 0,
            heightM: 0,
            direction: 'wall_custom',
            finishType: 'none',
            finishMaterialId: '',
            seokgoType: 'sg_normal',
            mdfId: 'mdf_9',
            filmPricePerM: 5000,
            filmSections: [],
            wallType: 'normal',
            hapanId: 'hp_normal_11',
            insulationType: 'none',
            decorType: 'none',
            decorCustomName: '',
            decorSqm: 0,
            decorPricePerSqm: 0,
            ojingeoEnabled: false,
            ojingeoId: 'hp_squid_4',
            ojingeoQty: 0,
            lgStudSpacingMm: 406,
            lgRunnerPrice: 0,
            lgStudPrice: 0,
            enabled: true,
          }],
        }
      ),
    })),

  updatePartition: (roomId, partitionId, fields) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          partitions: (r.partitions || []).map((p) =>
            p.id !== partitionId ? p : { ...p, ...fields }
          ),
        }
      ),
    })),

  addPartitionMolding: (roomId, partitionId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          partitions: (r.partitions || []).map((p) =>
            p.id !== partitionId ? p : {
              ...p,
              moldings: [...(p.moldings || []), {
                id: `pmold_${Date.now()}_${Math.random()}`,
                widthMm: 60,
                autoCalc: true,
                customLengthM: 0,
              }],
            }
          ),
        }
      ),
    })),

  updatePartitionMolding: (roomId, partitionId, moldingId, fields) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          partitions: (r.partitions || []).map((p) =>
            p.id !== partitionId ? p : {
              ...p,
              moldings: (p.moldings || []).map((m) =>
                m.id !== moldingId ? m : { ...m, ...fields }
              ),
            }
          ),
        }
      ),
    })),

  deletePartitionMolding: (roomId, partitionId, moldingId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          partitions: (r.partitions || []).map((p) =>
            p.id !== partitionId ? p : {
              ...p,
              moldings: (p.moldings || []).filter((m) => m.id !== moldingId),
            }
          ),
        }
      ),
    })),

  deletePartition: (roomId, partitionId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          partitions: (r.partitions || []).filter((p) => p.id !== partitionId),
        }
      ),
    })),

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
            totalLengthMm: 0,
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

  // 랩핑평판 (몰딩)
  addMolding: (roomId, moldType) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          moldings: [...(r.moldings || []), {
            id: `mold_${Date.now()}_${Math.random()}`,
            moldType,
            widthMm: moldType === '걸레받이' ? 80 : moldType === '천정몰딩' ? 30 : moldType === '창틀몰딩' ? 150 : 60,
            autoCalc: ['걸레받이', '천정몰딩', '벽A', '벽B', '벽C', '벽D', '벽(북)', '벽(남)', '벽(동)', '벽(서)'].includes(moldType),
            customLengthM: 0,
            itemWidthM: 0,
            itemHeightM: 0,
            qty: 1,
          }],
        }
      ),
    })),

  updateMolding: (roomId, moldingId, fields) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          moldings: (r.moldings || []).map((m) =>
            m.id !== moldingId ? m : { ...m, ...fields }
          ),
        }
      ),
    })),

  deleteMolding: (roomId, moldingId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id !== roomId ? r : {
          ...r,
          moldings: (r.moldings || []).filter((m) => m.id !== moldingId),
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
      rooms: s.rooms.map((r) => {
        if (r.id !== roomId) return r
        const newSec = { id: `fs_${Date.now()}`, ...section }
        const inSurface = r.surfaces.some(sf => sf.id === surfaceId)
        return {
          ...r,
          surfaces: inSurface ? r.surfaces.map((sf) =>
            sf.id !== surfaceId ? sf : { ...sf, filmSections: [...sf.filmSections, newSec] }
          ) : r.surfaces,
          partitions: !inSurface ? (r.partitions || []).map((p) =>
            p.id !== surfaceId ? p : { ...p, filmSections: [...(p.filmSections || []), newSec] }
          ) : (r.partitions || []),
        }
      }),
    })),

  // 필름 구간 수정
  updateFilmSection: (roomId, surfaceId, sectionId, fields) =>
    set((s) => ({
      rooms: s.rooms.map((r) => {
        if (r.id !== roomId) return r
        const inSurface = r.surfaces.some(sf => sf.id === surfaceId)
        const updSec = (list) => list.map((sf) =>
          sf.id !== surfaceId ? sf : {
            ...sf,
            filmSections: (sf.filmSections || []).map((sec) =>
              sec.id !== sectionId ? sec : { ...sec, ...fields }
            ),
          }
        )
        return {
          ...r,
          surfaces: inSurface ? updSec(r.surfaces) : r.surfaces,
          partitions: !inSurface ? updSec(r.partitions || []) : (r.partitions || []),
        }
      }),
    })),

  // 필름 구간 삭제
  deleteFilmSection: (roomId, surfaceId, sectionId) =>
    set((s) => ({
      rooms: s.rooms.map((r) => {
        if (r.id !== roomId) return r
        const inSurface = r.surfaces.some(sf => sf.id === surfaceId)
        const delSec = (list) => list.map((sf) =>
          sf.id !== surfaceId ? sf : {
            ...sf,
            filmSections: (sf.filmSections || []).filter((sec) => sec.id !== sectionId),
          }
        )
        return {
          ...r,
          surfaces: inSurface ? delSec(r.surfaces) : r.surfaces,
          partitions: !inSurface ? delSec(r.partitions || []) : (r.partitions || []),
        }
      }),
    })),
  }),
  { name: 'interior-estimate-store' }
)
)
