import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Spinner } from 'react-bootstrap';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (user && user.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > user.exp) {
      logout();
      return <Navigate to="/login" replace />;
    }
  }

  if (isLoading) {
    return (
      <Container className="vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute; 