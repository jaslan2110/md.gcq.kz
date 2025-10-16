'use client';

import { useState, useEffect } from 'react';
import { getAutoparkList, updateAutoparkDocument, createAutoparkDocument, deleteAutoparkDocument } from '@/app/actions/autopark';
import Link from 'next/link';

// Все колонки из схемы
const DEFAULT_COLUMNS = [
  { key: 'name', label: 'Название', width: '200px', editable: true, visible: true },
  { key: 'zkkid', label: 'ЗККИД', width: '120px', editable: true, visible: true },
  { key: 'position', label: 'Позиция', width: '150px', editable: true, visible: true },
  { key: 'owner', label: 'Владелец', width: '150px', editable: true, visible: true },
  { key: 'brand', label: 'Марка', width: '120px', editable: true, visible: true },
  { key: 'model', label: 'Модель', width: '150px', editable: true, visible: true },
  { key: 'gosnumber', label: 'Гос. номер', width: '120px', editable: true, visible: true },
  { key: 'serial', label: 'Серийный номер', width: '150px', editable: true, visible: false },
  { key: 'hoznumber', label: 'Хоз. номер', width: '120px', editable: true, visible: false },
  { key: 'year', label: 'Год', width: '80px', editable: true, visible: true },
  { key: 'narabotka', label: 'Наработка', width: '120px', editable: true, visible: false },
  { key: 'izmerenie_narabotka', label: 'Изм. наработка', width: '140px', editable: true, visible: false },
  { key: 'condition', label: 'Состояние', width: '120px', editable: true, visible: true },
  { key: 'kapital_remont', label: 'Капитальный ремонт', width: '150px', editable: true, visible: false },
  { key: 'note', label: 'Примечание', width: '200px', editable: true, visible: true },
  { key: 'Encumbrance', label: 'Обременение', width: '120px', editable: true, visible: false },
  { key: 'inventory_number', label: 'Инвент. номер', width: '140px', editable: true, visible: false },
  { key: 'width', label: 'Ширина', width: '100px', editable: true, visible: false },
];

