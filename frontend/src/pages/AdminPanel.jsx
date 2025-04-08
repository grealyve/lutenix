import { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Form, 
  Modal, 
  Badge,
  Pagination,
  Alert,
  Spinner
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });
  
  const itemsPerPage = 8;

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockUsers = [
          { id: 1, name: 'Admin', email: 'admin@lutenix.com', isAdmin: true },
          { id: 2, name: 'Enes Çaylı', email: 'enes@lutenix.com', isAdmin: false },
          { id: 3, name: 'Ali Alğan', email: 'ali@lutenix.com', isAdmin: false },
          { id: 4, name: 'Yusuf Çalışkan', email: 'yusuf@lutenix.com', isAdmin: false },
          { id: 5, name: 'Mehmet Yılmaz', email: 'mehmet@lutenix.com', isAdmin: false },
          { id: 6, name: 'Ayşe Demir', email: 'ayse@lutenix.com', isAdmin: false },
          { id: 7, name: 'Fatma Kaya', email: 'fatma@lutenix.com', isAdmin: false },
          { id: 8, name: 'Ahmet Öztürk', email: 'ahmet@lutenix.com', isAdmin: false },
          { id: 9, name: 'Zeynep Şahin', email: 'zeynep@lutenix.com', isAdmin: false },
          { id: 10, name: 'Mustafa Yıldız', email: 'mustafa@lutenix.com', isAdmin: false },
        ];
        
        setUsers(mockUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
        showAlertMessage('danger', 'Failed to load users. Please try again.');
      }
    };
    
    fetchUsers();
  }, []);

  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / itemsPerPage);
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const toggleUserSelection = (id) => {
    setSelectedUsers(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const currentIds = currentUsers.map(user => user.id);
      setSelectedUsers(prev => [...new Set([...prev, ...currentIds])]);
    } else {
      const currentIds = currentUsers.map(user => user.id);
      setSelectedUsers(prev => prev.filter(id => !currentIds.includes(id)));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      showAlertMessage('danger', 'Please fill all required fields');
      return;
    }
    
    const newUserObj = {
      id: users.length + 1,
      name: newUser.name,
      email: newUser.email,
      isAdmin: newUser.isAdmin
    };
    
    setUsers(prev => [...prev, newUserObj]);
    setShowCreateModal(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      isAdmin: false
    });
    
    showAlertMessage('success', 'User created successfully');
  };

  const handleDeleteUsers = () => {
    if (selectedUsers.length === 0) return;
    
    if (selectedUsers.includes(1)) {
      showAlertMessage('danger', 'Cannot delete admin account');
      return;
    }
    
    const updatedUsers = users.filter(user => !selectedUsers.includes(user.id));
    setUsers(updatedUsers);
    setSelectedUsers([]);
    
    showAlertMessage('success', 'Selected users deleted successfully');
  };

  const handleMakeAdmin = () => {
    if (selectedUsers.length === 0) return;
    
    const updatedUsers = users.map(user => {
      if (selectedUsers.includes(user.id)) {
        return { ...user, isAdmin: true };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    setSelectedUsers([]);
    
    showAlertMessage('success', 'Selected users granted admin privileges');
  };

  const showAlertMessage = (variant, message) => {
    setAlert({
      show: true,
      variant,
      message
    });
    
    setTimeout(() => {
      setAlert({ show: false, variant: '', message: '' });
    }, 3000);
  };

  const renderPaginationItems = () => {
    const items = [];
    
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
        disabled={currentPage === 1} 
      />
    );
    
    for (let number = 1; number <= Math.min(totalPages, 5); number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    
    if (totalPages > 5) {
      items.push(<Pagination.Ellipsis key="ellipsis" />);
      items.push(
        <Pagination.Item
          key={totalPages}
          active={totalPages === currentPage}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
        disabled={currentPage === totalPages || totalPages === 0} 
      />
    );
    
    return items;
  };

  return (
    <div className="page-content admin-panel">
      <Container fluid>
        <div className="admin-panel-header text-center">
          <h1 className="mb-0">ADMIN MANAGEMENT PANEL</h1>
        </div>
        
        {/* Alert */}
        {alert.show && (
          <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
            {alert.message}
          </Alert>
        )}
        
        {/* Action Buttons */}
        <div className="admin-action-buttons d-flex gap-2">
          <Button 
            variant="success" 
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-person-plus me-2"></i>
            Create User
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteUsers}
            disabled={selectedUsers.length === 0}
          >
            <i className="bi bi-person-x me-2"></i>
            Delete User
          </Button>
          <Button 
            variant="info" 
            onClick={handleMakeAdmin}
            disabled={selectedUsers.length === 0}
          >
            <i className="bi bi-person-check me-2"></i>
            Make Admin
          </Button>
        </div>
        
        {/* Users Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading users...</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>
                          <Form.Check 
                            type="checkbox" 
                            onChange={toggleSelectAll} 
                            checked={currentUsers.length > 0 && currentUsers.every(user => selectedUsers.includes(user.id))}
                          />
                        </th>
                        <th>Users <i className="bi bi-funnel-fill ms-1"></i></th>
                        <th>Is Admin <i className="bi bi-funnel-fill ms-1"></i></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map(user => (
                        <tr key={user.id}>
                          <td>
                            <Form.Check 
                              type="checkbox" 
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                            />
                          </td>
                          <td>{user.name}</td>
                          <td>
                            {user.isAdmin ? (
                              <Badge bg="success">Yes</Badge>
                            ) : (
                              <Badge bg="danger">No</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                
                {/* Pagination */}
                <div className="d-flex justify-content-end mt-3">
                  <Pagination size="sm">
                    {renderPaginationItems()}
                  </Pagination>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
        
        {/* Create User Modal */}
        <Modal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          centered
          className="admin-panel"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  placeholder="Enter user's name"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  placeholder="Enter user's email"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  placeholder="Enter user's password"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Admin privileges"
                  name="isAdmin"
                  checked={newUser.isAdmin}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateUser}>
              Create User
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default AdminPanel; 