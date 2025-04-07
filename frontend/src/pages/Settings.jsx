import { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import apiCall from '../utils/api';

const Settings = () => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, variant: '', message: '' });
  
  // Form states
  const [companyName, setCompanyName] = useState('Lutenix');
  const [acunetixPort, setAcunetixPort] = useState('3443');
  const [zapPort, setZapPort] = useState('8080');
  const [semgrepApiKey, setSemgrepApiKey] = useState('');
  const [acunetixApiKey, setAcunetixApiKey] = useState('');
  const [zapApiKey, setZapApiKey] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        setIsLoading(false);
      }
    };
    
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAlertInfo({ show: false, variant: '', message: '' });

    try {
      await apiCall('/users/updateScanner', {
        method: 'POST',
        body: JSON.stringify({
          api_key: zapApiKey,
          scanner: 'zap',
          scanner_url: 'https://localhost',
          scanner_port: parseInt(zapPort)
        })
      });

      await apiCall('/users/updateScanner', {
        method: 'POST',
        body: JSON.stringify({
          api_key: acunetixApiKey,
          scanner: 'acunetix',
          scanner_url: 'https://localhost',
          scanner_port: parseInt(acunetixPort)
        })
      });

      await apiCall('/users/updateScanner', {
        method: 'POST',
        body: JSON.stringify({
          api_key: semgrepApiKey,
          scanner: 'semgrep',
          scanner_url: 'https://localhost'
        })
      });

      setAlertInfo({
        show: true,
        variant: 'success',
        message: 'Settings updated successfully!'
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      setAlertInfo({
        show: true,
        variant: 'danger',
        message: 'Failed to update settings. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Company Settings</h1>
        
        {alertInfo.show && (
          <Alert variant={alertInfo.variant} dismissible onClose={() => setAlertInfo({ ...alertInfo, show: false })}>
            {alertInfo.message}
          </Alert>
        )}
        
        <Card className="mb-4">
          <Card.Body className="bg-light">
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col xs={12}>
                  <Form.Group className="mb-4">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Acunetix Port</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={acunetixPort}
                      onChange={(e) => setAcunetixPort(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>ZAP Port</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={zapPort}
                      onChange={(e) => setZapPort(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group className="mb-4">
                    <Form.Label>Semgrep API Key</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={semgrepApiKey}
                      onChange={(e) => setSemgrepApiKey(e.target.value)}
                      placeholder="Enter Semgrep API Key"
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group className="mb-4">
                    <Form.Label>Acunetix API Key</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={acunetixApiKey}
                      onChange={(e) => setAcunetixApiKey(e.target.value)}
                      placeholder="Enter Acunetix API Key"
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group className="mb-4">
                    <Form.Label>ZAP API Key</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={zapApiKey}
                      onChange={(e) => setZapApiKey(e.target.value)}
                      placeholder="Enter ZAP API Key"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end">
                <Button 
                  variant="info" 
                  type="submit" 
                  className="px-4 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Settings; 