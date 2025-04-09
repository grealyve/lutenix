import { useState, useEffect } from 'react';
import { Container, Table, Dropdown, Form, InputGroup, Row, Col, Button, Card } from 'react-bootstrap';
import { FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown, FaEye, FaTrash, FaPlus } from 'react-icons/fa';

const SemgrepDeployments = () => {
  const [deployments, setDeployments] = useState([]);
  const [filteredDeployments, setFilteredDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockData = [
          {
            id: 1,
            findingUrl: 'https://github.com/semgrep/semgrep',
            deploymentName: 'windows_docker',
            status: 'Active',
            lastScan: '2025-04-08',
            findings: 12
          },
          {
            id: 2,
            findingUrl: 'https://github.com/semgrep/semgrep',
            deploymentName: 'linux_docker',
            status: 'Active',
            lastScan: '2025-04-07',
            findings: 8
          },
          {
            id: 3,
            findingUrl: 'https://github.com/semgrep/semgrep',
            deploymentName: 'macOS_scan',
            status: 'Active',
            lastScan: '2025-04-06',
            findings: 5
          },
          {
            id: 4,
            findingUrl: 'https://github.com/semgrep/semgrep-docs',
            deploymentName: 'docs_scan',
            status: 'Inactive',
            lastScan: '2025-04-05',
            findings: 3
          },
          {
            id: 5,
            findingUrl: 'https://github.com/semgrep/semgrep-app',
            deploymentName: 'app_scan',
            status: 'Active',
            lastScan: '2025-04-04',
            findings: 7
          },
          {
            id: 6,
            findingUrl: 'https://github.com/semgrep/semgrep-rules',
            deploymentName: 'rules_scan',
            status: 'Active',
            lastScan: '2025-04-03',
            findings: 15
          },
          {
            id: 7,
            findingUrl: 'https://github.com/semgrep/semgrep-action',
            deploymentName: 'action_scan',
            status: 'Active',
            lastScan: '2025-04-02',
            findings: 4
          },
          {
            id: 8,
            findingUrl: 'https://github.com/semgrep/semgrep-interfaces',
            deploymentName: 'interfaces_scan',
            status: 'Inactive',
            lastScan: '2025-04-01',
            findings: 2
          },
          {
            id: 9,
            findingUrl: 'https://github.com/semgrep/semgrep-core',
            deploymentName: 'core_scan',
            status: 'Active',
            lastScan: '2025-03-31',
            findings: 9
          },
          {
            id: 10,
            findingUrl: 'https://github.com/semgrep/semgrep-grammar',
            deploymentName: 'grammar_scan',
            status: 'Active',
            lastScan: '2025-03-30',
            findings: 6
          }
        ];
        
        setDeployments(mockData);
        setFilteredDeployments(mockData);
        setTotalPages(Math.ceil(mockData.length / itemsPerPage));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching deployments:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDeployments(deployments);
    } else {
      const filtered = deployments.filter(deployment =>
        deployment.deploymentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deployment.findingUrl.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDeployments(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, deployments]);
  
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    setFilteredDeployments(prevData => {
      const sortedData = [...prevData];
      sortedData.sort((a, b) => {
        if (a[key] < b[key]) {
          return direction === 'asc' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      return sortedData;
    });
  };
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDeployments.slice(indexOfFirstItem, indexOfLastItem);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="text-muted ms-1" />;
    }
    return sortConfig.direction === 'asc' ? <FaSortUp className="text-primary ms-1" /> : <FaSortDown className="text-primary ms-1" />;
  };
  
  
  return (
    <div className="page-content">
      <Container fluid>
        
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row>
              <Col md={6} lg={4}>
                <InputGroup className="mb-3 mb-md-0">
                  <InputGroup.Text className="bg-transparent">
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search deployments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-start-0"
                  />
                </InputGroup>
              </Col>
              <Col md={6} lg={8} className="d-flex justify-content-md-end">
                <Dropdown className="me-2">
                  <Dropdown.Toggle variant="outline-secondary" id="status-filter">
                    <FaFilter className="me-2" />
                    Status
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item>All</Dropdown.Item>
                    <Dropdown.Item>Active</Dropdown.Item>
                    <Dropdown.Item>Inactive</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr className="bg-light">
                    <th 
                      className="py-3 px-4" 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => requestSort('id')}
                    >
                      <div className="d-flex align-items-center">
                        ID {renderSortIcon('id')}
                      </div>
                    </th>
                    <th 
                      className="py-3 px-4" 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => requestSort('findingUrl')}
                    >
                      <div className="d-flex align-items-center">
                        Finding URL {renderSortIcon('findingUrl')}
                      </div>
                    </th>
                    <th 
                      className="py-3 px-4" 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => requestSort('deploymentName')}
                    >
                      <div className="d-flex align-items-center">
                        Deployment Name {renderSortIcon('deploymentName')}
                      </div>
                    </th>
                    <th 
                      className="py-3 px-4 text-center" 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => requestSort('status')}
                    >
                      <div className="d-flex align-items-center justify-content-center">
                        Status {renderSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="py-3 px-4 text-center" 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => requestSort('findings')}
                    >
                      <div className="d-flex align-items-center justify-content-center">
                        Findings {renderSortIcon('findings')}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        No deployments found
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((deployment) => (
                      <tr key={deployment.id}>
                        <td className="py-3 px-4">{deployment.id}</td>
                        <td className="py-3 px-4 text-break">
                          <a href={deployment.findingUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                            {deployment.findingUrl}
                          </a>
                        </td>
                        <td className="py-3 px-4 fw-medium">{deployment.deploymentName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`badge ${deployment.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                            {deployment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">{deployment.findings}</td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="light" size="sm" className="me-2" title="View details">
                            <FaEye />
                          </Button>
                          <Button variant="light" size="sm" className="text-danger" title="Delete">
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
            
            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center p-3">
              <div className="small text-muted">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredDeployments.length)} of {filteredDeployments.length} deployments
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages).keys()].map((number) => (
                    <li key={number + 1} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => paginate(number + 1)}
                      >
                        {number + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default SemgrepDeployments;
