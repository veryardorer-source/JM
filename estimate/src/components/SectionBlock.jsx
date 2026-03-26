import { useState } from 'react';
import ItemRow from './ItemRow';
import {
  updateSection, removeSection,
  addItem, updateItem, removeItem,
  addSubSection, updateSubSection, removeSubSection,
  addSubItem, updateSubItem, removeSubItem,
  calcSection,
} from '../store/useStore';

const TABLE_HEADER = (
  <thead>
    <tr className="bg-gray-100 text-xs text-gray-600">
      <th className="px-2 py-1 text-left">품명</th>
      <th className="px-2 py-1 text-left">규격</th>
      <th className="px-2 py-1">단위</th>
      <th className="px-2 py-1">수량</th>
      <th className="px-2 py-1 text-right" colSpan={2}>재료비 (단가 / 금액)</th>
      <th className="px-2 py-1 text-right" colSpan={2}>노무비 (단가 / 금액)</th>
      <th className="px-2 py-1 text-right" colSpan={2}>경비 (단가 / 금액)</th>
      <th className="px-2 py-1 text-right">합계</th>
      <th className="px-2 py-1">비고</th>
      <th className="px-2 py-1 w-8"></th>
    </tr>
  </thead>
);

function SubTotal({ mat, lab, exp }) {
  const total = mat + lab + exp;
  return (
    <tr className="bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
      <td colSpan={5} className="px-2 py-1 text-right font-medium">[소 계]</td>
      <td className="px-2 py-1 text-right font-medium text-gray-700">{mat ? mat.toLocaleString() : '-'}</td>
      <td></td>
      <td className="px-2 py-1 text-right font-medium text-gray-700">{lab ? lab.toLocaleString() : '-'}</td>
      <td></td>
      <td className="px-2 py-1 text-right font-medium text-gray-700">{exp ? exp.toLocaleString() : '-'}</td>
      <td className="px-2 py-1 text-right font-bold text-blue-700">{total ? total.toLocaleString() : '-'}</td>
      <td colSpan={2}></td>
    </tr>
  );
}

export default function SectionBlock({ estimateId, section, sectionNum }) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(section.name);
  const [newSubName, setNewSubName] = useState('');
  const [addingSubSection, setAddingSubSection] = useState(false);

  const sc = calcSection(section);

  function saveName() {
    if (nameVal.trim()) updateSection(estimateId, section.id, nameVal.trim());
    setEditingName(false);
  }

  function handleAddSubSection() {
    if (!newSubName.trim()) return;
    addSubSection(estimateId, section.id, newSubName.trim());
    setNewSubName('');
    setAddingSubSection(false);
  }

  return (
    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* 공종 헤더 */}
      <div className="flex items-center gap-2 bg-green-700 text-white px-3 py-2">
        <span className="font-bold text-sm w-6">{sectionNum}</span>
        {editingName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            className="flex-1 px-2 py-0.5 text-sm text-gray-800 rounded"
          />
        ) : (
          <span
            className="flex-1 font-semibold text-sm cursor-pointer hover:underline"
            onDoubleClick={() => setEditingName(true)}
          >
            {section.name}
          </span>
        )}
        <span className="text-xs opacity-80 ml-auto">
          합계 {sc.total.toLocaleString()}원
        </span>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="text-white opacity-70 hover:opacity-100 text-sm ml-2"
        >
          {collapsed ? '▼' : '▲'}
        </button>
        <button
          onClick={() => { if (confirm(`"${section.name}" 공종을 삭제할까요?`)) removeSection(estimateId, section.id); }}
          className="text-white opacity-70 hover:opacity-100 text-sm"
        >
          ✕
        </button>
      </div>

      {!collapsed && (
        <div className="p-2">
          {/* 하위구역들 */}
          {section.subSections.map((ss, ssIdx) => {
            let ssMat = 0, ssLab = 0, ssExp = 0;
            ss.items.forEach(it => {
              ssMat += (it.materialUnit || 0) * (it.qty || 0);
              ssLab += (it.laborUnit || 0) * (it.qty || 0);
              ssExp += (it.expenseUnit || 0) * (it.qty || 0);
            });
            return (
              <div key={ss.id} className="mb-3">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded px-3 py-1 mb-1">
                  <span className="text-xs text-green-700 font-semibold">
                    {sectionNum}-{ssIdx + 1}
                  </span>
                  <SubSectionName
                    name={ss.name}
                    onSave={name => updateSubSection(estimateId, section.id, ss.id, name)}
                  />
                  <button
                    onClick={() => { if (confirm(`"${ss.name}" 구역을 삭제할까요?`)) removeSubSection(estimateId, section.id, ss.id); }}
                    className="text-red-400 hover:text-red-600 text-xs ml-auto"
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    {TABLE_HEADER}
                    <tbody>
                      {ss.items.map(item => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          onUpdate={fields => updateSubItem(estimateId, section.id, ss.id, item.id, fields)}
                          onRemove={() => removeSubItem(estimateId, section.id, ss.id, item.id)}
                        />
                      ))}
                      <SubTotal mat={ssMat} lab={ssLab} exp={ssExp} />
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() => addSubItem(estimateId, section.id, ss.id)}
                  className="mt-1 ml-2 text-xs text-green-700 hover:text-green-900"
                >
                  + 항목 추가
                </button>
              </div>
            );
          })}

          {/* 공종 직속 항목 */}
          {section.items.length > 0 && (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-sm border-collapse">
                {TABLE_HEADER}
                <tbody>
                  {section.items.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onUpdate={fields => updateItem(estimateId, section.id, item.id, fields)}
                      onRemove={() => removeItem(estimateId, section.id, item.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex gap-3 mt-2 flex-wrap">
            <button
              onClick={() => addItem(estimateId, section.id)}
              className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-3 py-1 hover:bg-blue-100"
            >
              + 항목 추가
            </button>
            {addingSubSection ? (
              <div className="flex gap-1 items-center">
                <input
                  autoFocus
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubSection()}
                  placeholder="하위구역 이름 (예: 홀타일)"
                  className="text-xs px-2 py-1 border border-gray-300 rounded w-48"
                />
                <button onClick={handleAddSubSection} className="text-xs bg-green-600 text-white px-2 py-1 rounded">추가</button>
                <button onClick={() => setAddingSubSection(false)} className="text-xs text-gray-500">취소</button>
              </div>
            ) : (
              <button
                onClick={() => setAddingSubSection(true)}
                className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-3 py-1 hover:bg-green-100"
              >
                + 하위구역 추가
              </button>
            )}
          </div>

          {/* 공종 소계 */}
          <div className="mt-2 pt-2 border-t border-gray-200 text-right text-sm">
            <span className="text-gray-500 mr-4">재료비 {sc.mat.toLocaleString()}</span>
            <span className="text-gray-500 mr-4">노무비 {sc.lab.toLocaleString()}</span>
            <span className="text-gray-500 mr-4">경비 {sc.exp.toLocaleString()}</span>
            <span className="font-bold text-blue-700">소계 {sc.total.toLocaleString()}원</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SubSectionName({ name, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);
  function save() { if (val.trim()) onSave(val.trim()); setEditing(false); }
  if (editing) {
    return (
      <input
        autoFocus value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={e => e.key === 'Enter' && save()}
        className="flex-1 px-1 text-xs border border-green-300 rounded"
      />
    );
  }
  return (
    <span className="flex-1 text-xs text-green-800 font-medium cursor-pointer hover:underline" onDoubleClick={() => setEditing(true)}>
      {name}
    </span>
  );
}
