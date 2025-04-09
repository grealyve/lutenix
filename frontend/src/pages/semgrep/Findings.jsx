import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Container, Row, Col, Card, Form, InputGroup, Table, Badge, Button, Pagination, Dropdown, OverlayTrigger, Tooltip, Alert, Spinner } from 'react-bootstrap';
import { FaSearch, FaFilter, FaExclamationTriangle, FaInfoCircle, FaEye, FaTrash, FaFileDownload, FaExternalLinkAlt, FaChevronRight } from 'react-icons/fa';
import { semgrepAPI } from '../../utils/api';

const SemgrepFindings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [loadingDeployments, setLoadingDeployments] = useState(false);
  const [deploymentError, setDeploymentError] = useState(null);

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
    critical: { display: 'Critical', color: 'danger', icon: <FaExclamationTriangle /> },
    high: { display: 'High', color: 'danger', icon: <FaExclamationTriangle /> },
    medium: { display: 'Medium', color: 'warning', icon: <FaExclamationTriangle /> },
    low: { display: 'Low', color: 'info', icon: <FaInfoCircle /> },
    info: { display: 'Info', color: 'secondary', icon: <FaInfoCircle /> },
    unknown: { display: 'Unknown', color: 'light', icon: <FaInfoCircle /> }
  };

  const [summary, setSummary] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    unknown: 0
  });

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        setLoadingDeployments(true);
        setDeploymentError(null);
        
        const response = await semgrepAPI.getDeployments();
        
        if (!response || !Array.isArray(response.data)) {
          console.error("Invalid API response structure for deployments:", response);
          throw new Error("Received invalid data format from deployments API.");
        }
        
        setDeployments(response.data);
        
        const params = new URLSearchParams(location.search);
        const slugFromQuery = params.get('deployment_slug');
        
        if (slugFromQuery) {
          const matchingDeployment = response.data.find(dep => dep.slug === slugFromQuery);
          if (matchingDeployment) {
            setSelectedDeployment(matchingDeployment);
          } else {
            setDeploymentError(`Deployment with slug "${slugFromQuery}" not found.`);
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
  }, [location.search]);

  useEffect(() => {
    if (!selectedDeployment) {
      setLoading(false);
      return;
    }
    
    const fetchFindings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching findings for slug: ${selectedDeployment.slug}`);
        const response = await semgrepAPI.getFindingsByDeployment(selectedDeployment.slug);

        if (!response || !Array.isArray(response.data)) {
          console.error("Invalid API response structure for findings:", response);
          throw new Error("Received invalid data format from findings API.");
        }

        const mappedData = response.data.map(finding => ({
          id: finding.id,
          vulnerabilityName: finding.vulnerability_name,
          severity: finding.risk?.toLowerCase() || 'unknown',
          targetUrl: finding.url,
          location: finding.location,
          date: finding.created_at,
          scanId: finding.scan_id
        }));

        setFindings(mappedData);

        const summaryData = mappedData.reduce((acc, finding) => {
          const severityKey = finding.severity;
          acc[severityKey] = (acc[severityKey] || 0) + 1;
          return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0, info: 0, unknown: 0 });

        setSummary(summaryData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching findings:', err);
        setError(err.message || `Failed to fetch findings for ${selectedDeployment.slug}.`);
        setLoading(false);
        setFindings([]);
        setFilteredFindings([]);
      }
    };

    fetchFindings();
  }, [selectedDeployment]);

  useEffect(() => {
    let results = findings;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(finding =>
        finding.vulnerabilityName.toLowerCase().includes(lowerSearchTerm) ||
        finding.location.toLowerCase().includes(lowerSearchTerm) ||
        (finding.targetUrl && finding.targetUrl.toLowerCase().includes(lowerSearchTerm))
      );
    }

    if (filterSeverity !== 'All') {
      const lowerFilterSeverity = filterSeverity.toLowerCase();
      results = results.filter(finding => finding.severity === lowerFilterSeverity);
    }

    setFilteredFindings(results);
    setCurrentPage(1);
  }, [findings, searchTerm, filterSeverity]);

  const handleSelectDeployment = (deployment) => {
    setSelectedDeployment(deployment);
    navigate(`/semgrep/findings?deployment_slug=${deployment.slug}`);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFindings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFindings.length / itemsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-CA');
    } catch (e) {
      return dateString;
    }
  };

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
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
      }
    }

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || totalPages === 0}
      />
    );

    if (startPage > 1) {
      items.push(<Pagination.Item key={1} onClick={() => handlePageChange(1)}>{1}</Pagination.Item>);
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
      }
    }

    for (let number = startPage; number <= endPage; number++) {
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

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
      }
      items.push(<Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>);
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

  const renderDeploymentSelection = () => {
    return (
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-3">Select a Deployment</h5>
          
          {loadingDeployments ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading deployments...</span>
              </Spinner>
            </div>
          ) : deploymentError ? (
            <Alert variant="danger">{deploymentError}</Alert>
          ) : deployments.length === 0 ? (
            <Alert variant="info">No deployments found.</Alert>
          ) : (
            <div className="list-group">
              {deployments.map(deployment => (
                <Button
                  key={deployment.id}
                  variant="outline-primary"
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center mb-2 ${selectedDeployment?.id === deployment.id ? 'active' : ''}`}
                  onClick={() => handleSelectDeployment(deployment)}
                >
                  <div>
                    <div className="fw-bold">{deployment.name}</div>
                    <small className="text-muted">ID: {deployment.id}</small>
                  </div>
                  <FaChevronRight />
                </Button>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Semgrep Findings</h1>
        
        {/* Show deployment selection UI if no deployment is selected */}
        {!location.search && renderDeploymentSelection()}
        
        {/* Show findings if a deployment is selected */}
        {selectedDeployment && (
          <>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
              <h2 className="h4 mb-3 mb-md-0">
                Deployment: <span className="text-primary">{selectedDeployment.name}</span>
              </h2>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => {
                  setSelectedDeployment(null);
                  navigate('/semgrep/findings');
                }}
              >
                Change Deployment
              </Button>
            </div>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            {/* Summary cards */}
            <Row className="mb-4">
              <Col md={12} xl={3} className="mb-3 mb-xl-0">
                <Card className={`bg-${severityMap['critical']?.color || 'secondary'} text-white h-100`}>
                  <Card.Body className="d-flex align-items-center">
                    <div className="me-3">{severityMap['critical']?.icon || <FaExclamationTriangle />}</div>
                    <div>
                      <h5 className="mb-0">Critical & High</h5>
                      <h3 className="mb-0">{summary.critical + summary.high}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} xl={3} className="mb-3 mb-xl-0">
                <Card className={`bg-${severityMap['medium']?.color || 'secondary'} text-dark h-100`}>
                  <Card.Body className="d-flex align-items-center">
                    <div className="me-3">{severityMap['medium']?.icon || <FaExclamationTriangle />}</div>
                    <div>
                      <h5 className="mb-0">Medium</h5>
                      <h3 className="mb-0">{summary.medium}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} xl={3} className="mb-3 mb-xl-0">
                <Card className={`bg-${severityMap['low']?.color || 'secondary'} text-white h-100`}>
                  <Card.Body className="d-flex align-items-center">
                    <div className="me-3">{severityMap['low']?.icon || <FaInfoCircle />}</div>
                    <div>
                      <h5 className="mb-0">Low</h5>
                      <h3 className="mb-0">{summary.low}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} xl={3} className="mb-3 mb-xl-0">
                <Card className={`bg-${severityMap['info']?.color || 'secondary'} text-white h-100`}>
                  <Card.Body className="d-flex align-items-center">
                    <div className="me-3">{severityMap['info']?.icon || <FaInfoCircle />}</div>
                    <div>
                      <h5 className="mb-0">Info / Unknown</h5>
                      <h3 className="mb-0">{summary.info + summary.unknown}</h3>
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
                      <InputGroup.Text className="bg-light border-end-0"><FaSearch /></InputGroup.Text>
                      <Form.Control
                        placeholder="Search name, location, URL..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-start-0"
                        disabled={loading}
                      />
                    </InputGroup>
                  </Col>
                  <Col lg={8} md={6} className="d-flex justify-content-md-end">
                    <Dropdown className="me-2">
                      <Dropdown.Toggle variant="outline-secondary" id="severity-filter" disabled={loading}>
                        <FaFilter className="me-1" />
                        Severity: {filterSeverity}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setFilterSeverity('All')}>All Severities</Dropdown.Item>
                        {Object.entries(severityMap)
                          .filter(([key]) => key !== 'unknown')
                          .map(([key, { display }]) => (
                          <Dropdown.Item key={key} onClick={() => setFilterSeverity(display)}>{display}</Dropdown.Item>
                        ))}
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
                    <h5 className="mb-0 text-muted">
                      {loading ? 'Loading...' : `${filteredFindings.length} finding${filteredFindings.length !== 1 ? 's' : ''} found`}
                      {selectedFindings.length > 0 && ` (${selectedFindings.length} selected)`}
                    </h5>
                  </div>
                  <div>
                    {selectedFindings.length > 0 && !loading && (
                    <>
                      <Button variant="outline-danger" size="sm" className="me-2" disabled>
                        <FaTrash className="me-1" /> Delete Selected
                      </Button>
                      <Button variant="outline-primary" size="sm" disabled>
                        <FaFileDownload className="me-1" /> Export Selected
                      </Button>
                    </>
                    )}
                  </div>
                </div>

                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '3%' }}>
                          <Form.Check
                            type="checkbox"
                            onChange={toggleSelectAll}
                            checked={!loading && currentItems.length > 0 && currentItems.every(item => selectedFindings.includes(item.id))}
                            disabled={loading || currentItems.length === 0}
                          />
                        </th>
                        <th style={{ width: '10%' }}>Severity</th>
                        <th style={{ width: '40%' }}>Vulnerability & Location</th>
                        <th style={{ width: '32%' }}>Target URL</th>
                        <th style={{ width: '10%' }}>Detected</th>
                        <th style={{ width: '5%' }} className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-5">
                            <Spinner animation="border" role="status" variant="primary">
                              <span className="visually-hidden">Loading...</span>
                            </Spinner>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={6} className="text-center py-5 text-danger">
                            Error loading findings: {error}
                          </td>
                        </tr>
                      ) : currentItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">No findings match your criteria.</td>
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
                                bg={severityMap[finding.severity]?.color || 'light'}
                                text={['warning', 'light', 'info'].includes(severityMap[finding.severity]?.color) ? 'dark' : 'white'}
                                className="d-flex align-items-center gap-1 py-1 px-2 text-capitalize"
                              >
                                {severityMap[finding.severity]?.icon} {finding.severity}
                              </Badge>
                            </td>
                            <td>
                              <div className="fw-semibold">{finding.vulnerabilityName}</div>
                              <div className="small text-muted" style={{ wordBreak: 'break-all' }}>{finding.location}</div>
                            </td>
                            <td className="small text-break">
                              {finding.targetUrl ? (
                                <a href={finding.targetUrl} target="_blank" rel="noopener noreferrer" title={finding.targetUrl} className="text-decoration-none">
                                  {finding.targetUrl.replace(/^https?:\/\//, '')}
                                  <FaExternalLinkAlt className="ms-1 small text-muted" />
                                </a>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                            <td className="small">{formatDate(finding.date)}</td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center">
                                <OverlayTrigger placement="top" overlay={<Tooltip>View Details</Tooltip>}>
                                  <Button variant="light" size="sm" className="me-1 text-primary" disabled>
                                    <FaEye />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                                  <Button variant="light" size="sm" className="text-danger" disabled>
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

                {!loading && !error && filteredFindings.length > 0 && totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                    <div className="small text-muted">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredFindings.length)} of {filteredFindings.length} findings
                    </div>
                    <Pagination size="sm" className="mb-0">
                      {renderPaginationItems()}
                    </Pagination>
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

export default SemgrepFindings;