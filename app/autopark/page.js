'use client';

import { useState, useEffect } from 'react';
import { getAutoparkList } from '@/app/actions/autopark';
import AutoparkModal from '@/app/components/AutoparkModal';

// Все доступные колонки из схемы
const ALL_COLUMNS = [
  { key: 'name', label: 'Название', visible: true },
  { key: 'zkkid', label: 'ЗККИД', visible: true },
  { key: 'position', label: 'Позиция', visible: true },
  { key: 'owner', label: 'Владелец', visible: true },
  { key: 'brand', label: 'Марка', visible: true },
  { key: 'model', label: 'Модель', visible: true },
  { key: 'gosnumber', label: 'Гос. номер', visible: true },
  { key: 'serial', label: 'Серийный номер', visible: false },
  { key: 'hoznumber', label: 'Хоз. номер', visible: false },
  { key: 'year', label: 'Год', visible: false },
  { key: 'narabotka', label: 'Наработка', visible: false },
  { key: 'izmerenie_narabotka', label: 'Изм. наработка', visible: false },
  { key: 'condition', label: 'Состояние', visible: false },
  { key: 'kapital_remont', label: 'Капитальный ремонт', visible: false },
  { key: 'note', label: 'Примечание', visible: false },
  { key: 'Encumbrance', label: 'Обременение', visible: false },
  { key: 'inventory_number', label: 'Инвент. номер', visible: false },
  { key: 'width', label: 'Ширина', visible: false },
];

export default function AutoparkPage() {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [columns, setColumns] = useState(ALL_COLUMNS);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [sortBy, setSortBy] = useState('$createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

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

  const totalPages = Math.ceil(total / limit);
  const visibleColumns = columns.filter(col => col.visible);

  function toggleColumn(key) {
    setColumns(columns.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    ));
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Заголовок */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Автопарк</h1>
              <p className="text-gray-600">Всего записей: {total}</p>
            </div>
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              ⚙ Настройка колонок
            </button>
          </div>

          {/* Панель настройки колонок */}
          {showColumnSettings && (
            <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
              <h3 className="font-semibold mb-3">Выберите отображаемые колонки:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {columns.map(col => (
                  <label key={col.key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => toggleColumn(col.key)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Таблица */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Загрузка данных...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Нет данных для отображения
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      №
                    </th>
                    {visibleColumns.map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>{col.label}</span>
                          {sortBy === col.key && (
                            <span className="text-blue-600">
                              {sortOrder === 'ASC' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc, index) => (
                    <tr key={doc.$id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {(page - 1) * limit + index + 1}
                      </td>
                      {visibleColumns.map(col => (
                        <td key={col.key} className="px-4 py-3 text-sm text-gray-900">
                          {doc[col.key] || '-'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setSelectedDocument(doc)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Подробнее
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-md p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-600">
                  Показывать по:
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="ml-2 border border-gray-300 rounded px-2 py-1"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
                <span className="text-sm text-gray-600">
                  Показано {(page - 1) * limit + 1}-{Math.min(page * limit, total)} из {total}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ««
                </button>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ‹ Назад
                </button>

                {/* Номера страниц */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 border rounded ${
                        page === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Вперед ›
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно */}
      {selectedDocument && (
        <AutoparkModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}