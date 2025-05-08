import { useState, useEffect, useRef } from 'react';
import { Container, Card, Modal, Form, Button, Alert } from 'react-bootstrap';
import ScanTable from '../../components/ScanTable';

const OwaspZapScans = () => {
  const [scanData, setScanData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanStats, setScanStats] = useState({
    scannedAssets: 0,
    vulnerabilities: 0
  });
  
  const [showModal, setShowModal] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [urlList, setUrlList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('success');
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) {
           throw new Error('No authentication token found. Please log in.');
        }
        const response = await fetch('http://localhost:4040/api/v1/zap/scans', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });
  
        if (response.status === 401) {
          console.error('Authentication failed (401). Token might be expired.');
          localStorage.removeItem('authToken');
          history.push('/login');
          throw new Error('Authentication failed. Please log in again.');
        }
  
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
  
        const responseData = await response.json();
  
        if (!responseData || !responseData.data || !Array.isArray(responseData.data.scans)) {
          console.error("Unexpected API response structure:", responseData);
          throw new Error("Received invalid data format from the server.");
        }
  
        const formattedData = responseData.data.scans.map(scan => {
          const createdDate = new Date(scan.createdAt);
          const formattedDate = createdDate.toLocaleString('sv-SE', { 
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
  
          return {
            id: scan.id,
            target: scan.target,
            status: scan.status,
            createdAt: formattedDate
          };
        });
  
        setScanData(formattedData);
  
        const totalAssets = formattedData.length;
        setScanStats({
          scannedAssets: totalAssets,
          vulnerabilities: 0
        });
  
        setError(null);
        setIsLoading(false);
      } catch (err) {
        setError(`Failed to fetch scan data: ${err.message}`);
        setIsLoading(false);
        console.error('Error fetching scan data:', err);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartScan = () => {
    setShowModal(true);
  };

  const handleDeleteScan = async (selectedScanIds) => {
    if (window.confirm(`Are you sure you want to delete ${selectedScanIds.length} scan(s)?`)) {
      try {
        const selectedScans = scanData.filter(scan => selectedScanIds.includes(scan.id));
        const targetUrls = selectedScans.map(scan => scan.target);
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }
        
        const response = await fetch('http://localhost:4040/api/v1/zap/deleteScans', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scan_url: targetUrls
          })
        });

        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          throw new Error('Authentication failed. Please log in again.');
        }

        if (!response.ok) {
          throw new Error(`Delete request failed with status ${response.status}`);
        }

        // Update local state after successful API call
        setScanData(scanData.filter(scan => !selectedScanIds.includes(scan.id)));
        alert(`Deleted ${selectedScanIds.length} scan(s) successfully`);
        
      } catch (error) {
        console.error('Error deleting scans:', error);
        alert(`Failed to delete scans: ${error.message}`);
      }
    }
  };

  const handleStopScan = (selectedScanIds) => {
    alert(`Stopped ${selectedScanIds.length} scan(s)`);
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
    if (targetUrl.trim() && !urlList.includes(targetUrl.trim())) {
      setUrlList([...urlList, targetUrl.trim()]);
      setTargetUrl('');
    }
  };

  const handleRemoveUrl = (url) => {
    setUrlList(urlList.filter(item => item !== url));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const urls = content.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !urlList.includes(line));
      
      if (urls.length > 0) {
        setUrlList([...urlList, ...urls]);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmitScan = async () => {
    const urlsToScan = targetUrl.trim() 
      ? [...urlList, targetUrl.trim()] 
      : [...urlList];
    
    if (urlsToScan.length === 0) {
      setAlertMessage('Please add at least one URL to scan');
      setAlertType('danger');
      return;
    }

    setIsSubmitting(true);
    setAlertMessage(null);

    try {
      for (const url of urlsToScan) {
        const token = localStorage.getItem('auth_token');
        if (!token) {
           throw new Error('No authentication token found. Please log in.');
        }
        await fetch('http://localhost:4040/api/v1/zap/scans', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target_url: url
          })
        });
      }
      
      setAlertMessage(`Successfully initiated scan for ${urlsToScan.length} URL(s)`);
      setAlertType('success');
      
      setTargetUrl('');
      setUrlList([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      await fetchData();
      
    } catch (error) {
      console.error('Error starting scan:', error);
      setAlertMessage('Failed to start scan. Please try again.');
      setAlertType('danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Card className="mb-4 bg-secondary text-white">
          <Card.Body>
            <div className="d-flex justify-content-between">
              <div>
                <h2>Scanned Asset: {scanStats.scannedAssets}</h2>
                <h2>Vulnerabilities: {scanStats.vulnerabilities}</h2>
              </div>
            </div>
          </Card.Body>
        </Card>
        
        {isLoading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading scan data...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <ScanTable
            title="OWASP ZAP Scans"
            data={scanData}
            onStartScan={handleStartScan}
            onDeleteScan={handleDeleteScan}
            onStopScan={handleStopScan}
          />
        )}
        
        {/* Scan Modal */}
        <Modal show={showModal} onHide={handleCloseModal} backdrop="static" size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Start New OWASP ZAP Scan</Modal.Title>
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

export default OwaspZapScans;