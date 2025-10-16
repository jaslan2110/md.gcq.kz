'use server';

import { createSessionClient } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { createLogEntry } from './logs';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = '68b93491000d66c50778'; // ID коллекции autopark


export async function updateAutoparkDocument(documentId, data) {
  try {
    const { databases } = await createSessionClient();
    
    // 1. Получаем текущее состояние документа перед обновлением
    const oldDocument = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId
    );

    // 2. Обновляем документ
    const updatedDocument = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId,
      data
    );

    // 3. Сравниваем старые и новые данные и создаем логи
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const oldValue = oldDocument[key];
        const newValue = data[key];

        // Создаем лог, только если значение действительно изменилось
        if (String(oldValue || '') !== String(newValue || '')) {
          await createLogEntry(documentId, key, oldValue, newValue);
        }
      }
    }
    
    return {
      success: true,
      document: updatedDocument
    };
  } catch (error) {
    console.error('Update autopark document error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}


export async function getAutoparkList(page = 1, limit = 25, orderBy = '$createdAt', orderType = 'DESC') {
  try {
    const { databases } = await createSessionClient();
    
    const offset = (page - 1) * limit;
    
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc(orderBy)
    ];
    
    if (orderType === 'ASC') {
      queries[2] = Query.orderAsc(orderBy);
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      queries
    );
    
    return {
      success: true,
      documents: response.documents,
      total: response.total
    };
  } catch (error) {
    console.error('Get autopark list error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getAutoparkDocument(documentId) {
  try {
    const { databases } = await createSessionClient();
    
    const document = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId
    );
    
    return {
      success: true,
      document
    };
  } catch (error) {
    console.error('Get autopark document error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function createAutoparkDocument(data) {
  try {
    const { databases } = await createSessionClient();
    
    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      'unique()',
      data
    );
    
    return {
      success: true,
      document
    };
  } catch (error) {
    console.error('Create autopark document error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}



export async function deleteAutoparkDocument(documentId) {
  try {
    const { databases } = await createSessionClient();
    
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId
    );
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Delete autopark document error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}