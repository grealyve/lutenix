import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Table, Badge, Button, Pagination, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaSearch, FaFilter, FaExclamationTriangle, FaInfoCircle, FaEye, FaTrash, FaFileDownload } from 'react-icons/fa';

const AcunetixFindings = () => {
  const [findings, setFindings] = useState([]);
  const [filteredFindings, setFilteredFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFindings, setSelectedFindings] = useState([]);
  
  const itemsPerPage = 10;
  
  // Severity levels and their corresponding colors
  const severityMap = {
    Critical: { color: 'danger', icon: <FaExclamationTriangle /> },
    High: { color: 'danger', icon: <FaExclamationTriangle /> },
    Medium: { color: 'warning', icon: <FaExclamationTriangle /> },
    Low: { color: 'info', icon: <FaInfoCircle /> },
    Information: { color: 'secondary', icon: <FaInfoCircle /> }
  };
  
  // Summary data for each severity level
  const [summary, setSummary] = useState({
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Information: 0
  });

  // Fetch findings data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Mock data - in a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = [
          {
            id: 1,
            title: 'Remote Code Execution',
            severity: 'Critical',
            target: 'https://example.com/upload',
            location: '/upload.php',
            description: 'Remote code execution via malicious file upload',
            status: 'Open',
            date: '2023-04-20'
          },
          {
            id: 2,
            title: 'Remote File Inclusion',
            severity: 'Critical',
            target: 'https://example.com/include',
            location: 'include.php?file=page',
            description: 'Remote file inclusion via unvalidated file parameter',
            status: 'Open',
            date: '2023-04-19'
          },
          {
            id: 3,
            title: 'SQL Injection',
            severity: 'High',
            target: 'https://example.com/search',
            location: 'search.php?query=keyword',
            description: 'SQL injection vulnerability in search parameter',
            status: 'Fixed',
            date: '2023-04-15'
          },
          {
            id: 4,
            title: 'Cross-Site Scripting (XSS)',
            severity: 'High',
            target: 'https://example.com/profile',
            location: 'profile.php?name=user',
            description: 'Reflected XSS vulnerability in name parameter',
            status: 'Open',
            date: '2023-04-18'
          },
          {
            id: 5,
            title: 'Cross-Site Request Forgery (CSRF)',
            severity: 'Medium',
            target: 'https://example.com/settings',
            location: '/settings',
            description: 'CSRF vulnerability in settings form',
            status: 'Open',
            date: '2023-04-17'
          },
          {
            id: 6,
            title: 'Broken Authentication',
            severity: 'High',
            target: 'https://example.com/login',
            location: '/login.php',
            description: 'Password reset without proper verification',
            status: 'Open',
            date: '2023-04-16'
          },
          {
            id: 7,
            title: 'Information Disclosure',
            severity: 'Medium',
            target: 'https://example.com',
            location: 'HTTP Headers',
            description: 'Sensitive information revealed in HTTP headers',
            status: 'Fixed',
            date: '2023-04-10'
          },
          {
            id: 8,
            title: 'Directory Traversal',
            severity: 'High',
            target: 'https://example.com/files',
            location: 'files.php?path=docs',
            description: 'Directory traversal via path parameter',
            status: 'Open',
            date: '2023-04-14'
          },
          {
            id: 9,
            title: 'Weak Password Policy',
            severity: 'Medium',
            target: 'https://example.com/register',
            location: '/register.php',
            description: 'Weak password policy allows simple passwords',
            status: 'Open',
            date: '2023-04-13'
          },
          {
            id: 10,
            title: 'Insecure Direct Object Reference',
            severity: 'Medium',
            target: 'https://example.com/documents',
            location: 'documents.php?id=123',
            description: 'Insecure direct object reference in document ID',
            status: 'Fixed',
            date: '2023-04-11'
          },
          {
            id: 11,
            title: 'Cookie Without Secure Flag',
            severity: 'Low',
            target: 'https://example.com',
            location: 'Cookies',
            description: 'Session cookie missing secure flag',
            status: 'Open',
            date: '2023-04-12'
          },
          {
            id: 12,
            title: 'Missing Content Security Policy',
            severity: 'Low',
            target: 'https://example.com',
            location: 'HTTP Headers',
            description: 'Content Security Policy header not set',
            status: 'Open',
            date: '2023-04-09'
          },
          {
            id: 13,
            title: 'Server Information Disclosure',
            severity: 'Information',
            target: 'https://example.com',
            location: 'HTTP Headers',
            description: 'Server type and version disclosed in headers',
            status: 'Fixed',
            date: '2023-04-08'
          },
          {
            id: 14,
            title: 'HTML Form Without CSRF Protection',
            severity: 'Medium',
            target: 'https://example.com/contact',
            location: '/contact.php',
            description: 'Form submission without CSRF token',
            status: 'Open',
            date: '2023-04-07'
          },
          {
            id: 15,
            title: 'Clickjacking Vulnerability',
            severity: 'Low',
            target: 'https://example.com',
            location: 'Global',
            description: 'X-Frame-Options header missing',
            status: 'Fixed',
            date: '2023-04-06'
          }
        ];
        
        setFindings(mockData);
        
        // Calculate summary
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
  
  // Apply filters and search
  useEffect(() => {
    let results = findings;
    
    // Apply search term
    if (searchTerm) {
      results = results.filter(finding =>
        finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.target.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply severity filter
    if (filterSeverity !== 'All') {
      results = results.filter(finding => finding.severity === filterSeverity);
    }
    
    // Apply status filter
    if (filterStatus !== 'All') {
      results = results.filter(finding => finding.status === filterStatus);
    }
    
    setFilteredFindings(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [findings, searchTerm, filterSeverity, filterStatus]);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFindings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFindings.length / itemsPerPage);
  
  // Handle pagination click
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  // Handle checkbox selection
  const toggleFindingSelection = (id) => {
    setSelectedFindings(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(item => item !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };
  
  // Select all findings on current page
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const currentIds = currentItems.map(item => item.id);
      setSelectedFindings(prev => [...new Set([...prev, ...currentIds])]);
    } else {
      const currentIds = currentItems.map(item => item.id);
      setSelectedFindings(prev => prev.filter(id => !currentIds.includes(id)));
    }
  };
  
  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
        disabled={currentPage === 1} 
      />
    );
    
    // Page numbers
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
    
    // Ellipsis and last page
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
    
    // Next button
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
        <h1 className="mb-4">Acunetix Findings</h1>
        
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

export default AcunetixFindings; 