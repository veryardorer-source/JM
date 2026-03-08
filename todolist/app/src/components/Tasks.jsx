import { useState } from 'react'
import { useStore } from '../store/useStore'

const TEMPLATES_BY_TYPE = {
  '시공의뢰':  ['실측', '평면도', '3D', '마감재', '작업도면'],
  '디자인의뢰': ['평면도', '디자인', '작업도면'],
}
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function getTemplateState(tasks, projectId, template) {
  const related = tasks.filter(t =>
    t.projectId === projectId &&
    (t.title === template || t.title.startsWith(template + ' '))
  )
  const active = related.find(t => t.status !== '완료')
  const doneCount = related.filter(t => t.status === '완료').length
  if (active) return { type: 'active', task: active, nextTitle: null }
  if (doneCount > 0) return { type: 'done', count: doneCount, nextTitle: `${template} ${doneCount + 1}차 수정` }
  return { type: 'none', nextTitle: template }
}

const today = () => new Date().toISOString().slice(0, 10)
const isOverdue = d => d && d < today()
const isToday_ = d => d === today()

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function isRecurringActiveToday(r) {
  const now = new Date()
  const dow = now.getDay()
  const dom = now.getDate()
  if (!r.active) return false
  if (r.repeatType === 'daily') return true
  if (r.repeatType === 'weekly') return r.repeatDays.includes(dow)
  if (r.repeatType === 'monthly') return r.repeatMonthDay === dom
  return false
}

function RecurringItem({ r, onComplete, onUncomplete, onEdit, onDelete }) {
  const todayStr = today()
  const doneToday = r.lastCompletedDate === todayStr
  const activeToday = isRecurringActiveToday(r)

  let repeatDesc = ''
  if (r.repeatType === 'daily') repeatDesc = '매일'
  else if (r.repeatType === 'weekly') repeatDesc = `매주 ${r.repeatDays.map(d => WEEKDAY_NAMES[d]).join('·')}`
  else if (r.repeatType === 'monthly') repeatDesc = `매월 ${r.repeatMonthDay}일`

  return (
    <div className={`bg-white rounded-xl px-4 py-3 shadow-sm border flex items-center gap-3 ${!activeToday ? 'opacity-50' : doneToday ? 'border-green-100' : 'border-blue-100'}`}>
      <button
        onClick={() => doneToday ? onUncomplete(r.id) : onComplete(r.id)}
        disabled={!activeToday}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${doneToday ? 'bg-green-500 border-green-500' : activeToday ? 'border-blue-300 hover:border-blue-500' : 'border-gray-200'}`}
      >
        {doneToday && <span className="text-white text-xs">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${doneToday ? 'line-through text-gray-400' : 'text-gray-800'}`}>{r.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{repeatDesc}</span>
          {!activeToday && <span className="text-[11px] text-gray-400">오늘 아님</span>}
          {doneToday && <span className="text-[11px] text-green-500">오늘 완료</span>}
          {r.priority === '높음' && !doneToday && <span className="text-[11px] text-red-500 font-medium">긴급</span>}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onEdit(r)} className="text-gray-300 hover:text-blue-400 text-sm px-1">✎</button>
        <button onClick={() => { if (confirm('삭제할까요?')) onDelete(r.id) }} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
      </div>
    </div>
  )
}

