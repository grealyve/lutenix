import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Table, Badge, Button, Pagination, Dropdown, OverlayTrigger, Tooltip, Spinner, Alert } from 'react-bootstrap';
import { FaSearch, FaFilter, FaExclamationTriangle, FaInfoCircle, FaEye, FaTrash, FaFileDownload } from 'react-icons/fa';
import { format } from 'date-fns';

const OwaspZapFindings = () => {
  const [findings, setFindings] = useState([]);
  const [filteredFindings, setFilteredFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFindings, setSelectedFindings] = useState([]);
  
  const itemsPerPage = 10;
  
  const severityMap = {
    High: { color: 'danger', icon: <FaExclamationTriangle /> },
    Medium: { color: 'warning', icon: <FaExclamationTriangle /> },
    Low: { color: 'info', icon: <FaInfoCircle /> },
    Informational: { color: 'secondary', icon: <FaInfoCircle /> }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }
        
        const response = await fetch('http://localhost:4040/api/v1/zap/findings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          throw new Error('Authentication failed. Please log in again.');
        }
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (!responseData || !responseData.data || !Array.isArray(responseData.data)) {
          console.error("Unexpected API response structure:", responseData);
          throw new Error("Received invalid data format from the server.");
        }

        setFindings(responseData.data);
        
        const summaryData = responseData.data.reduce((acc, finding) => {
          acc[finding.risk] = (acc[finding.risk] || 0) + 1;
          return acc;
        }, {
          High: 0,
          Medium: 0,
          Low: 0,
          Informational: 0
        });
        
        setSummary(summaryData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching findings:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // State for summary counts
  const [summary, setSummary] = useState({
    High: 0,
    Medium: 0,
    Low: 0,
    Informational: 0
  });
  
  useEffect(() => {
    let results = findings;
    
    if (searchTerm) {
      results = results.filter(finding =>
        (finding.vulnerability_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (finding.url?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (finding.location?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterSeverity !== 'All') {
      results = results.filter(finding => finding.risk === filterSeverity);
    }
    
    setFilteredFindings(results);
    setCurrentPage(1);
  }, [findings, searchTerm, filterSeverity]);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFindings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFindings.length / itemsPerPage);
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const toggleFindingSelection = (id) => {
    setSelectedFindings(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(item => item !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };
  
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const currentIds = currentItems.map(item => item.id);
      setSelectedFindings(prev => [...new Set([...prev, ...currentIds])]);
    } else {
      const currentIds = currentItems.map(item => item.id);
      setSelectedFindings(prev => prev.filter(id => !currentIds.includes(id)));
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

  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedFindings.length} finding(s)?`)) {
      alert(`Deleted ${selectedFindings.length} finding(s)`);
    }
  };

  const handleExportSelected = () => {
    alert(`Exported ${selectedFindings.length} finding(s)`);
  };

  const handleViewDetails = (findingId) => {
    alert(`Viewing details for finding ${findingId}`);
  };

  const handleDeleteSingle = (findingId) => {
    if (window.confirm(`Are you sure you want to delete finding ${findingId}?`)) {

      alert(`Deleted finding ${findingId}`);
    }
  };
  
  return (
    <div className="page-content">
      <Container fluid>
        {/* Page Title */}
        <h1 className="mb-4">OWASP ZAP Findings</h1>
        
        {/* Error Display */}
        {error && <Alert variant="danger">{error}</Alert>}
        
        {/* Summary cards */}
        <Row className="mb-4">
          <Col md={12} xl={3} className="mb-3 mb-xl-0">
            <Card className="bg-danger text-white h-100">
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
          <Col md={4} xl={3} className="mb-3 mb-xl-0">
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
          <Col md={4} xl={3} className="mb-3 mb-xl-0">
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
          <Col md={4} xl={3} className="mb-3 mb-xl-0">
            <Card className="bg-secondary text-white h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="me-3">
                  <FaInfoCircle size={30} />
                </div>
                <div>
                  <h5 className="mb-0">Informational</h5>
                  <h3 className="mb-0">{summary.Informational}</h3>
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
                    placeholder="Search findings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col lg={8} md={6} className="d-flex justify-content-md-end align-items-center">
                <Dropdown className="me-2">
                  <Dropdown.Toggle variant="outline-secondary" id="severity-filter">
                    <FaFilter className="me-2" />
                    Severity: {filterSeverity}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setFilterSeverity('All')} active={filterSeverity === 'All'}>All</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterSeverity('High')} active={filterSeverity === 'High'}>High</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterSeverity('Medium')} active={filterSeverity === 'Medium'}>Medium</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterSeverity('Low')} active={filterSeverity === 'Low'}>Low</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterSeverity('Informational')} active={filterSeverity === 'Informational'}>Informational</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Findings Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-0">
                  {loading ? 'Loading findings...' :
                   error ? 'Error loading findings' :
                   `Total findings: ${filteredFindings.length}`}
                  {selectedFindings.length > 0 && ` (${selectedFindings.length} selected)`}
                </h5>
              </div>
              <div>
                {selectedFindings.length > 0 && !loading && (
                  <>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="me-2"
                      onClick={handleDeleteSelected}
                    >
                      <FaTrash className="me-1" /> Delete
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={handleExportSelected}
                    >
                      <FaFileDownload className="me-1" /> Export
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
                        checked={currentItems.length > 0 && currentItems.every(item => selectedFindings.includes(item.id))}
                        disabled={loading || currentItems.length === 0}
                      />
                    </th>
                    <th style={{ width: '120px' }}>Severity</th>
                    <th>Vulnerability & URL</th>
                    <th>Location</th>
                    <th style={{ width: '180px' }}>Date Found</th>
                    <th style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        <Spinner animation="border" role="status" size="sm">
                          <span className="visually-hidden">Loading...</span>
                        </Spinner> Loading...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-danger">
                        Error loading findings. Please try again later.
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        {findings.length === 0 ? 'No findings available.' : 'No findings match your current filters.'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map(finding => {
                      const severityInfo = severityMap[finding.risk] || { color: 'secondary', icon: <FaInfoCircle /> };
                      const formattedDate = finding.created_at ? 
                        format(new Date(finding.created_at), 'yyyy-MM-dd HH:mm:ss') : 
                        'N/A';
                        
                      return (
                        <tr key={finding.id}>
                          <td>
                            <Form.Check 
                              type="checkbox" 
                              checked={selectedFindings.includes(finding.id)}
                              onChange={() => toggleFindingSelection(finding.id)}
                            />
                          </td>
                          <td>
                            <Badge 
                              bg={severityInfo.color}
                              className="d-inline-flex align-items-center gap-1 py-1 px-2"
                            >
                              {severityInfo.icon} {finding.risk}
                            </Badge>
                          </td>
                          <td>
                            <div className="fw-semibold">{finding.vulnerability_name || 'N/A'}</div>
                            <div className="small text-muted text-truncate" style={{ maxWidth: '400px' }}>
                              {finding.url || 'N/A'}
                            </div>
                          </td>
                          <td className="small">
                            {finding.location || 'N/A'}
                          </td>
                          <td className="small">
                            {formattedDate}
                          </td>
                          <td>
                            <div className="d-flex">
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>View Details</Tooltip>}
                              >
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="me-1 p-1 text-primary"
                                  onClick={() => handleViewDetails(finding.id)}
                                >
                                  <FaEye />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Delete</Tooltip>}
                              >
                                <Button 
                                  variant="link" 
                                  size="sm"
                                  className="p-1 text-danger"
                                  onClick={() => handleDeleteSingle(finding.id)}
                                >
                                  <FaTrash />
                                </Button>
                              </OverlayTrigger>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
            
            {}
            {!loading && !error && totalPages > 0 && (
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                <div className="small text-muted mb-2 mb-md-0">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredFindings.length)} of {filteredFindings.length} findings
                </div>
                <Pagination size="sm" className="mb-0">
                  {renderPaginationItems()}
                </Pagination>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default OwaspZapFindings;