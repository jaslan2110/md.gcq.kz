'use server';

import { createSessionClient, createAdminClient } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { getUser } from './auth';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const ROLES_COLLECTION_ID = '68f0c865003364e63789'; // ЗАМЕНИТЕ на ID вашей коллекции roles
const USERS_EXTENDED_COLLECTION_ID = '68f0c90100342a08a355'; // ЗАМЕНИТЕ на ID вашей коллекции users_extended

/**
 * Получить все роли
 */
export async function getAllRoles() {
  try {
    const { databases } = await createSessionClient();
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      ROLES_COLLECTION_ID,
      [
        Query.orderDesc('createdAt'),
        Query.limit(100)
      ]
    );

    return {
      success: true,
      roles: response.documents
    };
  } catch (error) {
    console.error('Get all roles error:', error);
    return {
      success: false,
      error: error.message,
      roles: []
    };
  }
}

/**
 * Создать новую роль
 */
export async function createRole(data) {
  try {
    const { databases } = await createSessionClient();
    const user = await getUser();

    if (!user) {
      throw new Error('Не авторизован');
    }

    // Проверка прав администратора
    const userRole = await getUserRole(user.$id);
    if (!userRole || !userRole.role?.permissions?.canManageRoles) {
      throw new Error('Недостаточно прав для создания ролей');
    }

    const roleData = {
      name: data.name,
      description: data.description || '',
      isActive: data.isActive ?? true,
      permissions: JSON.stringify(data.permissions || {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const role = await databases.createDocument(
      DATABASE_ID,
      ROLES_COLLECTION_ID,
      'unique()',
      roleData
    );

    return {
      success: true,
      role
    };
  } catch (error) {
    console.error('Create role error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Обновить роль
 */
export async function updateRole(roleId, data) {
  try {
    const { databases } = await createSessionClient();
    const user = await getUser();

    if (!user) {
      throw new Error('Не авторизован');
    }

    // Проверка прав администратора
    const userRole = await getUserRole(user.$id);
    if (!userRole || !userRole.role?.permissions?.canManageRoles) {
      throw new Error('Недостаточно прав для обновления ролей');
    }

    const updateData = {
      ...data,
      permissions: typeof data.permissions === 'string' 
        ? data.permissions 
        : JSON.stringify(data.permissions || {}),
      updatedAt: new Date().toISOString(),
    };

    const role = await databases.updateDocument(
      DATABASE_ID,
      ROLES_COLLECTION_ID,
      roleId,
      updateData
    );

    return {
      success: true,
      role
    };
  } catch (error) {
    console.error('Update role error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Удалить роль
 */
export async function deleteRole(roleId) {
  try {
    const { databases } = await createSessionClient();
    const user = await getUser();

    if (!user) {
      throw new Error('Не авторизован');
    }

    // Проверка прав администратора
    const userRole = await getUserRole(user.$id);
    if (!userRole || !userRole.role?.permissions?.canManageRoles) {
      throw new Error('Недостаточно прав для удаления ролей');
    }

    // Проверяем, что роль не используется
    const usersWithRole = await databases.listDocuments(
      DATABASE_ID,
      USERS_EXTENDED_COLLECTION_ID,
      [Query.equal('roleId', roleId)]
    );

    if (usersWithRole.total > 0) {
      throw new Error('Невозможно удалить роль, которая назначена пользователям');
    }

    await databases.deleteDocument(
      DATABASE_ID,
      ROLES_COLLECTION_ID,
      roleId
    );

    return {
      success: true
    };
  } catch (error) {
    console.error('Delete role error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Получить роль пользователя
 */
export async function getUserRole(userId) {
  try {
    const { databases } = await createSessionClient();

    // Получаем расширенные данные пользователя
    const userExtendedList = await databases.listDocuments(
      DATABASE_ID,
      USERS_EXTENDED_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (userExtendedList.total === 0) {
      return {
        success: true,
        userExtended: null,
        role: null
      };
    }

    const userExtended = userExtendedList.documents[0];

    // Проверяем блокировку
    if (userExtended.isBlocked) {
      const blockedUntil = userExtended.blockedUntil 
        ? new Date(userExtended.blockedUntil) 
        : null;
      
      if (blockedUntil && blockedUntil > new Date()) {
        throw new Error(`Пользователь заблокирован до ${blockedUntil.toLocaleString('ru-RU')}`);
      } else if (!blockedUntil) {
        throw new Error('Пользователь заблокирован');
      }
    }

    // Получаем роль
    if (!userExtended.roleId) {
      return {
        success: true,
        userExtended,
        role: null
      };
    }

    const role = await databases.getDocument(
      DATABASE_ID,
      ROLES_COLLECTION_ID,
      userExtended.roleId
    );

    // Парсим permissions
    const permissions = role.permissions 
      ? JSON.parse(role.permissions) 
      : {};

    return {
      success: true,
      userExtended,
      role: {
        ...role,
        permissions
      }
    };
  } catch (error) {
    console.error('Get user role error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Получить всех пользователей с их ролями
 */
export async function getAllUsersWithRoles() {
  try {
    const { account } = await createAdminClient();
    const { databases } = await createSessionClient();

    // Получаем всех пользователей из Auth
    const allUsers = [];
    let lastUserId = null;
    
    // Appwrite возвращает максимум 100 пользователей за раз
    while (true) {
      const queries = lastUserId 
        ? [Query.limit(100), Query.cursorAfter(lastUserId)]
        : [Query.limit(100)];
      
      const usersList = await account.list(queries);
      allUsers.push(...usersList.users);
      
      if (usersList.users.length < 100) break;
      lastUserId = usersList.users[usersList.users.length - 1].$id;
    }

    // Получаем расширенные данные всех пользователей
    const usersExtended = await databases.listDocuments(
      DATABASE_ID,
      USERS_EXTENDED_COLLECTION_ID,
      [Query.limit(500)]
    );

    // Получаем все роли
    const rolesResponse = await databases.listDocuments(
      DATABASE_ID,
      ROLES_COLLECTION_ID,
      [Query.limit(100)]
    );

    const rolesMap = {};
    rolesResponse.documents.forEach(role => {
      rolesMap[role.$id] = {
        ...role,
        permissions: role.permissions ? JSON.parse(role.permissions) : {}
      };
    });

    // Создаем map расширенных данных пользователей
    const usersExtendedMap = {};
    usersExtended.documents.forEach(ue => {
      usersExtendedMap[ue.userId] = ue;
    });

    // Объединяем данные
    const usersWithRoles = allUsers.map(user => {
      const extended = usersExtendedMap[user.$id];
      const role = extended?.roleId ? rolesMap[extended.roleId] : null;

      return {
        ...user,
        extended: extended || null,
        role: role || null
      };
    });

    return {
      success: true,
      users: usersWithRoles
    };
  } catch (error) {
    console.error('Get all users with roles error:', error);
    return {
      success: false,
      error: error.message,
      users: []
    };
  }
}

/**
 * Назначить роль пользователю
 */
export async function assignRoleToUser(userId, roleId) {
  try {
    const { databases } = await createSessionClient();
    const user = await getUser();

    if (!user) {
      throw new Error('Не авторизован');
    }

    // Проверка прав администратора
    const userRole = await getUserRole(user.$id);
    if (!userRole || !userRole.role?.permissions?.canManageUsers) {
      throw new Error('Недостаточно прав для назначения ролей');
    }

    // Проверяем, существует ли запись для пользователя
    const userExtendedList = await databases.listDocuments(
      DATABASE_ID,
      USERS_EXTENDED_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    let result;

    if (userExtendedList.total === 0) {
      // Создаем новую запись
      result = await databases.createDocument(
        DATABASE_ID,
        USERS_EXTENDED_COLLECTION_ID,
        'unique()',
        {
          userId,
          roleId,
          isBlocked: false,
          blockedUntil: null,
          createdAt: new Date().toISOString()
        }
      );
    } else {
      // Обновляем существующую
      result = await databases.updateDocument(
        DATABASE_ID,
        USERS_EXTENDED_COLLECTION_ID,
        userExtendedList.documents[0].$id,
        {
          roleId
        }
      );
    }

    return {
      success: true,
      userExtended: result
    };
  } catch (error) {
    console.error('Assign role to user error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Заблокировать/разблокировать пользователя
 */
export async function toggleUserBlock(userId, isBlocked, blockedUntil = null) {
  try {
    const { databases } = await createSessionClient();
    const user = await getUser();

    if (!user) {
      throw new Error('Не авторизован');
    }

    // Проверка прав администратора
    const userRole = await getUserRole(user.$id);
    if (!userRole || !userRole.role?.permissions?.canManageUsers) {
      throw new Error('Недостаточно прав для блокировки пользователей');
    }

    // Получаем расширенные данные пользователя
    const userExtendedList = await databases.listDocuments(
      DATABASE_ID,
      USERS_EXTENDED_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    let result;

    const blockData = {
      isBlocked,
      blockedUntil: blockedUntil ? new Date(blockedUntil).toISOString() : null
    };

    if (userExtendedList.total === 0) {
      // Создаем новую запись
      result = await databases.createDocument(
        DATABASE_ID,
        USERS_EXTENDED_COLLECTION_ID,
        'unique()',
        {
          userId,
          roleId: null,
          ...blockData,
          createdAt: new Date().toISOString()
        }
      );
    } else {
      // Обновляем существующую
      result = await databases.updateDocument(
        DATABASE_ID,
        USERS_EXTENDED_COLLECTION_ID,
        userExtendedList.documents[0].$id,
        blockData
      );
    }

    return {
      success: true,
      userExtended: result
    };
  } catch (error) {
    console.error('Toggle user block error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Создать пользователя с ролью (для администратора)
 */
export async function createUserWithRole(email, password, name, roleId) {
  try {
    const { account } = await createAdminClient();
    const { databases } = await createSessionClient();
    const currentUser = await getUser();

    if (!currentUser) {
      throw new Error('Не авторизован');
    }

    // Проверка прав администратора
    const userRole = await getUserRole(currentUser.$id);
    if (!userRole || !userRole.role?.permissions?.canManageUsers) {
      throw new Error('Недостаточно прав для создания пользователей');
    }

    // Создаем пользователя в Auth
    const newUser = await account.create(
      'unique()',
      email,
      password,
      name
    );

    // Создаем расширенные данные с ролью
    await databases.createDocument(
      DATABASE_ID,
      USERS_EXTENDED_COLLECTION_ID,
      'unique()',
      {
        userId: newUser.$id,
        roleId,
        isBlocked: false,
        blockedUntil: null,
        createdAt: new Date().toISOString()
      }
    );

    return {
      success: true,
      user: newUser
    };
  } catch (error) {
    console.error('Create user with role error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}