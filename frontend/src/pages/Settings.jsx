import { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import apiCall from '../utils/api';

const Settings = () => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, variant: '', message: '' });
  
  // Form states
  const [scanner, setScanner] = useState('zap');
  const [scannerUrl, setScannerUrl] = useState('https://localhost');
  const [scannerPort, setScannerPort] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        // Fetch settings implementation would go here
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        setIsLoading(false);
      }
    };
    
    // Uncomment to fetch settings on component mount
    // fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAlertInfo({ show: false, variant: '', message: '' });

    try {
      const requestBody = {
        api_key: apiKey,
        scanner: scanner,
        scanner_url: scannerUrl,
        scanner_port: scannerPort ? parseInt(scannerPort) : undefined
      };

      await apiCall('/users/updateScanner', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      setAlertInfo({
        show: true,
        variant: 'success',
        message: 'Scanner settings updated successfully!'
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
        <h1 className="mb-4">Scanner Settings</h1>
        
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
                    <Form.Label>Scanner</Form.Label>
                    <Form.Select
                      value={scanner}
                      onChange={(e) => setScanner(e.target.value)}
                    >
                      <option value="zap">ZAP</option>
                      <option value="acunetix">Acunetix</option>
                      <option value="semgrep">Semgrep</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Scanner URL</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={scannerUrl}
                      onChange={(e) => setScannerUrl(e.target.value)}
                      placeholder="Enter Scanner URL"
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Scanner Port</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={scannerPort}
                      onChange={(e) => setScannerPort(e.target.value)}
                      placeholder="Enter Scanner Port"
                    />
                    <Form.Text className="text-muted">
                      Leave empty for Semgrep
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group className="mb-4">
                    <Form.Label>API Key</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter API Key"
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