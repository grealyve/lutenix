# SecMan Security Scanner Dashboard

SecMan is a comprehensive security scanning platform that integrates multiple industry-standard security scanners into a unified dashboard, providing real-time vulnerability assessment and management.

![SecMan Dashboard](docs/dashboard-screenshot.png)

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

## API Endpoints

### Dashboard API
- `GET /api/v1/dashboard/stats` - Retrieve dashboard statistics and metrics

### Authentication & User Management
- `POST /api/v1/users/login` - User authentication
- `GET /api/v1/users/logout` - User logout with token blacklisting
- `GET /api/v1/users/profile` - Get current user profile
- `POST /api/v1/users/updateProfile` - Update user profile information
- `POST /api/v1/users/updateScanner` - Update scanner configuration settings

### Admin API
- `POST /api/v1/admin/register` - Register new users
- `POST /api/v1/admin/createCompany` - Create a new company
- `POST /api/v1/admin/addCompanyUser` - Add a user to a company
- `POST /api/v1/admin/makeAdmin` - Promote user to admin role
- `POST /api/v1/admin/makeUser` - Demote admin to user role
- `POST /api/v1/admin/deleteUser` - Delete a user
- `GET /api/v1/admin/getUsers` - List all users

### OWASP ZAP API
- `POST /api/v1/zap/scans` - Start a new ZAP scan
- `GET /api/v1/zap/scans` - List all ZAP scans
- `GET /api/v1/zap/scans/:scan_id` - Get a specific scan status
- `POST /api/v1/zap/abortScan` - Pause an active scan
- `POST /api/v1/zap/deleteScans` - Delete scans
- `GET /api/v1/zap/alerts/:scan_id` - Get alerts for a specific scan
- `GET /api/v1/zap/alerts/detail/:alert_id` - Get detailed alert information
- `GET /api/v1/zap/results` - Get scan results by URL
- `GET /api/v1/zap/findings` - Get all user findings
- `POST /api/v1/zap/report` - Generate a ZAP report
- `GET /api/v1/zap/reports` - List all ZAP reports

### Acunetix API
- `GET /api/v1/acunetix/targets` - List all targets
- `POST /api/v1/acunetix/targets` - Add a new target
- `POST /api/v1/acunetix/targets/delete` - Delete targets
- `GET /api/v1/acunetix/scans` - List all scans
- `POST /api/v1/acunetix/startScan` - Start a new scan
- `POST /api/v1/acunetix/scans/delete` - Delete scans
- `POST /api/v1/acunetix/scans/abort` - Abort running scans
- `GET /api/v1/acunetix/vulnerabilities` - List all vulnerabilities
- `GET /api/v1/acunetix/reports` - List all reports
- `POST /api/v1/acunetix/generateReport` - Generate a new report

### Semgrep API
- `GET /api/v1/semgrep/scanDetails` - Get scan details
- `GET /api/v1/semgrep/deployments` - List all deployments
- `GET /api/v1/semgrep/projects` - List all projects
- `GET /api/v1/semgrep/scans` - List all scans
- `GET /api/v1/semgrep/findings` - List all findings
- `GET /api/v1/semgrep/secrets` - List detected secrets
- `GET /api/v1/semgrep/repository` - List all repositories

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

![Use Case Diagram](docs/use-case-diagram.png)

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