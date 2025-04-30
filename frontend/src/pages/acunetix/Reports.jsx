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
  const [error, setError] = useState(null);
  
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }
        
        const response = await fetch('http://localhost:4040/api/v1/acunetix/reports', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            throw new Error('Authentication expired. Please log in again.');
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Check if the response has the expected structure
        const reportsData = responseData.data?.reports || responseData.reports || [];
        
        const formattedReports = reportsData.map(report => ({
          id: report.report_id,
          name: report.template_name || 'Unnamed Report',
          date: new Date(report.generation_date).toLocaleString(),
          status: report.status.charAt(0).toUpperCase() + report.status.slice(1),
          findings: report.source?.id_list?.length || 0,
          format: 'HTML/PDF',
          description: report.source?.description || 'Multiple targets scan report',
          downloadLinks: report.download || []
        }));
        
        setReports(formattedReports);
        setFilteredReports(formattedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
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

  const handleDeleteReports = async () => {
    if (selectedReports.length === 0) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      
      console.log('Delete reports:', selectedReports);

      const remainingReports = reports.filter(report => !selectedReports.includes(report.id));
      setReports(remainingReports);
      setFilteredReports(remainingReports);
      setSelectedReports([]);
    } catch (error) {
      console.error('Error deleting reports:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadReport = (downloadUrl, format) => {
    if (!downloadUrl) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      return;
    }
    
    const baseUrl = 'http://localhost:4040';
    const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${baseUrl}${downloadUrl}`;
    
    window.open(fullUrl, '_blank');
    
    console.log(`Downloading report in ${format} format:`, fullUrl);
  };
  
  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Acunetix Reports</h1>
        
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            {error}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="mb-4">
          <Row>
            <Col>
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
                    <th style={{ width: '100px' }}>Targets</th>
                    <th style={{ width: '150px' }}>Download Links</th>
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
                            bg={
                              report.status === 'Completed' ? 'success' : 
                              report.status === 'In progress' ? 'warning' : 
                              'danger'
                            }
                            className="py-2 px-2"
                          >
                            {report.status}
                          </Badge>
                        </td>
                        <td className="text-center">{report.findings}</td>
                        <td>
                          {report.downloadLinks && report.downloadLinks.length > 0 ? (
                            <div className="d-flex gap-2 justify-content-center">
                              {report.downloadLinks.map((link, index) => {
                                const format = link.endsWith('.html') ? 'HTML' : link.endsWith('.pdf') ? 'PDF' : 'File';
                                return (
                                  <Button 
                                    key={index}
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => handleDownloadReport(link, format)}
                                  >
                                    <FaFileDownload className="me-1" /> {format}
                                  </Button>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-muted">No downloads</span>
                          )}
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
                              onClick={() => handleDownloadReport(report.downloadLinks?.[0])}
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