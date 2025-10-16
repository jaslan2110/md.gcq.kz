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
 * Получает логи для конкретного документа
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