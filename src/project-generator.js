const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');



/**
 * Creates a file with content
 * @param {string} filePath - Path to the file
 * @param {string} content - Content of the file
 */
const createFileBackend = (filePath, content = '') => {
  fs.ensureFileSync(filePath);
  fs.writeFileSync(filePath, content);
};

/**
 * Creates a directory
 * @param {string} dirPath - Path to the directory
 */
const createBackendDirectory = (dirPath) => {
  fs.ensureDirSync(dirPath);
};

/**
 * Creates a backend project structure
 * @param {string} baseDir - Base directory for the project
 * @returns {Promise<void>}
 */
const createBackendStructure = async (baseDir) => {
  const spinner = ora('Creating backend project structure').start();
  
  try {
    // Create main directories
    createBackendDirectory(path.join(baseDir, 'src'));
    createBackendDirectory(path.join(baseDir, 'src/config'));
    createBackendDirectory(path.join(baseDir, 'src/controllers'));
    createBackendDirectory(path.join(baseDir, 'src/models'));
    createBackendDirectory(path.join(baseDir, 'src/routes'));
    createBackendDirectory(path.join(baseDir, 'src/middlewares'));
    createBackendDirectory(path.join(baseDir, 'src/services'));
    createBackendDirectory(path.join(baseDir, 'src/utils'));
    createBackendDirectory(path.join(baseDir, 'src/database'));
    createBackendDirectory(path.join(baseDir, 'tests'));
    createBackendDirectory(path.join(baseDir, 'public'));
    createBackendDirectory(path.join(baseDir, 'logs'));
    createBackendDirectory(path.join(baseDir, 'uploads'));
    // Create config files
    createFileBackend(path.join(baseDir, 'src/config/db.js'), `
// Database configuration
module.exports = {
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  }
};
`);

    createFile(path.join(baseDir, 'src/config/env.js'), `
// Environment configuration
module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d'
};
`);

    // Create controller files
    createFile(path.join(baseDir, 'src/controllers/userController.js'), `
const User = require('../models/userModel');
const userService = require('../services/userService');
const { successResponse, errorResponse } = require('../utils/responseUtil');

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return successResponse(res, 200, 'Users retrieved successfully', users);
  } catch (error) {
    return errorResponse(res, 500, 'Error retrieving users', error);
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User retrieved successfully', user);
  } catch (error) {
    return errorResponse(res, 500, 'Error retrieving user', error);
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    return successResponse(res, 201, 'User created successfully', user);
  } catch (error) {
    return errorResponse(res, 500, 'Error creating user', error);
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User updated successfully', user);
  } catch (error) {
    return errorResponse(res, 500, 'Error updating user', error);
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await userService.deleteUser(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Error deleting user', error);
  }
};
`);

    // Create model files
    createFile(path.join(baseDir, 'src/models/userModel.js'), `
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
`);

    // Create route files
    createFile(path.join(baseDir, 'src/routes/userRoutes.js'), `
const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), userController.getUsers);
router.get('/:id', authenticate, userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router;
`);

    // Create middleware files
    createFile(path.join(baseDir, 'src/middlewares/authMiddleware.js'), `
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const User = require('../models/userModel');
const { errorResponse } = require('../utils/responseUtil');

// Authenticate user
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return errorResponse(res, 401, 'Authentication required');
    }
    
    // Verify token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user || !user.active) {
      return errorResponse(res, 401, 'User not found or inactive');
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Invalid token', error);
  }
};

// Authorize user roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Not authorized to access this resource');
    }
    next();
  };
};
`);

    createFile(path.join(baseDir, 'src/middlewares/errorMiddleware.js'), `
const { errorResponse } = require('../utils/responseUtil');

// Not found middleware
exports.notFound = (req, res, next) => {
  errorResponse(res, 404, \`Resource not found - \${req.originalUrl}\`);
};

// Error handler middleware
exports.errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log error
  console.error(err.stack);
  
  errorResponse(
    res,
    statusCode,
    err.message || 'Internal Server Error',
    process.env.NODE_ENV === 'production' ? null : err.stack
  );
};
`);

    // Create service files
    createFile(path.join(baseDir, 'src/services/userService.js'), `
const User = require('../models/userModel');

// Get all users
exports.getAllUsers = async () => {
  return await User.find({ active: true }).select('-password');
};

// Get user by ID
exports.getUserById = async (id) => {
  return await User.findById(id).select('-password');
};

// Create new user
exports.createUser = async (userData) => {
  return await User.create(userData);
};

// Update user
exports.updateUser = async (id, userData) => {
  return await User.findByIdAndUpdate(
    id,
    userData,
    { new: true, runValidators: true }
  ).select('-password');
};

// Delete user
exports.deleteUser = async (id) => {
  return await User.findByIdAndUpdate(
    id,
    { active: false },
    { new: true }
  );
};
`);

    // Create utility files
    createFile(path.join(baseDir, 'src/utils/responseUtil.js'), `
// Success response
exports.successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

// Error response
exports.errorResponse = (res, statusCode = 500, message = 'Error', error = null) => {
  const response = {
    success: false,
    message
  };
  
  if (error !== null && process.env.NODE_ENV !== 'production') {
    response.error = error.toString();
  }
  
  return res.status(statusCode).json(response);
};
`);

    // Create database files
    createFile(path.join(baseDir, 'src/database/index.js'), `
const mongoose = require('mongoose');
const config = require('../config/db');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.url, config.options);
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
    return conn;
  } catch (error) {
    console.error(\`Error connecting to MongoDB: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;
`);

    // Create main application files
    createFile(path.join(baseDir, 'src/app.js'), `
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const userRoutes = require('./routes/userRoutes');

// Initialize express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// Static files
app.use(express.static('public'));

// Routes
app.use('/api/users', userRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
`);

    createFile(path.join(baseDir, 'src/server.js'), `
const app = require('./app');
const connectDB = require('./database');
const { port, nodeEnv } = require('./config/env');

// Connect to database
connectDB();

// Start server
const server = app.listen(port, () => {
  console.log(\`Server running in \${nodeEnv} mode on port \${port}\`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(\`Unhandled Rejection: \${err.message}\`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = server;
`);

    // Create test files
    createFile(path.join(baseDir, 'tests/user.test.js'), `
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/userModel');

describe('User API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/testdb');
  });

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.email).toBe(userData.email);
    });
  });
});
`);

    // Create configuration files
    createFile(path.join(baseDir, '.env'), `
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/myapp

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# Logging
LOG_LEVEL=info
`);

    createFile(path.join(baseDir, '.gitignore'), `
# Dependencies
node_modules/
npm-debug.log
yarn-error.log
yarn-debug.log
package-lock.json

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build files
dist/
build/

# Logs
logs/
*.log

# Testing
coverage/

# OS files
.DS_Store
Thumbs.db

# IDE files
.idea/
.vscode/
*.sublime-project
*.sublime-workspace
`);

    createFile(path.join(baseDir, 'package.json'), `
{
  "name": "backend-app",
  "version": "1.0.0",
  "description": "Backend application",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --detectOpenHandles",
    "lint": "eslint ."
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "helmet": "^6.0.1",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^7.0.3",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "eslint": "^8.36.0",
    "jest": "^29.5.0",
    "nodemon": "^2.0.22",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
`);

    createFile(path.join(baseDir, 'nodemon.json'), `
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["node_modules", "logs"],
  "env": {
    "NODE_ENV": "development"
  }
}
`);

    createFile(path.join(baseDir, 'README.md'), `
# Backend Application

A Node.js backend application with Express and MongoDB.

## Features

- RESTful API architecture
- User authentication and authorization
- MongoDB database integration
- Error handling middleware
- Request validation
- Logging
- Testing with Jest

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Create a \`.env\` file based on the provided example
4. Start the development server:
   \`\`\`
   npm run dev
   \`\`\`

## API Endpoints

### Users

- \`GET /api/users\` - Get all users (admin only)
- \`GET /api/users/:id\` - Get user by ID
- \`POST /api/users\` - Create a new user
- \`PUT /api/users/:id\` - Update user
- \`DELETE /api/users/:id\` - Delete user (admin only)

## Testing

Run tests with:

\`\`\`
npm test
\`\`\`

## License

MIT
`);

    createFile(path.join(baseDir, 'public/README.md'), `
# Public Directory

This directory contains static files that are served by the Express application.

You can place HTML, CSS, JavaScript, images, and other static assets here.
`);

    createFile(path.join(baseDir, 'logs/error.log'), '');

    spinner.succeed('Backend project structure created successfully');
  } catch (error) {
    spinner.fail(`Failed to create backend project structure: ${error.message}`);
    throw error;
  }
};

