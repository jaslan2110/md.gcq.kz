import { getUser, logout } from '@/app/actions/auth';
import { getUserRole } from '@/app/actions/roles';
import { redirect } from 'next/navigation';
import AutoparkTableWithRoles from '@/app/components/AutoparkTableWithRoles';
import Link from 'next/link';

export default async function AdminDashboard() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Получаем роль пользователя
  const userRoleData = await getUserRole(user.$id);
  const canManageRoles = userRoleData.success && userRoleData.role?.permissions?.canManageRoles;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50">
      {/* Шапка */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Админ-панель Автопарка
              </h1>
              <p className="text-sm text-gray-600 mt-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Добро пожаловать, <strong className="text-gray-800 ml-1">{user.name}</strong> 
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-gray-500">{user.email}</span>
                {userRoleData.success && userRoleData.role && (
                  <>
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="text-blue-600 font-semibold">{userRoleData.role.name}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {canManageRoles && (
                <Link
                  href="/admin/roles"
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Роли и права
                </Link>
              )}
              <form action={logout}>
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Выйти
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-[1920px] mx-auto px-6 py-6">
        <AutoparkTableWithRoles userId={user.$id} />
      </main>
    </div>
  );
}