import { useState, useEffect } from 'react';
import { Container, Card } from 'react-bootstrap';
import ScanTable from '../../components/ScanTable';

const OwaspZapScans = () => {
  const [scanData, setScanData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanStats, setScanStats] = useState({
    scannedAssets: 0,
    vulnerabilities: 0
  });

  // Fetch scan data on component mount
  useEffect(() => {
    // This would normally be an API call
    // In this example, we're using mock data
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockData = [
          { id: 1, target: 'https://google.com', critical: 1, high: 5, medium: 3, low: 9, information: 15 },
          { id: 2, target: 'https://tesla.com', critical: 2, high: 7, medium: 14, low: 32, information: 8 },
          { id: 3, target: 'https://n11.com', critical: 0, high: 7, medium: 6, low: 27, information: 11 },
          { id: 4, target: 'https://trendyol.com', critical: 2, high: 3, medium: 0, low: 12, information: 0 },
          { id: 5, target: 'https://hepsiburada.com', critical: 4, high: 4, medium: 1, low: 23, information: 20 },
          { id: 6, target: 'https://sahibinden.com', critical: 6, high: 9, medium: 11, low: 44, information: 22 },
          { id: 7, target: 'https://bim.com', critical: 1, high: 8, medium: 21, low: 75, information: 30 },
          { id: 8, target: 'https://abdiiibrahim.com', critical: 0, high: 11, medium: 18, low: 21, information: 6 }
        ];
        
        setScanData(mockData);
        
        // Calculate scan statistics
        const totalAssets = mockData.length;
        const totalVulnerabilities = mockData.reduce((acc, scan) => 
          acc + scan.critical + scan.high + scan.medium + scan.low + scan.information, 0);
          
        setScanStats({
          scannedAssets: totalAssets,
          vulnerabilities: totalVulnerabilities
        });
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch scan data');
        setIsLoading(false);
        console.error('Error fetching scan data:', err);
      }
    };
    
    fetchData();
  }, []);

  const handleStartScan = () => {
    // This would open a modal or navigate to a new scan form
    alert('Start scan functionality would open a form to configure a new scan');
  };

  const handleDeleteScan = (selectedScanIds) => {
    // This would call an API to delete the selected scans
    if (window.confirm(`Are you sure you want to delete ${selectedScanIds.length} scan(s)?`)) {
      setScanData(scanData.filter(scan => !selectedScanIds.includes(scan.id)));
      alert(`Deleted ${selectedScanIds.length} scan(s)`);
    }
  };

  const handleStopScan = (selectedScanIds) => {
    // This would call an API to stop the selected scans
    alert(`Stopped ${selectedScanIds.length} scan(s)`);
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Card className="mb-4 bg-secondary text-white">
          <Card.Body>
            <div className="d-flex justify-content-between">
              <div>
                <h2>Scanned Asset: {scanStats.scannedAssets}</h2>
                <h2>Vulnerabilities: {scanStats.vulnerabilities}</h2>
              </div>
            </div>
          </Card.Body>
        </Card>
        
        <ScanTable
          title="OWASP ZAP Scans"
          data={scanData}
          onStartScan={handleStartScan}
          onDeleteScan={handleDeleteScan}
          onStopScan={handleStopScan}
        />
      </Container>
    </div>
  );
};

export default OwaspZapScans; 