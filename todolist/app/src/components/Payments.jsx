import { useState } from 'react'
import { useStore } from '../store/useStore'

const PAYMENT_TYPES = ['계약금', '중도금', '잔금', '기타']

function formatAmount(n) {
  if (!n && n !== 0) return '-'
  const num = Number(n)
  if (num >= 100000000) return `${(num / 100000000).toFixed(num % 100000000 === 0 ? 0 : 1)}억`
  if (num >= 10000) return `${Math.floor(num / 10000)}만원`
  return `${num.toLocaleString()}원`
}

const EMPTY_FORM = { projectId: '', type: '계약금', amount: '', dueDate: '', paidDate: '', paid: false, note: '' }

export default function Payments({ compact = false }) {
  const { projects, payments, addPayment, updatePayment, deletePayment } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterProject, setFilterProject] = useState('전체')
  const [showPaid, setShowPaid] = useState(false)

  const filtered = payments.filter(p => {
    const projectMatch = filterProject === '전체' || p.projectId === filterProject
    const paidMatch = showPaid ? true : !p.paid
    return projectMatch && paidMatch
  })

  // 총 수금 통계
  const totalExpected = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalReceived = payments.filter(p => p.paid).reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalPending = totalExpected - totalReceived

  // 연체 수금 (예정일 지났는데 미수금)
  const today = new Date().toISOString().slice(0, 10)
  const overduePayments = payments.filter(p => !p.paid && p.dueDate && p.dueDate < today)

  function openAdd(projectId = '') {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, projectId })
    setShowForm(true)
  }

  function openEdit(p) {
    setEditingId(p.id)
    setForm({ projectId: p.projectId, type: p.type, amount: p.amount, dueDate: p.dueDate || '', paidDate: p.paidDate || '', paid: p.paid, note: p.note || '' })
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || !form.projectId) return
    const data = { ...form, amount: Number(form.amount), paid: Boolean(form.paid) }
    if (editingId) {
      updatePayment(editingId, data)
    } else {
      addPayment(data)
    }
    setShowForm(false)
    setEditingId(null)
  }

  function togglePaid(p) {
    const paidDate = !p.paid ? today : ''
    updatePayment(p.id, { paid: !p.paid, paidDate })
  }

  if (compact) {
    // 대시보드용 컴팩트 뷰
    return <PaymentSummary payments={payments} projects={projects} onAdd={() => openAdd()} />
  }

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <div className="text-lg font-bold text-gray-800">{formatAmount(totalExpected)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">총 계약금액</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <div className="text-lg font-bold text-green-600">{formatAmount(totalReceived)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">수금 완료</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <div className={`text-lg font-bold ${totalPending > 0 ? 'text-orange-500' : 'text-gray-400'}`}>{formatAmount(totalPending)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">미수금</div>
        </div>
      </div>

      {overduePayments.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-red-500 text-sm">⚠</span>
          <span className="text-sm text-red-600 font-medium">연체 {overduePayments.length}건</span>
          <span className="text-sm text-red-500">{formatAmount(overduePayments.reduce((s, p) => s + Number(p.amount || 0), 0))}</span>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap items-center">
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 text-gray-600"
          >
            <option value="전체">전체 현장</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={showPaid} onChange={e => setShowPaid(e.target.checked)} className="rounded" />
            수금완료 포함
          </label>
        </div>
        <button onClick={() => openAdd()} className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-600">+ 추가</button>
      </div>

      {/* 결제 목록 */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm shadow-sm border border-gray-100">항목이 없습니다</div>
      ) : (
        <div className="space-y-2">
          {filtered
            .sort((a, b) => {
              if (!a.paid && b.paid) return -1
              if (a.paid && !b.paid) return 1
              if (!a.dueDate && b.dueDate) return 1
              if (a.dueDate && !b.dueDate) return -1
              return a.dueDate > b.dueDate ? 1 : -1
            })
            .map(p => {
              const project = projects.find(pr => pr.id === p.projectId)
              const isOverdue = !p.paid && p.dueDate && p.dueDate < today
              return (
                <div key={p.id} className={`bg-white rounded-xl px-4 py-3.5 shadow-sm border ${isOverdue ? 'border-red-100' : p.paid ? 'border-green-100' : 'border-gray-100'} ${p.paid ? 'opacity-70' : ''}`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePaid(p)}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${p.paid ? 'bg-green-500 border-green-500' : isOverdue ? 'border-red-300 hover:border-red-400' : 'border-gray-300 hover:border-blue-400'}`}
                    >
                      {p.paid && <span className="text-white text-xs">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${p.paid ? 'text-gray-400' : 'text-gray-800'}`}>
                          {project?.name || '알 수 없는 현장'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{p.type}</span>
                        {isOverdue && <span className="text-[11px] text-red-500 font-medium">연체</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className={`text-sm font-semibold ${p.paid ? 'text-green-600' : 'text-orange-500'}`}>{formatAmount(p.amount)}</span>
                        {p.dueDate && <span className={`text-[11px] ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>예정 {p.dueDate}</span>}
                        {p.paidDate && <span className="text-[11px] text-green-500">입금 {p.paidDate}</span>}
                      </div>
                      {p.note && <div className="text-xs text-gray-400 mt-0.5">{p.note}</div>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(p)} className="text-gray-300 hover:text-blue-400 text-sm px-1">✎</button>
                      <button onClick={() => { if (confirm('삭제할까요?')) deletePayment(p.id) }} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{editingId ? '수금 수정' : '수금 추가'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">현장 *</label>
                <select value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" required>
                  <option value="">현장 선택</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">구분</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                    {PAYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">금액 (원) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="10000000" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">입금 예정일</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">실제 입금일</label>
                  <input type="date" value={form.paidDate} onChange={e => setForm(p => ({ ...p, paidDate: e.target.value, paid: !!e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">메모</label>
                <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="메모..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.paid} onChange={e => setForm(p => ({ ...p, paid: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-600">수금 완료</span>
              </label>
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

// 대시보드용 수금 요약 컴포넌트
export function PaymentSummary({ payments, projects, onAdd }) {
  const today = new Date().toISOString().slice(0, 10)
  const thisMonth = today.slice(0, 7)

  const totalExpected = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalReceived = payments.filter(p => p.paid).reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalPending = totalExpected - totalReceived

  const upcomingPayments = payments
    .filter(p => !p.paid && p.dueDate >= today)
    .sort((a, b) => a.dueDate > b.dueDate ? 1 : -1)
    .slice(0, 4)

  const overduePayments = payments.filter(p => !p.paid && p.dueDate && p.dueDate < today)

  return (
    <div className="space-y-3">
      {/* 미수금 요약 바 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-700">수금 현황</div>
          {overduePayments.length > 0 && (
            <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">⚠ 연체 {overduePayments.length}건</span>
          )}
        </div>
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <div className="text-xs text-gray-400">미수금</div>
            <div className="text-xl font-bold text-orange-500">{formatAmount(totalPending)}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-400">수금 완료</div>
            <div className="text-xl font-bold text-green-600">{formatAmount(totalReceived)}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-400">총 계약</div>
            <div className="text-xl font-bold text-gray-700">{formatAmount(totalExpected)}</div>
          </div>
        </div>
        {/* 수금 진행바 */}
        {totalExpected > 0 && (
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.round((totalReceived / totalExpected) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* 예정된 수금 */}
      {upcomingPayments.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2 px-1">예정된 수금</div>
          <div className="space-y-1.5">
            {upcomingPayments.map(p => {
              const project = projects.find(pr => pr.id === p.projectId)
              const daysLeft = Math.ceil((new Date(p.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
              const isNear = daysLeft <= 7
              return (
                <div key={p.id} className={`bg-white rounded-xl px-4 py-3 shadow-sm border flex items-center gap-3 ${isNear ? 'border-orange-100' : 'border-gray-100'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 truncate">{project?.name || '-'}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{p.type}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {p.dueDate} · {isNear ? <span className="text-orange-500 font-medium">D-{daysLeft}</span> : `D-${daysLeft}`}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-orange-500 flex-shrink-0">{formatAmount(p.amount)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 연체 수금 */}
      {overduePayments.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-red-500 mb-2 px-1">연체된 수금</div>
          <div className="space-y-1.5">
            {overduePayments.map(p => {
              const project = projects.find(pr => pr.id === p.projectId)
              return (
                <div key={p.id} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-red-100 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{project?.name || '-'}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-500">{p.type}</span>
                    </div>
                    <div className="text-xs text-red-400 mt-0.5">예정 {p.dueDate}</div>
                  </div>
                  <div className="text-sm font-bold text-red-500 flex-shrink-0">{formatAmount(p.amount)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
