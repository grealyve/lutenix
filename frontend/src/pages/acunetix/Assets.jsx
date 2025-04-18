import { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Form, 
  InputGroup, 
  Badge,
  Modal,
  Pagination,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  Alert
} from 'react-bootstrap';
import { 
  FaPlus, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaCheckCircle, 
  FaTimesCircle,
  FaInfoCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaRedo,
  FaExclamationTriangle
} from 'react-icons/fa';

const AcunetixAssets = () => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetUrls, setTargetUrls] = useState('');
  const [addingAsset, setAddingAsset] = useState(false);
  const [sortField, setSortField] = useState('address');
  const [sortDirection, setSortDirection] = useState('asc');
  const [stats, setStats] = useState({
    total: 0,
    scanned: 0
  });
  
  const itemsPerPage = 8;
  const apiUrl = 'http://localhost:4040/api/v1/acunetix/targets';

  // Fetch assets data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          setError('Session expired. Please log in again.');
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        const transformedData = result.data.targets.map(target => ({
          id: target.target_id,
          target: target.address,
          fqdn: target.fqdn,
          scanStatus: target.last_scan_date ? 'Yes' : 'No',
          lastScan: target.last_scan_date ? new Date(target.last_scan_date).toLocaleDateString() : 'Never',
          lastScanStatus: target.last_scan_session_status,
          vulnerabilities: calculateTotalVulnerabilities(target.severity_counts),
          severityCounts: target.severity_counts,
          description: target.description,
          threat: target.threat
        }));
        
        setAssets(transformedData);
        
        const scannedCount = transformedData.filter(asset => asset.scanStatus === 'Yes').length;
        setStats({
          total: transformedData.length,
          scanned: scannedCount
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching assets:', error);
        setError('Failed to load Acunetix assets. Please try again later.');
        setLoading(false);
      }
    };
    
    const calculateTotalVulnerabilities = (severityCounts) => {
      if (!severityCounts) return 0;
      return (
        (severityCounts.critical || 0) +
        (severityCounts.high || 0) +
        (severityCounts.medium || 0) +
        (severityCounts.low || 0) +
        (severityCounts.info || 0)
      );
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    let results = [...assets];
    
    if (searchTerm) {
      results = results.filter(asset =>
        asset.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.fqdn.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'All') {
      results = results.filter(asset => asset.scanStatus === filterStatus);
    }
    
    results.sort((a, b) => {
      if (sortField === 'target') {
        return sortDirection === 'asc' 
          ? a.target.localeCompare(b.target)
          : b.target.localeCompare(a.target);
      }
      if (sortField === 'fqdn') {
        return sortDirection === 'asc' 
          ? a.fqdn.localeCompare(b.fqdn)
          : b.fqdn.localeCompare(a.fqdn);
      }
      if (sortField === 'scanStatus') {
        return sortDirection === 'asc' 
          ? a.scanStatus.localeCompare(b.scanStatus)
          : b.scanStatus.localeCompare(a.scanStatus);
      }
      if (sortField === 'lastScan') {
        // Handle 'Never' as a special case
        if (a.lastScan === 'Never' && b.lastScan !== 'Never') return sortDirection === 'asc' ? 1 : -1;
        if (a.lastScan !== 'Never' && b.lastScan === 'Never') return sortDirection === 'asc' ? -1 : 1;
        if (a.lastScan === 'Never' && b.lastScan === 'Never') return 0;
        
        return sortDirection === 'asc' 
          ? new Date(a.lastScan) - new Date(b.lastScan)
          : new Date(b.lastScan) - new Date(a.lastScan);
      }
      if (sortField === 'vulnerabilities') {
        return sortDirection === 'asc' 
          ? a.vulnerabilities - b.vulnerabilities
          : b.vulnerabilities - a.vulnerabilities;
      }
      if (sortField === 'threat') {
        return sortDirection === 'asc' 
          ? a.threat - b.threat
          : b.threat - a.threat;
      }
      return 0;
    });
    
    setFilteredAssets(results);
    setCurrentPage(1);
  }, [assets, searchTerm, filterStatus, sortField, sortDirection]);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const toggleAssetSelection = (id) => {
    setSelectedAssets(prevSelected => {
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
      setSelectedAssets(prev => [...new Set([...prev, ...currentIds])]);
    } else {
      const currentIds = currentItems.map(item => item.id);
      setSelectedAssets(prev => prev.filter(id => !currentIds.includes(id)));
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleAddAsset = async () => {
    if (!targetUrls.trim()) return;
    
    try {
      setLoading(true);
      setAddingAsset(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        setAddingAsset(false);
        return;
      }
      
      // Parse input - split by newline and filter empty lines
      const urls = targetUrls.split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      if (urls.length === 0) {
        setError('Please enter at least one valid URL.');
        setLoading(false);
        setAddingAsset(false);
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each URL sequentially
      for (const url of urls) {
        try {          
          const response = await fetch('http://localhost:4040/api/v1/acunetix/targets', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ target_url: url })
          });
          
          console.log(`Response status for ${url}: ${response.status}`);
          
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            setError('Session expired. Please log in again.');
            setLoading(false);
            setAddingAsset(false);
            return;
          }
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response for ${url}:`, errorText);
            throw new Error(`Failed to add target: ${url} (${response.status})`);
          }
          
          const result = await response.json();
          console.log(`Successfully added target: ${url}`, result);
          successCount++;
          
          // Add small delay between requests to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error adding target ${url}:`, error);
          errorCount++;
        }
      }
      
      // After processing all URLs, refresh the asset list regardless of errors
      try {
        console.log("Refreshing asset list after additions");
        const fetchResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (fetchResponse.ok) {
          const result = await fetchResponse.json();
          
          if (result && result.data && Array.isArray(result.data.targets)) {
            const transformedData = result.data.targets.map(target => ({
              id: target.target_id,
              target: target.address,
              fqdn: target.fqdn || '',
              scanStatus: target.last_scan_date ? 'Yes' : 'No',
              lastScan: target.last_scan_date ? new Date(target.last_scan_date).toLocaleDateString() : 'Never',
              lastScanStatus: target.last_scan_session_status || '',
              vulnerabilities: calculateTotalVulnerabilities(target.severity_counts),
              severityCounts: target.severity_counts || {},
              description: target.description || '',
              threat: target.threat || 0
            }));
            
            setAssets(transformedData);
            
            const scannedCount = transformedData.filter(asset => asset.scanStatus === 'Yes').length;
            setStats({
              total: transformedData.length,
              scanned: scannedCount
            });
          } else {
            console.error("Invalid response format:", result);
          }
        } else {
          console.error("Failed to refresh asset list:", fetchResponse.status);
        }
      } catch (refreshError) {
        console.error("Error refreshing asset list:", refreshError);
      }
      
      // Show result message
      if (errorCount > 0 && successCount > 0) {
        setSuccess(`Successfully added ${successCount} targets.`);
        setError(`Failed to add ${errorCount} targets. Check console for details.`);
      } else if (errorCount > 0) {
        setError(`Failed to add ${errorCount} targets. Check console for details.`);
      } else if (successCount > 0) {
        setSuccess(`Successfully added ${successCount} targets.`);
      }
      
      setShowAddModal(false);
      setTargetUrls('');
      setLoading(false);
      setAddingAsset(false);
    } catch (error) {
      console.error('Error adding assets:', error);
      setError('Failed to add assets. Please try again.');
      setLoading(false);
      setAddingAsset(false);
    }
  };
  
  const handleDeleteAssets = async () => {
    if (selectedAssets.length === 0) return;
    
    try {
      setLoading(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedAssets = assets.filter(asset => !selectedAssets.includes(asset.id));
      
      setAssets(updatedAssets);
      
      const scannedCount = updatedAssets.filter(asset => asset.scanStatus === 'Yes').length;
      setStats({
        total: updatedAssets.length,
        scanned: scannedCount
      });
      
      setSelectedAssets([]);
      setLoading(false);
    } catch (error) {
      console.error('Error deleting assets:', error);
      setError('Failed to delete assets. Please try again.');
      setLoading(false);
    }
  };
  
  const getSeverityBadgeColor = (count) => {
    if (count > 10) return "danger";
    if (count > 5) return "warning";
    if (count > 0) return "info";
    return "secondary";
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

  const renderSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ms-1 text-muted" />;
    if (sortDirection === 'asc') return <FaSortUp className="ms-1" />;
    return <FaSortDown className="ms-1" />;
  };
  
  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Acunetix Assets</h1>
        
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}
        
        {/* Success Alert */}
        {success && (
          <Alert variant="success" className="mb-4" dismissible onClose={() => setSuccess(null)}>
            <FaCheckCircle className="me-2" />
            {success}
          </Alert>
        )}
        
        {/* Stats and Action Buttons */}
        <Card className="bg-dark text-white mb-4 border-0 shadow">
          <Card.Body className="py-4">
            <Row className="align-items-center">
              <Col md={8} className="d-flex">
                <div className="me-5">
                  <h6 className="text-white-50 mb-1">Asset Count</h6>
                  <h2 className="mb-0">{stats.total}</h2>
                </div>
                <div>
                  <h6 className="text-white-50 mb-1">Scanned Assets</h6>
                  <h2 className="mb-0">{stats.scanned}</h2>
                </div>
              </Col>
              <Col md={4} className="text-md-end mt-3 mt-md-0">
                <Button 
                  variant="primary" 
                  className="me-2" 
                  onClick={() => setShowAddModal(true)}
                >
                  <FaPlus className="me-2" /> Add Assets
                </Button>
                <Button 
                  variant="danger" 
                  disabled={selectedAssets.length === 0}
                  onClick={handleDeleteAssets}
                >
                  <FaTrash className="me-2" /> Delete Asset
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
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
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col lg={8} md={6} className="d-flex justify-content-md-end">
                <Dropdown>
                  <Dropdown.Toggle variant="light" id="status-filter">
                    <FaFilter className="me-2" />
                    Scan Status: {filterStatus}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setFilterStatus('All')}>All</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('Yes')}>Scanned</Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterStatus('No')}>Not Scanned</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Assets Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-0">
                  Total assets: {filteredAssets.length}
                  {selectedAssets.length > 0 && ` (${selectedAssets.length} selected)`}
                </h5>
              </div>
              {selectedAssets.length > 0 && (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Scan Selected Assets</Tooltip>}
                >
                  <Button variant="outline-success" size="sm">
                    <FaRedo className="me-1" /> Scan Selected
                  </Button>
                </OverlayTrigger>
              )}
            </div>
            
            <div className="table-responsive">
              <Table hover>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40px' }}>
                      <Form.Check 
                        type="checkbox" 
                        onChange={toggleSelectAll} 
                        checked={currentItems.length > 0 && currentItems.every(item => selectedAssets.includes(item.id))}
                      />
                    </th>
                    <th className="cursor-pointer" onClick={() => handleSort('target')}>
                      Target {renderSortIcon('target')}
                    </th>
                    <th className="cursor-pointer" onClick={() => handleSort('fqdn')}>
                      FQDN {renderSortIcon('fqdn')}
                    </th>
                    <th className="cursor-pointer" onClick={() => handleSort('scanStatus')}>
                      Scan Status {renderSortIcon('scanStatus')}
                    </th>
                    <th className="cursor-pointer" onClick={() => handleSort('lastScan')}>
                      Last Scan {renderSortIcon('lastScan')}
                    </th>
                    <th className="cursor-pointer" onClick={() => handleSort('vulnerabilities')}>
                      Vulnerabilities {renderSortIcon('vulnerabilities')}
                    </th>
                    <th style={{ width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">No assets match your filters</td>
                    </tr>
                  ) : (
                    currentItems.map(asset => (
                      <tr key={asset.id}>
                        <td>
                          <Form.Check 
                            type="checkbox" 
                            checked={selectedAssets.includes(asset.id)}
                            onChange={() => toggleAssetSelection(asset.id)}
                          />
                        </td>
                        <td>{asset.target}</td>
                        <td>{asset.fqdn}</td>
                        <td>
                          {asset.scanStatus === 'Yes' ? (
                            <Badge bg="success" className="d-inline-flex align-items-center">
                              <FaCheckCircle className="me-1" /> Yes
                            </Badge>
                          ) : (
                            <Badge bg="danger" className="d-inline-flex align-items-center">
                              <FaTimesCircle className="me-1" /> No
                            </Badge>
                          )}
                        </td>
                        <td>{asset.lastScan}</td>
                        <td>
                          {asset.vulnerabilities > 0 ? (
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip>
                                  Critical: {asset.severityCounts.critical || 0}<br />
                                  High: {asset.severityCounts.high || 0}<br />
                                  Medium: {asset.severityCounts.medium || 0}<br />
                                  Low: {asset.severityCounts.low || 0}<br />
                                  Info: {asset.severityCounts.info || 0}
                                </Tooltip>
                              }
                            >
                              <Badge bg={getSeverityBadgeColor(asset.vulnerabilities)}>
                                {asset.vulnerabilities}
                              </Badge>
                            </OverlayTrigger>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Scan Asset</Tooltip>}
                            >
                              <Button variant="outline-primary" size="sm">
                                <FaRedo />
                              </Button>
                            </OverlayTrigger>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>View Details</Tooltip>}
                            >
                              <Button variant="outline-info" size="sm">
                                <FaInfoCircle />
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
                Showing {filteredAssets.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredAssets.length)} of {filteredAssets.length} assets
              </div>
              <Pagination size="sm" className="mb-0">
                {renderPaginationItems()}
              </Pagination>
            </div>
          </Card.Body>
        </Card>
        
        {/* Add Asset Modal */}
        <Modal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Add New Assets</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Target URLs or IPs</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  placeholder="https://example1.com&#10;https://example2.com&#10;127.0.0.1"
                  value={targetUrls}
                  onChange={(e) => setTargetUrls(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Enter one target per line. Each target should be a valid URL with protocol (https://) or an IP address.
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddAsset} 
              disabled={!targetUrls.trim() || addingAsset}
            >
              {addingAsset ? 'Adding...' : 'Add Assets'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default AcunetixAssets;