export default function AutoparkTable() {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null); // { rowId, columnKey }
  const [editValue, setEditValue] = useState('');
  const [sortBy, setSortBy] = useState('$createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [saving, setSaving] = useState(false);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Фильтруем только видимые колонки
  const visibleColumns = columns.filter(col => col.visible);

  useEffect(() => {
    loadDocuments();
  }, [page, limit, sortBy, sortOrder]);

  async function loadDocuments() {
    setLoading(true);
    const result = await getAutoparkList(page, limit, sortBy, sortOrder);
    if (result.success) {
      setDocuments(result.documents);
      setTotal(result.total);
    }
    setLoading(false);
  }

  function startEdit(rowId, columnKey, currentValue) {
    setEditingCell({ rowId, columnKey });
    setEditValue(currentValue || '');
  }

  async function saveEdit() {
    if (!editingCell) return;

    setSaving(true);
    const { rowId, columnKey } = editingCell;
    
    const result = await updateAutoparkDocument(rowId, {
      [columnKey]: editValue
    });

    if (result.success) {
      // Обновляем локальное состояние
      setDocuments(docs => docs.map(doc => 
        doc.$id === rowId 
          ? { ...doc, [columnKey]: editValue }
          : doc
      ));
    }

    setSaving(false);
    setEditingCell(null);
    setEditValue('');
  }

  function cancelEdit() {
    setEditingCell(null);
    setEditValue('');
  }

  function toggleColumnVisibility(key) {
    setColumns(columns.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    ));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }

  async function addNewRow() {
    const newData = {};
    columns.forEach(col => {
      newData[col.key] = '';
    });

    const result = await createAutoparkDocument(newData);
    if (result.success) {
      await loadDocuments();
    }
  }

  async function deleteRow(rowId) {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;

    const result = await deleteAutoparkDocument(rowId);
    if (result.success) {
      await loadDocuments();
    }
  }

  function handleSort(columnKey) {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(columnKey);
      setSortOrder('ASC');
    }
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      {/* Панель инструментов */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-500 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={addNewRow}
              className="bg-red-500 text-white px-5 py-2.5 rounded-lg hover:bg-green-600 transition-all duration-200 font-semibold flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить строку
            </button>
            
            <button
              onClick={loadDocuments}
              disabled={loading}
              className="bg-white text-blue-600 px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Обновить
            </button>

            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="bg-white text-blue-600 px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Настройка колонок
            </button>

            <div className="border-l border-blue-400 pl-4 ml-2">
              <span className="text-white font-medium">
                Всего записей: <span className="font-bold text-lg">{total}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-white font-medium">
              Показывать:
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="ml-2 bg-white text-gray-700 border-0 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 font-semibold shadow-md"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </label>
          </div>
        </div>

        {/* Панель настройки колонок */}
        {showColumnSettings && (
          <div className="mt-4 bg-white rounded-lg p-4 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-lg">Настройка отображения колонок</h3>
              <button
                onClick={() => setShowColumnSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {columns.map(col => (
                <label 
                  key={col.key} 
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => toggleColumnVisibility(col.key)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium text-lg">Загрузка данных...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-16 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg text-gray-500 mb-4">Нет данных для отображения</p>
            <button
              onClick={addNewRow}
              className="text-blue-600 hover:text-blue-800 font-semibold text-lg hover:underline"
            >
              Добавить первую запись
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider shadow-sm" style={{ width: '60px' }}>
                  №
                </th>
                {visibleColumns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:from-gray-200 hover:to-gray-300 transition-all duration-150 shadow-sm"
                    style={{ width: col.width, minWidth: col.width }}
                  >
                    <div className="flex items-center justify-between select-none">
                      <span>{col.label}</span>
                      {sortBy === col.key && (
                        <span className="text-blue-600 ml-2 font-bold text-sm">
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-300 px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider shadow-sm" style={{ width: '150px' }}>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <tr key={doc.$id} className="hover:bg-blue-50 transition-colors duration-150 group">
                  <td className="border border-gray-300 px-4 py-2.5 text-sm text-gray-600 bg-gray-50 font-semibold text-center">
                    {(page - 1) * limit + index + 1}
                  </td>
                  {visibleColumns.map(col => {
                    const isEditing = editingCell?.rowId === doc.$id && editingCell?.columnKey === col.key;
                    const cellValue = doc[col.key] || '';

                    return (
                      <td
                        key={col.key}
                        className="border border-gray-300 p-0 text-sm relative group-hover:border-blue-200"
                        style={{ minWidth: col.width }}
                      >
                        {isEditing ? (
                          <div className="flex">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={saveEdit}
                              autoFocus
                              disabled={saving}
                              className="w-full px-3 py-2.5 border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 font-medium"
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => col.editable && startEdit(doc.$id, col.key, cellValue)}
                            className={`px-3 py-2.5 h-full cursor-pointer hover:bg-yellow-50 transition-colors duration-150 ${
                              !cellValue ? 'text-gray-400 italic' : 'text-gray-800'
                            }`}
                          >
                            {cellValue || 'Нажмите для ввода'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-2.5 text-sm text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        href={`/autopark/${doc.$id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors duration-150 px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Просмотр
                      </Link>
                      <button
                        onClick={() => deleteRow(doc.$id)}
                        className="text-red-600 hover:text-red-800 font-semibold hover:underline transition-colors duration-150 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-300 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 font-medium">
              Показано <span className="font-bold text-blue-600">{(page - 1) * limit + 1}</span> - 
              <span className="font-bold text-blue-600"> {Math.min(page * limit, total)}</span> из 
              <span className="font-bold text-blue-600"> {total}</span> записей
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-150 font-semibold text-gray-700 shadow-sm hover:shadow"
              >
                ««
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-150 font-semibold text-gray-700 shadow-sm hover:shadow"
              >
                ‹
              </button>

              {/* Номера страниц */}
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-all duration-150 font-semibold shadow-sm hover:shadow ${
                      page === pageNum
                        ? 'bg-blue-600 text-white border-blue-600 transform scale-105'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-150 font-semibold text-gray-700 shadow-sm hover:shadow"
              >
                ›
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-150 font-semibold text-gray-700 shadow-sm hover:shadow"
              >
                »»
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
