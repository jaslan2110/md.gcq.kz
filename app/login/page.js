import { login } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { getUser } from '@/app/actions/auth';

export default async function LoginPage() {
  // Проверяем, не залогинен ли пользователь
  const user = await getUser();
  if (user) {
    redirect('/');
  }

  async function handleLogin(formData) {
    'use server';
    const result = await login(formData);
    if (result.success) {
      redirect('/');
    }
    return result;
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <form 
        action={handleLogin}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '15px', 
          width: '350px',
          padding: '30px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Вход в панель</h2>
        
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          style={{ 
            padding: '12px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          required
          style={{ 
            padding: '12px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        
        <button 
          type="submit"
          style={{ 
            padding: '12px', 
            background: '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Войти
        </button>
      </form>
    </div>
  );
}