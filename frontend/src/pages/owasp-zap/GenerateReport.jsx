import { useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  InputGroup,
  Spinner,
  Badge
} from 'react-bootstrap';
import { FaFileAlt, FaUpload, FaGlobe, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const OwaspZapGenerateReport = () => {
  const [reportName, setReportName] = useState('');
  const [urls, setUrls] = useState('');
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('success');
  const [alertMessage, setAlertMessage] = useState('');

  const handleGenerateReport = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    
    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    setLoading(true);
    
    setTimeout(() => {
      console.log('Generating OWASP ZAP report with:', { reportName, urls: urls.split(',').map(url => url.trim()) });
      setAlertVariant('success');
      setAlertMessage(`Report "${reportName}" is being generated. You will be notified when it's ready.`);
      setShowAlert(true);
      setLoading(false);
      
      setReportName('');
      setUrls('');
      setValidated(false);
    }, 2000);
  };

  const handleGenerateForAll = () => {
    setLoading(true);
    
    setTimeout(() => {
      console.log('Generating OWASP ZAP report for all assets');
      setAlertVariant('success');
      setAlertMessage('A comprehensive report for all assets is being generated. You will be notified when it\'s ready.');
      setShowAlert(true);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Generate OWASP ZAP Report</h1>
        
        {showAlert && (
          <Alert 
            variant={alertVariant} 
            onClose={() => setShowAlert(false)} 
            dismissible
            className="mb-4"
          >
            {alertMessage}
          </Alert>
        )}
        
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h2 className="fs-4 mb-4">Report Generation</h2>
                <p className="text-muted mb-4">
                  Create a new web application security report by entering a name and the URLs you want to analyze. 
                  For multiple URLs, separate them with commas.
                </p>
                
                <Form noValidate validated={validated} onSubmit={handleGenerateReport}>
                  <Form.Group className="mb-4" controlId="reportName">
                    <Form.Label>Report Name:</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaFileAlt />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Enter a descriptive name for your report"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a report name.
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                  
                  <Form.Group className="mb-4" controlId="urls">
                    <Form.Label>URLs:</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaGlobe />
                      </InputGroup.Text>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Enter URLs to scan (separated by commas)"
                        value={urls}
                        onChange={(e) => setUrls(e.target.value)}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide at least one URL.
                      </Form.Control.Feedback>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Example: https://example.com, https://api.example.com
                    </Form.Text>
                  </Form.Group>
                  
                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      size="lg" 
                      type="submit"
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
                          Generating...
                        </>
                      ) : (
                        <>
                          <FaUpload className="me-2" /> Generate Report
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline-primary" 
                      size="lg"
                      onClick={handleGenerateForAll}
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
                          Generating...
                        </>
                      ) : (
                        'Generate Report for All Assets'
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
            
            <Card className="border-0 shadow-sm mt-4">
              <Card.Body className="p-4">
                <h3 className="fs-5 mb-3">Recently Generated Reports</h3>
                <div className="d-flex align-items-center p-3 border-bottom">
                  <FaFileAlt className="text-primary me-3" size={24} />
                  <div>
                    <h6 className="mb-0">Main Website Security Scan</h6>
                    <small className="text-muted">Generated 3 hours ago</small>
                  </div>
                  <Badge bg="danger" className="mx-2">18 issues</Badge>
                  <Button variant="outline-primary" size="sm" className="ms-auto">
                    View
                  </Button>
                </div>
                <div className="d-flex align-items-center p-3">
                  <FaFileAlt className="text-primary me-3" size={24} />
                  <div>
                    <h6 className="mb-0">API Endpoints Security Assessment</h6>
                    <small className="text-muted">Generated yesterday</small>
                  </div>
                  <Badge bg="warning" className="mx-2">7 issues</Badge>
                  <Button variant="outline-primary" size="sm" className="ms-auto">
                    View
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h3 className="fs-5 mb-3">About OWASP ZAP Reports</h3>
                <p>
                  OWASP Zed Attack Proxy (ZAP) is a security tool that helps find vulnerabilities in web applications during the development and testing phase.
                </p>
                <h5 className="fs-6 mt-4">Report Features:</h5>
                <ul className="ps-3">
                  <li>Web vulnerability detection</li>
                  <li>SQL injection testing</li>
                  <li>Cross-site scripting (XSS) detection</li>
                  <li>Security misconfigurations</li>
                  <li>Authentication issues</li>
                </ul>
                <h5 className="fs-6 mt-4">Vulnerability Categories:</h5>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <Badge bg="danger" className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-1" /> Critical
                  </Badge>
                  <Badge bg="danger" className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-1" /> High
                  </Badge>
                  <Badge bg="warning" text="dark" className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-1" /> Medium
                  </Badge>
                  <Badge bg="info" className="d-flex align-items-center">
                    <FaInfoCircle className="me-1" /> Low
                  </Badge>
                  <Badge bg="secondary" className="d-flex align-items-center">
                    <FaInfoCircle className="me-1" /> Information
                  </Badge>
                </div>
              </Card.Body>
            </Card>
            
            <Card className="border-0 shadow-sm mt-4">
              <Card.Body className="p-4">
                <h3 className="fs-5 mb-3">Scanning Tips</h3>
                <ul className="ps-3">
                  <li>Ensure the application is in a test environment</li>
                  <li>Include authentication flows in your scope</li>
                  <li>Run both automated and manual scans for best results</li>
                  <li>Review and validate findings before sharing reports</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default OwaspZapGenerateReport; 