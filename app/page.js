"use client";

import { useEffect, useState } from 'react';
import { account } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
      } catch (error) {
        // Если ошибка — значит, сессия невалидна, отправляем на логин
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]); // Пустой массив зависимостей, чтобы useEffect выполнился один раз

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      router.push('/login');
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  if (loading) {
    return <p>Загрузка...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Админ-панель</h1>
      <p>Добро пожаловать, **{user.name}** ({user.email})!</p>
      <button onClick={handleLogout} style={{ padding: '10px', background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Выйти
      </button>
    </div>
  );
}