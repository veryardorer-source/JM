import { useState } from 'react'
import { useStore } from '../store/useStore'

const STATUS_COLOR = {
  '대기': 'bg-gray-100 text-gray-600',
  '진행중': 'bg-yellow-100 text-yellow-700',
  '완료': 'bg-green-100 text-green-700',
}

const EMPTY_TASK = { title: '', dueDate: '', priority: '보통', memo: '' }
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function buildCalendar(year, month) {
  // month: 0-indexed
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

function CalendarView({ tasks, onRestore, onDelete }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)

  const todayStr = today.toISOString().slice(0, 10)

  // 완료된 task를 날짜별로 매핑
  const tasksByDate = tasks.reduce((acc, t) => {
    const d = t.completedAt || t.dueDate
    if (!d) return acc
    if (!acc[d]) acc[d] = []
    acc[d].push(t)
    return acc
  }, {})

  const cells = buildCalendar(year, month)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  function dateStr(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] || []) : []

  return (
    <div className="space-y-4">
      {/* 월 네비게이션 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg">‹</button>
          <span className="font-semibold text-gray-800">{year}년 {month + 1}월</span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg">›</button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 px-2 pt-2">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`text-center text-[11px] font-medium py-1.5 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 px-2 pb-3 gap-y-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />
            const ds = dateStr(d)
            const hasTasks = !!tasksByDate[ds]
            const isToday = ds === todayStr
            const isSelected = ds === selectedDate
            const dow = (i) % 7
            const isSun = (cells.indexOf(d) === i) && (i % 7 === 0)
            const isSat = i % 7 === 6
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(isSelected ? null : ds)}
                className={`relative flex flex-col items-center py-1.5 rounded-lg transition-colors
                  ${isSelected ? 'bg-blue-500' : isToday ? 'bg-blue-50' : 'hover:bg-gray-50'}
                `}
              >
                <span className={`text-sm font-medium leading-none
                  ${isSelected ? 'text-white' : isToday ? 'text-blue-600' : i % 7 === 0 ? 'text-red-400' : i % 7 === 6 ? 'text-blue-400' : 'text-gray-700'}
                `}>{d}</span>
                {hasTasks && (
                  <div className={`mt-1 flex gap-0.5 flex-wrap justify-center`}>
                    {tasksByDate[ds].slice(0, 3).map((_, idx) => (
                      <div key={idx} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-green-400'}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 선택한 날짜의 업무 */}
      {selectedDate && (
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2 px-1">
            {selectedDate} {selectedTasks.length === 0 ? '— 완료된 업무 없음' : `— ${selectedTasks.length}건 완료`}
          </div>
          {selectedTasks.length === 0 ? (
            <div className="bg-white rounded-xl p-5 text-center text-gray-400 text-sm shadow-sm border border-gray-100">
              이 날 완료된 업무가 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(t => (
                <div key={t.id} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-green-100 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-600">{t.title}</div>
                    {t.memo && <div className="text-xs text-gray-400 mt-0.5">{t.memo}</div>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => onRestore(t.id)} className="text-gray-300 hover:text-blue-400 text-sm px-1" title="되돌리기">↩</button>
                    <button onClick={() => { if (confirm('삭제할까요?')) onDelete(t.id) }} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Accounting() {
  const { tasks, addTask, updateTask, deleteTask } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_TASK)
  const [activeView, setActiveView] = useState('pending') // 'pending' | 'history'

  const accountingTasks = tasks.filter(t => t.projectId === null)
  const pendingTasks = accountingTasks.filter(t => t.status !== '완료')
    .sort((a, b) => {
      const aOver = a.dueDate && new Date(a.dueDate) < new Date(new Date().toDateString())
      const bOver = b.dueDate && new Date(b.dueDate) < new Date(new Date().toDateString())
      if (aOver && !bOver) return -1
      if (!aOver && bOver) return 1
      if (!a.dueDate && b.dueDate) return 1
      if (a.dueDate && !b.dueDate) return -1
      return a.dueDate > b.dueDate ? 1 : -1
    })

  const historyTasks = accountingTasks.filter(t => t.status === '완료')

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_TASK)
    setShowForm(true)
  }

  function openEdit(t) {
    setEditingId(t.id)
    setForm({ title: t.title, dueDate: t.dueDate || '', priority: t.priority, memo: t.memo || '' })
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editingId) {
      updateTask(editingId, form)
    } else {
      addTask({ ...form, projectId: null })
    }
    setShowForm(false)
    setEditingId(null)
  }

  function cycleStatus(t) {
    const seq = ['대기', '진행중', '완료']
    const next = seq[(seq.indexOf(t.status) + 1) % seq.length]
    updateTask(t.id, { status: next })
  }

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date(new Date().toDateString())

  return (
    <div className="space-y-4">
      {/* 뷰 전환 탭 */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveView('pending')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'pending' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
        >
          할일 {pendingTasks.length > 0 && <span className="text-blue-500">({pendingTasks.length})</span>}
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
        >
          지난 스케줄
        </button>
      </div>

      {/* 할일 뷰 */}
      {activeView === 'pending' && (
        <>
          <div className="flex justify-end">
            <button onClick={openAdd} className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-600">+ 업무 추가</button>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm border border-gray-100">
              남은 업무가 없습니다 🎉
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map(t => (
                <TaskItem key={t.id} t={t} onCycle={cycleStatus} onEdit={openEdit} onDelete={deleteTask} />
              ))}
            </div>
          )}
        </>
      )}

      {/* 지난 스케줄 뷰 - 캘린더 */}
      {activeView === 'history' && (
        <CalendarView
          tasks={historyTasks}
          onRestore={(id) => updateTask(id, { status: '대기' })}
          onDelete={deleteTask}
        />
      )}

      {/* 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{editingId ? '업무 수정' : '업무 추가'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">업무 내용 *</label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="예: 3월 급여 이체"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">마감일</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">우선순위</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                    <option>높음</option>
                    <option>보통</option>
                    <option>낮음</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">메모</label>
                <textarea value={form.memo} onChange={e => setForm(p => ({ ...p, memo: e.target.value }))} rows={2} placeholder="추가 메모..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-blue-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-600">{editingId ? '수정 완료' : '추가'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50">취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskItem({ t, onCycle, onEdit, onDelete }) {
  const isOverdue = t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString())
  const STATUS_COLOR = {
    '대기': 'bg-gray-100 text-gray-600',
    '진행중': 'bg-yellow-100 text-yellow-700',
    '완료': 'bg-green-100 text-green-700',
  }
  return (
    <div className={`bg-white rounded-xl px-4 py-3.5 shadow-sm border ${isOverdue ? 'border-red-100' : 'border-gray-100'}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onCycle(t)} className={`mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 cursor-pointer ${STATUS_COLOR[t.status]}`}>
          {t.status}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800">{t.title}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {t.dueDate && (
              <span className={`text-[11px] ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {isOverdue ? '⚠ ' : ''}{t.dueDate}
              </span>
            )}
            {t.priority === '높음' && <span className="text-[11px] text-red-500 font-medium">긴급</span>}
            {t.memo && <span className="text-[11px] text-gray-400 truncate max-w-[150px]">{t.memo}</span>}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onEdit(t)} className="text-gray-300 hover:text-blue-400 text-sm px-1">✎</button>
          <button onClick={() => { if (confirm('삭제할까요?')) onDelete(t.id) }} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
        </div>
      </div>
    </div>
  )
}
