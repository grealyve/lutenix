import { Container } from 'react-bootstrap';

const SemgrepGenerateReport = () => {
  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Generate Semgrep Report</h1>
        <p>This page will allow generating new reports from Semgrep scans.</p>
      </Container>
    </div>
  );
};

export default SemgrepGenerateReport; 