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
  Badge,
  ProgressBar
} from 'react-bootstrap';
import { FaFileAlt, FaUpload, FaGlobe, FaInfoCircle, FaExclamationTriangle, FaCheck, FaServer } from 'react-icons/fa';

const AcunetixGenerateReport = () => {
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
    
    // Mock API call - in a real app this would call an actual API
    setTimeout(() => {
      console.log('Generating Acunetix report with:', { reportName, urls: urls.split(',').map(url => url.trim()) });
      setAlertVariant('success');
      setAlertMessage(`Report "${reportName}" is being generated. You will be notified when it's ready.`);
      setShowAlert(true);
      setLoading(false);
      
      // Reset form after successful submission
      setReportName('');
      setUrls('');
      setValidated(false);
    }, 2000);
  };

  const handleGenerateForAll = () => {
    setLoading(true);
    
    // Mock API call for generating report for all assets
    setTimeout(() => {
      console.log('Generating Acunetix report for all assets');
      setAlertVariant('success');
      setAlertMessage('A comprehensive report for all assets is being generated. You will be notified when it\'s ready.');
      setShowAlert(true);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Generate Acunetix Report</h1>
        
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
                  Create a new comprehensive web vulnerability assessment report by entering a name and the URLs you want to analyze. 
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
                  <div className="flex-grow-1">
                    <h6 className="mb-0">Comprehensive Security Scan</h6>
                    <small className="text-muted">Generated 1 hour ago</small>
                  </div>
                  <Badge bg="danger" className="me-2">24 issues</Badge>
                  <Button variant="outline-primary" size="sm">
                    View
                  </Button>
                </div>
                <div className="d-flex align-items-center p-3 border-bottom">
                  <FaFileAlt className="text-primary me-3" size={24} />
                  <div className="flex-grow-1">
                    <h6 className="mb-0">Customer Portal Security Report</h6>
                    <small className="text-muted">Generated 5 hours ago</small>
                  </div>
                  <Badge bg="warning" className="me-2">15 issues</Badge>
                  <Button variant="outline-primary" size="sm">
                    View
                  </Button>
                </div>
                <div className="d-flex align-items-center p-3">
                  <FaFileAlt className="text-primary me-3" size={24} />
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center">
                      <h6 className="mb-0 me-2">Partner API Report</h6>
                      <Badge bg="info">In Progress</Badge>
                    </div>
                    <small className="text-muted">Started 10 minutes ago</small>
                    <ProgressBar now={60} className="mt-2" style={{ height: '6px' }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h3 className="fs-5 mb-3">About Acunetix Reports</h3>
                <p>
                  Acunetix is an automated web vulnerability scanner that detects and reports on over 7,000 web application vulnerabilities including all variants of SQL Injection and XSS.
                </p>
                <h5 className="fs-6 mt-4">Report Features:</h5>
                <ul className="ps-3">
                  <li>Comprehensive vulnerability detection</li>
                  <li>False positive verification</li>
                  <li>OWASP Top 10 coverage</li>
                  <li>Detailed remediation instructions</li>
                  <li>Executive and technical summaries</li>
                </ul>
                <h5 className="fs-6 mt-4">Report Format Options:</h5>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <Badge bg="primary" className="d-flex align-items-center">
                    <FaFileAlt className="me-1" /> HTML
                  </Badge>
                  <Badge bg="secondary" className="d-flex align-items-center">
                    <FaFileAlt className="me-1" /> PDF
                  </Badge>
                  <Badge bg="info" className="d-flex align-items-center">
                    <FaFileAlt className="me-1" /> CSV
                  </Badge>
                  <Badge bg="success" className="d-flex align-items-center">
                    <FaFileAlt className="me-1" /> XML
                  </Badge>
                </div>
              </Card.Body>
            </Card>
            
            <Card className="border-0 shadow-sm mt-4">
              <Card.Body className="p-4">
                <h3 className="fs-5 mb-3">Scan Status</h3>
                <div className="d-flex align-items-center mb-3">
                  <FaServer className="text-primary me-3" size={18} />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <span>Scanner Status:</span>
                      <Badge bg="success" className="d-flex align-items-center">
                        <FaCheck className="me-1" /> Ready
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <FaServer className="text-primary me-3" size={18} />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <span>Active Scans:</span>
                      <span className="fw-bold">1</span>
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <FaServer className="text-primary me-3" size={18} />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <span>Queued Scans:</span>
                      <span className="fw-bold">0</span>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AcunetixGenerateReport; 