import { Container, Row, Col } from 'react-bootstrap';

const OwaspZap = () => {
  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col>
            <h1 className="border-bottom pb-3">OWASP ZAP</h1>
            <p className="mt-4">This is the OWASP ZAP analysis page. Content will be added here.</p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default OwaspZap; 