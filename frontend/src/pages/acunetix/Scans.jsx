import { useState, useEffect } from 'react';
import { Container, Card } from 'react-bootstrap';
import ScanTable from '../../components/ScanTable';

const AcunetixScans = () => {
  const [scanData, setScanData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanStats, setScanStats] = useState({
    scannedAssets: 0,
    vulnerabilities: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockData = [
          { id: 1, target: 'https://google.com', critical: 1, high: 5, medium: 3, low: 9, information: 15 },
          { id: 2, target: 'https://tesla.com', critical: 2, high: 7, medium: 14, low: 32, information: 8 },
          { id: 3, target: 'https://n11.com', critical: 0, high: 7, medium: 6, low: 27, information: 11 },
          { id: 4, target: 'https://trendyol.com', critical: 2, high: 3, medium: 0, low: 12, information: 0 },
          { id: 5, target: 'https://hepsiburada.com', critical: 4, high: 4, medium: 1, low: 23, information: 20 },
          { id: 6, target: 'https://sahibinden.com', critical: 6, high: 9, medium: 11, low: 44, information: 22 }
        ];
        
        setScanData(mockData);
        
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
    alert('Start scan functionality would open a form to configure a new scan');
  };

  const handleDeleteScan = (selectedScanIds) => {
    if (window.confirm(`Are you sure you want to delete ${selectedScanIds.length} scan(s)?`)) {
      setScanData(scanData.filter(scan => !selectedScanIds.includes(scan.id)));
      alert(`Deleted ${selectedScanIds.length} scan(s)`);
    }
  };

  const handleStopScan = (selectedScanIds) => {
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
          title="Acunetix Scans"
          data={scanData}
          onStartScan={handleStartScan}
          onDeleteScan={handleDeleteScan}
          onStopScan={handleStopScan}
        />
      </Container>
    </div>
  );
};

export default AcunetixScans; 