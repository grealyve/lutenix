import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Table, Badge, Button, Pagination, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaSearch, FaFilter, FaExclamationTriangle, FaInfoCircle, FaEye, FaTrash, FaFileDownload, FaPlay, FaExternalLinkAlt, FaTag, FaShieldAlt } from 'react-icons/fa';

const AcunetixFindings = () => {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVulnerabilities, setSelectedVulnerabilities] = useState([]);
  
  const itemsPerPage = 10;
  
  const severityMap = {
    3: { level: 'Critical', color: 'danger', icon: <FaExclamationTriangle /> },
    2: { level: 'High', color: 'danger', icon: <FaExclamationTriangle /> },
    1: { level: 'Medium', color: 'warning', icon: <FaExclamationTriangle /> },
    0: { level: 'Low', color: 'info', icon: <FaInfoCircle /> }
  };
  
  const [summary, setSummary] = useState({
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        const response = await fetch('http://localhost:4040/api/v1/acunetix/vulnerabilities', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            throw new Error('Authentication failed. Please log in again.');
          }
          throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result && result.data && Array.isArray(result.data.vulnerabilities)) {
          setVulnerabilities(result.data.vulnerabilities);
          
          // Calculate summary by severity
          const summaryData = result.data.vulnerabilities.reduce((acc, vuln) => {
            const severityLevel = severityMap[vuln.severity]?.level || 'Low';
            acc[severityLevel] = (acc[severityLevel] || 0) + 1;
            return acc;
          }, {
            Critical: 0,
            High: 0,
            Medium: 0,
            Low: 0
          });
          
          setSummary(summaryData);
        } else {
          throw new Error('Invalid API response format');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching vulnerabilities:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    let results = vulnerabilities;
    
    // Apply search term
    if (searchTerm) {
      results = results.filter(vuln =>
        (vuln.vt_name && vuln.vt_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vuln.affects_url && vuln.affects_url.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vuln.tags && vuln.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    
    if (filterSeverity !== 'All') {
      const severityValue = Object.keys(severityMap).find(
        key => severityMap[key].level === filterSeverity
      );
      if (severityValue) {
        results = results.filter(vuln => vuln.severity === Number(severityValue));
      }
    }
    
    // Apply status filter
    if (filterStatus !== 'All') {
      results = results.filter(vuln => 
        vuln.status && vuln.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }
    
    setFilteredVulnerabilities(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [vulnerabilities, searchTerm, filterSeverity, filterStatus]);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVulnerabilities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVulnerabilities.length / itemsPerPage);
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const toggleVulnerabilitySelection = (id) => {
    setSelectedVulnerabilities(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(item => item !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };
  
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const currentIds = currentItems.map(item => item.vuln_id);
      setSelectedVulnerabilities(prev => [...new Set([...prev, ...currentIds])]);
    } else {
      const currentIds = currentItems.map(item => item.vuln_id);
      setSelectedVulnerabilities(prev => prev.filter(id => !currentIds.includes(id)));
    }
  };
  
  const renderPaginationItems = () => {
    const items = [];
    
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
        disabled={currentPage === 1} 
      />
    );
    
    for (let number = 1; number <= Math.min(totalPages, 5); number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    
    if (totalPages > 5) {
      items.push(<Pagination.Ellipsis key="ellipsis" />);
      items.push(
        <Pagination.Item
          key={totalPages}
          active={totalPages === currentPage}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
        disabled={currentPage === totalPages || totalPages === 0} 
      />
    );
    
    return items;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get appropriate status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'danger';
      case 'fixed':
        return 'success';
      case 'false positive':
        return 'info';
      case 'ignored':
        return 'secondary';
      default:
        return 'warning';
    }
  };

  const getCVEs = (tags = []) => {
    return tags.filter(tag => tag.startsWith('CVE-'));
  };
  
  const getCWEs = (tags = []) => {
    return tags.filter(tag => tag.startsWith('CWE-'));
  };
  
  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Acunetix Vulnerabilities</h1>
        
        {/* Summary cards */}
        <Row className="mb-4">
          <Col md={3} className="mb-3 mb-xl-0">
            <Card className="bg-danger text-white h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="me-3">
                  <FaExclamationTriangle size={30} />
                </div>
                <div>
                  <h5 className="mb-0">Critical</h5>
                  <h3 className="mb-0">{summary.Critical}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3 mb-xl-0">
            <Card className="bg-danger text-white h-100" style={{ opacity: 0.8 }}>
              <Card.Body className="d-flex align-items-center">
                <div className="me-3">
                  <FaExclamationTriangle size={30} />
                </div>
                <div>
                  <h5 className="mb-0">High</h5>
                  <h3 className="mb-0">{summary.High}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3 mb-xl-0">
            <Card className="bg-warning text-dark h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="me-3">
                  <FaExclamationTriangle size={30} />
                </div>
                <div>
                  <h5 className="mb-0">Medium</h5>
                  <h3 className="mb-0">{summary.Medium}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3 mb-xl-0">
            <Card className="bg-info text-white h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="me-3">
                  <FaInfoCircle size={30} />
                </div>
                <div>
                  <h5 className="mb-0">Low</h5>
                  <h3 className="mb-0">{summary.Low}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Filters and Search */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body>
            <Row>
              <Col lg={4} md={6} className="mb-3 mb-md-0">
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search vulnerabilities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col lg={8} md={6} className="d-flex flex-wrap justify-content-md-end gap-2">
                <Dropdown className="me-2">
                  <Dropdown.Toggle variant="light" id="severity-filter">
                    <FaFilter className="me-2" />
                    Severity: {filterSeverity}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setFilterSeverity('All')}>All</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterSeverity('Critical')}>Critical</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterSeverity('High')}>High</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterSeverity('Medium')}>Medium</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterSeverity('Low')}>Low</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown>
                  <Dropdown.Toggle variant="light" id="status-filter">
                    <FaFilter className="me-2" />
                    Status: {filterStatus}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setFilterStatus('All')}>All</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('open')}>Open</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('fixed')}>Fixed</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('false positive')}>False Positive</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('ignored')}>Ignored</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Vulnerabilities Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            {error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="mb-0">
                      Total vulnerabilities: {filteredVulnerabilities.length}
                      {selectedVulnerabilities.length > 0 && ` (${selectedVulnerabilities.length} selected)`}
                    </h5>
                  </div>
                  <div>
                    {selectedVulnerabilities.length > 0 && (
                      <>
                        <Button variant="outline-success" size="sm" className="me-2">
                          <FaShieldAlt className="me-1" /> Mark Fixed
                        </Button>
                        <Button variant="outline-danger" size="sm">
                          <FaTrash className="me-1" /> Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="table-responsive">
                  <Table hover>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '40px' }}>
                          <Form.Check 
                            type="checkbox" 
                            onChange={toggleSelectAll} 
                            checked={currentItems.length > 0 && currentItems.every(item => selectedVulnerabilities.includes(item.vuln_id))}
                          />
                        </th>
                        <th style={{ width: '90px' }}>Severity</th>
                        <th>Vulnerability</th>
                        <th>Target</th>
                        <th>Tags</th>
                        <th style={{ width: '100px' }}>Status</th>
                        <th style={{ width: '150px' }}>Last Seen</th>
                        <th style={{ width: '100px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="mt-2">Loading vulnerability data...</div>
                          </td>
                        </tr>
                      ) : currentItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-4">No vulnerabilities match your filters</td>
                        </tr>
                      ) : (
                        currentItems.map(vuln => (
                          <tr key={vuln.vuln_id}>
                            <td>
                              <Form.Check 
                                type="checkbox" 
                                checked={selectedVulnerabilities.includes(vuln.vuln_id)}
                                onChange={() => toggleVulnerabilitySelection(vuln.vuln_id)}
                              />
                            </td>
                            <td>
                              <Badge 
                                bg={severityMap[vuln.severity]?.color || 'secondary'}
                                className="d-flex align-items-center gap-1 py-2 px-2"
                              >
                                {severityMap[vuln.severity]?.icon} {severityMap[vuln.severity]?.level || 'Unknown'}
                              </Badge>
                            </td>
                            <td>
                              <div className="fw-semibold">{vuln.vt_name}</div>
                              <div className="small text-muted">
                                {getCVEs(vuln.tags).map((cve, index) => (
                                  <Badge key={index} bg="dark" className="me-1">{cve}</Badge>
                                ))}
                                {getCWEs(vuln.tags).map((cwe, index) => (
                                  <Badge key={index} bg="secondary" className="me-1">{cwe}</Badge>
                                ))}
                              </div>
                            </td>
                            <td>
                              <a href={vuln.affects_url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                {vuln.affects_url}
                              </a>
                              {vuln.affects_detail && (
                                <div className="small text-muted">{vuln.affects_detail}</div>
                              )}
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {vuln.tags && vuln.tags
                                  .filter(tag => !tag.startsWith('CVE-') && !tag.startsWith('CWE-'))
                                  .slice(0, 3) // Limit to 3 tags for display
                                  .map((tag, index) => (
                                    <Badge key={index} bg="light" text="dark" className="border">
                                      <FaTag className="me-1" size={10} /> {tag}
                                    </Badge>
                                  ))}
                                {vuln.tags && vuln.tags.length > 3 && (
                                  <Badge bg="light" text="dark" className="border">
                                    +{vuln.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td>
                              <Badge 
                                bg={getStatusColor(vuln.status)}
                                className="py-2 px-2 text-capitalize"
                              >
                                {vuln.status || 'Unknown'}
                              </Badge>
                            </td>
                            <td>{formatDate(vuln.last_seen)}</td>
                            <td>
                              <div className="d-flex">
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>View Details</Tooltip>}
                                >
                                  <Button 
                                    variant="light" 
                                    size="sm" 
                                    className="me-1 text-primary"
                                  >
                                    <FaEye />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Visit Target</Tooltip>}
                                >
                                  <Button 
                                    variant="light" 
                                    size="sm"
                                    className="me-1 text-success"
                                    as="a"
                                    href={vuln.affects_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <FaExternalLinkAlt />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Mark Fixed</Tooltip>}
                                >
                                  <Button 
                                    variant="light" 
                                    size="sm"
                                    className="text-success"
                                  >
                                    <FaShieldAlt />
                                  </Button>
                                </OverlayTrigger>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {!loading && filteredVulnerabilities.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="small text-muted">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredVulnerabilities.length)} of {filteredVulnerabilities.length} vulnerabilities
                    </div>
                    <Pagination size="sm" className="mb-0">
                      {renderPaginationItems()}
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default AcunetixFindings;