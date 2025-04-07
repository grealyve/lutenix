import { Container, Row, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import Table from 'react-bootstrap/Table';

const Scans = () => {

  const [data, setData] = useState([
    {
      id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      url: 'https://github.com/juice-shop/juice-shop',
      status: 'pending',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:05:00Z',
    },
    {
      id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0',
      url: 'https://example.com',
      status: 'completed',
      createdAt: '2024-01-02T11:00:00Z',
      updatedAt: '2024-01-02T11:30:00Z',
    }
  ]);

  useEffect(() => {
  }, []);


  const dataMapping = data.map((item) => {
    return (
      <tr key={item.id}>
        <td>{item.id}</td>
        <td>{item.url}</td>
        <td>{item.status}</td>
        <td>{item.createdAt}</td>
        <td>{item.updatedAt}</td>
      </tr>
    )
  })


  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col>
            <h1 className="border-bottom pb-3">Scans</h1>
            <Table striped bordered hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>URL</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
              </tr>
            </thead>
          <tbody> 
            {dataMapping}
          </tbody>
          </Table>
            <p className="mt-4">This is the Scans management page. Content will be added here.</p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Scans; 