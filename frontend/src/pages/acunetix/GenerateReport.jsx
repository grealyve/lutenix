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

  const generateReport = async (title, sites) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      
      const response = await fetch('http://localhost:4040/api/v1/acunetix/generateReport', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          scan_urls: sites
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          throw new Error('Authentication expired. Please log in again.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      setAlertVariant('success');
      setAlertMessage(`${data.message || 'Report generation started successfully'}. ${data.report_path ? `Report path: ${data.report_path}` : ''}`);
      setShowAlert(true);
      
      if (title === reportName) {
        setReportName('');
        setUrls('');
        setValidated(false);
      }
      
      return data;
    } catch (error) {
      console.error('Error generating report:', error);
      setAlertVariant('danger');
      setAlertMessage(error.message || 'Failed to generate report. Please try again.');
      setShowAlert(true);
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    
    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    setLoading(true);
    
    // Parse URLs from comma-separated string to array
    const sitesArray = urls.split(',').map(url => url.trim()).filter(url => url);
    
    try {
      await generateReport(reportName, sitesArray);
    } catch (error) {
      // Error is already handled in generateReport
    }
  };

  const handleGenerateForAll = async () => {
    setLoading(true);
    
    try {
      await generateReport('Comprehensive Security Scan', []);
    } catch (error) {
      // Error is already handled in generateReport
    }
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
                  </div>
                </Form>
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
                <h5 className="fs-6 mt-4">Report Format Options:</h5>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <Badge bg="primary" className="d-flex align-items-center">
                    <FaFileAlt className="me-1" /> HTML
                  </Badge>
                  <Badge bg="secondary" className="d-flex align-items-center">
                    <FaFileAlt className="me-1" /> PDF
                  </Badge>
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