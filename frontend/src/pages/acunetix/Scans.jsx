import { useState, useEffect, useRef } from 'react';
import { Container, Card, Alert, Badge, Spinner, Modal, Button, Form, ListGroup } from 'react-bootstrap';
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
  const [targets, setTargets] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const fetchTargets = async () => {
    setLoadingTargets(true);
    setAlertMessage(null);
    
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      
      // Fetch targets from the Acunetix targets API
      const response = await fetch('http://localhost:4040/api/v1/acunetix/targets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Handle 401 unauthorized error
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        setAlertType('danger');
        setAlertMessage('Authentication failed. Please log in again.');
        setLoadingTargets(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Targets API request failed with status ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Transform the targets data as needed
      if (responseData.data && responseData.data.targets) {
        setTargets(responseData.data.targets);
      } else {
        setTargets([]);
        setAlertType('warning');
        setAlertMessage('No targets available. Please add targets in the Assets section first.');
      }
    } catch (err) {
      setAlertType('danger');
      setAlertMessage('Failed to fetch targets. Please try again.');
      console.error('Error fetching targets:', err);
    } finally {
      setLoadingTargets(false);
    }
  };

  const handleStartScan = () => {
    setShowModal(true);
    setSelectedTargets([]);
    fetchTargets();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTargets([]);
    setAlertMessage(null);
  };

  const handleTargetSelection = (targetId) => {
    setSelectedTargets(prevSelected => {
      if (prevSelected.includes(targetId)) {
        return prevSelected.filter(id => id !== targetId);
      } else {
        return [...prevSelected, targetId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTargets.length === targets.length) {
      setSelectedTargets([]);
    } else {
      setSelectedTargets(targets.map(target => target.target_id));
    }
  };

  const handleSubmitScan = async () => {
    if (selectedTargets.length === 0) {
      setAlertType('danger');
      setAlertMessage('Please select at least one target to scan');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      const scan_urls = selectedTargets.map(targetId => {
        const target = targets.find(t => t.target_id === targetId);
        return target ? target.address : null;
      }).filter(url => url);
      
      const response = await fetch('http://localhost:4040/api/v1/acunetix/startScan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ scan_urls })
      });
      
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

  const handleDeleteScan = async (selectedScanIds) => {
    if (window.confirm(`Are you sure you want to delete ${selectedScanIds.length} scan(s)?`)) {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('auth_token');
        
        const scan_urls = selectedScanIds.map(scanId => {
          const scan = scanData.find(s => s.id === scanId);
          return scan ? scan.target : null;
        }).filter(url => url);
        
        const response = await fetch('http://localhost:4040/api/v1/acunetix/scans/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ scan_urls })
        });
        
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          setError('Authentication failed. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        setScanData(scanData.filter(scan => !selectedScanIds.includes(scan.id)));
        
        setAlertType('success');
        setAlertMessage(`Successfully deleted ${selectedScanIds.length} scan(s)`);
        
        // Refresh data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } catch (err) {
        setError(`Failed to delete scan(s): ${err.message}`);
        console.error('Error deleting scans:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStopScan = async (selectedScanIds) => {
    if (window.confirm(`Are you sure you want to stop ${selectedScanIds.length} scan(s)?`)) {
      try {
        setIsLoading(true);
        setError(null);
        setAlertMessage(null);
        
        const token = localStorage.getItem('auth_token');
        
        const scan_urls = selectedScanIds.map(scanId => {
          const scan = scanData.find(s => s.id === scanId);
          return scan ? scan.target : null;
        }).filter(url => url);
        
        const response = await fetch('http://localhost:4040/api/v1/acunetix/scans/abort', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ scan_urls })
        });
        
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          setError('Authentication failed. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        // Update scan status in the UI
        setScanData(prevData => 
          prevData.map(scan => 
            selectedScanIds.includes(scan.id) 
              ? { ...scan, status: 'aborted', progress: 100 } 
              : scan
          )
        );
        
        setAlertType('success');
        setAlertMessage(`Successfully stopped ${selectedScanIds.length} scan(s)`);
        
        // Refresh data to get updated scan statuses
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } catch (err) {
        setError(`Failed to stop scan(s): ${err.message}`);
        console.error('Error stopping scans:', err);
      } finally {
        setIsLoading(false);
      }
    }
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
            
            {loadingTargets ? (
              <div className="text-center my-4">
                <Spinner animation="border" role="status" variant="primary">
                  <span className="visually-hidden">Loading targets...</span>
                </Spinner>
                <p className="mt-2">Loading available targets...</p>
              </div>
            ) : targets.length > 0 ? (
              <>
                <div className="d-flex justify-content-between mb-2">
                  <h5>Select Targets to Scan</h5>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedTargets.length === targets.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="border rounded p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <ListGroup>
                    {targets.map((target) => (
                      <ListGroup.Item 
                        key={target.target_id}
                        className="d-flex justify-content-between align-items-center"
                        action
                        active={selectedTargets.includes(target.target_id)}
                        onClick={() => handleTargetSelection(target.target_id)}
                      >
                        <div>
                          <div><strong>{target.address}</strong></div>
                          {target.description && (
                            <small className="text-muted">{target.description}</small>
                          )}
                        </div>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedTargets.includes(target.target_id)}
                          onChange={() => {}} // Handled by the ListGroup.Item onClick
                          onClick={(e) => e.stopPropagation()}
                        />
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
                <div className="mt-2 text-end">
                  <small className="text-muted">
                    Selected {selectedTargets.length} of {targets.length} targets
                  </small>
                </div>
              </>
            ) : alertMessage ? null : (
              <div className="text-center my-4">
                <p>No targets available. Please add targets in the Assets section first.</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmitScan}
              disabled={isSubmitting || selectedTargets.length === 0}
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