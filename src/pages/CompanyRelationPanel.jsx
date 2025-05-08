import { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert,
  Spinner
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiCall from '../utils/api';

const CompanyRelationPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [companyName, setCompanyName] = useState('');
  const [companyLoading, setCompanyLoading] = useState(false);
  
  const [userCompanyName, setUserCompanyName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  
  const [alert, setAlert] = useState({ show: false, variant: '', message: '', section: '' });
  
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      showAlertMessage('danger', 'Company name is required', 'company');
      return;
    }
    
    setCompanyLoading(true);
    
    try {
      const response = await apiCall('/admin/createCompany', {
        method: 'POST',
        body: JSON.stringify({
          company_name: companyName
        })
      });
      
      showAlertMessage('success', `Company "${companyName}" created successfully`, 'company');
      setCompanyName('');
    } catch (error) {
      console.error('Error creating company:', error);
      showAlertMessage('danger', 'Failed to create company. Please try again.', 'company');
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleAddUserToCompany = async (e) => {
    e.preventDefault();
    
    if (!userCompanyName.trim()) {
      showAlertMessage('danger', 'Company name is required', 'user');
      return;
    }
    
    if (!userEmail.trim()) {
      showAlertMessage('danger', 'User email is required', 'user');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      showAlertMessage('danger', 'Please enter a valid email address', 'user');
      return;
    }
    
    setUserLoading(true);
    
    try {
      // Endpoint for adding user to company
      await apiCall('/admin/addCompanyUser', {
        method: 'POST',
        body: JSON.stringify({
          email: userEmail,
          company_name: userCompanyName
        })
      });
      
      showAlertMessage('success', `User ${userEmail} added to company "${userCompanyName}" successfully`, 'user');
      
      setUserCompanyName('');
      setUserEmail('');
    } catch (error) {
      console.error('Error adding user to company:', error);
      showAlertMessage('danger', 'Failed to add user to company. Please try again.', 'user');
    } finally {
      setUserLoading(false);
    }
  };

  const showAlertMessage = (variant, message, section) => {
    setAlert({
      show: true,
      variant,
      message,
      section
    });
    
    if (variant === 'success') {
      setTimeout(() => {
        setAlert(prev => ({
          ...prev,
          show: prev.section === section ? false : prev.show
        }));
      }, 4000);
    }
  };

  return (
    <div className="page-content admin-panel">
      <Container fluid>
        <div className="admin-panel-header text-center">
          <h1 className="mb-0">Company Relation Panel</h1>
        </div>
        
        <Row className="justify-content-center relation-panel-container">
          {/* Company Creation Form */}
          <Col lg={6} className="mb-4 mb-lg-0">
            <Card className="border-0 shadow-sm relation-form">
              <Card.Body className="p-4 company-creation-form">
                {alert.show && alert.section === 'company' && (
                  <Alert 
                    variant={alert.variant} 
                    onClose={() => setAlert(prev => ({ ...prev, show: false }))} 
                    dismissible={alert.variant !== 'success'}
                    className="mb-4"
                  >
                    {alert.message}
                  </Alert>
                )}
                
                <Form onSubmit={handleCreateCompany}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name"
                      className="form-control-lg"
                      disabled={companyLoading}
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end mt-4">
                    <Button 
                      variant="info" 
                      type="submit" 
                      size="lg"
                      className="text-white px-4"
                      disabled={companyLoading}
                    >
                      {companyLoading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Creating...
                        </>
                      ) : (
                        'Create Company'
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          
          {/* User to Company Form */}
          <Col lg={6}>
            <Card className="border-0 shadow-sm relation-form">
              <Card.Body className="p-4 company-creation-form">
                {alert.show && alert.section === 'user' && (
                  <Alert 
                    variant={alert.variant} 
                    onClose={() => setAlert(prev => ({ ...prev, show: false }))} 
                    dismissible={alert.variant !== 'success'}
                    className="mb-4"
                  >
                    {alert.message}
                  </Alert>
                )}
                
                <Form onSubmit={handleAddUserToCompany}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={userCompanyName}
                      onChange={(e) => setUserCompanyName(e.target.value)}
                      placeholder="Enter company name"
                      className="form-control-lg"
                      disabled={userLoading}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">User Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Enter user email"
                      className="form-control-lg"
                      disabled={userLoading}
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end mt-4">
                    <Button 
                      variant="info" 
                      type="submit" 
                      size="lg"
                      className="text-white px-4"
                      disabled={userLoading}
                    >
                      {userLoading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Adding...
                        </>
                      ) : (
                        'Add User'
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CompanyRelationPanel;