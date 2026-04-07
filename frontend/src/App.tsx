import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { useUserStore } from '@/stores'; // TEMPORARILY DISABLED FOR TESTING
import { Header, Sidebar } from '@/components/common';

// Pages
import HomePage from '@/pages/Home';
import TradePage from '@/pages/Trade';
import LogPage from '@/pages/Log';
import ReportPage from '@/pages/Report';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import ProfilePage from '@/pages/Profile';

// Protected Route - TEMPORARILY DISABLED FOR TESTING
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // const { isAuthenticated } = useUserStore();
  //
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  return <>{children}</>;
}

// Layout with sidebar
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  // const { isAuthenticated } = useUserStore(); // TEMPORARILY DISABLED FOR TESTING

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages - TEMPORARILY DISABLED FOR TESTING */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected pages */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <HomePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trade"
          element={
            <ProtectedRoute>
              <MainLayout>
                <TradePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/log"
          element={
            <ProtectedRoute>
              <MainLayout>
                <LogPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ReportPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;