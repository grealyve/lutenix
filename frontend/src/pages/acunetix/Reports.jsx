import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, InputGroup, Badge, Pagination, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaSearch, FaFilter, FaFileDownload, FaTrash, FaPlus, FaEye } from 'react-icons/fa';

const AcunetixReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReports, setSelectedReports] = useState([]);
  
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = [
          {
            id: 1,
            name: 'Comprehensive Security Scan Report',
            date: '2023-05-20',
            status: 'Completed',
            findings: 24,
            format: 'HTML',
            description: 'Full vulnerability assessment of all web applications'
          },
          {
            id: 2,
            name: 'Customer Portal Security Report',
            date: '2023-05-18',
            status: 'Completed',
            findings: 15,
            format: 'HTML',
            description: 'Security assessment of the customer portal application'
          },
          {
            id: 3,
            name: 'Partner API Security Report',
            date: '2023-05-15',
            status: 'Completed',
            findings: 10,
            format: 'HTML',
            description: 'Security audit of partner-facing API endpoints'
          },
          {
            id: 4,
            name: 'E-commerce Platform Scan Report',
            date: '2023-05-12',
            status: 'Completed',
            findings: 18,
            format: 'HTML',
            description: 'Vulnerability assessment of e-commerce platform'
          },
          {
            id: 5,
            name: 'Internal Admin Dashboard Report',
            date: '2023-05-09',
            status: 'Completed',
            findings: 12,
            format: 'HTML',
            description: 'Security scan of internal administrative interfaces'
          },
          {
            id: 6,
            name: 'Mobile API Backend Security Report',
            date: '2023-05-05',
            status: 'Completed',
            findings: 8,
            format: 'HTML',
            description: 'Security assessment of backend APIs used by mobile apps'
          },
          {
            id: 7,
            name: 'Payment Gateway Integration Report',
            date: '2023-05-02',
            status: 'Completed',
            findings: 5,
            format: 'HTML',
            description: 'Security audit of payment processing system integration'
          },
          {
            id: 8,
            name: 'User Authentication System Report',
            date: '2023-04-28',
            status: 'Completed',
            findings: 9,
            format: 'HTML',
            description: 'Comprehensive assessment of user authentication mechanisms'
          },
          {
            id: 9,
            name: 'Content Management System Report',
            date: '2023-04-25',
            status: 'Completed',
            findings: 14,
            format: 'HTML',
            description: 'Security scan of the content management system'
          },
          {
            id: 10,
            name: 'File Upload Functionality Report',
            date: '2023-04-22',
            status: 'Completed',
            findings: 11,
            format: 'HTML',
            description: 'Security assessment of file upload capabilities'
          },
          {
            id: 11,
            name: 'Cloud Infrastructure Scan Report',
            date: '2023-04-18',
            status: 'Completed',
            findings: 16,
            format: 'HTML',
            description: 'Security assessment of cloud-hosted web applications'
          },
          {
            id: 12,
            name: 'Third-party Integration Security Report',
            date: '2023-04-15',
            status: 'Completed',
            findings: 7,
            format: 'HTML',
            description: 'Security audit of third-party service integrations'
          },
          {
            id: 13,
            name: 'Customer Data Processing Report',
            date: '2023-04-12',
            status: 'Completed',
            findings: 13,
            format: 'HTML',
            description: 'Assessment of customer data handling and processing'
          },
          {
            id: 14,
            name: 'Legacy Application Security Report',
            date: '2023-04-08',
            status: 'Completed',
            findings: 22,
            format: 'HTML',
            description: 'Security scan of legacy web applications'
          }
        ];
        
        setReports(mockData);
        setFilteredReports(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    let results = reports;
    
    if (searchTerm) {
      results = results.filter(report =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'All') {
      results = results.filter(report => report.status === filterStatus);
    }
    
    setFilteredReports(results);
    setCurrentPage(1);
  }, [reports, searchTerm, filterStatus]);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const toggleReportSelection = (id) => {
    setSelectedReports(prevSelected => {
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
      setSelectedReports(prev => [...new Set([...prev, ...currentIds])]);
    } else {
      const currentIds = currentItems.map(item => item.id);
      setSelectedReports(prev => prev.filter(id => !currentIds.includes(id)));
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

  const handleCreateReport = () => {
    console.log('Create report clicked');
  };

  const handleDeleteReports = () => {
    console.log('Delete reports clicked:', selectedReports);
  };
  
  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Acunetix Reports</h1>
        
        {/* Action Buttons */}
        <div className="mb-4">
          <Row>
            <Col>
              <Button 
                variant="primary" 
                className="me-2"
                onClick={handleCreateReport}
              >
                <FaPlus className="me-2" />
                Create Report
              </Button>
              {selectedReports.length > 0 && (
                <Button 
                  variant="danger"
                  onClick={handleDeleteReports}
                >
                  <FaTrash className="me-2" />
                  Delete Report
                </Button>
              )}
            </Col>
          </Row>
        </div>
        
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
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col lg={8} md={6} className="d-flex justify-content-md-end">
                <Dropdown>
                  <Dropdown.Toggle variant="light" id="status-filter">
                    <FaFilter className="me-2" />
                    Status: {filterStatus}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setFilterStatus('All')}>All</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('Completed')}>Completed</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('In Progress')}>In Progress</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('Failed')}>Failed</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Reports Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-0">
                  Total reports: {filteredReports.length}
                  {selectedReports.length > 0 && ` (${selectedReports.length} selected)`}
                </h5>
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
                        checked={currentItems.length > 0 && currentItems.every(item => selectedReports.includes(item.id))}
                      />
                    </th>
                    <th>Report Name</th>
                    <th style={{ width: '120px' }}>Date</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '100px' }}>Findings</th>
                    <th style={{ width: '150px' }}>Download Link</th>
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
                      <td colSpan={7} className="text-center py-4">No reports match your filters</td>
                    </tr>
                  ) : (
                    currentItems.map(report => (
                      <tr key={report.id}>
                        <td>
                          <Form.Check 
                            type="checkbox" 
                            checked={selectedReports.includes(report.id)}
                            onChange={() => toggleReportSelection(report.id)}
                          />
                        </td>
                        <td>
                          <div className="fw-semibold">{report.name}</div>
                          <div className="small text-muted">{report.description}</div>
                        </td>
                        <td>{report.date}</td>
                        <td>
                          <Badge 
                            bg={report.status === 'Completed' ? 'success' : report.status === 'In Progress' ? 'warning' : 'danger'}
                            className="py-2 px-2"
                          >
                            {report.status}
                          </Badge>
                        </td>
                        <td className="text-center">{report.findings}</td>
                        <td className="text-center">
                          <Button variant="outline-primary" size="sm">
                            <FaFileDownload className="me-1" /> {report.format}
                          </Button>
                        </td>
                        <td>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>View Report</Tooltip>}
                          >
                            <Button 
                              variant="light" 
                              size="sm" 
                              className="text-primary"
                            >
                              <FaEye />
                            </Button>
                          </OverlayTrigger>
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
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredReports.length)} of {filteredReports.length} reports
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

export default AcunetixReports; 