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
    const documentFiles = allFiles.files.filter(file => {
      return file.name.startsWith(`${documentId}__`);
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
    
    // Сначала получаем информацию о файле перед удалением
    const fileInfo = await storage.getFile(BUCKET_ID, fileId);
    
    // Извлекаем информацию из имени файла
    const nameParts = fileInfo.name.split('__');
    const documentId = nameParts[0] || '';
    const category = nameParts.length >= 2 ? nameParts[1] : 'other';
    const originalName = nameParts.length >= 3 ? nameParts.slice(2).join('__') : fileInfo.name;
    
    // Удаляем файл
    await storage.deleteFile(BUCKET_ID, fileId);
    
    // Создаем лог об удалении файла
    if (documentId) {
      await createFileDeleteLog(documentId, originalName, category, fileId);
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