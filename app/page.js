import { getUser, logout } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Админ-панель</h1>
      <p>Добро пожаловать, <strong>{user.name}</strong> ({user.email})!</p>
      
      <form action={logout}>
        <button 
          type="submit"
          style={{ 
            padding: '10px 20px', 
            background: 'red', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Выйти
        </button>
      </form>
    </div>
  );
}