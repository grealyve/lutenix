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

const CompanyCreationPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });
  
  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showAlertMessage('danger', 'Company name is required');
      return false;
    }
    if (!formData.email.trim()) {
      showAlertMessage('danger', 'Email address is required');
      return false;
    }
    if (!formData.password.trim()) {
      showAlertMessage('danger', 'Password is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlertMessage('danger', 'Please enter a valid email address');
      return false;
    }
    
    if (formData.password.length < 8) {
      showAlertMessage('danger', 'Password must be at least 8 characters long');
      return false;
    }
    
    return true;
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showAlertMessage('success', `Company "${formData.name}" created successfully`);
      
      setFormData({
        name: '',
        email: '',
        password: ''
      });
    } catch (error) {
      console.error('Error creating company:', error);
      showAlertMessage('danger', 'Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showAlertMessage = (variant, message) => {
    setAlert({
      show: true,
      variant,
      message
    });
    
    if (variant === 'success') {
      setTimeout(() => {
        setAlert({ show: false, variant: '', message: '' });
      }, 5000);
    }
  };

  return (
    <div className="page-content admin-panel">
      <Container fluid>
        <div className="admin-panel-header text-center">
          <h1 className="mb-0">Company Creation Panel</h1>
        </div>
        
        {/* Alert */}
        {alert.show && (
          <Alert 
            variant={alert.variant} 
            onClose={() => setAlert({ show: false })} 
            dismissible={alert.variant !== 'success'}
          >
            {alert.message}
          </Alert>
        )}
        
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="border-0 shadow-sm company-creation-card">
              <Card.Body className="p-4 p-md-5 company-creation-form">
                <Form onSubmit={handleCreateCompany}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      className="form-control-lg"
                      disabled={loading}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Mail Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      className="form-control-lg"
                      disabled={loading}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password"
                      className="form-control-lg"
                      disabled={loading}
                    />
                  </Form.Group>
                  
                  <div className="d-grid gap-2 mt-5">
                    <Button 
                      variant="info" 
                      type="submit" 
                      size="lg"
                      className="text-white"
                      disabled={loading}
                    >
                      {loading ? (
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
                        'Create User'
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

export default CompanyCreationPanel; 