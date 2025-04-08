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
  Spinner
} from 'react-bootstrap';
import { FaFileAlt, FaUpload, FaGlobe } from 'react-icons/fa';

const SemgrepGenerateReport = () => {
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
      console.log('Generating report with:', { reportName, urls: urls.split(',').map(url => url.trim()) });
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
      console.log('Generating report for all assets');
      setAlertVariant('success');
      setAlertMessage('A comprehensive report for all assets is being generated. You will be notified when it\'s ready.');
      setShowAlert(true);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Generate Semgrep Report</h1>
        
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
                  Create a new security report by entering a name and the URLs you want to analyze. 
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
                    <h6 className="mb-0">Frontend Security Scan</h6>
                    <small className="text-muted">Generated 2 hours ago</small>
                  </div>
                  <Button variant="outline-primary" size="sm" className="ms-auto">
                    View
                  </Button>
                </div>
                <div className="d-flex align-items-center p-3">
                  <FaFileAlt className="text-primary me-3" size={24} />
                  <div>
                    <h6 className="mb-0">API Security Assessment</h6>
                    <small className="text-muted">Generated yesterday</small>
                  </div>
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
                <h3 className="fs-5 mb-3">About Semgrep Reports</h3>
                <p>
                  Semgrep is a lightweight static analysis tool that helps detect security issues, bugs, and code quality issues in your codebase.
                </p>
                <h5 className="fs-6 mt-4">Report Features:</h5>
                <ul className="ps-3">
                  <li>Code vulnerability detection</li>
                  <li>Security best practice violations</li>
                  <li>Prioritized findings by severity</li>
                  <li>Suggested fixes for issues</li>
                  <li>Custom rule support</li>
                </ul>
                <h5 className="fs-6 mt-4">Report Format:</h5>
                <p>
                  Reports are generated in HTML format for easy viewing and sharing with your team.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SemgrepGenerateReport; 