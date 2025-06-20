# MSCS Application Manager

A comprehensive web application for managing Master of Science in Computer Science applications. Track universities, deadlines, documents, tasks, and compare programs all in one place.

## Features

- **Dashboard**: Real-time overview of application progress
- **University Management**: Track universities by category (Reach/Target/Safety)
- **Deadline Tracking**: Never miss important application deadlines
- **Document Management**: Version control for SOPs, CVs, and other documents
- **Task Management**: Kanban-style board for organizing application tasks
- **University Comparison**: Side-by-side comparison of programs
- **File Upload**: Secure document storage with Cloudinary
- **User Authentication**: Secure JWT-based authentication

## Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **PostgreSQL** - Database
- **Prisma** - Database ORM
- **JWT** - Authentication
- **Cloudinary** - File storage
- **bcryptjs** - Password hashing

### Frontend
- **HTML5** + **CSS3** + **JavaScript**
- **Tailwind CSS** - Styling framework
- **Font Awesome** - Icons

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Cloudinary account (for file uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mscs-application-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/mscs_app_manager"
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_EXPIRES_IN="7d"
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   PORT=5000
   NODE_ENV="development"
   FRONTEND_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start the development servers**
   
   Backend (Terminal 1):
   ```bash
   npm run dev
   ```
   
   Frontend (Terminal 2):
   ```bash
   npm run client
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Universities
- `GET /api/universities` - Get all universities
- `POST /api/universities` - Create university
- `GET /api/universities/:id` - Get single university
- `PUT /api/universities/:id` - Update university
- `DELETE /api/universities/:id` - Delete university

### Documents
- `GET /api/documents` - Get all documents
- `POST /api/documents` - Create document
- `GET /api/documents/:id` - Get single document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/stats/summary` - Get document statistics

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/stats/summary` - Get task statistics

### Deadlines
- `GET /api/deadlines` - Get all deadlines
- `POST /api/deadlines` - Create deadline
- `GET /api/deadlines/:id` - Get single deadline
- `PUT /api/deadlines/:id` - Update deadline
- `DELETE /api/deadlines/:id` - Delete deadline
- `GET /api/deadlines/stats/summary` - Get deadline statistics

### File Upload
- `POST /api/upload/document` - Upload document file
- `PUT /api/upload/document/:id` - Update document file
- `DELETE /api/upload/document/:id` - Delete document file
- `GET /api/upload/stats` - Get upload statistics

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity
- `GET /api/dashboard/upcoming-deadlines` - Get upcoming deadlines

## Database Schema

### Core Models
- **User** - User accounts and authentication
- **University** - University information and application status
- **UniversityRequirement** - Admission requirements and program details
- **Document** - Document metadata and file references
- **Task** - Application tasks and todo items
- **Deadline** - Important dates and deadlines

### Relationships
- User has many Universities, Documents, Tasks, Deadlines
- University has one UniversityRequirement
- University has many Tasks and Deadlines
- All models include proper foreign key constraints and cascading deletes

## Development

### Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Project Structure
```
├── server/
│   ├── index.js              # Main server file
│   ├── lib/
│   │   └── prisma.js         # Prisma client configuration
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   └── routes/
│       ├── auth.js           # Authentication routes
│       ├── universities.js   # University CRUD routes
│       ├── documents.js      # Document CRUD routes
│       ├── tasks.js          # Task CRUD routes
│       ├── deadlines.js      # Deadline CRUD routes
│       ├── dashboard.js      # Dashboard data routes
│       └── upload.js         # File upload routes
├── prisma/
│   └── schema.prisma         # Database schema
├── index.html                # Main frontend file
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Deployment

### Backend Deployment (Railway/Render)
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy backend code
4. Run database migrations

### Frontend Deployment (Vercel/Netlify)
1. Update API endpoints to production URLs
2. Deploy static files
3. Configure custom domain (optional)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the GitHub repository.