import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import WaterQualityMonitoring from './pages/WaterQualityMonitoring';
import DiseaseHotspots from './pages/DiseaseHotspots';
import DeviceManagement from './pages/DeviceManagement';
import MobileSync from './pages/MobileSync';
import AlertManagement from './pages/AlertManagement';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';

// Styles
import './styles/ux4g.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-3" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="header">
        <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      </header>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className={`content-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {children}
      </main>
    </div>
  );
};

// Main App Component
const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-3" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="text-muted">Loading auth state...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            currentUser ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/water-quality"
          element={
            <ProtectedRoute>
              <Layout>
                <WaterQualityMonitoring />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/disease-hotspots"
          element={
            <ProtectedRoute>
              <Layout>
                <DiseaseHotspots />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/device-management"
          element={
            <ProtectedRoute>
              <Layout>
                <DeviceManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mobile-sync"
          element={
            <ProtectedRoute>
              <Layout>
                <MobileSync />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Layout>
                <AlertManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  // Add error boundary
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/water-quality-admin')) {
      console.log('Redirecting to correct base path');
      window.location.href = '/water-quality-admin';
    }
  }, []);

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <h1>Something went wrong</h1>
          <pre>{error.message}</pre>
          <button 
            className="btn btn-primary mt-3" 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-3" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="text-muted">Loading application...</p>
        </div>
      </div>
    }>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#212529',
              border: '1px solid #DEE2E6',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Poppins, Inter, sans-serif'
            },
            success: {
              iconTheme: {
                primary: '#28A745',
                secondary: '#FFFFFF'
              }
            },
            error: {
              iconTheme: {
                primary: '#DC3545',
                secondary: '#FFFFFF'
              }
            }
          }}
        />
      </AuthProvider>
    </React.Suspense>
  );
}

export default App;
