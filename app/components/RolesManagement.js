'use client';

import { useState, useEffect } from 'react';
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getAllUsersWithRoles,
  assignRoleToUser,
  toggleUserBlock,
  createUserWithRole
} from '@/app/actions/roles';

// Структура прав доступа по умолчанию
const DEFAULT_PERMISSIONS = {
  // Управление системой
  canManageRoles: false, // Управление ролями
  canManageUsers: false, // Управление пользователями
  
  // Просмотр данных
  canViewAutopark: false, // Просмотр списка автопарка
  canViewDetails: false, // Просмотр детальной информации
  canViewFiles: false, // Просмотр файлов
  canViewHistory: false, // Просмотр истории изменений
  
  // Редактирование данных
  canEditAutopark: false, // Редактирование данных автопарка
  canCreateAutopark: false, // Создание записей
  canDeleteAutopark: false, // Удаление записей
  
  // Работа с файлами
  canUploadFiles: false, // Загрузка файлов
  canDeleteFiles: false, // Удаление файлов
  
  // Видимость колонок (по умолчанию все видимы если есть доступ)
  visibleColumns: [
    'name', 'zkkid', 'position', 'owner', 'brand', 'model', 
    'gosnumber', 'serial', 'hoznumber', 'year', 'narabotka',
    'izmerenie_narabotka', 'condition', 'kapital_remont', 
    'note', 'Encumbrance', 'inventory_number', 'width'
  ],
  
  // Редактируемые колонки
  editableColumns: [
    'name', 'zkkid', 'position', 'owner', 'brand', 'model',
    'gosnumber', 'serial', 'hoznumber', 'year', 'narabotka',
    'izmerenie_narabotka', 'condition', 'kapital_remont',
    'note', 'Encumbrance', 'inventory_number', 'width'
  ]
};

const COLUMN_LABELS = {
  name: 'Название',
  zkkid: 'ЗККИД',
  position: 'Позиция',
  owner: 'Владелец',
  brand: 'Марка',
  model: 'Модель',
  gosnumber: 'Гос. номер',
  serial: 'Серийный номер',
  hoznumber: 'Хоз. номер',
  year: 'Год',
  narabotka: 'Наработка',
  izmerenie_narabotka: 'Изм. наработка',
  condition: 'Состояние',
  kapital_remont: 'Капитальный ремонт',
  note: 'Примечание',
  Encumbrance: 'Обременение',
  inventory_number: 'Инвент. номер',
  width: 'Ширина',
};

