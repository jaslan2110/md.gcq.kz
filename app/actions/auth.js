'use server';

import { createAdminClient, createSessionClient } from '@/lib/appwrite-server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData) {
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const { account } = await createAdminClient();
    
    // Создаём сессию
    const session = await account.createEmailPasswordSession(email, password);
    
    // Сохраняем сессию в cookies
    const cookieStore = await cookies();
    cookieStore.set('session', session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.message || 'Ошибка при входе' 
    };
  }
}

export async function logout() {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession('current');
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/login');
}

export async function getUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch (error) {
    return null;
  }
}