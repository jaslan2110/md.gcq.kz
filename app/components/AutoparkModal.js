'use client';

export default function AutoparkModal({ document, onClose }) {
  if (!document) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {document.name || 'Детали автомобиля'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(document).map(([key, value]) => {
              if (key === '$id' || key === '$createdAt' || key === '$updatedAt' || 
                  key === '$permissions' || key === '$collectionId' || key === '$databaseId') {
                return null;
              }

              return (
                <div key={key} className="border-b border-gray-200 pb-3">
                  <div className="text-sm font-semibold text-gray-500 mb-1">
                    {key}
                  </div>
                  <div className="text-base text-gray-900">
                    {value || '-'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div className="mb-1">
                <span className="font-semibold">ID документа:</span> {document.$id}
              </div>
              <div className="mb-1">
                <span className="font-semibold">Создано:</span>{' '}
                {new Date(document.$createdAt).toLocaleString('ru-RU')}
              </div>
              <div>
                <span className="font-semibold">Обновлено:</span>{' '}
                {new Date(document.$updatedAt).toLocaleString('ru-RU')}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}