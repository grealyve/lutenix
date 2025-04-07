import { Container, Row, Col, Card } from 'react-bootstrap';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Home = () => {
  const vulnerabilityData = [
    { name: 'Critical', value: 14.3, color: '#FF4444' },
    { name: 'High', value: 14.3, color: '#FF7777' },
    { name: 'Medium', value: 14.3, color: '#FFCC44' },
    { name: 'Low', value: 14.3, color: '#44D7B6' },
    { name: 'Information', value: 42.8, color: '#9FE7F5' },
  ];

  return (
    <div className="dashboard-content">
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <h1 className="border-bottom pb-3">Welcome To Lutenix Dashboard</h1>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={6}>
            <div className="dashboard-stats">
              <h3 className="mb-4">Your Asset Count: <span className="text-primary">384</span></h3>
              <h3>Vulnerability Count: <span className="text-primary">892</span></h3>
            </div>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Body>
                <Card.Title className="text-center mb-4">Vulnerability Chart</Card.Title>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vulnerabilityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    >
                      {vulnerabilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home; 