// ── 서브 뷰: 전체 할일 ────────────────────────────────────────────
function AllView({ tasks, projects, recurring, onToggle, onDelete, onAdd, onEdit, completeRecurring, uncompleteRecurring, onEditRecurring, onAddRecurring, deleteRecurring }) {
  const [showRecurring, setShowRecurring] = useState(true)

  const pending = tasks
    .filter(t => t.status !== '완료')
    .sort((a, b) => {
      const aOv = isOverdue(a.dueDate), bOv = isOverdue(b.dueDate)
      if (aOv && !bOv) return -1
      if (!aOv && bOv) return 1
      if (!a.dueDate && b.dueDate) return 1
      if (a.dueDate && !b.dueDate) return -1
      return a.dueDate > b.dueDate ? 1 : -1
    })

  const sortedRecurring = [...recurring].sort((a, b) => {
    const aT = isRecurringActiveToday(a), bT = isRecurringActiveToday(b)
    if (aT && !bT) return -1
    if (!aT && bT) return 1
    return 0
  })

  return (
    <div className="space-y-4">
      {/* 반복 업무 섹션 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <button
            onClick={() => setShowRecurring(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            반복 업무
            {recurring.filter(r => isRecurringActiveToday(r) && r.lastCompletedDate !== today()).length > 0 && (
              <span className="text-xs text-blue-500 font-medium">
                ({recurring.filter(r => isRecurringActiveToday(r) && r.lastCompletedDate !== today()).length}건 오늘)
              </span>
            )}
            <span className="text-gray-300 text-xs">{showRecurring ? '▲' : '▼'}</span>
          </button>
          <button onClick={onAddRecurring} className="text-xs text-blue-500 hover:underline">+ 추가</button>
        </div>
        {showRecurring && (
          <div className="px-4 py-3">
            {sortedRecurring.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-4">
                반복 업무를 추가하면 매일/매주/매월 자동으로 표시됩니다
              </div>
            ) : (
              <div className="space-y-2">
                {sortedRecurring.map(r => (
                  <RecurringItem
                    key={r.id}
                    r={r}
                    onComplete={completeRecurring}
                    onUncomplete={uncompleteRecurring}
                    onEdit={onEditRecurring}
                    onDelete={deleteRecurring}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 일반 할일 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-gray-700">일반 할일</div>
          <button onClick={onAdd} className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-600">+ 추가</button>
        </div>
        {pending.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm border border-gray-100">모든 할일 완료 🎉</div>
        ) : (
          <div className="space-y-2">
            {pending.map(t => {
              const project = projects.find(p => p.id === t.projectId)
              const overdue = isOverdue(t.dueDate)
              const todayTask = isToday_(t.dueDate)
              return (
                <div key={t.id} className={`bg-white rounded-xl px-4 py-3 shadow-sm border flex items-center gap-3 ${overdue ? 'border-red-100' : todayTask ? 'border-blue-100' : 'border-gray-100'}`}>
                  <button
                    onClick={() => onToggle(t.id)}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${t.status === '완료' ? 'bg-green-500 border-green-500' : t.status === '진행중' ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                  >
                    {t.status === '완료' && <span className="text-white text-xs">✓</span>}
                    {t.status === '진행중' && <span className="text-blue-500 text-[10px]">▶</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800">{t.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {project && <span className="text-[11px] text-blue-500 truncate max-w-[120px]">{project.name}</span>}
                      {!project && <span className="text-[11px] text-purple-500">경리</span>}
                      {t.dueDate && <span className={`text-[11px] ${overdue ? 'text-red-500 font-medium' : todayTask ? 'text-blue-500' : 'text-gray-400'}`}>{overdue ? '⚠ ' : ''}{t.dueDate}</span>}
                      {t.priority === '높음' && <span className="text-[11px] text-red-500 font-medium">긴급</span>}
                    </div>
                  </div>
                  <button onClick={() => onEdit(t)} className="text-gray-300 hover:text-blue-400 text-sm px-1 flex-shrink-0">✎</button>
                  <button onClick={() => onDelete(t.id)} className="text-gray-300 hover:text-red-400 text-lg flex-shrink-0">×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 서브 뷰: 디자인 업무 ─────────────────────────────────────────
function DesignView({ tasks, projects, addTask, updateTask, deleteTask }) {
  const [expandedProject, setExpandedProject] = useState(null)
  const [addingCustom, setAddingCustom] = useState(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customDueDate, setCustomDueDate] = useState('')

  function handleTemplateClick(projectId, template, projectType) {
    const state = getTemplateState(tasks, projectId, template)
    if (state.type === 'active') return
    const category = projectType === '디자인의뢰' ? '디자인' : '현장'
    addTask({ title: state.nextTitle, projectId, dueDate: '', category, priority: '보통' })
  }

  function handleCustomAdd(e) {
    e.preventDefault()
    if (!customTitle.trim() || !addingCustom) return
    addTask({ title: customTitle, projectId: addingCustom, dueDate: customDueDate, category: '디자인', priority: '보통' })
    setCustomTitle('')
    setCustomDueDate('')
    setAddingCustom(null)
  }

  const activeProjects = projects.filter(p => p.status !== '완료')

  const TYPE_COLOR = {
    '시공의뢰':  'text-orange-500 bg-orange-50 border border-orange-200',
    '디자인의뢰': 'text-purple-500 bg-purple-50 border border-purple-200',
  }

  return (
    <div className="space-y-3">
      {activeProjects.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm border border-gray-100">진행 중인 현장이 없습니다</div>
      ) : (
        activeProjects.map(project => {
          const pType = project.projectType || '시공의뢰'
          const templates = TEMPLATES_BY_TYPE[pType] || TEMPLATES_BY_TYPE['시공의뢰']
          const pTasks = tasks.filter(t => t.projectId === project.id)
          const pendingPTasks = pTasks.filter(t => t.status !== '완료')
          const isOpen = expandedProject === project.id

          return (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpandedProject(isOpen ? null : project.id)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm">{project.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_COLOR[pType]}`}>{pType}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{project.client} · 할일 {pendingPTasks.length}건</div>
                </div>
                <span className="text-gray-300 text-base">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3">
                  <div>
                    <div className="text-[11px] text-gray-400 mb-2">빠른 추가</div>
                    <div className="flex flex-wrap gap-2">
                      {templates.map(tmpl => {
                        const state = getTemplateState(tasks, project.id, tmpl)
                        return (
                          <button
                            key={tmpl}
                            onClick={() => handleTemplateClick(project.id, tmpl, pType)}
                            title={state.type === 'active' ? '현재 진행중' : state.type === 'done' ? `클릭하면 "${state.nextTitle}" 추가` : `"${tmpl}" 추가`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                              ${state.type === 'active'
                                ? 'bg-blue-50 border-blue-200 text-blue-600 cursor-default'
                                : state.type === 'done'
                                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                              }`}
                          >
                            {state.type === 'active' && '▶ '}
                            {state.type === 'done' && '✓ '}
                            {state.type === 'none' && '+ '}
                            {tmpl}
                            {state.type === 'done' && <span className="ml-1 text-orange-500">+수정</span>}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => setAddingCustom(addingCustom === project.id ? null : project.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500"
                      >
                        + 직접 입력
                      </button>
                    </div>
                  </div>

                  {addingCustom === project.id && (
                    <form onSubmit={handleCustomAdd} className="flex gap-2">
                      <input
                        autoFocus
                        value={customTitle}
                        onChange={e => setCustomTitle(e.target.value)}
                        placeholder="할일 입력..."
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                      />
                      <input
                        type="date"
                        value={customDueDate}
                        onChange={e => setCustomDueDate(e.target.value)}
                        className="w-32 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                      />
                      <button type="submit" className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-600">✓</button>
                    </form>
                  )}

                  {pTasks.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {pTasks
                        .sort((a, b) => {
                          if (a.status === '완료' && b.status !== '완료') return 1
                          if (a.status !== '완료' && b.status === '완료') return -1
                          return 0
                        })
                        .map(t => {
                          const overdue = isOverdue(t.dueDate)
                          return (
                            <div key={t.id} className={`flex items-center gap-2 py-1 ${t.status === '완료' ? 'opacity-50' : ''}`}>
                              <button
                                onClick={() => updateTask(t.id, { status: t.status === '완료' ? '대기' : t.status === '대기' ? '진행중' : '완료' })}
                                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                                  ${t.status === '완료' ? 'bg-green-500 border-green-500' : t.status === '진행중' ? 'border-blue-400 bg-blue-100' : 'border-gray-300 hover:border-blue-400'}`}
                              >
                                {t.status === '완료' && <span className="text-white text-[9px]">✓</span>}
                                {t.status === '진행중' && <span className="text-blue-500 text-[9px]">▶</span>}
                              </button>
                              <span className={`text-sm flex-1 ${t.status === '완료' ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t.title}</span>
                              {t.dueDate && <span className={`text-[11px] flex-shrink-0 ${overdue && t.status !== '완료' ? 'text-red-500' : 'text-gray-400'}`}>{t.dueDate}</span>}
                              <button onClick={() => deleteTask(t.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">×</button>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// ── 서브 뷰: 경리업무 ────────────────────────────────────────────
function AccountingView({ tasks, recurring, updateTask, deleteTask, onShowForm, completeRecurring, uncompleteRecurring, onEditRecurring, onAddRecurring, deleteRecurring }) {
  const pending = tasks
    .filter(t => t.projectId === null && t.status !== '완료')
    .sort((a, b) => {
      const aOv = isOverdue(a.dueDate), bOv = isOverdue(b.dueDate)
      if (aOv && !bOv) return -1
      if (!aOv && bOv) return 1
      if (!a.dueDate && b.dueDate) return 1
      if (a.dueDate && !b.dueDate) return -1
      return a.dueDate > b.dueDate ? 1 : -1
    })

  const sortedRecurring = [...recurring].sort((a, b) => {
    const aT = isRecurringActiveToday(a), bT = isRecurringActiveToday(b)
    if (aT && !bT) return -1
    if (!aT && bT) return 1
    return 0
  })

  function cycleStatus(t) {
    const seq = ['대기', '진행중', '완료']
    updateTask(t.id, { status: seq[(seq.indexOf(t.status) + 1) % seq.length] })
  }

  const STATUS_COLOR = { '대기': 'bg-gray-100 text-gray-600', '진행중': 'bg-yellow-100 text-yellow-700', '완료': 'bg-green-100 text-green-700' }

  return (
    <div className="space-y-5">
      {/* 반복 업무 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-gray-700">반복 업무</div>
          <button onClick={onAddRecurring} className="text-xs text-blue-500 hover:underline">+ 추가</button>
        </div>
        {sortedRecurring.length === 0 ? (
          <div className="bg-white rounded-xl p-5 text-center text-gray-400 text-sm shadow-sm border border-gray-100 border-dashed">
            반복 업무를 추가하면 매일/매주/매월 자동으로 표시됩니다
          </div>
        ) : (
          <div className="space-y-2">
            {sortedRecurring.map(r => (
              <RecurringItem key={r.id} r={r} onComplete={completeRecurring} onUncomplete={uncompleteRecurring} onEdit={onEditRecurring} onDelete={deleteRecurring} />
            ))}
          </div>
        )}
      </div>

      {/* 일반 업무 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-gray-700">일반 업무</div>
          <button onClick={onShowForm} className="text-xs text-blue-500 hover:underline">+ 추가</button>
        </div>
        {pending.length === 0 ? (
          <div className="bg-white rounded-xl p-5 text-center text-gray-400 text-sm shadow-sm border border-gray-100">남은 업무가 없습니다 🎉</div>
        ) : (
          <div className="space-y-2">
            {pending.map(t => {
              const overdue = isOverdue(t.dueDate)
              return (
                <div key={t.id} className={`bg-white rounded-xl px-4 py-3.5 shadow-sm border ${overdue ? 'border-red-100' : 'border-gray-100'}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => cycleStatus(t)} className={`mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 cursor-pointer ${STATUS_COLOR[t.status]}`}>
                      {t.status}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{t.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {t.dueDate && <span className={`text-[11px] ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{overdue ? '⚠ ' : ''}{t.dueDate}</span>}
                        {t.priority === '높음' && <span className="text-[11px] text-red-500 font-medium">긴급</span>}
                        {t.memo && <span className="text-[11px] text-gray-400 truncate max-w-[140px]">{t.memo}</span>}
                      </div>
                    </div>
                    <button onClick={() => { if (confirm('삭제할까요?')) deleteTask(t.id) }} className="text-gray-300 hover:text-red-400 text-lg leading-none flex-shrink-0">×</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 서브 뷰: 스케줄 캘린더 ───────────────────────────────────────
function ScheduleView({ tasks, updateTask, deleteTask }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)

  const todayStr = now.toISOString().slice(0, 10)
  const completedTasks = tasks.filter(t => t.status === '완료')

  const tasksByDate = completedTasks.reduce((acc, t) => {
    const d = t.completedAt || t.dueDate
    if (!d) return acc
    if (!acc[d]) acc[d] = []
    acc[d].push(t)
    return acc
  }, {})

  const cells = buildCalendar(year, month)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    setSelectedDate(null)
  }
  function ds(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] || []) : []

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-xl">‹</button>
          <span className="font-semibold text-gray-800">{year}년 {month + 1}월</span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-xl">›</button>
        </div>
        <div className="grid grid-cols-7 px-2 pt-2">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`text-center text-[11px] font-medium py-1.5 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 px-2 pb-3 gap-y-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />
            const dateStr = ds(d)
            const hasTasks = !!tasksByDate[dateStr]
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex flex-col items-center py-1.5 rounded-lg transition-colors ${isSelected ? 'bg-blue-500' : isToday ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <span className={`text-sm font-medium leading-none ${isSelected ? 'text-white' : isToday ? 'text-blue-600' : i % 7 === 0 ? 'text-red-400' : i % 7 === 6 ? 'text-blue-400' : 'text-gray-700'}`}>{d}</span>
                {hasTasks && (
                  <div className="mt-1 flex gap-0.5 justify-center">
                    {tasksByDate[dateStr].slice(0, 3).map((_, idx) => (
                      <div key={idx} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-green-400'}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2 px-1">
            {selectedDate} — {selectedTasks.length === 0 ? '완료된 업무 없음' : `${selectedTasks.length}건 완료`}
          </div>
          {selectedTasks.length === 0 ? (
            <div className="bg-white rounded-xl p-5 text-center text-gray-400 text-sm shadow-sm border border-gray-100">이 날 완료된 업무가 없습니다</div>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(t => (
                <div key={t.id} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-green-100 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-600">{t.title}</div>
                    {t.memo && <div className="text-xs text-gray-400 mt-0.5">{t.memo}</div>}
                  </div>
                  <button onClick={() => updateTask(t.id, { status: '대기' })} className="text-gray-300 hover:text-blue-400 text-sm px-1" title="되돌리기">↩</button>
                  <button onClick={() => { if (confirm('삭제할까요?')) deleteTask(t.id) }} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
const EMPTY_FORM = { title: '', dueDate: '', priority: '보통', memo: '', projectId: null }
const EMPTY_RECURRING = { title: '', repeatType: 'daily', repeatDays: [], repeatMonthDay: '', priority: '보통', memo: '' }

export default function Tasks() {
  const { tasks, projects, recurring, addTask, updateTask, deleteTask, toggleTaskStatus, addRecurring, updateRecurring, deleteRecurring, completeRecurring, uncompleteRecurring } = useStore()
  const [subTab, setSubTab] = useState('all')

  // 일반 할일 추가/수정 모달
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingTaskId, setEditingTaskId] = useState(null)

  // 반복 업무 추가/수정 모달
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [editingRecurringId, setEditingRecurringId] = useState(null)
  const [rForm, setRForm] = useState(EMPTY_RECURRING)

  const todayActiveRecurring = recurring.filter(r => r.active && isRecurringActiveToday(r) && r.lastCompletedDate !== today())
  const pendingAll = tasks.filter(t => t.status !== '완료').length + todayActiveRecurring.length
  const pendingAccounting = tasks.filter(t => t.projectId === null && t.status !== '완료').length + todayActiveRecurring.length
  const pendingDesign = tasks.filter(t => t.projectId !== null && t.status !== '완료').length

  // 일반 할일 추가
  function handleOpenAdd(defaultProjectId = null) {
    setEditingTaskId(null)
    setForm({ ...EMPTY_FORM, projectId: defaultProjectId })
    setShowForm(true)
  }

  // 일반 할일 수정
  function handleOpenEdit(task) {
    setEditingTaskId(task.id)
    setForm({ title: task.title, dueDate: task.dueDate || '', priority: task.priority || '보통', memo: task.memo || '', projectId: task.projectId })
    setShowForm(true)
  }

  function handleTaskSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editingTaskId) {
      updateTask(editingTaskId, { title: form.title, dueDate: form.dueDate, priority: form.priority, memo: form.memo, projectId: form.projectId || null })
    } else {
      addTask({ ...form, projectId: form.projectId || null })
    }
    setForm(EMPTY_FORM)
    setEditingTaskId(null)
    setShowForm(false)
  }

  // 반복 업무 추가
  function handleOpenAddRecurring() {
    setEditingRecurringId(null)
    setRForm(EMPTY_RECURRING)
    setShowRecurringForm(true)
  }

  // 반복 업무 수정
  function handleOpenEditRecurring(r) {
    setEditingRecurringId(r.id)
    setRForm({ title: r.title, repeatType: r.repeatType, repeatDays: r.repeatDays, repeatMonthDay: r.repeatMonthDay || '', priority: r.priority, memo: r.memo || '' })
    setShowRecurringForm(true)
  }

  function handleRecurringSubmit(e) {
    e.preventDefault()
    if (!rForm.title.trim()) return
    const data = { ...rForm, repeatMonthDay: rForm.repeatMonthDay ? Number(rForm.repeatMonthDay) : null }
    if (editingRecurringId) updateRecurring(editingRecurringId, data)
    else addRecurring(data)
    setShowRecurringForm(false)
    setEditingRecurringId(null)
    setRForm(EMPTY_RECURRING)
  }

  function toggleRepeatDay(day) {
    setRForm(p => ({
      ...p,
      repeatDays: p.repeatDays.includes(day) ? p.repeatDays.filter(d => d !== day) : [...p.repeatDays, day]
    }))
  }

  const SUB_TABS = [
    { id: 'all', label: '전체', count: pendingAll },
    { id: 'design', label: '디자인', count: pendingDesign },
    { id: 'accounting', label: '경리', count: pendingAccounting },
    { id: 'schedule', label: '스케줄', count: null },
  ]

  return (
    <div className="space-y-4">
      {/* 서브 탭 */}
      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${subTab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
          >
            {t.label}
            {t.count > 0 && <span className={`ml-1 ${subTab === t.id ? 'text-blue-500' : 'text-blue-400'}`}>({t.count})</span>}
          </button>
        ))}
      </div>

      {/* 서브 뷰 */}
      {subTab === 'all' && (
        <AllView
          tasks={tasks}
          projects={projects}
          recurring={recurring}
          onToggle={toggleTaskStatus}
          onDelete={deleteTask}
          onAdd={() => handleOpenAdd()}
          onEdit={handleOpenEdit}
          completeRecurring={completeRecurring}
          uncompleteRecurring={uncompleteRecurring}
          onEditRecurring={handleOpenEditRecurring}
          onAddRecurring={handleOpenAddRecurring}
          deleteRecurring={deleteRecurring}
        />
      )}
      {subTab === 'design' && (
        <DesignView tasks={tasks} projects={projects} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} />
      )}
      {subTab === 'accounting' && (
        <AccountingView
          tasks={tasks}
          recurring={recurring}
          updateTask={updateTask}
          deleteTask={deleteTask}
          onShowForm={() => handleOpenAdd(null)}
          completeRecurring={completeRecurring}
          uncompleteRecurring={uncompleteRecurring}
          onEditRecurring={handleOpenEditRecurring}
          onAddRecurring={handleOpenAddRecurring}
          deleteRecurring={deleteRecurring}
        />
      )}
      {subTab === 'schedule' && (
        <ScheduleView tasks={tasks} updateTask={updateTask} deleteTask={deleteTask} />
      )}

      {/* 일반 할일 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{editingTaskId ? '할일 수정' : '할일 추가'}</h3>
            </div>
            <form onSubmit={handleTaskSubmit} className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">내용 *</label>
                <input autoFocus value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="할일 입력..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">현장 (선택)</label>
                <select value={form.projectId || ''} onChange={e => setForm(p => ({ ...p, projectId: e.target.value || null }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                  <option value="">경리/기타 업무</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
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
                <input value={form.memo} onChange={e => setForm(p => ({ ...p, memo: e.target.value }))} placeholder="메모..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-blue-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-600">{editingTaskId ? '수정 완료' : '추가'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50">취소</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 반복 업무 추가/수정 모달 */}
      {showRecurringForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{editingRecurringId ? '반복 업무 수정' : '반복 업무 추가'}</h3>
            </div>
            <form onSubmit={handleRecurringSubmit} className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">업무명 *</label>
                <input autoFocus value={rForm.title} onChange={e => setRForm(p => ({ ...p, title: e.target.value }))} placeholder="예: 현장 진행 체크" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">반복 유형</label>
                <div className="flex gap-2">
                  {[['daily', '매일'], ['weekly', '매주'], ['monthly', '매월']].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setRForm(p => ({ ...p, repeatType: val, repeatDays: [], repeatMonthDay: '' }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${rForm.repeatType === val ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {rForm.repeatType === 'weekly' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">요일 선택</label>
                  <div className="flex gap-1.5">
                    {WEEKDAY_NAMES.map((name, idx) => (
                      <button key={idx} type="button" onClick={() => toggleRepeatDay(idx)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${rForm.repeatDays.includes(idx) ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {rForm.repeatType === 'monthly' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">매월 몇 일</label>
                  <input type="number" min="1" max="31" value={rForm.repeatMonthDay} onChange={e => setRForm(p => ({ ...p, repeatMonthDay: e.target.value }))} placeholder="25" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">우선순위</label>
                  <select value={rForm.priority} onChange={e => setRForm(p => ({ ...p, priority: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                    <option>높음</option>
                    <option>보통</option>
                    <option>낮음</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">메모</label>
                  <input value={rForm.memo} onChange={e => setRForm(p => ({ ...p, memo: e.target.value }))} placeholder="메모" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-blue-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-600">{editingRecurringId ? '수정 완료' : '추가'}</button>
                <button type="button" onClick={() => setShowRecurringForm(false)} className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50">취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
