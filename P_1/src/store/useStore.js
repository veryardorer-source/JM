import { create } from 'zustand'

const defaultSurface = (label, direction) => ({
  id: `${direction}_${Date.now()}_${Math.random()}`,
  label,
  direction, // floor | ceiling | wallN | wallS | wallE | wallW
  finishType: 'none',      // 마감재 타입 키
  finishMaterialId: '',    // 선택된 마감재 ID
  seokgoType: 'sg_normal', // 석고보드 종류
  mdfId: 'mdf_9',          // MDF 종류
  filmPricePerM: 5000,         // 필름 m당 단가
  // 필름 구간 목록 [{id, label, widthMm, patternRepeatMm, heightOverrideMm}]
  // heightOverrideMm=0 이면 벽 높이 사용
  filmSections: [],
  openings: [],                // 개구부 [{id, type, width, height}]
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
    surfaces: [
      defaultSurface('바닥', 'floor'),
      defaultSurface('천장', 'ceiling'),
      defaultSurface('벽(북)', 'wallN'),
      defaultSurface('벽(남)', 'wallS'),
      defaultSurface('벽(동)', 'wallE'),
      defaultSurface('벽(서)', 'wallW'),
    ],
  }
}

export const useStore = create((set, get) => ({
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
              filmSections: [...sf.filmSections, { id: `fs_${Date.now()}`, ...section }],
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
}))
