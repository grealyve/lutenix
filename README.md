# SecMan Security Scanner Dashboard

SecMan is a comprehensive security scanning platform that integrates multiple industry-standard security scanners into a unified dashboard, providing real-time vulnerability assessment and management.

![image](https://github.com/user-attachments/assets/ed9be856-c642-4676-8c0b-a9978736f257)

![image](https://github.com/user-attachments/assets/619ecc95-b0ff-4e31-9e65-392e2989a660)

## Getting Started

### Prerequisites
- Node.js (v14+) for frontend
- Go (v1.22.5+) for backend
- PostgreSQL database
- Redis for token management
- Modern web browser
- Access to security scanner APIs (ZAP, Acunetix, Semgrep)

### Installation

1. Clone the repository
```bash
git clone https://github.com/grealyve/secman.git
cd secman
```

2. Install dependencies
```bash
go mod tidy
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Start the backend server
```bash
go run main.go
```

## Features

### Integrated Security Scanners
- **OWASP ZAP** - Web application security scanner for detecting vulnerabilities in web applications
- **Acunetix** - Automated web vulnerability scanner for comprehensive web security assessment
- **Semgrep** - Static code analysis tool for finding bugs and enforcing code standards

### Powerful Dashboard
- Real-time vulnerability metrics and statistics from a dedicated dashboard API
- Interactive charts for vulnerability distribution
- Scanner-specific data visualization in a tabbed interface
- Comprehensive scan history and reporting with filtering capabilities

### Scan Management
- Start scans directly from the interface with multi-URL support
- Configure scan parameters for each scanner
- Bulk URL scanning capability via file upload
- Detailed scan monitoring and control (pause, abort, delete)

### User & Company Management
- Multi-company support with isolation between organizations
- Role-based access control system with granular permissions
- User registration and authentication with JWT token
- Company-specific scan isolation and reporting

## Architecture

### Backend
SecMan uses a modern Go backend with the following components:

- **Web Framework**: Gin-Gonic for high-performance REST API
- **Database**: PostgreSQL with GORM ORM for data persistence
- **Authentication**: JWT-based authentication with Redis blacklisting for token invalidation
- **Security**: Role-based middleware authorization for all endpoints
- **Models**: Structured data models for Users, Companies, Scans, Findings, and Reports

### Frontend
- **Framework**: React with React Router for navigation
- **UI Library**: Bootstrap for responsive design
- **State Management**: Context API for authentication and app state
- **API Integration**: Fetch API with Bearer token authentication

### Database Schema
The application automatically migrates the following models:
- Companies
- Users
- Scans
- Findings
- Reports
- ScannerSettings

## Dashboard Screenshots

#### Semgrep Findings:
![image](https://github.com/user-attachments/assets/d881f712-8298-4247-8259-b6595ace2635)


#### Owasp ZAP Start Scan:
![image](https://github.com/user-attachments/assets/b9852297-641b-4620-bba9-d8c2ed8b2a87)

#### Acunetix Adding Assets:
![image](https://github.com/user-attachments/assets/3f34fb1d-78d8-42fb-9b96-477875b9ae97)

#### Generating Report:
![image](https://github.com/user-attachments/assets/e4c14f9d-1665-4466-900a-47e7f9e68fca)


## Frontend Routes

The application offers a clean, organized routing structure:

- **Dashboard**: `/` - Main dashboard with summary statistics
- **OWASP ZAP**: 
  - `/owasp-zap/scans` - Manage ZAP scans
  - `/owasp-zap/findings` - View scan findings
  - `/owasp-zap/reports` - Access and download reports
  - `/owasp-zap/generate-report` - Create new reports
- **Acunetix**:
  - `/acunetix/assets` - Manage assets/targets
  - `/acunetix/scans` - Manage scans
  - `/acunetix/findings` - View vulnerabilities
  - `/acunetix/reports` - Access reports
  - `/acunetix/generate-report` - Generate new reports
- **Semgrep**:
  - `/semgrep/scans` - Manage code scans
  - `/semgrep/findings` - View findings
  - `/semgrep/deployments` - Manage deployments
- **Administration**:
  - `/admin` - Admin panel
  - `/user-creation` - Create new users
  - `/company-relation` - Manage company relations
- **User Settings**:
  - `/settings` - Scanner configuration
  - `/profile-settings` - User profile management
- **Help**: `/help` - Documentation and user assistance

## Use Case Diagram

The system supports the following user interactions:

### User Operations
- Login to the system
- View scan results
- Start, stop, and delete scans
- Insert, edit, and delete assets
- Create and download reports

### Admin Operations
- All user operations
- Create, delete and manage users
- Manage authorization and permissions
- Edit system configuration

## Security

The application implements several security measures:
- JWT-based authentication with token blacklisting
- Role-based access control for all endpoints
- Authorization middleware to protect resources
- Token invalidation on logout
- Password hashing for user credentials

## Admin Features

Administrators can manage companies and users through dedicated admin panels:
- Create and manage companies
- Add users to companies
- Register new users
- Promote/demote user roles

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact [ysf.yildiz11@gmail.com)](mailto:ysf.yildiz11@gmail.com).

---

 2025 SecMan Security Platform. All rights reserved.
