import { useState, useEffect } from 'react';
import { Container, Table, Dropdown, Form, InputGroup, Row, Col, Button, Card, Alert } from 'react-bootstrap';
import { FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown, FaEye, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import { semgrepAPI } from '../../utils/api';

const SemgrepDeployments = () => {
  const [deployments, setDeployments] = useState([]);
  const [filteredDeployments, setFilteredDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await semgrepAPI.getDeployments();

        if (!response || !Array.isArray(response.data)) {
            console.error("Invalid API response structure:", response);
            throw new Error("Received invalid data format from API.");
        }

        const formattedData = response.data.map(dep => ({
          id: dep.id,
          name: dep.name,
          findingsUrl: dep.findings?.url,
          slug: dep.slug
        }));

        setDeployments(formattedData);
        setFilteredDeployments(formattedData);
        setTotalPages(Math.ceil(formattedData.length / itemsPerPage));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching deployments:', err);
        setError(err.message || 'Failed to fetch deployments. Please try again.');
        setLoading(false);
        setDeployments([]);
        setFilteredDeployments([]);
        setTotalPages(1);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = deployments;
    if (searchTerm.trim() !== '') {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = deployments.filter(deployment =>
        deployment.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        (deployment.findingsUrl && deployment.findingsUrl.toLowerCase().includes(lowerCaseSearchTerm)) ||
        deployment.slug.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    const sorted = sortData(filtered, sortConfig);
    setFilteredDeployments(sorted);
    setTotalPages(Math.ceil(sorted.length / itemsPerPage));
    setCurrentPage(1);
  }, [searchTerm, deployments, sortConfig]);


  const sortData = (data, config) => {
    const sortedData = [...data];
    sortedData.sort((a, b) => {
      const aValue = a[config.key];
      const bValue = b[config.key];

      if (aValue < bValue) {
        return config.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return config.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortedData;
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDeployments.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
         setCurrentPage(pageNumber);
      }
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="text-muted ms-1" />;
    }
    return sortConfig.direction === 'asc' ? <FaSortUp className="text-primary ms-1" /> : <FaSortDown className="text-primary ms-1" />;
  };

  const handleViewDetails = (deploymentId) => {
      console.log("View details for:", deploymentId);
  };

  const handleDelete = (deploymentId, deploymentName) => {
      console.log("Delete:", deploymentId, deploymentName);
      if (window.confirm(`Are you sure you want to delete deployment "${deploymentName}" (ID: ${deploymentId})?`)) {
          alert("Delete functionality not yet implemented.");
      }
  };

  return (
    <div className="page-content">
      <Container fluid>

        {}
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="align-items-center">
              {}
              <Col md={6} lg={4}>
                <InputGroup className="mb-3 mb-md-0">
                  <InputGroup.Text className="bg-light border-end-0">
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search name, URL, slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-start-0"
                  />
                </InputGroup>
              </Col>

              {}
              <Col md={6} lg={8} className="d-flex justify-content-md-end align-items-center">
                {}
                {}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th
                      className="py-3 px-4"
                      style={{ cursor: 'pointer', width: '10%' }}
                      onClick={() => requestSort('id')}
                    >
                      <div className="d-flex align-items-center">
                        ID {renderSortIcon('id')}
                      </div>
                    </th>
                    <th
                      className="py-3 px-4"
                      style={{ cursor: 'pointer', width: '35%' }}
                      onClick={() => requestSort('name')}
                    >
                      <div className="d-flex align-items-center">
                        Deployment Name {renderSortIcon('name')}
                      </div>
                    </th>
                     {}
                     <th
                      className="py-3 px-4"
                      style={{ width: '40%' }}
                    >
                      Findings URL
                    </th>
                    {}
                    <th className="py-3 px-4 text-center" style={{ width: '15%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      {}
                      <td colSpan={4} className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? ( 
                      <tr>
                          <td colSpan={4} className="text-center py-5 text-danger">
                              Error loading data. {error}
                          </td>
                      </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5 text-muted">
                        No deployments found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((deployment) => (
                      <tr key={deployment.id}>
                        {}
                        <td className="py-3 px-4">{deployment.id}</td>
                        {}
                        <td className="py-3 px-4 fw-medium">{deployment.name}</td>
                        {}
                        <td className="py-3 px-4 text-break">
                          {deployment.findingsUrl ? (
                            <a href={deployment.findingsUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-none" title={deployment.findingsUrl}>
                              {}
                              {deployment.findingsUrl.length > 60 ? `${deployment.findingsUrl.substring(0, 60)}...` : deployment.findingsUrl}
                              <FaExternalLinkAlt className="ms-1 small text-muted" />
                            </a>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        {}
                        <td className="py-3 px-4 text-center">
                          <Button
                             variant="outline-secondary"
                             size="sm"
                             className="me-2"
                             title="View details"
                             onClick={() => handleViewDetails(deployment.id)}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            title="Delete"
                            onClick={() => handleDelete(deployment.id, deployment.name)}
                            >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            {}
            {!loading && !error && filteredDeployments.length > 0 && totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="small text-muted">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredDeployments.length)} of {filteredDeployments.length} deployments
                </div>
                <nav aria-label="Deployments pagination">
                  <ul className="pagination pagination-sm mb-0">
                    {/* Previous Button */}
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <Button variant="link" className="page-link" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                        Previous
                      </Button>
                    </li>
                    {}
                    {[...Array(totalPages).keys()].map((number) => (
                       <li key={number + 1} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                         <Button
                           variant={currentPage === number + 1 ? 'primary' : 'link'}
                           className="page-link"
                           onClick={() => paginate(number + 1)}
                         >
                           {number + 1}
                         </Button>
                       </li>
                     ))}
                    {}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <Button variant="link" className="page-link" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                        Next
                      </Button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default SemgrepDeployments;