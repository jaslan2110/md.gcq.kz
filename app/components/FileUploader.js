'use client';

import { useState } from 'react';

const FILE_CATEGORIES = {
  techpassport: 'Технический паспорт',
  photos: 'Фотографии',
  documents: 'Документы',
  other: 'Прочее'
};

export default function FileUploader({ documentId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('photos');
  const [error, setError] = useState('');

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('documentId', documentId);
      formData.append('category', selectedCategory);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUploadComplete?.();
        e.target.value = '';
      } else {
        setError(result.error || 'Ошибка при загрузке файлов');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Ошибка при загрузке файлов');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Категория файлов
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          disabled={uploading}
        >
          {Object.entries(FILE_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Загрузить файлы
        </label>
        <div className="relative">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent"></div>
                <span className="text-blue-600 font-semibold">Загрузка...</span>
              </div>
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Поддерживаемые форматы: изображения, PDF, Word, Excel
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">Ошибка:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
