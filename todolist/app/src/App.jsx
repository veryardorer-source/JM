import { useState, useRef } from 'react'
import ExcelJS from 'exceljs'
import Dashboard from './components/Dashboard'
import Projects from './components/Projects'
import Tasks from './components/Tasks'
import Payments from './components/Payments'
import HR from './components/HR'
import { useStore, importAll } from './store/useStore'

const TABS = [
  { id: 'dashboard', label: '대시보드', icon: '🏠' },
  { id: 'projects', label: '현장', icon: '🏗' },
  { id: 'payments', label: '수금', icon: '💳' },
  { id: 'tasks', label: '할일', icon: '✅' },
  { id: 'hr', label: '노무', icon: '👥' },
]

const STORAGE_KEYS = {
  PROJECTS:      'jm_projects_v2',
  TASKS:         'jm_tasks_v2',
  PAYMENTS:      'jm_payments_v1',
  RECURRING:     'jm_recurring_v1',
  EMPLOYEES:     'jm_employees_v1',
  PAYROLL:       'jm_payroll_v1',
  LEAVE_RECORDS: 'jm_leave_records_v1',
}

function BackupModal({ onClose }) {
  const fileInputRef = useRef(null)
  const [msg, setMsg] = useState(null) // { type: 'ok'|'err', text }

  // 마지막 백업 시각 (localStorage에 기록)
  const lastBackup = localStorage.getItem('jm_last_backup')

  function handleExport() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects:     JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS)      || '[]'),
      tasks:        JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)         || '[]'),
      payments:     JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS)      || '[]'),
      recurring:    JSON.parse(localStorage.getItem(STORAGE_KEYS.RECURRING)     || '[]'),
      employees:    JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES)     || '[]'),
      payroll:      JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYROLL)       || '[]'),
      leaveRecords: JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVE_RECORDS) || '[]'),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href     = url
    a.download = `JM업무관리_백업_${date}.json`
    a.click()
    URL.revokeObjectURL(url)
    localStorage.setItem('jm_last_backup', new Date().toLocaleString('ko-KR'))
    setMsg({ type: 'ok', text: '백업 파일이 다운로드됐습니다.' })
  }

  async function handleExportExcel() {
    const projects     = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS)      || '[]')
    const tasks        = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)         || '[]')
    const payments     = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS)      || '[]')
    const recurring    = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECURRING)     || '[]')
    const employees    = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES)     || '[]')
    const payroll      = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYROLL)       || '[]')
    const leaveRecords = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVE_RECORDS) || '[]')
    const WEEKDAY   = ['일', '월', '화', '수', '목', '금', '토']

    const wb = new ExcelJS.Workbook()
    wb.creator = 'JM업무관리'

    // 헤더 스타일 공통
    function styleHeader(row, bgColor = '4472C4') {
      row.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        }
      })
      row.height = 22
    }

    function styleDataRow(row, isEven) {
      row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF5F7FA' : 'FFFFFFFF' } }
        cell.alignment = { vertical: 'middle', wrapText: true }
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          left: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          right: { style: 'hair', color: { argb: 'FFE0E0E0' } },
        }
      })
      row.height = 18
    }

    // ── 시트1: 현장 ──────────────────────────────────────────────
    const wsProject = wb.addWorksheet('현장')
    wsProject.columns = [
      { header: '현장명',   key: 'name',        width: 22 },
      { header: '의뢰인',   key: 'client',       width: 12 },
      { header: '유형',     key: 'type',         width: 10 },
      { header: '시작일',   key: 'startDate',    width: 12 },
      { header: '마감일',   key: 'dueDate',      width: 12 },
      { header: '상태',     key: 'status',       width: 10 },
      { header: '완료단계', key: 'stages',       width: 28 },
      { header: '메모',     key: 'memo',         width: 30 },
    ]
    styleHeader(wsProject.getRow(1), '2E75B6')
    wsProject.views = [{ state: 'frozen', ySplit: 1 }]
    projects.forEach((p, i) => {
      const row = wsProject.addRow({
        name: p.name, client: p.client, type: p.projectType || '시공의뢰',
        startDate: p.startDate, dueDate: p.dueDate, status: p.status,
        stages: Object.entries(p.stages || {}).map(([k, v]) => v ? `✓${k}` : k).join('  '),
        memo: p.memo,
      })
      styleDataRow(row, i % 2 === 1)
      // 상태별 색상
      const statusCell = row.getCell('status')
      if (p.status === '완료') statusCell.font = { color: { argb: 'FF107C10' } }
      else if (p.status === '진행중') statusCell.font = { color: { argb: 'FF0063B1' } }
    })
    wsProject.autoFilter = { from: 'A1', to: 'H1' }

    // ── 시트2: 할일 ──────────────────────────────────────────────
    const wsTask = wb.addWorksheet('할일')
    wsTask.columns = [
      { header: '제목',     key: 'title',     width: 30 },
      { header: '현장',     key: 'project',   width: 20 },
      { header: '마감일',   key: 'dueDate',   width: 12 },
      { header: '우선순위', key: 'priority',  width: 10 },
      { header: '상태',     key: 'status',    width: 10 },
      { header: '완료일',   key: 'completedAt', width: 12 },
      { header: '메모',     key: 'memo',      width: 30 },
    ]
    styleHeader(wsTask.getRow(1), '538135')
    wsTask.views = [{ state: 'frozen', ySplit: 1 }]
    tasks.forEach((t, i) => {
      const proj = projects.find(p => p.id === t.projectId)
      const row = wsTask.addRow({
        title: t.title, project: proj ? proj.name : '경리/기타',
        dueDate: t.dueDate, priority: t.priority,
        status: t.status, completedAt: t.completedAt, memo: t.memo,
      })
      styleDataRow(row, i % 2 === 1)
      const statusCell = row.getCell('status')
      if (t.status === '완료') statusCell.font = { color: { argb: 'FF107C10' } }
      else if (t.status === '진행중') statusCell.font = { color: { argb: 'FF0063B1' } }
      if (t.priority === '높음') row.getCell('priority').font = { color: { argb: 'FFC42B1C' }, bold: true }
    })
    wsTask.autoFilter = { from: 'A1', to: 'G1' }

    // ── 시트3: 수금 ──────────────────────────────────────────────
    const wsPayment = wb.addWorksheet('수금')
    wsPayment.columns = [
      { header: '현장명',   key: 'project',   width: 22 },
      { header: '구분',     key: 'type',      width: 10 },
      { header: '금액',     key: 'amount',    width: 16 },
      { header: '마감일',   key: 'dueDate',   width: 12 },
      { header: '수금일',   key: 'paidDate',  width: 12 },
      { header: '수금여부', key: 'paid',      width: 10 },
      { header: '비고',     key: 'note',      width: 20 },
    ]
    styleHeader(wsPayment.getRow(1), '7030A0')
    wsPayment.views = [{ state: 'frozen', ySplit: 1 }]
    let totalAmount = 0, paidAmount = 0
    payments.forEach((p, i) => {
      const proj = projects.find(pr => pr.id === p.projectId)
      const row = wsPayment.addRow({
        project: proj ? proj.name : '', type: p.type,
        amount: p.amount, dueDate: p.dueDate,
        paidDate: p.paidDate, paid: p.paid ? '완료' : '미수금', note: p.note,
      })
      styleDataRow(row, i % 2 === 1)
      // 금액 형식
      const amtCell = row.getCell('amount')
      amtCell.numFmt = '#,##0"원"'
      amtCell.alignment = { horizontal: 'right', vertical: 'middle' }
      // 수금여부 색상
      const paidCell = row.getCell('paid')
      if (p.paid) paidCell.font = { color: { argb: 'FF107C10' }, bold: true }
      else paidCell.font = { color: { argb: 'FFC42B1C' } }
      totalAmount += p.amount || 0
      if (p.paid) paidAmount += p.amount || 0
    })
    // 합계 행
    const sumRow = wsPayment.addRow({ project: '합계', type: '', amount: totalAmount, paid: `${paidAmount.toLocaleString()}원 수금` })
    sumRow.eachCell({ includeEmpty: true }, cell => {
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAE6F0' } }
    })
    sumRow.getCell('amount').numFmt = '#,##0"원"'
    sumRow.getCell('amount').alignment = { horizontal: 'right', vertical: 'middle' }
    wsPayment.autoFilter = { from: 'A1', to: 'G1' }

    // ── 시트4: 반복업무 ───────────────────────────────────────────
    const wsRecurring = wb.addWorksheet('반복업무')
    wsRecurring.columns = [
      { header: '업무명',   key: 'title',      width: 28 },
      { header: '반복유형', key: 'repeatType', width: 10 },
      { header: '요일/날짜', key: 'repeat',   width: 16 },
      { header: '우선순위', key: 'priority',  width: 10 },
      { header: '활성',     key: 'active',    width: 8  },
      { header: '메모',     key: 'memo',      width: 24 },
    ]
    styleHeader(wsRecurring.getRow(1), 'C55A11')
    wsRecurring.views = [{ state: 'frozen', ySplit: 1 }]
    recurring.forEach((r, i) => {
      const repeatLabel = r.repeatType === 'daily' ? '매일' : r.repeatType === 'weekly' ? '매주' : '매월'
      const repeatDetail = r.repeatType === 'weekly'
        ? r.repeatDays.map(d => WEEKDAY[d]).join('·')
        : r.repeatType === 'monthly' ? `${r.repeatMonthDay}일` : '매일'
      const row = wsRecurring.addRow({
        title: r.title, repeatType: repeatLabel, repeat: repeatDetail,
        priority: r.priority, active: r.active ? '활성' : '비활성', memo: r.memo,
      })
      styleDataRow(row, i % 2 === 1)
      if (!r.active) row.eachCell(c => { c.font = { color: { argb: 'FF999999' } } })
      if (r.priority === '높음') row.getCell('priority').font = { color: { argb: 'FFC42B1C' }, bold: true }
    })

    // ── 시트5: 직원 ───────────────────────────────────────────────
    const wsEmployee = wb.addWorksheet('직원')
    wsEmployee.columns = [
      { header: '이름',     key: 'name',         width: 12 },
      { header: '고용형태', key: 'employeeType',  width: 10 },
      { header: '직책',     key: 'position',      width: 10 },
      { header: '재직상태', key: 'status',        width: 10 },
      { header: '입사일',   key: 'hireDate',      width: 12 },
      { header: '연락처',   key: 'phone',         width: 14 },
      { header: '기본급',   key: 'baseSalary',    width: 16 },
      { header: '일당',     key: 'dailyWage',     width: 12 },
      { header: '메모',     key: 'memo',          width: 24 },
    ]
    styleHeader(wsEmployee.getRow(1), '1F5C9E')
    wsEmployee.views = [{ state: 'frozen', ySplit: 1 }]
    employees.forEach((e, i) => {
      const row = wsEmployee.addRow({ ...e })
      styleDataRow(row, i % 2 === 1)
      wsEmployee.getCell(`G${i + 2}`).numFmt = '#,##0"원"'
      wsEmployee.getCell(`H${i + 2}`).numFmt = '#,##0"원"'
    })

    // ── 시트6: 급여명세서 ─────────────────────────────────────────
    const wsPayroll = wb.addWorksheet('급여명세서')
    wsPayroll.columns = [
      { header: '지급월',   key: 'yearMonth',         width: 10 },
      { header: '이름',     key: 'name',              width: 12 },
      { header: '고용형태', key: 'employeeType',       width: 10 },
      { header: '총지급액', key: 'gross',              width: 16 },
      { header: '국민연금', key: 'nationalPension',   width: 14 },
      { header: '건강보험', key: 'healthInsurance',   width: 14 },
      { header: '장기요양', key: 'longTermCare',      width: 12 },
      { header: '고용보험', key: 'employmentInsurance', width: 12 },
      { header: '소득세',   key: 'incomeTax',         width: 12 },
      { header: '지방소득세', key: 'localIncomeTax',  width: 12 },
      { header: '원천징수', key: 'withholdingTax',   width: 12 },
      { header: '총공제액', key: 'totalDeduction',    width: 14 },
      { header: '실수령액', key: 'netPay',            width: 16 },
      { header: '지급여부', key: 'isPaid',            width: 10 },
      { header: '지급일',   key: 'paidDate',          width: 12 },
    ]
    styleHeader(wsPayroll.getRow(1), '1F5C9E')
    wsPayroll.views = [{ state: 'frozen', ySplit: 1 }]
    payroll.forEach((pr, i) => {
      const emp = employees.find(e => e.id === pr.employeeId)
      const row = wsPayroll.addRow({
        yearMonth: pr.yearMonth, name: emp?.name || '', employeeType: emp?.employeeType || '',
        gross: pr.gross, nationalPension: pr.nationalPension, healthInsurance: pr.healthInsurance,
        longTermCare: pr.longTermCare, employmentInsurance: pr.employmentInsurance,
        incomeTax: pr.incomeTax, localIncomeTax: pr.localIncomeTax,
        withholdingTax: pr.withholdingTax, totalDeduction: pr.totalDeduction,
        netPay: pr.netPay, isPaid: pr.isPaid ? '완료' : '미지급', paidDate: pr.paidDate,
      })
      styleDataRow(row, i % 2 === 1)
      ;['gross','nationalPension','healthInsurance','longTermCare','employmentInsurance','incomeTax','localIncomeTax','withholdingTax','totalDeduction','netPay'].forEach(k => {
        const cell = row.getCell(k)
        if (cell) cell.numFmt = '#,##0"원"'
      })
      if (pr.isPaid) row.getCell('isPaid').font = { color: { argb: 'FF107C10' }, bold: true }
    })
    wsPayroll.autoFilter = { from: 'A1', to: 'O1' }

    // 파일 다운로드
    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `JM업무관리_${date}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    localStorage.setItem('jm_last_backup', new Date().toLocaleString('ko-KR'))
    setMsg({ type: 'ok', text: '엑셀 파일이 다운로드됐습니다.' })
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.projects || !data.tasks) throw new Error('올바른 백업 파일이 아닙니다.')
        if (!confirm('현재 데이터가 모두 백업 파일로 교체됩니다.\n계속할까요?')) return
        setMsg({ type: 'ok', text: '복원 중... 잠시 기다려주세요.' })
        await importAll(data)
        setMsg({ type: 'ok', text: '복원 완료! 창을 닫고 다시 열어주세요.' })
      } catch (err) {
        setMsg({ type: 'err', text: `복원 실패: ${err.message}` })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">데이터 백업 / 복원</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-5 py-5 space-y-3">
          {/* 엑셀 내보내기 */}
          <button
            onClick={handleExportExcel}
            className="w-full flex items-center gap-4 bg-green-50 hover:bg-green-100 border border-green-100 rounded-xl px-4 py-4 transition-colors text-left"
          >
            <span className="text-2xl">📊</span>
            <div>
              <div className="text-sm font-semibold text-green-700">엑셀로 내보내기</div>
              <div className="text-xs text-green-600 mt-0.5">현장·할일·수금·반복업무 시트별 저장</div>
              {lastBackup && <div className="text-[11px] text-green-500 mt-0.5">마지막 백업: {lastBackup}</div>}
            </div>
          </button>

          {/* JSON 내보내기 */}
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-4 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl px-4 py-4 transition-colors text-left"
          >
            <span className="text-2xl">💾</span>
            <div>
              <div className="text-sm font-semibold text-blue-700">JSON 백업 (복원용)</div>
              <div className="text-xs text-blue-500 mt-0.5">앱 복원에 사용하는 전체 백업</div>
            </div>
          </button>

          {/* 가져오기 */}
          <button
            onClick={handleImportClick}
            className="w-full flex items-center gap-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-4 transition-colors text-left"
          >
            <span className="text-2xl">📂</span>
            <div>
              <div className="text-sm font-semibold text-gray-700">백업 복원</div>
              <div className="text-xs text-gray-500 mt-0.5">JSON 파일에서 불러오기</div>
              <div className="text-[11px] text-red-400 mt-0.5">⚠ 현재 데이터가 교체됩니다</div>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

          {/* 안내 */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 text-xs text-yellow-700">
            브라우저 캐시를 지우면 데이터가 삭제될 수 있습니다.<br />
            중요한 변경 후 정기적으로 백업하세요.
          </div>

          {/* 결과 메시지 */}
          {msg && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showBackup, setShowBackup] = useState(false)
  const { tasks, payments } = useStore()

  const today = new Date().toISOString().slice(0, 10)
  const overduePayments = payments.filter(p => !p.paid && p.dueDate && p.dueDate < today)
  const overdueTasks = tasks.filter(t => t.status !== '완료' && t.dueDate && t.dueDate < today)
  const alertCount = overduePayments.length + overdueTasks.length

  const dateObj = new Date()
  const dateStr = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayStr = dayNames[dateObj.getDay()]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-800">JM 업무관리</h1>
            <div className="text-xs text-gray-400">{dateStr} ({dayStr})</div>
          </div>
          <div className="flex items-center gap-2">
            {alertCount > 0 && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-xs px-3 py-1.5 rounded-full font-medium">
                ⚠ {alertCount}건
              </div>
            )}
            <button
              onClick={() => setShowBackup(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="백업 / 복원"
            >
              💾
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-24">
        {activeTab === 'dashboard' && <Dashboard onTabChange={setActiveTab} />}
        {activeTab === 'projects' && <Projects />}
        {activeTab === 'payments' && <Payments />}
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'hr' && <HR />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(tab => {
            let badge = 0
            if (tab.id === 'payments') badge = overduePayments.length
            if (tab.id === 'tasks') badge = tasks.filter(t => t.status !== '완료' && t.dueDate && t.dueDate < today).length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors relative ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className={`text-[11px] font-medium ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`}>{tab.label}</span>
                {badge > 0 && (
                  <span className="absolute top-1.5 right-[calc(50%-14px)] bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>
                )}
                {activeTab === tab.id && <div className="absolute bottom-0 w-10 h-0.5 bg-blue-500 rounded-t-full" />}
              </button>
            )
          })}
        </div>
      </nav>

      {showBackup && <BackupModal onClose={() => setShowBackup(false)} />}
    </div>
  )
}
