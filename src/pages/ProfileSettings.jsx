import { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import apiCall from '../utils/api';

const ProfileSettings = () => {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, variant: '', message: '' });
  
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      const fullName = user.name || '';
      const nameParts = fullName.split(' ');
      if (nameParts.length > 0) {
        setName(nameParts[0]);
        setSurname(nameParts.slice(1).join(' '));
      }
      
      setEmail(user.email || '');
    } else {
      setName('Yusuf');
      setSurname('Yıldız');
      setEmail('ysf.yildiz11@gmail.com');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAlertInfo({ show: false, variant: '', message: '' });

    if (password && password !== confirmPassword) {
      setAlertInfo({
        show: true,
        variant: 'danger',
        message: 'Passwords do not match!'
      });
      setIsLoading(false);
      return;
    }

    try {
      await apiCall('/users/updateProfile', {
        method: 'POST',
        body: JSON.stringify({
          name: name,
          surname: surname,
          mail: email
        })
      });

      if (password) {
        await apiCall('/users/updatePassword', {
          method: 'POST',
          body: JSON.stringify({
            password: password,
            confirmPassword: confirmPassword
          })
        });
      }

      setAlertInfo({
        show: true,
        variant: 'success',
        message: 'Profile updated successfully!'
      });
      
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Error updating profile:", error);
      setAlertInfo({
        show: true,
        variant: 'danger',
        message: 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h1 className="mb-4">Profile Settings</h1>
        
        {alertInfo.show && (
          <Alert variant={alertInfo.variant} dismissible onClose={() => setAlertInfo({ ...alertInfo, show: false })}>
            {alertInfo.message}
          </Alert>
        )}
        
        <Card className="mb-4">
          <Card.Body className="bg-light">
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col xs={12} md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Surname</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group className="mb-4">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <hr className="my-4" />
                  <p className="text-muted mb-4">Leave the password fields empty if you don't want to change your password.</p>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      isInvalid={password !== confirmPassword && confirmPassword !== ''}
                    />
                    {password !== confirmPassword && confirmPassword !== '' && (
                      <Form.Control.Feedback type="invalid">
                        Passwords do not match
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end">
                <Button 
                  variant="info" 
                  type="submit" 
                  className="px-4 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default ProfileSettings; 