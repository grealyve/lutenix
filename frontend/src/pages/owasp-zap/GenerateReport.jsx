import { Container } from 'react-bootstrap';

const OwaspZapGenerateReport = () => {
  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Generate OWASP ZAP Report</h1>
        <p>This page will allow generating new reports from OWASP ZAP scans.</p>
      </Container>
    </div>
  );
};

export default OwaspZapGenerateReport; 