'use server';

import { createSessionClient } from '@/lib/appwrite-server';
import { Storage, Query } from 'node-appwrite';
import { createFileDeleteLog } from './logs';

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

export async function getDocumentFiles(documentId) {
  try {
    const { databases } = await createSessionClient();
    const client = databases.client;
    const storage = new Storage(client);
    
    // Получаем все файлы из bucket
    const allFiles = await storage.listFiles(BUCKET_ID);
    
    // Фильтруем файлы по documentId в имени файла
    // И исключаем удалённые файлы (с префиксом DELETED__)
    const documentFiles = allFiles.files.filter(file => {
      const isDeleted = file.name.startsWith('DELETED__');
      const belongsToDocument = file.name.startsWith(`${documentId}__`) || 
                               file.name.startsWith(`DELETED__${documentId}__`);
      return belongsToDocument && !isDeleted;
    });
    
    // Добавляем к каждому файлу извлеченные теги из имени
    const filesWithTags = documentFiles.map(file => {
      const nameParts = file.name.split('__');
      const category = nameParts.length >= 2 ? nameParts[1] : 'other';
      const originalName = nameParts.length >= 3 ? nameParts.slice(2).join('__') : file.name;
      
      return {
        ...file,
        $tags: [documentId, category],
        displayName: originalName,
        category: category
      };
    });
    
    return {
      success: true,
      files: filesWithTags
    };
  } catch (error) {
    console.error('Get document files error:', error);
    return {
      success: false,
      error: error.message,
      files: []
    };
  }
}

export async function getFileUrl(fileId) {
  try {
    const { databases } = await createSessionClient();
    const client = databases.client;
    const storage = new Storage(client);
    
    const result = storage.getFileView(BUCKET_ID, fileId);
    
    return {
      success: true,
      url: result.href
    };
  } catch (error) {
    console.error('Get file URL error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getFileDownloadUrl(fileId) {
  try {
    const { databases } = await createSessionClient();
    const client = databases.client;
    const storage = new Storage(client);
    
    const result = storage.getFileDownload(BUCKET_ID, fileId);
    
    return {
      success: true,
      url: result.href
    };
  } catch (error) {
    console.error('Get file download URL error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function deleteFile(fileId) {
  try {
    const { databases } = await createSessionClient();
    const client = databases.client;
    const storage = new Storage(client);
    
    // Получаем информацию о файле
    const fileInfo = await storage.getFile(BUCKET_ID, fileId);
    
    // Извлекаем информацию из имени файла
    const nameParts = fileInfo.name.split('__');
    const documentId = nameParts[0] || '';
    const category = nameParts.length >= 2 ? nameParts[1] : 'other';
    const originalName = nameParts.length >= 3 ? nameParts.slice(2).join('__') : fileInfo.name;
    
    // Создаём ссылки на файл для сохранения в логах
    const viewUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
    const downloadUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
    
    // Переименовываем файл с префиксом DELETED__
    const newFileName = `DELETED__${fileInfo.name}`;
    
    // К сожалению, Appwrite API не поддерживает переименование файлов напрямую
    // Поэтому мы просто создаём лог с пометкой "удалён" и сохраняем ссылки
    // Файл остаётся в хранилище, но мы его фильтруем при получении списка файлов
    
    // Создаем временную метку удаления в самом Appwrite через обновление файла
    // (используем API для обновления, если доступно)
    try {
      // Пытаемся обновить файл, добавив префикс в название
      // Это работает только если у вас есть права на обновление
      await fetch(
        `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
            'X-Appwrite-Key': process.env.APPWRITE_API_KEY,
          },
          body: JSON.stringify({
            name: newFileName
          })
        }
      );
    } catch (renameError) {
      console.log('Could not rename file, marking as deleted in logs only:', renameError.message);
      // Если не удалось переименовать, всё равно продолжаем с логом
    }
    
    // Создаем лог об "удалении" файла с сохранением ссылок
    if (documentId) {
      await createFileDeleteLog(documentId, originalName, category, fileId, viewUrl, downloadUrl);
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Delete file error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}