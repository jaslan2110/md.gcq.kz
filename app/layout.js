import './globals.css';

export const metadata = {
  title: 'Админ-панель - Автопарк',
  description: 'Система управления автопарком',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        {children}
      </body>
    </html>
  );
}