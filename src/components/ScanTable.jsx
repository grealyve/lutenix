import { useState } from 'react';
import { Table, Form, Button, Pagination } from 'react-bootstrap';

const ScanTable = ({ 
  title, 
  data, 
  onStartScan, 
  onDeleteScan, 
  onStopScan 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const itemsPerPage = 8;
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const handleSelectItem = (targetId) => {
    if (selectedItems.includes(targetId)) {
      setSelectedItems(selectedItems.filter(id => id !== targetId));
    } else {
      setSelectedItems([...selectedItems, targetId]);
    }
  };
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentPageIds = currentItems.map(item => item.id);
      setSelectedItems([...selectedItems, ...currentPageIds.filter(id => !selectedItems.includes(id))]);
    } else {
      const currentPageIds = currentItems.map(item => item.id);
      setSelectedItems(selectedItems.filter(id => !currentPageIds.includes(id)));
    }
  };
  
  const renderPaginationItems = () => {
    let items = [];
    
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
    <div className="scan-table-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">{title}</h2>
        <div>
          <Button 
            variant="info" 
            className="me-2 text-white" 
            onClick={onStartScan}
          >
            Start Scan
          </Button>
          <Button 
            variant="danger" 
            className="me-2" 
            onClick={() => onDeleteScan(selectedItems)}
            disabled={selectedItems.length === 0}
          >
            Delete Scan
          </Button>
          <Button 
            variant="primary" 
            onClick={() => onStopScan(selectedItems)}
            disabled={selectedItems.length === 0}
          >
            Stop Scan
          </Button>
        </div>
      </div>
      
      <Table bordered hover responsive className="mt-3">
        <thead className="bg-secondary text-white">
          <tr>
            <th style={{ width: '40px' }}>
              <Form.Check 
                type="checkbox" 
                onChange={handleSelectAll}
                checked={currentItems.length > 0 && currentItems.every(item => selectedItems.includes(item.id))}
              />
            </th>
            <th>Target <i className="bi bi-funnel"></i></th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map(item => (
            <tr key={item.id}>
              <td>
                <Form.Check 
                  type="checkbox" 
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                />
              </td>
              <td>{item.target}</td>
              <td>
                <span className={`badge bg-${getStatusColor(item.status)}`}>
                  {formatStatus(item.status)}
                </span>
              </td>
              <td>{item.createdAt}</td>
            </tr>
          ))}
          
          {currentItems.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center py-3">No scan results found</td>
            </tr>
          )}
        </tbody>
      </Table>
      
      <div className="d-flex justify-content-end mt-3">
        <Pagination>{renderPaginationItems()}</Pagination>
      </div>
      
      {totalPages > 0 && (
        <div className="text-end mt-2 text-muted small">
          Page {currentPage} of {totalPages}
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'finished':
      return 'success';
    case 'running':
      return 'primary';
    case 'completed':
      return 'success';
    case 'in progress':
      return 'primary';
    case 'queued':
      return 'info';
    case 'failed':
      return 'danger';
    default:
      return 'secondary';
  }
};
const formatStatus = (status) => {
  if (!status) return 'Unknown';
  
  const statusLower = status.toLowerCase();
  
  const statusMap = {
    'finished': 'Completed',
    'running': 'In Progress',
    'completed': 'Completed',
    'in progress': 'In Progress',
    'queued': 'Queued',
    'failed': 'Failed'
  };
  
  return statusMap[statusLower] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export default ScanTable;