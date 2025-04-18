import { useState, useEffect, useRef } from 'react';
import { Container, Card, Alert, Badge, Spinner, Modal, Button, Form } from 'react-bootstrap';
import ScanTable from '../../components/ScanTable';

const AcunetixScans = () => {
  const [scanData, setScanData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanStats, setScanStats] = useState({
    scannedAssets: 0,
    vulnerabilities: 0
  });
  
  // Modal state variables
  const [showModal, setShowModal] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [urlList, setUrlList] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get auth token from localStorage
        const token = localStorage.getItem('auth_token');
        
        // Make API request with Bearer token
        const response = await fetch('http://localhost:4040/api/v1/acunetix/scans', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Handle 401 unauthorized error
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          setError('Authentication failed. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const responseData = await response.json();
        
        const transformedData = responseData.data.scans.map((scan, index) => {
          return {
            id: scan.scan_id,
            target: scan.target.address,
            critical: scan.current_session.severity_counts.critical || 0,
            high: scan.current_session.severity_counts.high || 0,
            medium: scan.current_session.severity_counts.medium || 0,
            low: scan.current_session.severity_counts.low || 0,
            information: scan.current_session.severity_counts.info || 0,
            status: scan.current_session.status,
            progress: scan.current_session.progress,
            profileName: scan.profile_name,
            createdAt: new Date(scan.current_session.start_date).toLocaleString()
          };
        });
        
        setScanData(transformedData);
        
        const totalAssets = responseData.data.pagination.count;
        const totalVulnerabilities = transformedData.reduce((acc, scan) => 
          acc + scan.critical + scan.high + scan.medium + scan.low + scan.information, 0);
          
        setScanStats({
          scannedAssets: totalAssets,
          vulnerabilities: totalVulnerabilities
        });
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch scan data');
        setIsLoading(false);
        console.error('Error fetching scan data:', err);
      }
    };
    
    fetchData();
  }, []);

  const handleStartScan = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTargetUrl('');
    setUrlList([]);
    setAlertMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    if (!targetUrl.trim()) return;
    
    // Simple URL validation
    try {
      new URL(targetUrl);
      
      // Check if URL already exists in the list
      if (urlList.includes(targetUrl)) {
        setAlertType('warning');
        setAlertMessage('This URL is already in the list');
        return;
      }
      
      setUrlList([...urlList, targetUrl]);
      setTargetUrl('');
      setAlertMessage(null);
    } catch (e) {
      setAlertType('danger');
      setAlertMessage('Please enter a valid URL (e.g., https://example.com)');
    }
  };

  const handleRemoveUrl = (urlToRemove) => {
    setUrlList(urlList.filter(url => url !== urlToRemove));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'text/plain') {
      setAlertType('danger');
      setAlertMessage('Please upload a valid .txt file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);
      
      // Validate URLs
      const validUrls = [];
      const invalidUrls = [];
      
      lines.forEach(line => {
        try {
          new URL(line);
          if (!urlList.includes(line) && !validUrls.includes(line)) {
            validUrls.push(line);
          }
        } catch (e) {
          invalidUrls.push(line);
        }
      });
      
      if (invalidUrls.length > 0) {
        setAlertType('warning');
        setAlertMessage(`Added ${validUrls.length} URLs. ${invalidUrls.length} invalid URLs were skipped.`);
      } else if (validUrls.length === 0) {
        setAlertType('warning');
        setAlertMessage('No new valid URLs found in the file');
      } else {
        setAlertType('success');
        setAlertMessage(`Successfully added ${validUrls.length} URLs from the file`);
      }
      
      if (validUrls.length > 0) {
        setUrlList([...urlList, ...validUrls]);
      }
    };
    
    reader.readAsText(file);
  };

  const handleSubmitScan = async () => {
    // Combine current targetUrl (if not empty) with urlList
    const urlsToScan = [...urlList];
    if (targetUrl.trim() && !urlList.includes(targetUrl)) {
      try {
        new URL(targetUrl);
        urlsToScan.push(targetUrl);
      } catch (e) {
        setAlertType('danger');
        setAlertMessage('Please enter a valid URL before starting the scan');
        return;
      }
    }
    
    if (urlsToScan.length === 0) {
      setAlertType('danger');
      setAlertMessage('Please add at least one URL to scan');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      
      // Make API request with Bearer token
      const response = await fetch('http://localhost:4040/api/v1/acunetix/startScan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targets: urlsToScan })
      });
      
      // Handle 401 unauthorized error
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        setAlertType('danger');
        setAlertMessage('Authentication failed. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const responseData = await response.json();
      
      setAlertType('success');
      setAlertMessage('Scan started successfully!');
      
      // Refresh scan data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err) {
      setAlertType('danger');
      setAlertMessage('Failed to start scan. Please try again.');
      console.error('Error starting scan:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScan = (selectedScanIds) => {
    if (window.confirm(`Are you sure you want to delete ${selectedScanIds.length} scan(s)?`)) {
      setScanData(scanData.filter(scan => !selectedScanIds.includes(scan.id)));
      alert(`Deleted ${selectedScanIds.length} scan(s)`);
    }
  };

  const handleStopScan = (selectedScanIds) => {
    alert(`Stopped ${selectedScanIds.length} scan(s)`);
  };

  return (
    <div className="page-content">
      <Container fluid>
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        
        <Card className="mb-4 bg-secondary text-white">
          <Card.Body>
            <div className="d-flex justify-content-between">
              <div>
                <h2>Scanned Assets <Badge bg="info" pill>{scanStats.scannedAssets}</Badge></h2>
                <h2>Vulnerabilities <Badge bg="danger" pill>{scanStats.vulnerabilities}</Badge></h2>
              </div>
            </div>
          </Card.Body>
        </Card>
        
        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading scan data...</p>
          </div>
        ) : (
          <ScanTable
            title="Acunetix Scans"
            data={scanData}
            onStartScan={handleStartScan}
            onDeleteScan={handleDeleteScan}
            onStopScan={handleStopScan}
          />
        )}

        {/* Scan Modal */}
        <Modal show={showModal} onHide={handleCloseModal} backdrop="static" size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Start New Acunetix Scan</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {alertMessage && (
              <Alert variant={alertType} onClose={() => setAlertMessage(null)} dismissible>
                {alertMessage}
              </Alert>
            )}
            
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Target URL</Form.Label>
                <div className="d-flex">
                  <Form.Control 
                    type="url" 
                    placeholder="https://example.com" 
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                  />
                  <Button 
                    variant="primary" 
                    className="ms-2" 
                    onClick={handleAddUrl}
                    disabled={!targetUrl.trim()}
                  >
                    Add
                  </Button>
                </div>
                <Form.Text className="text-muted">
                  Enter a URL to scan or add multiple URLs
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Upload URL List</Form.Label>
                <Form.Control 
                  type="file" 
                  accept=".txt"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
                <Form.Text className="text-muted">
                  Upload a .txt file with one URL per line
                </Form.Text>
              </Form.Group>
              
              {urlList.length > 0 && (
                <div className="mb-3">
                  <Form.Label>URLs to scan ({urlList.length})</Form.Label>
                  <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {urlList.map((url, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-1 p-1 bg-light rounded">
                        <span>{url}</span>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleRemoveUrl(url)}
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmitScan}
              disabled={isSubmitting || (urlList.length === 0 && !targetUrl.trim())}
            >
              {isSubmitting ? 'Starting...' : 'Start Scan'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default AcunetixScans;