import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Spinner, Nav, Tab, Alert } from 'react-bootstrap';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FaExclamationTriangle, FaShieldAlt, FaBug, FaSearch, FaServer, FaChartPie } from 'react-icons/fa';

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    findings_by_severity: [],
    recent_scans: [],
    scans_by_status: [],
    scans_by_type: [],
    total_scans: 0,
    total_vulnerabilities: 0
  });

  const [zapScans, setZapScans] = useState([]);
  const [acunetixScans, setAcunetixScans] = useState([]);
  const [semgrepScans, setSemgrepScans] = useState([]);
  const [isLoadingZap, setIsLoadingZap] = useState(true);
  const [isLoadingAcunetix, setIsLoadingAcunetix] = useState(true);
  const [isLoadingSemgrep, setIsLoadingSemgrep] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('auth_token');
        
        const statsResponse = await fetch('http://localhost:4040/api/v1/dashboard/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Handle 401 unauthorized error
        if (statsResponse.status === 401) {
          localStorage.removeItem('auth_token');
          setError('Authentication failed. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        if (!statsResponse.ok) {
          throw new Error(`API request failed with status ${statsResponse.status}`);
        }
        
        const statsData = await statsResponse.json();
        setDashboardStats(statsData);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        setIsLoading(false);
        console.error('Error fetching dashboard data:', err);
      }
    };
    
    fetchDashboardData();
    fetchZapScans();
    fetchAcunetixScans();
    fetchSemgrepScans();
  }, []);

  // Function to fetch ZAP scan data
  const fetchZapScans = async () => {
    try {
      setIsLoadingZap(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('http://localhost:4040/api/v1/zap/scans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`ZAP API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      // Check different possible structures and handle appropriately
      let scans = [];
      if (Array.isArray(data)) {
        scans = data;
      } else if (Array.isArray(data.data)) {
        scans = data.data;
      } else if (data.data && Array.isArray(data.data.scans)) {
        scans = data.data.scans;
      } else if (typeof data === 'object' && Object.keys(data).length > 0) {
        // Fallback if we get an unexpected structure but it has content
        scans = [data];
      }
      setZapScans(scans);
      setIsLoadingZap(false);
    } catch (err) {
      console.error('Error fetching ZAP scan data:', err);
      setIsLoadingZap(false);
    }
  };

  const fetchAcunetixScans = async () => {
    try {
      setIsLoadingAcunetix(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('http://localhost:4040/api/v1/acunetix/scans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Acunetix API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      // Handle different response structure
      const scans = data.data?.scans || [];
      setAcunetixScans(scans);
      setIsLoadingAcunetix(false);
    } catch (err) {
      console.error('Error fetching Acunetix scan data:', err);
      setIsLoadingAcunetix(false);
    }
  };

  const fetchSemgrepScans = async () => {
    try {
      setIsLoadingSemgrep(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('http://localhost:4040/api/v1/semgrep/scans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Semgrep API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setSemgrepScans(Array.isArray(data.data) ? data.data : []);
      setIsLoadingSemgrep(false);
    } catch (err) {
      console.error('Error fetching Semgrep scan data:', err);
      setIsLoadingSemgrep(false);
    }
  };

  const normalizeSeverity = (severity) => {
    if (!severity) return 'unknown';
    const lowerSeverity = severity.toLowerCase();
    if (lowerSeverity === 'informational') return 'info';
    return lowerSeverity;
  };

  // Process vulnerability data for the pie chart
  const vulnerabilityData = dashboardStats.findings_by_severity
    .reduce((acc, item) => {
      const normalizedRisk = normalizeSeverity(item.risk);
      const existingItem = acc.find(i => normalizeSeverity(i.name) === normalizedRisk);
      
      if (existingItem) {
        existingItem.value += item.count;
      } else {
        acc.push({
          name: normalizedRisk === 'medium' ? 'Medium' : 
                normalizedRisk === 'low' ? 'Low' : 
                normalizedRisk === 'high' ? 'High' :
                normalizedRisk === 'critical' ? 'Critical' :
                normalizedRisk === 'info' ? 'Informational' : item.risk,
          value: item.count,
          color: normalizedRisk === 'critical' ? '#dc3545' : 
                normalizedRisk === 'high' ? '#fd7e14' : 
                normalizedRisk === 'medium' ? '#ffc107' : 
                normalizedRisk === 'low' ? '#20c997' : 
                normalizedRisk === 'info' ? '#0dcaf0' : '#6c757d'
        });
      }
      return acc;
    }, []);

  const toolCountsMap = {};
  // First populate from dashboard stats
  dashboardStats.scans_by_type.forEach(item => {
    toolCountsMap[item.scanner.toLowerCase()] = item.count;
  });
  
  // Ensure all scanner types are represented
  // If acunetix is missing in dashboard stats but we have acunetix scans data
  if (!toolCountsMap['acunetix'] && acunetixScans.length > 0) {
    toolCountsMap['acunetix'] = acunetixScans.length;
  }
  
  // Same for other tools
  if (!toolCountsMap['zap'] && zapScans.length > 0) {
    toolCountsMap['zap'] = zapScans.length;
  }
  
  if (!toolCountsMap['semgrep'] && semgrepScans.length > 0) {
    toolCountsMap['semgrep'] = semgrepScans.length;
  }

  const toolComparison = Object.keys(toolCountsMap).map(tool => ({
    name: tool.toUpperCase(),
    scans: toolCountsMap[tool]
  }));

  const getFilteredScans = (scannerType) => {
    return dashboardStats.recent_scans
      .filter(scan => scan.scanner?.toLowerCase() === scannerType.toLowerCase())
      .slice(0, 5);
  };

  const renderSeverityBadge = (count, severity) => {
    if (!count || count <= 0) return null;
    
    const normalizedSeverity = normalizeSeverity(severity);
    const badgeVariant = 
      normalizedSeverity === 'critical' ? 'danger' :
      normalizedSeverity === 'high' ? 'warning' :
      normalizedSeverity === 'medium' ? 'info' :
      normalizedSeverity === 'low' ? 'success' : 'secondary';
    
    return (
      <Badge bg={badgeVariant} pill className="ms-1">
        {count}
      </Badge>
    );
  };

  const renderStatusBadge = (status) => {
    if (!status) return <Badge bg="secondary">Unknown</Badge>;
    
    const statusLower = status.toLowerCase();
    const badgeVariant = 
      statusLower === 'completed' ? 'success' :
      statusLower === 'processing' || statusLower === 'running' ? 'primary' :
      statusLower === 'queued' || statusLower === 'pending' ? 'info' :
      statusLower === 'failed' || statusLower === 'error' ? 'danger' : 'secondary';
    
    // Capitalize first letter of status for consistent display
    const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    return (
      <Badge bg={badgeVariant}>
        {displayStatus}
      </Badge>
    );
  };

  const formatAcunetixScan = (scan) => {
    return {
      id: scan.scan_id || scan.id,
      target: scan.target?.address || scan.target || "Unknown target",
      status: scan.current_session?.status || scan.status || "Unknown",
      vulnerabilities: (
        scan.current_session?.severity_counts?.critical || 0) + 
        (scan.current_session?.severity_counts?.high || 0) + 
        (scan.current_session?.severity_counts?.medium || 0) + 
        (scan.current_session?.severity_counts?.low || 0) + 
        (scan.current_session?.severity_counts?.info || 0),
      date: scan.current_session?.start_date ? new Date(scan.current_session.start_date).toLocaleString() 
          : scan.createdAt ? new Date(scan.createdAt).toLocaleString() 
          : "Unknown"
    };
  };

  // Format vulnerability counts for ZAP scans
  const formatZapScan = (scan) => {
    return {
      id: scan.scanId || scan.id,
      target: scan.targetUrl || scan.target || "Unknown target",
      status: scan.status || "Unknown",
      vulnerabilities: scan.vulnerability_count || 
        ((scan.alertCounts?.high || 0) + 
         (scan.alertCounts?.medium || 0) + 
         (scan.alertCounts?.low || 0) + 
         (scan.alertCounts?.informational || 0)),
      date: scan.timestamp ? new Date(scan.timestamp).toLocaleString() 
          : scan.createdAt ? new Date(scan.createdAt).toLocaleString() 
          : "Unknown"
    };
  };

  // Format vulnerability counts for Semgrep scans
  const formatSemgrepScan = (scan) => {
    return {
      id: scan.scanId || scan.id,
      target: scan.repositoryName || scan.targetPath || scan.target || "Unknown target",
      status: scan.status || "Unknown",
      vulnerabilities: scan.vulnerability_count || 
        ((scan.results?.error || 0) + 
         (scan.results?.warning || 0) + 
         (scan.results?.info || 0)),
      date: scan.timestamp ? new Date(scan.timestamp).toLocaleString() 
          : scan.createdAt ? new Date(scan.createdAt).toLocaleString() 
          : "Unknown"
    };
  };

  // Calculate secure assets (approximation based on scan count vs total assets)
  const estimatedSecureAssets = Math.max(0, 100 - dashboardStats.total_scans);

  return (
    <div className="dashboard-content py-4">
      <Container fluid>
        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading dashboard data...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <>
            {/* Dashboard Header */}
            <Row className="mb-4 align-items-center">
              <Col>
                <h1 className="mb-0">SecMan Security Dashboard</h1>
                <p className="text-muted">Security scanning platform overview</p>
              </Col>
              <Col xs="auto">
                <p className="mb-0 text-end">
                  <small className="text-muted">Last updated: {new Date().toLocaleString()}</small>
                </p>
              </Col>
            </Row>

            {/* Quick Stats Cards */}
            <Row className="mb-4 g-3">
              <Col md={3}>
                <Card className="shadow-sm h-100 border-0">
                  <Card.Body className="d-flex align-items-center">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                      <FaServer className="text-primary" size={24} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Total Scans</h6>
                      <h3 className="mb-0">{dashboardStats.total_scans}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100 border-0">
                  <Card.Body className="d-flex align-items-center">
                    <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                      <FaBug className="text-danger" size={24} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Total Vulnerabilities</h6>
                      <h3 className="mb-0">{dashboardStats.total_vulnerabilities}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100 border-0">
                  <Card.Body className="d-flex align-items-center">
                    <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                      <FaExclamationTriangle className="text-warning" size={24} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Active Scans</h6>
                      <h3 className="mb-0">
                        {dashboardStats.scans_by_status.find(s => 
                          s.status.toLowerCase() === 'processing')?.count || 0}
                      </h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100 border-0">
                  <Card.Body className="d-flex align-items-center">
                    <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                      <FaChartPie className="text-success" size={24} />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Completed Scans</h6>
                      <h3 className="mb-0">
                        {dashboardStats.scans_by_status
                          .filter(s => s.status.toLowerCase() === 'completed')
                          .reduce((total, current) => total + current.count, 0)}
                      </h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Charts Row */}
            <Row className="mb-4 g-3">
              <Col lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body>
                    <Card.Title className="mb-4">Vulnerability Distribution</Card.Title>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={vulnerabilityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        >
                          {vulnerabilityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body>
                    <Card.Title className="mb-4">Scans by Tool</Card.Title>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={toolComparison}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="scans" name="Scan Count" fill="#0d6efd" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Recent Scans Tabs */}
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <Card.Title className="mb-4">Recent Scans</Card.Title>
                <Tab.Container defaultActiveKey="all">
                  <Nav variant="tabs" className="mb-3">
                    <Nav.Item>
                      <Nav.Link eventKey="all">All Scans</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="zap">OWASP ZAP</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="acunetix">Acunetix</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="semgrep">Semgrep</Nav.Link>
                    </Nav.Item>
                  </Nav>
                  <Tab.Content>
                    <Tab.Pane eventKey="all">
                      {dashboardStats.recent_scans.length > 0 ? (
                        <Table responsive hover className="align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Tool</th>
                              <th>Target</th>
                              <th>Status</th>
                              <th>Vulnerabilities</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardStats.recent_scans.slice(0, 10).map(scan => (
                              <tr key={scan.id}>
                                <td>
                                  <Badge bg="secondary">
                                    {scan.scanner?.toUpperCase() || 'Unknown'}
                                  </Badge>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <FaSearch className="me-2 text-secondary" />
                                    {scan.target}
                                  </div>
                                </td>
                                <td>{renderStatusBadge(scan.status)}</td>
                                <td>
                                  {renderSeverityBadge(scan.vulnerability_count, 'medium')}
                                </td>
                                <td>{new Date(scan.createdAt).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted my-4">No recent scans found.</p>
                      )}
                    </Tab.Pane>
                    <Tab.Pane eventKey="zap">
                      {isLoadingZap ? (
                        <div className="text-center my-4">
                          <Spinner animation="border" size="sm" />
                          <p>Loading ZAP scans...</p>
                        </div>
                      ) : zapScans.length > 0 ? (
                        <Table responsive hover className="align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Target</th>
                              <th>Status</th>
                              <th>Vulnerabilities</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {zapScans.slice(0, 5).map(scan => {
                              const formattedScan = formatZapScan(scan);
                              return (
                                <tr key={formattedScan.id}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <FaSearch className="me-2 text-secondary" />
                                      {formattedScan.target}
                                    </div>
                                  </td>
                                  <td>{renderStatusBadge(formattedScan.status)}</td>
                                  <td>
                                    {renderSeverityBadge(formattedScan.vulnerabilities, 'medium')}
                                  </td>
                                  <td>{formattedScan.date}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted my-4">No ZAP scans found.</p>
                      )}
                    </Tab.Pane>
                    <Tab.Pane eventKey="acunetix">
                      {isLoadingAcunetix ? (
                        <div className="text-center my-4">
                          <Spinner animation="border" size="sm" />
                          <p>Loading Acunetix scans...</p>
                        </div>
                      ) : acunetixScans.length > 0 ? (
                        <Table responsive hover className="align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Target</th>
                              <th>Status</th>
                              <th>Vulnerabilities</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {acunetixScans.slice(0, 5).map(scan => {
                              const formattedScan = formatAcunetixScan(scan);
                              return (
                                <tr key={formattedScan.id}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <FaSearch className="me-2 text-secondary" />
                                      {formattedScan.target}
                                    </div>
                                  </td>
                                  <td>{renderStatusBadge(formattedScan.status)}</td>
                                  <td>
                                    {renderSeverityBadge(formattedScan.vulnerabilities, 'medium')}
                                  </td>
                                  <td>{formattedScan.date}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted my-4">No Acunetix scans found.</p>
                      )}
                    </Tab.Pane>
                    <Tab.Pane eventKey="semgrep">
                      {isLoadingSemgrep ? (
                        <div className="text-center my-4">
                          <Spinner animation="border" size="sm" />
                          <p>Loading Semgrep scans...</p>
                        </div>
                      ) : semgrepScans.length > 0 ? (
                        <Table responsive hover className="align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Target</th>
                              <th>Status</th>
                              <th>Vulnerabilities</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semgrepScans.slice(0, 5).map(scan => {
                              const formattedScan = formatSemgrepScan(scan);
                              return (
                                <tr key={formattedScan.id}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <FaSearch className="me-2 text-secondary" />
                                      {formattedScan.target}
                                    </div>
                                  </td>
                                  <td>{renderStatusBadge(formattedScan.status)}</td>
                                  <td>
                                    {renderSeverityBadge(formattedScan.vulnerabilities, 'medium')}
                                  </td>
                                  <td>{formattedScan.date}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted my-4">No Semgrep scans found.</p>
                      )}
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Card.Body>
            </Card>

            {}
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <Card.Title className="mb-4">Scan Status Distribution</Card.Title>
                <Row>
                  {(() => {
                    // Group counts by status
                    const statusGroups = {};
                    dashboardStats.scans_by_status.forEach(item => {
                      const statusLower = item.status.toLowerCase();
                      if (!statusGroups[statusLower]) {
                        statusGroups[statusLower] = {
                          status: statusLower,
                          count: 0
                        };
                      }
                      statusGroups[statusLower].count += item.count;
                    });

                    return Object.values(statusGroups).map((statusItem, index) => {
                      const statusLower = statusItem.status;
                      const bgColor = 
                        statusLower === 'completed' ? 'bg-success' :
                        statusLower === 'processing' || statusLower === 'running' ? 'bg-primary' :
                        statusLower === 'queued' || statusLower === 'pending' ? 'bg-info' :
                        statusLower === 'failed' || statusLower === 'error' ? 'bg-danger' : 'bg-secondary';
                      
                      const displayStatus = statusLower.charAt(0).toUpperCase() + statusLower.slice(1);
                      
                      return (
                        <Col key={index} md={4} lg={3} className="mb-3">
                          <Card className={`${bgColor} bg-gradient text-white`}>
                            <Card.Body className="py-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="mb-0">{displayStatus}</h6>
                                  <small>Status</small>
                                </div>
                                <h4 className="mb-0">{statusItem.count}</h4>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    });
                  })()}
                </Row>
              </Card.Body>
            </Card>
          </>
        )}
      </Container>
    </div>
  );
};

export default Home;