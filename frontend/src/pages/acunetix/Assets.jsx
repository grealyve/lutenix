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
  Tooltip
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
  FaRedo
} from 'react-icons/fa';

const AcunetixAssets = () => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [sortField, setSortField] = useState('target');
  const [sortDirection, setSortDirection] = useState('asc');
  const [stats, setStats] = useState({
    total: 0,
    scanned: 0
  });
  
  const itemsPerPage = 8;

  // Fetch assets data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Mock data - in a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = [
          {
            id: 1,
            target: 'https://google.com',
            scanStatus: 'Yes',
            lastScan: '2023-05-10',
            vulnerabilities: 5
          },
          {
            id: 2,
            target: '127.0.0.1',
            scanStatus: 'Yes',
            lastScan: '2023-05-09',
            vulnerabilities: 2
          },
          {
            id: 3,
            target: 'https://tesla.com',
            scanStatus: 'No',
            lastScan: 'Never',
            vulnerabilities: 0
          },
          {
            id: 4,
            target: 'http://www.tesla.com',
            scanStatus: 'Yes',
            lastScan: '2023-05-07',
            vulnerabilities: 8
          },
          {
            id: 5,
            target: '127.0.0.1',
            scanStatus: 'Yes',
            lastScan: '2023-05-05',
            vulnerabilities: 3
          },
          {
            id: 6,
            target: '127.0.0.1',
            scanStatus: 'No',
            lastScan: 'Never',
            vulnerabilities: 0
          },
          {
            id: 7,
            target: '127.0.0.1',
            scanStatus: 'Yes',
            lastScan: '2023-05-01',
            vulnerabilities: 1
          },
          {
            id: 8,
            target: '127.0.0.1',
            scanStatus: 'No',
            lastScan: 'Never',
            vulnerabilities: 0
          },
          {
            id: 9,
            target: 'https://example.com',
            scanStatus: 'Yes',
            lastScan: '2023-04-28',
            vulnerabilities: 6
          },
          {
            id: 10,
            target: 'https://microsoft.com',
            scanStatus: 'No',
            lastScan: 'Never',
            vulnerabilities: 0
          },
          {
            id: 11,
            target: 'https://github.com',
            scanStatus: 'Yes',
            lastScan: '2023-04-22',
            vulnerabilities: 3
          },
          {
            id: 12,
            target: 'https://gitlab.com',
            scanStatus: 'Yes',
            lastScan: '2023-04-20',
            vulnerabilities: 2
          }
        ];
        
        setAssets(mockData);
        
        // Calculate stats
        const scannedCount = mockData.filter(asset => asset.scanStatus === 'Yes').length;
        setStats({
          total: mockData.length,
          scanned: scannedCount
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching assets:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters, search, and sorting
  useEffect(() => {
    let results = [...assets];
    
    // Apply search term
    if (searchTerm) {
      results = results.filter(asset =>
        asset.target.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'All') {
      results = results.filter(asset => asset.scanStatus === filterStatus);
    }
    
    // Apply sorting
    results.sort((a, b) => {
      if (sortField === 'target') {
        return sortDirection === 'asc' 
          ? a.target.localeCompare(b.target)
          : b.target.localeCompare(a.target);
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
      return 0;
    });
    
    setFilteredAssets(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [assets, searchTerm, filterStatus, sortField, sortDirection]);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  
  // Handle pagination click
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  // Handle checkbox selection
  const toggleAssetSelection = (id) => {
    setSelectedAssets(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(item => item !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };
  
  // Select all assets on current page
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const currentIds = currentItems.map(item => item.id);
      setSelectedAssets(prev => [...new Set([...prev, ...currentIds])]);
    } else {
      const currentIds = currentItems.map(item => item.id);
      setSelectedAssets(prev => prev.filter(id => !currentIds.includes(id)));
    }
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle add asset
  const handleAddAsset = () => {
    // Validate URL
    if (!newAssetUrl.trim()) return;
    
    // Create new asset
    const newAsset = {
      id: assets.length + 1,
      target: newAssetUrl,
      scanStatus: 'No',
      lastScan: 'Never',
      vulnerabilities: 0
    };
    
    // Add to assets
    setAssets(prev => [...prev, newAsset]);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      total: prev.total + 1
    }));
    
    // Close modal and reset form
    setShowAddModal(false);
    setNewAssetUrl('');
  };
  
  // Handle delete assets
  const handleDeleteAssets = () => {
    // Filter out selected assets
    const updatedAssets = assets.filter(asset => !selectedAssets.includes(asset.id));
    
    // Update assets
    setAssets(updatedAssets);
    
    // Update stats
    const scannedCount = updatedAssets.filter(asset => asset.scanStatus === 'Yes').length;
    setStats({
      total: updatedAssets.length,
      scanned: scannedCount
    });
    
    // Clear selection
    setSelectedAssets([]);
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

  // Render sort icon based on current sort state
  const renderSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ms-1 text-muted" />;
    if (sortDirection === 'asc') return <FaSortUp className="ms-1" />;
    return <FaSortDown className="ms-1" />;
  };
  
  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Acunetix Assets</h1>
        
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
                  <FaPlus className="me-2" /> Add Asset
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
                      <td colSpan={6} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">No assets match your filters</td>
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
                            <Badge bg={asset.vulnerabilities > 5 ? "danger" : asset.vulnerabilities > 2 ? "warning" : "info"}>
                              {asset.vulnerabilities}
                            </Badge>
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
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAssets.length)} of {filteredAssets.length} assets
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
            <Modal.Title>Add New Asset</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Asset URL or IP</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="https://example.com or 127.0.0.1"
                  value={newAssetUrl}
                  onChange={(e) => setNewAssetUrl(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Enter a valid URL with protocol (https://) or an IP address
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddAsset} disabled={!newAssetUrl.trim()}>
              Add Asset
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default AcunetixAssets; 