/**
 * Creates a frontend project structure
 * @param {string} baseDir - Base directory for the project
 * @returns {Promise<void>}
 */



// Helper function to create directory if it doesn't exist
const createDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Helper function to create file with content
const createFile = (filePath, content) => {
  fs.writeFileSync(filePath, content.trim());
};

// Main function to create frontend structure using Vite
const createFrontendStructure = async (baseDir, projectName = 'frontend') => {
  const spinner = ora('Creating frontend project with Vite').start();
  
  try {
    // Create the project directory if it doesn't exist
    createDirectory(baseDir);
    
    const fullPath = path.join(process.cwd(), baseDir);
    
    // Initialize a new Vite project
    spinner.text = 'Initializing Vite project...';
    
    try {
      execSync(`npm create vite@latest ${projectName} -- --template react`, {
        cwd: process.cwd(),
        stdio: 'ignore'
      });
      
      // Change to the newly created project directory
      process.chdir(path.join(process.cwd(), projectName));
    } catch (error) {
      spinner.fail(`Failed to initialize Vite project: ${error.message}`);
      throw error;
    }
    
    // Path to the new project
    const projectPath = path.join(process.cwd());
    
    // Create main directories
    spinner.text = 'Creating project structure...';
    createDirectory(path.join(projectPath, 'src/api'));
    createDirectory(path.join(projectPath, 'src/assets/images'));
    createDirectory(path.join(projectPath, 'src/assets/icons'));
    createDirectory(path.join(projectPath, 'src/components'));
    createDirectory(path.join(projectPath, 'src/context'));
    createDirectory(path.join(projectPath, 'src/hooks'));
    createDirectory(path.join(projectPath, 'src/layouts'));
    createDirectory(path.join(projectPath, 'src/pages'));
    createDirectory(path.join(projectPath, 'src/routes'));
    createDirectory(path.join(projectPath, 'src/styles'));
    createDirectory(path.join(projectPath, 'src/utils'));
    
    // Create API files
    createFile(path.join(projectPath, 'src/api/axiosClient.js'), `
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
`);

    createFile(path.join(projectPath, 'src/api/userApi.js'), `
import axiosClient from './axiosClient';

const userApi = {
  // Get all users
  getAll: () => {
    return axiosClient.get('/users');
  },
  
  // Get user by ID
  getById: (id) => {
    return axiosClient.get(\`/users/\${id}\`);
  },
  
  // Create new user
  create: (data) => {
    return axiosClient.post('/users', data);
  },
  
  // Update user
  update: (id, data) => {
    return axiosClient.put(\`/users/\${id}\`, data);
  },
  
  // Delete user
  delete: (id) => {
    return axiosClient.delete(\`/users/\${id}\`);
  },
  
  // Login
  login: (credentials) => {
    return axiosClient.post('/auth/login', credentials);
  },
  
  // Register
  register: (userData) => {
    return axiosClient.post('/auth/register', userData);
  }
};

export default userApi;
`);

    // Create component files
    createFile(path.join(projectPath, 'src/components/Navbar.jsx'), `
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          My App
        </Link>
        
        <div className="flex space-x-4">
          <Link to="/" className="hover:text-gray-300">
            Home
          </Link>
          
          {user ? (
            <>
              <Link to="/profile" className="hover:text-gray-300">
                Profile
              </Link>
              <button
                onClick={logout}
                className="hover:text-gray-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">
                Login
              </Link>
              <Link to="/register" className="hover:text-gray-300">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
`);

    createFile(path.join(projectPath, 'src/components/Footer.jsx'), `
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-auto">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} My App. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
`);

    createFile(path.join(projectPath, 'src/components/Button.jsx'), `
const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'font-medium rounded focus:outline-none transition-colors';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50'
  };
  
  const sizeClasses = {
    sm: 'py-1 px-2 text-sm',
    md: 'py-2 px-4',
    lg: 'py-3 px-6 text-lg'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  const buttonClasses = \`\${baseClasses} \${variantClasses[variant]} \${sizeClasses[size]} \${disabledClasses} \${className}\`;
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
`);

    // Create context files
    createFile(path.join(projectPath, 'src/context/AuthContext.jsx'), `
import { createContext, useState, useEffect } from 'react';
import userApi from '../api/userApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApi.login({ email, password });
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApi.register(userData);
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
`);

    // Create hook files
    createFile(path.join(projectPath, 'src/hooks/useAuth.js'), `
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
`);

    // Create layout files
    createFile(path.join(projectPath, 'src/layouts/MainLayout.jsx'), `
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
`);

    // Create page files
    createFile(path.join(projectPath, 'src/pages/Home.jsx'), `
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to My App</h1>
        
        {user ? (
          <p className="mb-4">Hello, {user.name}! You are logged in.</p>
        ) : (
          <p className="mb-4">Please log in to access all features.</p>
        )}
        
        <div className="max-w-2xl mx-auto">
          <p className="mb-4">
            This is a Vite React application with authentication, routing, and API integration.
          </p>
          <p>
            Explore the features and functionality of this application.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
`);

    createFile(path.join(projectPath, 'src/pages/Login.jsx'), `
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        
        <p className="mt-4 text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </MainLayout>
  );
};

export default Login;
`);

    createFile(path.join(projectPath, 'src/pages/Register.jsx'), `
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await register({ name, email, password });
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>
        
        <p className="mt-4 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </MainLayout>
  );
};

export default Register;
`);

    // Create route files
    createFile(path.join(projectPath, 'src/routes/AppRoutes.jsx'), `
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <div>Profile Page</div>
          </ProtectedRoute>
        }
      />
      
      {/* Catch all route */}
      <Route path="*" element={<div>Page not found</div>} />
    </Routes>
  );
};

export default AppRoutes;
`);

    // Create utility files
    createFile(path.join(projectPath, 'src/utils/helpers.js'), `
/**
 * Format date to a readable string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Truncate text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
`);

    // Create main application files
    createFile(path.join(projectPath, 'src/App.jsx'), `
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
`);

    createFile(path.join(projectPath, 'src/main.jsx'), `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`);

    // Create CSS file to include tailwind
    createFile(path.join(projectPath, 'src/styles/index.css'), `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
`);

    // Create Tailwind configuration
    createFile(path.join(projectPath, 'tailwind.config.js'), `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`);

    createFile(path.join(projectPath, 'postcss.config.js'), `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);

    // Create .env file
    createFile(path.join(projectPath, '.env'), `
VITE_API_URL=http://localhost:3000/api
`);

    // Update the package.json to include additional dependencies
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    
    // Add additional dependencies
    packageJson.dependencies = {
      ...packageJson.dependencies,
      'axios': '^1.6.2',
      'react-router-dom': '^6.20.0'
    };
    
    // Add Tailwind CSS as dev dependencies
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      'autoprefixer': '^10.4.16',
      'postcss': '^8.4.31',
      'tailwindcss': '^3.3.5'
    };
    
    // Write the updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    // Update the README.md
    createFile(path.join(projectPath, 'README.md'), `
# Vite React Frontend

A modern React frontend application built with Vite, featuring routing, authentication, and API integration.

## Features

- Fast development with Vite
- React Router for navigation
- Context API for state management
- Authentication with JWT
- Responsive design with Tailwind CSS
- Reusable components
- API integration with Axios

## Getting Started

### Prerequisites

- Node.js (v14 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Create a \`.env\` file based on the provided example
4. Start the development server:
   \`\`\`
   npm run dev
   \`\`\`

## Available Scripts

- \`npm run dev\` - Start the development server
- \`npm run build\` - Build the app for production
- \`npm run lint\` - Run ESLint
- \`npm run preview\` - Preview the production build locally

## Folder Structure

- \`src/api\` - API clients and services
- \`src/assets\` - Static assets like images and icons
- \`src/components\` - Reusable UI components
- \`src/context\` - React Context providers
- \`src/hooks\` - Custom React hooks
- \`src/layouts\` - Page layout components
- \`src/pages\` - Page components
- \`src/routes\` - Routing configuration
- \`src/styles\` - Global styles and CSS
- \`src/utils\` - Utility functions

## License

MIT
`);

    spinner.succeed('Frontend project structure created successfully');
    
    // Go back to original directory
    process.chdir('..');
    
    return projectPath;
  } catch (error) {
    spinner.fail(`Failed to create frontend project structure: ${error.message}`);
    throw error;
  }
};

// Command handler for the generate command
const generateCommand = async (options) => {
  try {
    const projectName = options.name || 'my-app';
    const projectPath = await createFrontendStructure('.', projectName);
    
    console.log(`\n✅ Project created at: ${projectPath}`);
    console.log('\nNext steps:');
    console.log(`1. cd ${projectName}`);
    console.log('2. npm install');
    console.log('3. npm run dev');
    
  } catch (error) {
    console.error('Error generating project:', error);
    process.exit(1);
  }
};

module.exports = {
  createFrontendStructure,
  generateCommand
};

/**
 * Creates a project structure based on user selection
 * @returns {Promise<void>}
 */
const createProjectStructure = async () => {
  try {
    // Ask user for project type
    const { projectType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'projectType',
        message: 'What type of project structure do you want to create?',
        choices: [
          { name: 'Backend (Node.js, Express, MongoDB)', value: 'backend' },
          { name: 'Frontend (React, React Router, Tailwind CSS)', value: 'frontend' }
        ]
      }
    ]);
    
    // Ask for output directory
    const { outputDir } = await inquirer.prompt([
      {
        type: 'input',
        name: 'outputDir',
        message: 'Enter the output directory:',
        default: projectType === 'backend' ? './backend' : './frontend'
      }
    ]);
    
    // Create the project structure
    if (projectType === 'backend') {
      await createBackendStructure(outputDir);
    } else {
      await createFrontendStructure(outputDir);
    }
    
    console.log(chalk.green.bold(`\n✅ Project structure created successfully in ${outputDir}`));
    console.log(chalk.blue(`\nNext steps:`));
    console.log(chalk.blue(`1. cd ${outputDir}`));
    console.log(chalk.blue(`2. npm install`));
    console.log(chalk.blue(`3. npm run dev (for backend as well frontend)`));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error creating project structure: ${error.message}`));
    throw error;
  }
};

module.exports = {
  createProjectStructure
};