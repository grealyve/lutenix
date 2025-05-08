import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { Container } from 'react-bootstrap';

const Layout = () => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Container fluid className="p-0">
          <Outlet />
        </Container>
      </main>
    </div>
  );
};

export default Layout; 