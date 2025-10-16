import { getUser } from '@/app/actions/auth';
import { getUserRole } from '@/app/actions/roles';
import { redirect } from 'next/navigation';
import RolesManagement from '@/app/components/RolesManagement';
import Link from 'next/link';

export default async function RolesPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Проверяем права доступа
  const userRoleData = await getUserRole(user.$id);
  
  if (!userRoleData.success || !userRoleData.role?.permissions?.canManageRoles) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Доступ запрещен</h2>
            <p className="text-gray-600 mb-6">У вас нет прав для управления ролями</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold"
            >
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50">
      {/* Шапка */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Управление ролями и пользователями
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Создание ролей, назначение прав доступа
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Администратор: <strong>{user.name}</strong>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-[1920px] mx-auto px-6 py-6">
        <RolesManagement />
      </main>
    </div>
  );
}