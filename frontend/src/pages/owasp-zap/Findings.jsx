import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Table, Badge, Button, Pagination, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaSearch, FaFilter, FaExclamationTriangle, FaInfoCircle, FaEye, FaTrash, FaFileDownload } from 'react-icons/fa';

const OwaspZapFindings = () => {
  const [findings, setFindings] = useState([]);
  const [filteredFindings, setFilteredFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFindings, setSelectedFindings] = useState([]);
  
  const itemsPerPage = 10;
  
  const severityMap = {
    Critical: { color: 'danger', icon: <FaExclamationTriangle /> },
    High: { color: 'danger', icon: <FaExclamationTriangle /> },
    Medium: { color: 'warning', icon: <FaExclamationTriangle /> },
    Low: { color: 'info', icon: <FaInfoCircle /> },
    Information: { color: 'secondary', icon: <FaInfoCircle /> }
  };
  
  const [summary, setSummary] = useState({
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Information: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = [
          {
            id: 1,
            title: 'Cross-Site Scripting (XSS)',
            severity: 'High',
            target: 'https://example.com/search',
            location: 'search.php?q=term',
            description: 'Reflected XSS vulnerability in search parameter',
            status: 'Open',
            date: '2023-04-18'
          },
          {
            id: 2,
            title: 'SQL Injection',
            severity: 'Critical',
            target: 'https://example.com/products',
            location: 'products.php?id=123',
            description: 'SQL injection in product ID parameter',
            status: 'Open',
            date: '2023-04-19'
          },
          {
            id: 3,
            title: 'Missing HTTP Security Headers',
            severity: 'Medium',
            target: 'https://example.com',
            location: 'Global',
            description: 'X-Frame-Options header is missing',
            status: 'Fixed',
            date: '2023-04-12'
          },
          {
            id: 4,
            title: 'CSRF Vulnerability',
            severity: 'High',
            target: 'https://example.com/settings',
            location: 'settings.php',
            description: 'CSRF token is missing for settings form',
            status: 'Open',
            date: '2023-04-15'
          },
          {
            id: 5,
            title: 'SSL/TLS Weak Cipher',
            severity: 'Medium',
            target: 'https://example.com',
            location: 'Global',
            description: 'Weak cipher suites are enabled',
            status: 'Open',
            date: '2023-04-14'
          },
          {
            id: 6,
            title: 'Directory Listing Enabled',
            severity: 'Low',
            target: 'https://example.com/assets',
            location: '/assets',
            description: 'Directory listing is enabled on assets folder',
            status: 'Fixed',
            date: '2023-04-10'
          },
          {
            id: 7,
            title: 'Insecure Cookie Attributes',
            severity: 'Medium',
            target: 'https://example.com',
            location: 'Global',
            description: 'Secure and HttpOnly flags are missing on cookies',
            status: 'Open',
            date: '2023-04-17'
          },
          {
            id: 8,
            title: 'Path Traversal Vulnerability',
            severity: 'Critical',
            target: 'https://example.com/download',
            location: 'download.php?file=file.pdf',
            description: 'Path traversal in file parameter allows access to system files',
            status: 'Open',
            date: '2023-04-20'
          },
          {
            id: 9,
            title: 'Server Information Leakage',
            severity: 'Information',
            target: 'https://example.com',
            location: 'HTTP Headers',
            description: 'Server version information is disclosed in HTTP headers',
            status: 'Fixed',
            date: '2023-04-09'
          },
          {
            id: 10,
            title: 'Insecure CORS Configuration',
            severity: 'Medium',
            target: 'https://api.example.com',
            location: 'API Endpoints',
            description: 'Access-Control-Allow-Origin is set to *',
            status: 'Open',
            date: '2023-04-16'
          },
          {
            id: 11,
            title: 'Content Sniffing Not Disabled',
            severity: 'Low',
            target: 'https://example.com',
            location: 'Global',
            description: 'X-Content-Type-Options header is missing',
            status: 'Open',
            date: '2023-04-13'
          },
          {
            id: 12,
            title: 'Open Redirect',
            severity: 'Medium',
            target: 'https://example.com/redirect',
            location: 'redirect.php?url=https://example.com',
            description: 'Open redirect vulnerability in url parameter',
            status: 'Fixed',
            date: '2023-04-11'
          },
          {
            id: 13,
            title: 'Vulnerable JavaScript Library',
            severity: 'High',
            target: 'https://example.com',
            location: '/js/jquery-1.8.2.min.js',
            description: 'Outdated jQuery version with known security vulnerabilities',
            status: 'Open',
            date: '2023-04-18'
          },
          {
            id: 14,
            title: 'HTTP TRACE Method Enabled',
            severity: 'Low',
            target: 'https://example.com',
            location: 'Global',
            description: 'HTTP TRACE method is enabled',
            status: 'Fixed',
            date: '2023-04-08'
          }
        ];
        
        setFindings(mockData);
        
        const summaryData = mockData.reduce((acc, finding) => {
          acc[finding.severity] = (acc[finding.severity] || 0) + 1;
          return acc;
        }, {
          Critical: 0,
          High: 0,
          Medium: 0,
          Low: 0,
          Information: 0
        });
        
        setSummary(summaryData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching findings:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    let results = findings;
    
    if (searchTerm) {
      results = results.filter(finding =>
        finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.target.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterSeverity !== 'All') {
      results = results.filter(finding => finding.severity === filterSeverity);
    }
    
    if (filterStatus !== 'All') {
      results = results.filter(finding => finding.status === filterStatus);
    }
    
    setFilteredFindings(results);
    setCurrentPage(1);
  }, [findings, searchTerm, filterSeverity, filterStatus]);
  
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
  
  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">OWASP ZAP Findings</h1>
        
        {/* Summary cards */}
        <Row className="mb-4">
          <Col md={12} xl={3} className="mb-3 mb-xl-0">
            <Card className="bg-danger text-white h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="me-3">
                  <FaExclamationTriangle size={30} />
                </div>
                <div>
                  <h5 className="mb-0">Critical & High</h5>
                  <h3 className="mb-0">{summary.Critical + summary.High}</h3>
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
                  <h5 className="mb-0">Information</h5>
                  <h3 className="mb-0">{summary.Information}</h3>
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
              <Col lg={8} md={6} className="d-flex justify-content-md-end">
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
                    <Dropdown.Item onClick={() => setFilterSeverity('Information')}>Information</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown>
                  <Dropdown.Toggle variant="light" id="status-filter">
                    <FaFilter className="me-2" />
                    Status: {filterStatus}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setFilterStatus('All')}>All</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('Open')}>Open</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('Fixed')}>Fixed</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('In Progress')}>In Progress</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('Won\'t Fix')}>Won't Fix</Dropdown.Item>
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
                  Total findings: {filteredFindings.length}
                  {selectedFindings.length > 0 && ` (${selectedFindings.length} selected)`}
                </h5>
              </div>
              <div>
                {selectedFindings.length > 0 && (
                  <>
                    <Button variant="outline-danger" size="sm" className="me-2">
                      <FaTrash className="me-1" /> Delete
                    </Button>
                    <Button variant="outline-primary" size="sm">
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
                      />
                    </th>
                    <th style={{ width: '100px' }}>Severity</th>
                    <th>Title & Location</th>
                    <th>Target</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '110px' }}>Date</th>
                    <th style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">No findings match your filters</td>
                    </tr>
                  ) : (
                    currentItems.map(finding => (
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
                            bg={severityMap[finding.severity]?.color || 'secondary'}
                            className="d-flex align-items-center gap-1 py-2 px-2"
                          >
                            {severityMap[finding.severity]?.icon} {finding.severity}
                          </Badge>
                        </td>
                        <td>
                          <div className="fw-semibold">{finding.title}</div>
                          <div className="small text-muted">{finding.location}</div>
                        </td>
                        <td>{finding.target}</td>
                        <td>
                          <Badge 
                            bg={finding.status === 'Fixed' ? 'success' : finding.status === 'Open' ? 'danger' : 'warning'}
                            className="py-2 px-2"
                          >
                            {finding.status}
                          </Badge>
                        </td>
                        <td>{finding.date}</td>
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
                              overlay={<Tooltip>Delete</Tooltip>}
                            >
                              <Button 
                                variant="light" 
                                size="sm"
                                className="text-danger"
                              >
                                <FaTrash />
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
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="small text-muted">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredFindings.length)} of {filteredFindings.length} findings
              </div>
              <Pagination size="sm" className="mb-0">
                {renderPaginationItems()}
              </Pagination>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default OwaspZapFindings; 