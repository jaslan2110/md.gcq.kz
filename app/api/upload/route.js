import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createFileUploadLog } from '@/app/actions/logs';

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const documentId = formData.get('documentId');
    const category = formData.get('category') || 'other';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Не выбраны файлы' },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Не указан ID документа' },
        { status: 400 }
      );
    }

    // Получаем сессию пользователя
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Создаем FormData для каждого файла
        const fileFormData = new FormData();
        
        // Генерируем уникальный ID (формат Appwrite)
        const fileId = 'unique()';
        
        // Создаем новое имя файла с префиксами
        const prefixedName = `${documentId}__${category}__${file.name}`;
        
        // Создаем новый File объект с измененным именем
        const renamedFile = new File([file], prefixedName, { type: file.type });
        
        fileFormData.append('fileId', fileId);
        fileFormData.append('file', renamedFile);

        // Загружаем через REST API Appwrite
        const response = await fetch(
          `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files`,
          {
            method: 'POST',
            headers: {
              'X-Appwrite-Project': PROJECT_ID,
              'X-Appwrite-Session': session.value,
            },
            body: fileFormData,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Upload failed for ${file.name}:`, errorText);
          throw new Error(`Failed to upload: ${errorText}`);
        }

        const result = await response.json();
        uploadedFiles.push(result);
        
        // Создаем лог о загрузке файла
        await createFileUploadLog(documentId, file.name, category, result.$id);
        
        console.log(`Successfully uploaded: ${file.name} as ${result.$id}`);
      } catch (fileError) {
        console.error(`Error uploading file ${file.name}:`, fileError);
        // Продолжаем с другими файлами
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Не удалось загрузить ни один файл' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      uploaded: uploadedFiles.length,
      total: files.length
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}