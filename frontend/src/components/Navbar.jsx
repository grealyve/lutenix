import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Badge, Collapse } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import lutenixLogo from '../assets/lutenix-logo.png';

const NavbarComponent = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const [expandedTool, setExpandedTool] = useState(null);
  
  const toggleToolExpansion = (tool) => {
    if (expandedTool === tool) {
      setExpandedTool(null);
    } else {
      setExpandedTool(tool);
    }
  };
  
  const isToolPathActive = (toolPath) => {
    return location.pathname.startsWith(toolPath);
  };
  
  const isSubPathActive = (subPath) => {
    return location.pathname === subPath;
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile-settings');
  };
  
  return (
    <Navbar bg="dark" variant="dark" className="flex-column sidebar" style={{ width: '235px', height: '100vh', position: 'fixed', left: 0, top: 0 }}>
      <Container className="d-flex flex-column p-0" fluid>
        <Navbar.Brand className="p-3 d-flex align-items-center">
          <img 
            src={lutenixLogo} 
            alt="Lutenix Logo" 
            width="40" 
            height="40" 
            className="me-2" 
          />
          <span className="text-info fs-4">Lutenix</span>
        </Navbar.Brand>
        
        {user && (
          <div 
            className="px-3 py-2 mb-3 d-flex align-items-center user-profile-section"
            onClick={handleProfileClick}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-person-circle fs-5 me-2 text-light"></i>
            <div>
              <div className="text-light">
                {user.name || `User ID: ${user.id?.substring(0, 8)}...`}
              </div>
              <Badge bg="primary">{user.role}</Badge>
            </div>
            <i className="bi bi-chevron-right ms-auto text-light"></i>
          </div>
        )}
        
        <Nav className="flex-column w-100">
          <Nav.Link 
            as={Link} 
            to="/" 
            className={`py-3 d-flex align-items-center ${isSubPathActive('/') ? 'active' : ''}`}
          >
            <i className="bi bi-house-door me-2"></i>
            Home
          </Nav.Link>
          
          {}
          <div className="nav-item">
            <Nav.Link 
              onClick={() => toggleToolExpansion('semgrep')}
              className={`py-3 d-flex align-items-center justify-content-between ${isToolPathActive('/semgrep') ? 'active' : ''}`}
            >
              <div>
                <i className="bi bi-code-square me-2"></i>
                Semgrep
              </div>
              <i className={`bi bi-chevron-${expandedTool === 'semgrep' ? 'up' : 'down'} ms-auto`}></i>
            </Nav.Link>
            
            <Collapse in={expandedTool === 'semgrep'}>
              <div>
                <Nav className="flex-column ps-4">
                <Nav.Link 
                    as={Link} 
                    to="/semgrep/deployments"
                    className={`py-2 ${isSubPathActive('/semgrep/deployments') ? 'active' : ''}`}
                  >
                    <i className="bi bi-layers me-2"></i>
                    Deployments
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/semgrep/scans"
                    className={`py-2 ${isSubPathActive('/semgrep/scans') ? 'active' : ''}`}
                  >
                    <i className="bi bi-search me-2"></i>
                    Scans
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/semgrep/findings"
                    className={`py-2 ${isSubPathActive('/semgrep/findings') ? 'active' : ''}`}
                  >
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Findings
                  </Nav.Link>
                </Nav>
              </div>
            </Collapse>
          </div>
          
          {}
          <div className="nav-item">
            <Nav.Link 
              onClick={() => toggleToolExpansion('owaspzap')}
              className={`py-3 d-flex align-items-center justify-content-between ${isToolPathActive('/owasp-zap') ? 'active' : ''}`}
            >
              <div>
                <i className="bi bi-shield-check me-2"></i>
                Owasp Zap
              </div>
              <i className={`bi bi-chevron-${expandedTool === 'owaspzap' ? 'up' : 'down'} ms-auto`}></i>
            </Nav.Link>
            
            <Collapse in={expandedTool === 'owaspzap'}>
              <div>
                <Nav className="flex-column ps-4">
                  <Nav.Link 
                    as={Link} 
                    to="/owasp-zap/scans"
                    className={`py-2 ${isSubPathActive('/owasp-zap/scans') ? 'active' : ''}`}
                  >
                    <i className="bi bi-search me-2"></i>
                    Scans
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/owasp-zap/findings"
                    className={`py-2 ${isSubPathActive('/owasp-zap/findings') ? 'active' : ''}`}
                  >
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Findings
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/owasp-zap/reports"
                    className={`py-2 ${isSubPathActive('/owasp-zap/reports') ? 'active' : ''}`}
                  >
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Reports
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/owasp-zap/generate-report"
                    className={`py-2 ${isSubPathActive('/owasp-zap/generate-report') ? 'active' : ''}`}
                  >
                    <i className="bi bi-file-earmark-plus me-2"></i>
                    Generate Report
                  </Nav.Link>
                </Nav>
              </div>
            </Collapse>
          </div>
          
          {}
          <div className="nav-item">
            <Nav.Link 
              onClick={() => toggleToolExpansion('acunetix')}
              className={`py-3 d-flex align-items-center justify-content-between ${isToolPathActive('/acunetix') ? 'active' : ''}`}
            >
              <div>
                <i className="bi bi-bug me-2"></i>
                Acunetix
              </div>
              <i className={`bi bi-chevron-${expandedTool === 'acunetix' ? 'up' : 'down'} ms-auto`}></i>
            </Nav.Link>
            
            <Collapse in={expandedTool === 'acunetix'}>
              <div>
                <Nav className="flex-column ps-4">
                  <Nav.Link 
                    as={Link} 
                    to="/acunetix/assets" 
                    className={`py-2 ${isSubPathActive('/acunetix/assets') ? 'active' : ''}`}
                  >
                    <i className="bi bi-box me-2"></i>
                    Assets
                  </Nav.Link>
                </Nav>

                <Nav className="flex-column ps-4">
                  <Nav.Link 
                    as={Link} 
                    to="/acunetix/scans"
                    className={`py-2 ${isSubPathActive('/acunetix/scans') ? 'active' : ''}`}
                  >
                    <i className="bi bi-search me-2"></i>
                    Scans
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/acunetix/findings"
                    className={`py-2 ${isSubPathActive('/acunetix/findings') ? 'active' : ''}`}
                  >
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Findings
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/acunetix/reports"
                    className={`py-2 ${isSubPathActive('/acunetix/reports') ? 'active' : ''}`}
                  >
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Reports
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/acunetix/generate-report"
                    className={`py-2 ${isSubPathActive('/acunetix/generate-report') ? 'active' : ''}`}
                  >
                    <i className="bi bi-file-earmark-plus me-2"></i>
                    Generate Report
                  </Nav.Link>
                </Nav>
              </div>
            </Collapse>
          </div>
        </Nav>
        <div className="mt-auto mb-4 px-3">
          <Nav.Link 
            as={Link} 
            to="/settings" 
            className={`py-2 d-flex align-items-center ${isSubPathActive('/settings') ? 'active' : ''}`}
          >
            <i className="bi bi-gear me-2"></i>
            Settings
          </Nav.Link>
          
          {user && user.role === 'admin' && (
            <>
              <Nav.Link 
                as={Link} 
                to="/admin" 
                className={`py-2 d-flex align-items-center ${isSubPathActive('/admin') ? 'active' : ''}`}
              >
                <i className="bi bi-person-badge me-2"></i>
                Admin Panel
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/user-creation" 
                className={`py-2 d-flex align-items-center ${isSubPathActive('/user-creation') ? 'active' : ''}`}
              >
                <i className="bi bi-person-plus me-2"></i>
                User Creation
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/company-relation" 
                className={`py-2 d-flex align-items-center ${isSubPathActive('/company-relation') ? 'active' : ''}`}
              >
                <i className="bi bi-diagram-3 me-2"></i>
                Company Relations
              </Nav.Link>
            </>
          )}
          
          <Nav.Link 
            as={Link} 
            to="/help" 
            className={`py-2 d-flex align-items-center ${isSubPathActive('/help') ? 'active' : ''}`}
          >
            <i className="bi bi-question-circle me-2"></i>
            Help
          </Nav.Link>
          
          <Nav.Link 
            onClick={handleLogout} 
            className="py-2 d-flex align-items-center text-danger mt-2"
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </Nav.Link>
          
          <div className="d-flex gap-2 mt-3">
            <a href="https://twitter.com/lutenixsec" target="_blank" rel="noopener noreferrer" className="text-muted">
              <i className="bi bi-twitter fs-4"></i>
            </a>
            <a href="https://youtube.com/lutenixsec" target="_blank" rel="noopener noreferrer" className="text-muted">
              <i className="bi bi-youtube fs-4"></i>
            </a>
            <a href="https://github.com/lutenixsec" target="_blank" rel="noopener noreferrer" className="text-muted">
              <i className="bi bi-github fs-4"></i>
            </a>
          </div>
        </div>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent; 