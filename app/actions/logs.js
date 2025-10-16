'use server';

import { createSessionClient } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { getUser } from './auth';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
// ЗАМЕНИТЕ НА ID ВАШЕЙ КОЛЛЕКЦИИ ЛОГОВ
const LOGS_COLLECTION_ID = '68f09b65001394dc984e'; 

/**
 * Создает запись в логе изменений
 * @param {string} autoparkId - ID документа автопарка
 * @param {string} fieldName - Название измененного поля
 * @param {string} oldValue - Старое значение
 * @param {string} newValue - Новое значение
 */
export async function createLogEntry(autoparkId, fieldName, oldValue, newValue) {
  try {
    const { databases } = await createSessionClient();
    const user = await getUser();

    if (!user) {
      throw new Error('Пользователь не авторизован для создания лога.');
    }

    const logData = {
      autoparkId,
      fieldName,
      oldValue: String(oldValue || ''),
      newValue: String(newValue || ''),
      changedBy: user.$id,
      changedByName: user.name,
      changedAt: new Date().toISOString(),
    };

    await databases.createDocument(
      DATABASE_ID,
      LOGS_COLLECTION_ID,
      'unique()',
      logData
    );

    return { success: true };
  } catch (error) {
    console.error('Create log entry error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Получает логи для конкретного документа (без пагинации, для обратной совместимости)
 * @param {string} autoparkId - ID документа автопарка
 */
export async function getLogsForDocument(autoparkId) {
    try {
        const { databases } = await createSessionClient();
        
        const response = await databases.listDocuments(
            DATABASE_ID,
            LOGS_COLLECTION_ID,
            [
                Query.equal('autoparkId', autoparkId),
                Query.orderDesc('changedAt'),
                Query.limit(100) // Можно ограничить количество логов
            ]
        );

        return { success: true, logs: response.documents };
    } catch (error) {
        console.error('Get logs for document error:', error);
        return { success: false, error: error.message, logs: [] };
    }
}

/**
 * Получает логи для конкретного документа с фильтрацией и пагинацией
 * @param {string} autoparkId - ID документа автопарка
 * @param {Object} filters - Фильтры
 * @param {string} filters.startDate - Дата начала (ISO format)
 * @param {string} filters.endDate - Дата окончания (ISO format)
 * @param {string} filters.fieldName - Название поля для фильтрации
 * @param {number} page - Номер страницы
 * @param {number} limit - Количество записей на странице
 */
export async function getLogsForDocumentPaginated(autoparkId, filters = {}, page = 1, limit = 10) {
  try {
    const { databases } = await createSessionClient();
    
    const offset = (page - 1) * limit;
    
    // Базовые запросы
    const queries = [
      Query.equal('autoparkId', autoparkId),
      Query.orderDesc('changedAt'),
      Query.limit(limit),
      Query.offset(offset)
    ];

    // Добавляем фильтр по дате начала
    if (filters.startDate) {
      queries.push(Query.greaterThanEqual('changedAt', filters.startDate));
    }

    // Добавляем фильтр по дате окончания
    if (filters.endDate) {
      // Добавляем один день к конечной дате чтобы включить весь день
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      queries.push(Query.lessThan('changedAt', endDate.toISOString()));
    }

    // Добавляем фильтр по типу поля
    if (filters.fieldName) {
      queries.push(Query.equal('fieldName', filters.fieldName));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      LOGS_COLLECTION_ID,
      queries
    );

    return {
      success: true,
      logs: response.documents,
      total: response.total,
      page,
      limit,
      totalPages: Math.ceil(response.total / limit)
    };
  } catch (error) {
    console.error('Get logs for document paginated error:', error);
    return {
      success: false,
      error: error.message,
      logs: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 0
    };
  }
}

/**
 * Создает запись в логе о загрузке файла
 * @param {string} autoparkId - ID документа автопарка
 * @param {string} fileName - Имя загруженного файла
 * @param {string} category - Категория файла
 * @param {string} fileId - ID файла в хранилище
 */
export async function createFileUploadLog(autoparkId, fileName, category, fileId) {
  try {
    const { databases } = await createSessionClient();
    const user = await getUser();

    if (!user) {
      throw new Error('Пользователь не авторизован для создания лога.');
    }

    const logData = {
      autoparkId,
      fieldName: 'file_upload',
      oldValue: '',
      newValue: `Загружен файл: ${fileName} (категория: ${category}, ID: ${fileId})`,
      changedBy: user.$id,
      changedByName: user.name,
      changedAt: new Date().toISOString(),
    };

    await databases.createDocument(
      DATABASE_ID,
      LOGS_COLLECTION_ID,
      'unique()',
      logData
    );

    return { success: true };
  } catch (error) {
    console.error('Create file upload log error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Создает запись в логе об удалении файла с сохранением ссылок
 * @param {string} autoparkId - ID документа автопарка
 * @param {string} fileName - Имя удаленного файла
 * @param {string} category - Категория файла
 * @param {string} fileId - ID файла в хранилище
 * @param {string} viewUrl - Ссылка для просмотра файла
 * @param {string} downloadUrl - Ссылка для скачивания файла
 */
export async function createFileDeleteLog(autoparkId, fileName, category, fileId, viewUrl, downloadUrl) {
  try {
    const { databases } = await createSessionClient();
    const user = await getUser();

    if (!user) {
      throw new Error('Пользователь не авторизован для создания лога.');
    }

    // Создаём строку с информацией о файле и ссылками
    const fileInfo = {
      fileName,
      category,
      fileId,
      viewUrl,
      downloadUrl
    };

    const logData = {
      autoparkId,
      fieldName: 'file_delete',
      oldValue: JSON.stringify(fileInfo), // Сохраняем всю информацию как JSON
      newValue: 'Удален',
      changedBy: user.$id,
      changedByName: user.name,
      changedAt: new Date().toISOString(),
    };

    await databases.createDocument(
      DATABASE_ID,
      LOGS_COLLECTION_ID,
      'unique()',
      logData
    );

    return { success: true };
  } catch (error) {
    console.error('Create file delete log error:', error);
    return { success: false, error: error.message };
  }
}