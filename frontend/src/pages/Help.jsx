import { Container, Row, Col } from 'react-bootstrap';

const Help = () => {
  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col>
            <h1 className="border-bottom pb-3">Help</h1>
            <p className="mt-4">This is the Help and Documentation page. Content will be added here.</p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Help; 