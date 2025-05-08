import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Table, Spinner, Alert, Badge, Button, Dropdown, Row, Col } from 'react-bootstrap';
import { FaExclamationTriangle, FaInfoCircle, FaSearch, FaFilter, FaRedoAlt } from 'react-icons/fa';
import { semgrepAPI, apiCall } from '../../utils/api';

const SemgrepScans = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [loadingDeployments, setLoadingDeployments] = useState(false);
  const [deploymentError, setDeploymentError] = useState(null);

  const [repositories, setRepositories] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState(null);
  const [scanStats, setScanStats] = useState({
    repoCount: 0,
    completedScans: 0
  });

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        setLoadingDeployments(true);
        setDeploymentError(null);
        
        const response = await apiCall('/semgrep/deployments');
        
        if (!response || !Array.isArray(response.data)) {
          console.error("Invalid API response structure for deployments:", response);
          throw new Error("Received invalid data format from deployments API.");
        }
        
        setDeployments(response.data);
        
        if (response.data.length === 1) {
          setSelectedDeployment(response.data[0]);
          navigate(`?deployment_id=${response.data[0].id}`);
        } else {
          const params = new URLSearchParams(location.search);
          const idFromQuery = params.get('deployment_id');
          
          if (idFromQuery) {
            const matchingDeployment = response.data.find(dep => dep.id === idFromQuery);
            if (matchingDeployment) {
              setSelectedDeployment(matchingDeployment);
            } else {
              setDeploymentError(`Deployment with ID "${idFromQuery}" not found.`);
            }
          }
        }
        
        setLoadingDeployments(false);
      } catch (err) {
        console.error('Error fetching deployments:', err);
        setDeploymentError(err.message || 'Failed to fetch deployments.');
        setLoadingDeployments(false);
      }
    };
    
    fetchDeployments();
  }, [location.search, navigate]);

  useEffect(() => {
    if (!selectedDeployment) {
      setRepositories([]);
      return;
    }
    
    const fetchRepositories = async () => {
      try {
        setLoadingRepos(true);
        setRepoError(null);
        
        const response = await fetch(`http://localhost:4040/api/v1/semgrep/repository?deployment_id=${selectedDeployment.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !Array.isArray(data.data)) {
          throw new Error("Invalid data format from API");
        }
        
        setRepositories(data.data);
        
        const completedScans = data.data.filter(repo => 
          repo.latestScan && repo.latestScan.status === "SCAN_STATUS_COMPLETED"
        ).length;
        
        setScanStats({
          repoCount: data.data.length,
          completedScans: completedScans
        });
        
        setLoadingRepos(false);
      } catch (err) {
        console.error('Error fetching repositories:', err);
        setRepoError(err.message || 'Failed to fetch repositories.');
        setLoadingRepos(false);
      }
    };
    
    fetchRepositories();
  }, [selectedDeployment]);

  const handleSelectDeployment = (deployment) => {
    setSelectedDeployment(deployment);
    navigate(`?deployment_id=${deployment.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleRefresh = () => {
    if (selectedDeployment) {
      setRepositories([]);
      setLoadingRepos(true);
      fetchRepositories();
    }
  };

  // Refactored for better reusability
  const fetchRepositories = async () => {
    if (!selectedDeployment) return;
    
    try {
      setLoadingRepos(true);
      setRepoError(null);
      
      // Using the updated local API endpoint with GET method
      const response = await fetch(`http://localhost:4040/api/v1/semgrep/repository?deployment_id=${selectedDeployment.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data.data)) {
        throw new Error("Invalid data format from API");
      }
      
      setRepositories(data.data);
      
      const completedScans = data.data.filter(repo => 
        repo.latestScan && repo.latestScan.status === "SCAN_STATUS_COMPLETED"
      ).length;
      
      setScanStats({
        repoCount: data.data.length,
        completedScans: completedScans
      });
      
      setLoadingRepos(false);
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setRepoError(err.message || 'Failed to fetch repositories.');
      setLoadingRepos(false);
    }
  };

  const renderDeploymentSelection = () => {
    return (
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Select Deployment</h5>
        </Card.Header>
        <Card.Body>
          {loadingDeployments ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              <span>Loading deployments...</span>
            </div>
          ) : deploymentError ? (
            <Alert variant="danger">{deploymentError}</Alert>
          ) : deployments.length === 0 ? (
            <Alert variant="info">No deployments found. Please configure a Semgrep deployment first.</Alert>
          ) : (
            <>
              <Form.Group>
                <Form.Label>Deployment</Form.Label>
                <Dropdown className="w-100 mb-3">
                  <Dropdown.Toggle variant="outline-primary" className="w-100 d-flex justify-content-between align-items-center">
                    {selectedDeployment ? selectedDeployment.name : 'Select a deployment'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    {deployments.map(deployment => (
                      <Dropdown.Item 
                        key={deployment.id} 
                        onClick={() => handleSelectDeployment(deployment)}
                        active={selectedDeployment?.id === deployment.id}
                      >
                        {deployment.name}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Form.Group>
            </>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderStatsCards = () => {
    return (
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100 bg-primary text-white">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <FaInfoCircle size={24} />
                </div>
                <div>
                  <h6 className="text-white-50 mb-1">Total Repositories</h6>
                  <h2 className="mb-0">{scanStats.repoCount}</h2>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100 bg-success text-white">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <FaInfoCircle size={24} />
                </div>
                <div>
                  <h6 className="text-white-50 mb-1">Completed Scans</h6>
                  <h2 className="mb-0">{scanStats.completedScans}</h2>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h4 className="page-title mb-4">Repository Scans</h4>
        
        {renderDeploymentSelection()}
        
        {selectedDeployment && (
          <>
            {renderStatsCards()}
            
            <Card>
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Repository Scans</h5>
                <Button variant="light" size="sm" onClick={handleRefresh}>
                  <FaRedoAlt className="me-1" /> Refresh
                </Button>
              </Card.Header>
              <Card.Body>
                {loadingRepos ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Loading repositories...</span>
                  </div>
                ) : repoError ? (
                  <Alert variant="danger">{repoError}</Alert>
                ) : repositories.length === 0 ? (
                  <Alert variant="info">No repositories found for this deployment.</Alert>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle">
                      <thead className="bg-light">
                        <tr>
                          <th>Repository</th>
                          <th>URL</th>
                          <th>Last Scan</th>
                          <th>Status</th>
                          <th>Dependencies</th>
                          <th>SCM Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repositories.map(repo => (
                          <tr key={repo.id}>
                            <td>
                              <div className="fw-semibold">{repo.name}</div>
                              <div className="small text-muted">ID: {repo.id}</div>
                            </td>
                            <td className="small text-break">
                              {repo.url ? (
                                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                  {repo.url.replace(/^https?:\/\//, '')}
                                </a>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                            <td className="small">
                              {repo.latestScan ? (
                                formatDate(repo.latestScan.completedAt || repo.latestScan.startedAt)
                              ) : (
                                <span className="text-muted">Never</span>
                              )}
                            </td>
                            <td>
                              {repo.latestScan ? (
                                <Badge 
                                  bg={repo.latestScan.status === "SCAN_STATUS_COMPLETED" ? "success" : 
                                      repo.latestScan.status.includes("ERROR") ? "danger" : "warning"}
                                  className="py-1 px-2"
                                >
                                  {repo.latestScan.status.replace("SCAN_STATUS_", "")}
                                </Badge>
                              ) : (
                                <Badge bg="secondary" className="py-1 px-2">NO SCAN</Badge>
                              )}
                            </td>
                            <td>
                              {repo.scaInfo && repo.scaInfo.dependencyCounts ? (
                                Object.entries(repo.scaInfo.dependencyCounts).map(([file, count], index) => (
                                  <div key={index} className="small">
                                    {file}: <Badge bg="info" className="py-1">{count}</Badge>
                                  </div>
                                ))
                              ) : (
                                <span className="text-muted small">No dependencies</span>
                              )}
                            </td>
                            <td>
                              <Badge 
                                bg="light" 
                                text="dark" 
                                className="border py-1 px-2"
                              >
                                {repo.scmType?.replace("SCM_TYPE_", "") || "UNKNOWN"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </>
        )}
      </Container>
    </div>
  );
};

export default SemgrepScans;