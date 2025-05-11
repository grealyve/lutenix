import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Badge, Collapse } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import secmanLogo from '../assets/secman-logo.png';
import semgrepLogo from '../assets/semgrep-logo.png';
import zapLogo from '../assets/zap-logo.png';
import acunetixLogo from '../assets/acunetix-logo.png';
import '../styles/navbar.css';

const NavbarComponent = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const [expandedTool, setExpandedTool] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    if (location.pathname.includes('/semgrep')) {
      setExpandedTool('semgrep');
    } else if (location.pathname.includes('/owasp-zap')) {
      setExpandedTool('owaspzap');
    } else if (location.pathname.includes('/acunetix')) {
      setExpandedTool('acunetix');
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch('http://localhost:4040/api/v1/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);
  
  const toggleToolExpansion = (tool) => {
    if (expandedTool === tool) {
      setExpandedTool(null);
    } else {
      setExpandedTool(tool);
    }
  };
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
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
    <>
      <div className={`sidebar-toggle d-lg-none ${collapsed ? 'toggled' : ''}`} onClick={toggleSidebar}>
        <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
      </div>
      
      <Navbar 
        bg="dark" 
        variant="dark" 
        className={`modern-sidebar ${collapsed ? 'collapsed' : ''}`}
      >
        <Container className="d-flex flex-column p-0 h-100" fluid>
          <div className="sidebar-header">
            <Navbar.Brand className="p-3 d-flex align-items-center">
              <img 
                src={secmanLogo} 
                alt="SecMan Logo" 
                className="logo-image" 
              />
              <span className="brand-text">SecMan</span>
            </Navbar.Brand>
          </div>
          
          {user && (
            <div 
              className="user-profile-section"
              onClick={handleProfileClick}
            >
              <div className="user-avatar">
                <i className="bi bi-person-circle"></i>
              </div>
              <div className="user-info">
                <div className="user-name">
                  {userProfile ? 
                    `${userProfile.name} ${userProfile.surname}` : 
                    `User ${user.id?.substring(0, 8)}...`}
                </div>
                <Badge bg="info" pill>{user.role}</Badge>
              </div>
              <i className="bi bi-chevron-right user-arrow"></i>
            </div>
          )}
          
          <div className="sidebar-content">
            <Nav className="flex-column w-100">
              <Nav.Link 
                as={Link} 
                to="/" 
                className={`nav-item-link ${isSubPathActive('/') ? 'active' : ''}`}
              >
                <i className="bi bi-house-door nav-icon"></i>
                <span className="nav-text">Home</span>
              </Nav.Link>
              
              {/* Semgrep Section */}
              <div className={`nav-group ${isToolPathActive('/semgrep') ? 'active-group' : ''}`}>
                <Nav.Link 
                  onClick={() => toggleToolExpansion('semgrep')}
                  className={`nav-item-link nav-group-header ${isToolPathActive('/semgrep') ? 'active' : ''}`}
                >
                  <div className="nav-item-content">
                    <img src={semgrepLogo} alt="Semgrep Logo" className="tool-logo nav-icon" />
                    <span className="nav-text">Semgrep</span>
                  </div>
                  <i className={`bi bi-chevron-${expandedTool === 'semgrep' ? 'up' : 'down'} nav-expand-icon`}></i>
                </Nav.Link>
                
                <Collapse in={expandedTool === 'semgrep'}>
                  <div className="nav-group-items">
                    <Nav.Link 
                      as={Link} 
                      to="/semgrep/deployments"
                      className={`sub-nav-link ${isSubPathActive('/semgrep/deployments') ? 'active' : ''}`}
                    >
                      <i className="bi bi-layers nav-icon"></i>
                      <span className="nav-text">Deployments</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/semgrep/scans"
                      className={`sub-nav-link ${isSubPathActive('/semgrep/scans') ? 'active' : ''}`}
                    >
                      <i className="bi bi-search nav-icon"></i>
                      <span className="nav-text">Scans</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/semgrep/findings"
                      className={`sub-nav-link ${isSubPathActive('/semgrep/findings') ? 'active' : ''}`}
                    >
                      <i className="bi bi-exclamation-triangle nav-icon"></i>
                      <span className="nav-text">Findings</span>
                    </Nav.Link>
                  </div>
                </Collapse>
              </div>
              
              {/* OWASP ZAP Section */}
              <div className={`nav-group ${isToolPathActive('/owasp-zap') ? 'active-group' : ''}`}>
                <Nav.Link 
                  onClick={() => toggleToolExpansion('owaspzap')}
                  className={`nav-item-link nav-group-header ${isToolPathActive('/owasp-zap') ? 'active' : ''}`}
                >
                  <div className="nav-item-content">
                    <img src={zapLogo} alt="OWASP ZAP Logo" className="tool-logo nav-icon" />
                    <span className="nav-text">OWASP ZAP</span>
                  </div>
                  <i className={`bi bi-chevron-${expandedTool === 'owaspzap' ? 'up' : 'down'} nav-expand-icon`}></i>
                </Nav.Link>
                
                <Collapse in={expandedTool === 'owaspzap'}>
                  <div className="nav-group-items">
                    <Nav.Link 
                      as={Link} 
                      to="/owasp-zap/scans"
                      className={`sub-nav-link ${isSubPathActive('/owasp-zap/scans') ? 'active' : ''}`}
                    >
                      <i className="bi bi-search nav-icon"></i>
                      <span className="nav-text">Scans</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/owasp-zap/findings"
                      className={`sub-nav-link ${isSubPathActive('/owasp-zap/findings') ? 'active' : ''}`}
                    >
                      <i className="bi bi-exclamation-triangle nav-icon"></i>
                      <span className="nav-text">Findings</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/owasp-zap/reports"
                      className={`sub-nav-link ${isSubPathActive('/owasp-zap/reports') ? 'active' : ''}`}
                    >
                      <i className="bi bi-file-earmark-text nav-icon"></i>
                      <span className="nav-text">Reports</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/owasp-zap/generate-report"
                      className={`sub-nav-link ${isSubPathActive('/owasp-zap/generate-report') ? 'active' : ''}`}
                    >
                      <i className="bi bi-file-earmark-plus nav-icon"></i>
                      <span className="nav-text">Generate Report</span>
                    </Nav.Link>
                  </div>
                </Collapse>
              </div>
              
              {/* Acunetix Section */}
              <div className={`nav-group ${isToolPathActive('/acunetix') ? 'active-group' : ''}`}>
                <Nav.Link 
                  onClick={() => toggleToolExpansion('acunetix')}
                  className={`nav-item-link nav-group-header ${isToolPathActive('/acunetix') ? 'active' : ''}`}
                >
                  <div className="nav-item-content">
                    <img src={acunetixLogo} alt="Acunetix Logo" className="tool-logo nav-icon" />
                    <span className="nav-text">Acunetix</span>
                  </div>
                  <i className={`bi bi-chevron-${expandedTool === 'acunetix' ? 'up' : 'down'} nav-expand-icon`}></i>
                </Nav.Link>
                
                <Collapse in={expandedTool === 'acunetix'}>
                  <div className="nav-group-items">
                    <Nav.Link 
                      as={Link} 
                      to="/acunetix/assets" 
                      className={`sub-nav-link ${isSubPathActive('/acunetix/assets') ? 'active' : ''}`}
                    >
                      <i className="bi bi-box nav-icon"></i>
                      <span className="nav-text">Assets</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/acunetix/scans"
                      className={`sub-nav-link ${isSubPathActive('/acunetix/scans') ? 'active' : ''}`}
                    >
                      <i className="bi bi-search nav-icon"></i>
                      <span className="nav-text">Scans</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/acunetix/findings"
                      className={`sub-nav-link ${isSubPathActive('/acunetix/findings') ? 'active' : ''}`}
                    >
                      <i className="bi bi-exclamation-triangle nav-icon"></i>
                      <span className="nav-text">Findings</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/acunetix/reports"
                      className={`sub-nav-link ${isSubPathActive('/acunetix/reports') ? 'active' : ''}`}
                    >
                      <i className="bi bi-file-earmark-text nav-icon"></i>
                      <span className="nav-text">Reports</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/acunetix/generate-report"
                      className={`sub-nav-link ${isSubPathActive('/acunetix/generate-report') ? 'active' : ''}`}
                    >
                      <i className="bi bi-file-earmark-plus nav-icon"></i>
                      <span className="nav-text">Generate Report</span>
                    </Nav.Link>
                  </div>
                </Collapse>
              </div>
            </Nav>
          </div>
          
          <div className="sidebar-footer">
            <Nav.Link 
              as={Link} 
              to="/settings" 
              className={`nav-item-link ${isSubPathActive('/settings') ? 'active' : ''}`}
            >
              <i className="bi bi-gear nav-icon"></i>
              <span className="nav-text">Settings</span>
            </Nav.Link>
            
            {user && user.role === 'admin' && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/admin" 
                  className={`nav-item-link ${isSubPathActive('/admin') ? 'active' : ''}`}
                >
                  <i className="bi bi-person-badge nav-icon"></i>
                  <span className="nav-text">Admin Panel</span>
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/user-creation" 
                  className={`nav-item-link ${isSubPathActive('/user-creation') ? 'active' : ''}`}
                >
                  <i className="bi bi-person-plus nav-icon"></i>
                  <span className="nav-text">User Creation</span>
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/company-relation" 
                  className={`nav-item-link ${isSubPathActive('/company-relation') ? 'active' : ''}`}
                >
                  <i className="bi bi-diagram-3 nav-icon"></i>
                  <span className="nav-text">Company Relations</span>
                </Nav.Link>
              </>
            )}
            
            <Nav.Link 
              as={Link} 
              to="/help" 
              className={`nav-item-link ${isSubPathActive('/help') ? 'active' : ''}`}
            >
              <i className="bi bi-question-circle nav-icon"></i>
              <span className="nav-text">Help</span>
            </Nav.Link>
            
            <Nav.Link 
              onClick={handleLogout} 
              className="nav-item-link logout-link"
            >
              <i className="bi bi-box-arrow-right nav-icon"></i>
              <span className="nav-text">Logout</span>
            </Nav.Link>
            
            <div className="social-links">
              <a href="https://twitter.com/secman" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="https://youtube.com/secman" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-youtube"></i>
              </a>
              <a href="https://github.com/secman" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-github"></i>
              </a>
            </div>
            
            <div className="app-version">
              <small>v1.0.0</small>
            </div>
          </div>
        </Container>
      </Navbar>
    </>
  );
};

export default NavbarComponent;