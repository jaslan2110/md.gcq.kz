import { getUser, logout } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import AutoparkTable from '@/app/components/AutoparkTable';

export default async function AdminDashboard() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

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
              </p>
            </div>
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
      </header>

      {/* Основной контент */}
      <main className="max-w-[1920px] mx-auto px-6 py-6">
        <AutoparkTable />
      </main>
    </div>
  );
}