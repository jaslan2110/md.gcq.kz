'use client';

export default function FileViewer({ file, onClose }) {
  const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${file.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg truncate flex-1 mr-4">
            {file.displayName || file.name}
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          <div className="flex items-center justify-center min-h-full">
            <img
              src={fileUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* Футер с действиями */}
        <div className="bg-gray-100 p-4 flex items-center justify-between border-t border-gray-300">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Размер:</span> {(file.sizeOriginal / 1024).toFixed(1)} KB
            <span className="mx-2">•</span>
            <span className="font-semibold">Тип:</span> {file.mimeType}
          </div>
          <div className="flex gap-2">
            <a
              href={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${file.$id}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
              download
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Скачать
            </a>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
