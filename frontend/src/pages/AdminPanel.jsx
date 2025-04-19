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
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    isAdmin: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });
  
  const itemsPerPage = 10;

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('http://localhost:4040/api/v1/admin/getUsers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      const formattedUsers = data.map(user => ({
        id: user.id,
        name: `${user.name} ${user.surname}`,
        email: user.email,
        isAdmin: user.role === 'admin'
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      showAlertMessage('danger', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      showAlertMessage('danger', 'Please fill all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('http://localhost:4040/api/v1/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUser.name,
          surname: newUser.surname || '',
          email: newUser.email,
          password: newUser.password,
          role: newUser.isAdmin ? 'admin' : 'user'
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login');
          return;
        }
        throw new Error('Failed to create user');
      }
      
      setShowCreateModal(false);
      setNewUser({
        name: '',
        surname: '',
        email: '',
        password: '',
        isAdmin: false
      });
      
      showAlertMessage('success', 'User created successfully');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error creating user:', error);
      showAlertMessage('danger', error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // Process each selected user
      for (const userId of selectedUsers) {
        const userToDelete = users.find(user => user.id === userId);
        if (!userToDelete) continue;
        
        // Skip deletion of admin user (if applicable)
        if (userToDelete.isAdmin && userToDelete.email === 'admin@admin.com') {
          showAlertMessage('danger', 'Cannot delete main admin account');
          continue;
        }
        
        const response = await fetch('http://localhost:4040/api/v1/admin/deleteUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email: userToDelete.email })
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            navigate('/login');
            return;
          }
          throw new Error(`Failed to delete ${userToDelete.name}`);
        }
      }
      
      setSelectedUsers([]);
      showAlertMessage('success', 'Selected users deleted successfully');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error deleting users:', error);
      showAlertMessage('danger', error.message || 'Failed to delete users');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // Process each selected user
      for (const userId of selectedUsers) {
        const userToUpdate = users.find(user => user.id === userId);
        if (!userToUpdate) continue;
        
        const response = await fetch('http://localhost:4040/api/v1/admin/makeAdmin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email: userToUpdate.email })
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            navigate('/login');
            return;
          }
          throw new Error(`Failed to make ${userToUpdate.name} an admin`);
        }
      }
      
      setSelectedUsers([]);
      showAlertMessage('success', 'Selected users granted admin privileges');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error making users admin:', error);
      showAlertMessage('danger', error.message || 'Failed to update admin privileges');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeUser = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      console.log('Making users regular users...');
      
      for (const userId of selectedUsers) {
        const userToUpdate = users.find(user => user.id === userId);
        if (!userToUpdate) continue;
        
        // Case-insensitive comparison to ensure admin protection
        if (userToUpdate.email.toLowerCase() === 'admin@admin.com'.toLowerCase()) {
          showAlertMessage('danger', 'Cannot change main admin account to regular user');
          console.log('Attempted to change admin account - operation blocked');
          continue;
        }
        
        console.log(`Sending makeUser request for ${userToUpdate.email}`);
        
        const response = await fetch('http://localhost:4040/api/v1/admin/makeUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email: userToUpdate.email })
        });
        
        console.log('makeUser response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            navigate('/login');
            return;
          }
          throw new Error(`Failed to make ${userToUpdate.name} a regular user`);
        }
      }
      
      setSelectedUsers([]);
      showAlertMessage('success', 'Selected users changed to regular users');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error making regular users:', error);
      showAlertMessage('danger', error.message || 'Failed to update user privileges');
    } finally {
      setLoading(false);
    }
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
          <Button 
            variant="secondary" 
            onClick={handleMakeUser}
            disabled={selectedUsers.length === 0}
          >
            <i className="bi bi-person me-2"></i>
            Make Regular User
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
                        <th>User <i className="bi bi-funnel-fill ms-1"></i></th>
                        <th>Email <i className="bi bi-funnel-fill ms-1"></i></th>
                        <th>Role <i className="bi bi-funnel-fill ms-1"></i></th>
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
                          <td>{user.email}</td>
                          <td>
                            {user.isAdmin ? (
                              <Badge bg="success">Admin</Badge>
                            ) : (
                              <Badge bg="secondary">User</Badge>
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
                <Form.Label>Surname</Form.Label>
                <Form.Control
                  type="text"
                  name="surname"
                  value={newUser.surname}
                  onChange={handleInputChange}
                  placeholder="Enter user's surname"
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