export default function RolesManagement() {
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' или 'users'
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния для модальных окон
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  
  // Форма роли
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    isActive: true,
    permissions: { ...DEFAULT_PERMISSIONS }
  });
  
  // Форма пользователя
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    name: '',
    roleId: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    if (activeTab === 'roles') {
      const result = await getAllRoles();
      if (result.success) {
        setRoles(result.roles.map(role => ({
          ...role,
          permissions: role.permissions ? JSON.parse(role.permissions) : { ...DEFAULT_PERMISSIONS }
        })));
      }
    } else {
      const result = await getAllUsersWithRoles();
      if (result.success) {
        setUsers(result.users);
      }
    }
    setLoading(false);
  }

  function openRoleModal(role = null) {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name,
        description: role.description || '',
        isActive: role.isActive,
        permissions: role.permissions || { ...DEFAULT_PERMISSIONS }
      });
    } else {
      setEditingRole(null);
      setRoleForm({
        name: '',
        description: '',
        isActive: true,
        permissions: { ...DEFAULT_PERMISSIONS }
      });
    }
    setShowRoleModal(true);
  }

  function closeRoleModal() {
    setShowRoleModal(false);
    setEditingRole(null);
    setRoleForm({
      name: '',
      description: '',
      isActive: true,
      permissions: { ...DEFAULT_PERMISSIONS }
    });
  }

  async function handleSaveRole() {
    if (!roleForm.name.trim()) {
      alert('Введите название роли');
      return;
    }

    const result = editingRole
      ? await updateRole(editingRole.$id, roleForm)
      : await createRole(roleForm);

    if (result.success) {
      closeRoleModal();
      loadData();
    } else {
      alert(`Ошибка: ${result.error}`);
    }
  }

  async function handleDeleteRole(roleId) {
    if (!confirm('Вы уверены, что хотите удалить эту роль?')) return;

    const result = await deleteRole(roleId);
    if (result.success) {
      loadData();
    } else {
      alert(`Ошибка: ${result.error}`);
    }
  }

  function updatePermission(key, value) {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value
      }
    }));
  }

  function toggleColumnVisibility(column) {
    setRoleForm(prev => {
      const visibleColumns = [...prev.permissions.visibleColumns];
      const index = visibleColumns.indexOf(column);
      
      if (index > -1) {
        visibleColumns.splice(index, 1);
      } else {
        visibleColumns.push(column);
      }
      
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          visibleColumns
        }
      };
    });
  }

  function toggleColumnEditable(column) {
    setRoleForm(prev => {
      const editableColumns = [...prev.permissions.editableColumns];
      const index = editableColumns.indexOf(column);
      
      if (index > -1) {
        editableColumns.splice(index, 1);
      } else {
        editableColumns.push(column);
      }
      
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          editableColumns
        }
      };
    });
  }

  async function handleAssignRole(userId, roleId) {
    const result = await assignRoleToUser(userId, roleId);
    if (result.success) {
      loadData();
    } else {
      alert(`Ошибка: ${result.error}`);
    }
  }

  async function handleToggleBlock(userId, isBlocked, blockedUntil = null) {
    const result = await toggleUserBlock(userId, isBlocked, blockedUntil);
    if (result.success) {
      loadData();
    } else {
      alert(`Ошибка: ${result.error}`);
    }
  }

  async function handleCreateUser() {
    if (!userForm.email || !userForm.password || !userForm.name) {
      alert('Заполните все обязательные поля');
      return;
    }

    const result = await createUserWithRole(
      userForm.email,
      userForm.password,
      userForm.name,
      userForm.roleId || null
    );

    if (result.success) {
      setShowUserModal(false);
      setUserForm({ email: '', password: '', name: '', roleId: '' });
      loadData();
    } else {
      alert(`Ошибка: ${result.error}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Табы */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'roles'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Управление ролями ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Управление пользователями ({users.length})
          </button>
        </div>
      </div>

      {/* Контент табов */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Загрузка данных...</p>
        </div>
      ) : activeTab === 'roles' ? (
        <RolesTab
          roles={roles}
          onEdit={openRoleModal}
          onDelete={handleDeleteRole}
          onCreate={() => openRoleModal()}
        />
      ) : (
        <UsersTab
          users={users}
          roles={roles}
          onAssignRole={handleAssignRole}
          onToggleBlock={handleToggleBlock}
          onCreateUser={() => setShowUserModal(true)}
        />
      )}

      {/* Модальное окно роли */}
      {showRoleModal && (
        <RoleModal
          roleForm={roleForm}
          setRoleForm={setRoleForm}
          onSave={handleSaveRole}
          onClose={closeRoleModal}
          isEditing={!!editingRole}
          updatePermission={updatePermission}
          toggleColumnVisibility={toggleColumnVisibility}
          toggleColumnEditable={toggleColumnEditable}
          columnLabels={COLUMN_LABELS}
        />
      )}

      {/* Модальное окно создания пользователя */}
      {showUserModal && (
        <UserModal
          userForm={userForm}
          setUserForm={setUserForm}
          roles={roles}
          onSave={handleCreateUser}
          onClose={() => {
            setShowUserModal(false);
            setUserForm({ email: '', password: '', name: '', roleId: '' });
          }}
        />
      )}
    </div>
  );
}

// Компонент таба ролей
function RolesTab({ roles, onEdit, onDelete, onCreate }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Роли</h2>
        <button
          onClick={onCreate}
          className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Создать роль
        </button>
      </div>

      <div className="p-6">
        {roles.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">Нет созданных ролей</p>
            <button
              onClick={onCreate}
              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
            >
              Создать первую роль
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => (
              <RoleCard
                key={role.$id}
                role={role}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент карточки роли
function RoleCard({ role, onEdit, onDelete }) {
  const permissions = role.permissions || {};
  const activePermissions = Object.entries(permissions)
    .filter(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value === true;
    })
    .length;

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{role.name}</h3>
          <p className="text-sm text-gray-600">{role.description || 'Нет описания'}</p>
        </div>
        <div className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold ${
          role.isActive 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {role.isActive ? 'Активна' : 'Неактивна'}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Активных прав: <strong>{activePermissions}</strong></span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Видимых колонок: <strong>{permissions.visibleColumns?.length || 0}</strong></span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(role)}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
        >
          Редактировать
        </button>
        <button
          onClick={() => onDelete(role.$id)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// Компонент таба пользователей
function UsersTab({ users, roles, onAssignRole, onToggleBlock, onCreateUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || 
                       (selectedRole === 'none' && !user.role) ||
                       user.role?.$id === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Пользователи</h2>
          <button
            onClick={onCreateUser}
            className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Создать пользователя
          </button>
        </div>

        {/* Фильтры */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Поиск по имени или email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="all">Все роли</option>
            <option value="none">Без роли</option>
            {roles.map(role => (
              <option key={role.$id} value={role.$id}>{role.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-500 text-lg">Пользователи не найдены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Пользователь</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Роль</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Статус</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <UserRow
                    key={user.$id}
                    user={user}
                    roles={roles}
                    onAssignRole={onAssignRole}
                    onToggleBlock={onToggleBlock}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент строки пользователя
function UserRow({ user, roles, onAssignRole, onToggleBlock }) {
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockUntil, setBlockUntil] = useState('');
  const isBlocked = user.extended?.isBlocked || false;
  const blockedUntilDate = user.extended?.blockedUntil 
    ? new Date(user.extended.blockedUntil) 
    : null;

  function handleBlock() {
    if (isBlocked) {
      // Разблокировать
      onToggleBlock(user.$id, false, null);
    } else {
      // Показать модальное окно для выбора времени блокировки
      setShowBlockModal(true);
    }
  }

  function confirmBlock() {
    const until = blockUntil ? new Date(blockUntil).toISOString() : null;
    onToggleBlock(user.$id, true, until);
    setShowBlockModal(false);
    setBlockUntil('');
  }

  return (
    <>
      <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <span className="text-blue-600 font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-500">ID: {user.$id.substring(0, 8)}...</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-gray-700">{user.email}</td>
        <td className="px-6 py-4">
          <select
            value={user.role?.$id || ''}
            onChange={(e) => onAssignRole(user.$id, e.target.value || null)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Без роли</option>
            {roles.map(role => (
              <option key={role.$id} value={role.$id}>{role.name}</option>
            ))}
          </select>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
              isBlocked
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {isBlocked ? 'Заблокирован' : 'Активен'}
            </span>
            {isBlocked && blockedUntilDate && (
              <span className="text-xs text-gray-500">
                До: {blockedUntilDate.toLocaleString('ru-RU')}
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 text-center">
          <button
            onClick={handleBlock}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              isBlocked
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isBlocked ? 'Разблокировать' : 'Заблокировать'}
          </button>
        </td>
      </tr>

      {/* Модальное окно блокировки */}
      {showBlockModal && (
        <tr>
          <td colSpan="5">
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                 onClick={() => setShowBlockModal(false)}>
              <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
                   onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Заблокировать пользователя
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Заблокировать до (необязательно):
                  </label>
                  <input
                    type="datetime-local"
                    value={blockUntil}
                    onChange={(e) => setBlockUntil(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Оставьте пустым для постоянной блокировки
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={confirmBlock}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Заблокировать
                  </button>
                  <button
                    onClick={() => {
                      setShowBlockModal(false);
                      setBlockUntil('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Модальное окно роли
function RoleModal({ 
  roleForm, 
  setRoleForm, 
  onSave, 
  onClose, 
  isEditing,
  updatePermission,
  toggleColumnVisibility,
  toggleColumnEditable,
  columnLabels
}) {
  const [activeSection, setActiveSection] = useState('general');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
           onClick={(e) => e.stopPropagation()}>
        
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">
            {isEditing ? 'Редактировать роль' : 'Создать роль'}
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

        {/* Навигация по секциям */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveSection('general')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeSection === 'general'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Основное
          </button>
          <button
            onClick={() => setActiveSection('permissions')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeSection === 'permissions'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Права доступа
          </button>
          <button
            onClick={() => setActiveSection('columns')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeSection === 'columns'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Колонки
          </button>
        </div>

        {/* Контент */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Название роли *
                </label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="Например: Администратор"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Краткое описание роли и её назначения"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roleForm.isActive}
                    onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">Роль активна</span>
                </label>
              </div>
            </div>
          )}

          {activeSection === 'permissions' && (
            <div className="space-y-6">
              {/* Управление системой */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Управление системой
                </h4>
                <div className="space-y-2 pl-7">
                  <PermissionCheckbox
                    label="Управление ролями"
                    checked={roleForm.permissions.canManageRoles}
                    onChange={(v) => updatePermission('canManageRoles', v)}
                  />
                  <PermissionCheckbox
                    label="Управление пользователями"
                    checked={roleForm.permissions.canManageUsers}
                    onChange={(v) => updatePermission('canManageUsers', v)}
                  />
                </div>
              </div>

              {/* Просмотр данных */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Просмотр данных
                </h4>
                <div className="space-y-2 pl-7">
                  <PermissionCheckbox
                    label="Просмотр списка автопарка"
                    checked={roleForm.permissions.canViewAutopark}
                    onChange={(v) => updatePermission('canViewAutopark', v)}
                  />
                  <PermissionCheckbox
                    label="Просмотр детальной информации"
                    checked={roleForm.permissions.canViewDetails}
                    onChange={(v) => updatePermission('canViewDetails', v)}
                  />
                  <PermissionCheckbox
                    label="Просмотр файлов"
                    checked={roleForm.permissions.canViewFiles}
                    onChange={(v) => updatePermission('canViewFiles', v)}
                  />
                  <PermissionCheckbox
                    label="Просмотр истории изменений"
                    checked={roleForm.permissions.canViewHistory}
                    onChange={(v) => updatePermission('canViewHistory', v)}
                  />
                </div>
              </div>

              {/* Редактирование данных */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Редактирование данных
                </h4>
                <div className="space-y-2 pl-7">
                  <PermissionCheckbox
                    label="Редактирование данных автопарка"
                    checked={roleForm.permissions.canEditAutopark}
                    onChange={(v) => updatePermission('canEditAutopark', v)}
                  />
                  <PermissionCheckbox
                    label="Создание записей"
                    checked={roleForm.permissions.canCreateAutopark}
                    onChange={(v) => updatePermission('canCreateAutopark', v)}
                  />
                  <PermissionCheckbox
                    label="Удаление записей"
                    checked={roleForm.permissions.canDeleteAutopark}
                    onChange={(v) => updatePermission('canDeleteAutopark', v)}
                  />
                </div>
              </div>

              {/* Работа с файлами */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Работа с файлами
                </h4>
                <div className="space-y-2 pl-7">
                  <PermissionCheckbox
                    label="Загрузка файлов"
                    checked={roleForm.permissions.canUploadFiles}
                    onChange={(v) => updatePermission('canUploadFiles', v)}
                  />
                  <PermissionCheckbox
                    label="Удаление файлов"
                    checked={roleForm.permissions.canDeleteFiles}
                    onChange={(v) => updatePermission('canDeleteFiles', v)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'columns' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Видимые колонки:</strong> Какие колонки пользователь может видеть в таблице<br />
                  <strong>Редактируемые колонки:</strong> Какие колонки пользователь может редактировать
                </p>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">Настройка видимости и редактирования колонок</h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Колонка</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Видимая</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Редактируемая</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(columnLabels).map(([key, label]) => (
                        <tr key={key} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 font-medium">{label}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={roleForm.permissions.visibleColumns?.includes(key)}
                              onChange={() => toggleColumnVisibility(key)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={roleForm.permissions.editableColumns?.includes(key)}
                              onChange={() => toggleColumnEditable(key)}
                              disabled={!roleForm.permissions.visibleColumns?.includes(key)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      const allColumns = Object.keys(columnLabels);
                      setRoleForm(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          visibleColumns: [...allColumns],
                          editableColumns: [...allColumns]
                        }
                      }));
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                  >
                    Выбрать все
                  </button>
                  <button
                    onClick={() => {
                      setRoleForm(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          visibleColumns: [],
                          editableColumns: []
                        }
                      }));
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold text-sm"
                  >
                    Снять все
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="bg-gray-50 p-6 flex justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
          >
            Отмена
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            {isEditing ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Компонент чекбокса для прав
function PermissionCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

// Модальное окно создания пользователя
function UserModal({ userForm, setUserForm, roles, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl"
           onClick={(e) => e.stopPropagation()}>
        
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">
            Создать пользователя
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

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Имя *
            </label>
            <input
              type="text"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              placeholder="Имя пользователя"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              placeholder="email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Пароль *
            </label>
            <input
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              placeholder="Минимум 8 символов"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Роль
            </label>
            <select
              value={userForm.roleId}
              onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Без роли</option>
              {roles.map(role => (
                <option key={role.$id} value={role.$id}>{role.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-6 flex justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
          >
            Отмена
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}