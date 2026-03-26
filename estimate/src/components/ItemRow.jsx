import { calcItem } from '../store/useStore';

const UNITS = ['EA', 'M', 'M2', 'M3', 'BOX', 'SET', '식', '인', '대', 'KG', 'L', '개'];

function NumInput({ value, onChange, className = '' }) {
  return (
    <input
      type="number"
      value={value === 0 ? '' : value}
      placeholder="0"
      onChange={e => onChange(Number(e.target.value) || 0)}
      className={`w-full text-right px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-400 ${className}`}
    />
  );
}

export default function ItemRow({ item, onUpdate, onRemove }) {
  const c = calcItem(item);
  const total = c.mat + c.lab + c.exp;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-2 py-1">
        <input
          value={item.name}
          onChange={e => onUpdate({ name: e.target.value })}
          placeholder="품명"
          className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-400"
        />
      </td>
      <td className="px-2 py-1">
        <input
          value={item.spec}
          onChange={e => onUpdate({ spec: e.target.value })}
          placeholder="규격"
          className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-400"
        />
      </td>
      <td className="px-2 py-1">
        <select
          value={item.unit}
          onChange={e => onUpdate({ unit: e.target.value })}
          className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-400"
        >
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </td>
      <td className="px-2 py-1 w-16">
        <NumInput value={item.qty} onChange={v => onUpdate({ qty: v })} />
      </td>
      {/* 재료비 */}
      <td className="px-2 py-1 w-24">
        <NumInput value={item.materialUnit} onChange={v => onUpdate({ materialUnit: v })} />
      </td>
      <td className="px-2 py-1 w-28 text-right text-sm text-gray-700 bg-gray-50">
        {c.mat ? c.mat.toLocaleString() : '-'}
      </td>
      {/* 노무비 */}
      <td className="px-2 py-1 w-24">
        <NumInput value={item.laborUnit} onChange={v => onUpdate({ laborUnit: v })} />
      </td>
      <td className="px-2 py-1 w-28 text-right text-sm text-gray-700 bg-gray-50">
        {c.lab ? c.lab.toLocaleString() : '-'}
      </td>
      {/* 경비 */}
      <td className="px-2 py-1 w-24">
        <NumInput value={item.expenseUnit} onChange={v => onUpdate({ expenseUnit: v })} />
      </td>
      <td className="px-2 py-1 w-28 text-right text-sm text-gray-700 bg-gray-50">
        {c.exp ? c.exp.toLocaleString() : '-'}
      </td>
      {/* 합계 */}
      <td className="px-2 py-1 w-28 text-right text-sm font-medium text-blue-700 bg-blue-50">
        {total ? total.toLocaleString() : '-'}
      </td>
      <td className="px-2 py-1">
        <input
          value={item.note || ''}
          onChange={e => onUpdate({ note: e.target.value })}
          placeholder="비고"
          className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-400"
        />
      </td>
      <td className="px-2 py-1 text-center">
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-sm">✕</button>
      </td>
    </tr>
  );
}
