'use client';

import { useState, useEffect } from 'react';
import { getDocumentFiles, deleteFile } from '@/app/actions/storage';
import FileUploader from './FileUploader';
import FileViewer from './FileViewer';
import { getLogsForDocument } from '@/app/actions/logs';

const FIELD_LABELS = {
  name: 'Название',
  zkkid: 'ЗККИД',
  position: 'Позиция',
  owner: 'Владелец',
  brand: 'Марка',
  model: 'Модель',
  gosnumber: 'Гос. номер',
  serial: 'Серийный номер',
  hoznumber: 'Хоз. номер',
  year: 'Год',
  narabotka: 'Наработка',
  izmerenie_narabotka: 'Измерение наработка',
  condition: 'Состояние',
  kapital_remont: 'Капитальный ремонт',
  note: 'Примечание',
  Encumbrance: 'Обременение',
  inventory_number: 'Инвентарный номер',
  width: 'Ширина',
};

const FILE_CATEGORIES = {
  techpassport: 'Технический паспорт',
  photos: 'Фотографии',
  documents: 'Документы',
  other: 'Прочее'
};


function ChangeHistory({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">История изменений пуста.</p>
      </div>
    );
  }

  // Иконки для разных полей
  const FIELD_ICONS = {
    name: '📝',
    zkkid: '🔢',
    position: '📍',
    owner: '👤',
    brand: '🚗',
    model: '🚘',
    gosnumber: '🔤',
    serial: 'SN',
    hoznumber: 'HN',
    year: '📅',
    narabotka: '⏱️',
    condition: '🛠️',
    note: '🗒️',
    default: '🔄'
  };

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.$id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-200">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl mr-4">
              {FIELD_ICONS[log.fieldName] || FIELD_ICONS.default}
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-800">
                  {FIELD_LABELS[log.fieldName] || log.fieldName}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(log.changedAt).toLocaleString('ru-RU')}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex items-center">
                  <span className="font-semibold text-gray-600 w-24">Пользователь:</span>
                  <span>{log.changedByName}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-600 w-24">Было:</span>
                  <span className="line-through text-red-600 flex-1">{log.oldValue || 'пусто'}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-600 w-24">Стало:</span>
                  <span className="text-green-600 font-medium flex-1">{log.newValue || 'пусто'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


export default function AutoparkCard({ document }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewingFile, setViewingFile] = useState(null);
  
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    loadFiles();
    loadLogs();
  }, []);

  async function loadFiles() {
    setLoading(true);
    const result = await getDocumentFiles(document.$id);
    if (result.success) {
      setFiles(result.files);
    }
    setLoading(false);
  }

  async function loadLogs() {
    setLoadingLogs(true);
    const result = await getLogsForDocument(document.$id);
    if (result.success) {
        setLogs(result.logs);
    }
    setLoadingLogs(false);
  }

  async function handleDeleteFile(fileId) {
    if (!confirm('Вы уверены, что хотите удалить этот файл?')) return;
    
    const result = await deleteFile(fileId);
    if (result.success) {
      await loadFiles();
    }
  }

  function getCategoryFromTags(tags) {
    const category = tags.find(tag => Object.keys(FILE_CATEGORIES).includes(tag));
    return category || 'other';
  }

  const filteredFiles = selectedCategory === 'all' 
    ? files 
    : files.filter(file => getCategoryFromTags(file.$tags || []) === selectedCategory);

  const filesByCategory = Object.keys(FILE_CATEGORIES).reduce((acc, category) => {
    acc[category] = files.filter(file => getCategoryFromTags(file.$tags || []) === category);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Информация об автомобиле */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden sticky top-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Информация
            </h2>
            <p className="text-blue-100 text-sm">
              ID: {document.$id}
            </p>
          </div>
          
          <div className="p-6 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
            {Object.entries(FIELD_LABELS).map(([key, label]) => {
              const value = document[key];
              if (!value) return null;
              
              return (
                <div key={key} className="border-b border-gray-200 pb-3">
                  <dt className="text-sm font-semibold text-gray-500 mb-1">
                    {label}
                  </dt>
                  <dd className="text-base text-gray-900 font-medium">
                    {value}
                  </dd>
                </div>
              );
            })}
            
            {Object.values(document).every(v => !v || v === document.$id) && (
              <p className="text-gray-500 italic text-center py-8">
                Нет данных для отображения
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Файлы и документы */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Файлы и документы
            </h2>
            <p className="text-green-100 text-sm">
              Всего файлов: <strong className="text-white">{files.length}</strong>
            </p>
          </div>

          {/* Загрузка файлов */}
          <div className="p-6 border-b border-gray-200">
            <FileUploader 
              documentId={document.$id} 
              onUploadComplete={loadFiles}
            />
          </div>

          {/* Фильтр по категориям */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все ({files.length})
              </button>
              {Object.entries(FILE_CATEGORIES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    selectedCategory === key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label} ({filesByCategory[key].length})
                </button>
              ))}
            </div>
          </div>

          {/* Список файлов */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Загрузка файлов...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-lg">
                  {selectedCategory === 'all' ? 'Нет загруженных файлов' : `Нет файлов в категории "${FILE_CATEGORIES[selectedCategory]}"`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredFiles.map(file => {
                  const isImage = file.mimeType?.startsWith('image/');
                  const category = getCategoryFromTags(file.$tags || []);
                  
                  return (
                    <div
                      key={file.$id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 bg-gray-50"
                    >
                      {isImage ? (
                        <div 
                          className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setViewingFile(file)}
                        >
                          <img
                            src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${file.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&mode=admin`}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      <h4 className="font-semibold text-gray-900 mb-1 truncate" title={file.displayName || file.name}>
                        {file.displayName || file.name}
                      </h4>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                          {FILE_CATEGORIES[category]}
                        </span>
                        <span>{(file.sizeOriginal / 1024).toFixed(1)} KB</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {isImage && (
                          <button
                            onClick={() => setViewingFile(file)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                          >
                            Просмотр
                          </button>
                        )}
                        <a
                          href={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${file.$id}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&mode=admin`}
                          download
                          className={`${isImage ? 'flex-1' : 'w-full'} bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold text-center`}
                        >
                          Скачать
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file.$id)}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden mt-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                <h2 className="text-2xl font-bold text-white">
                История изменений
                </h2>
            </div>
            <div className="p-6">
                {loadingLogs ? (
                    <div className="text-center py-8">
                        <p>Загрузка истории...</p>
                    </div>
                ) : (
                    <ChangeHistory logs={logs} />
                )}
            </div>
        </div>

      </div>

      {/* Модальное окно просмотра файла */}
      {viewingFile && (
        <FileViewer 
          file={viewingFile} 
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
}
