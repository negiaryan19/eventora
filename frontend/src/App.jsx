import { Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomeScreen from './screens/HomeScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import MovieDetailScreen from './screens/MovieDetailScreen';
import SeatSelectionScreen from './screens/SeatSelectionScreen';
import TicketsScreen from './screens/TicketsScreen';
import TicketVerifyScreen from './screens/TicketVerifyScreen';
import AuthScreen from './screens/AuthScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/discover" element={<DiscoverScreen />} />
          <Route path="/movie/:id" element={<MovieDetailScreen />} />
          <Route
            path="/book/:id"
            element={
              <ProtectedRoute>
                <SeatSelectionScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <TicketsScreen />
              </ProtectedRoute>
            }
          />
          <Route path="/ticket/:ticketCode" element={<TicketVerifyScreen />} />
          <Route
            path="/auth"
            element={isAuthenticated ? <Navigate to="/" replace /> : <AuthScreen />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileScreen />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
