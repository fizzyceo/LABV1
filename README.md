# Decision Tree Platform - Full-Stack Medical Algorithm Management

A comprehensive Next.js application for managing medical decision trees, templates, and algorithms with MongoDB integration.

## Features

### Frontend
- **Dashboard**: View all templates, algorithms, and global parameters with detailed statistics
- **Algorithm Builder**: Interactive drag-and-drop interface for creating decision trees
- **CMS**: Complete template and parameter management system
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Instant synchronization between frontend and backend

### Backend
- **RESTful API**: Complete CRUD operations for templates, algorithms, and global parameters
- **MongoDB Integration**: Robust data persistence with Mongoose ODM
- **Data Validation**: Comprehensive input validation and error handling
- **Scalable Architecture**: Modular design for easy maintenance and extension

## Technology Stack

- **Frontend**: Next.js 13+, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **UI Components**: Custom components with shadcn/ui
- **Icons**: Lucide React
- **State Management**: React hooks with custom API utilities

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd decision-tree-platform
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/decision-tree-app
```

For cloud MongoDB (MongoDB Atlas):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/decision-tree-app?retryWrites=true&w=majority
```

### 3. Start MongoDB
For local MongoDB:
```bash
mongod
```

### 4. Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
├── app/                    # Next.js 13+ app directory
│   ├── page.tsx           # Dashboard (main page)
│   ├── dashboard/         # Dashboard components
│   ├── cms/              # CMS pages and components
│   ├── builder/          # Algorithm builder pages
│   └── layout.tsx        # Root layout with navbar
├── components/
│   ├── Navbar.tsx        # Navigation component
│   └── ui/               # Reusable UI components
├── hooks/
│   └── useApi.ts         # Custom API hooks
├── lib/
│   └── mongodb.js        # MongoDB connection utility
├── models/               # Mongoose schemas
│   ├── Template.js       # Template model
│   ├── Algorithm.js      # Algorithm model  
│   └── GlobalParameter.js # Global parameter model
└── pages/api/            # API routes
    ├── templates/        # Template CRUD operations
    ├── algorithms/       # Algorithm CRUD operations
    └── global-parameters/ # Global parameter CRUD operations
```

## API Documentation

### Templates API
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create new template
- `GET /api/templates/[id]` - Get template by ID
- `PUT /api/templates/[id]` - Update template
- `DELETE /api/templates/[id]` - Delete template (soft delete)

### Algorithms API
- `GET /api/algorithms` - Get all algorithms
- `POST /api/algorithms` - Save new algorithm
- `GET /api/algorithms/[id]` - Get algorithm by ID
- `PUT /api/algorithms/[id]` - Update algorithm
- `DELETE /api/algorithms/[id]` - Delete algorithm (soft delete)

### Global Parameters API
- `GET /api/global-parameters` - Get all global parameters
- `POST /api/global-parameters` - Create new global parameter
- `GET /api/global-parameters/[id]` - Get global parameter by ID
- `PUT /api/global-parameters/[id]` - Update global parameter
- `DELETE /api/global-parameters/[id]` - Delete global parameter (soft delete)

## Usage Guide

### 1. Dashboard
- View statistics and overview of all data
- Click on templates or algorithms to expand details
- Monitor system usage and data growth

### 2. CMS (Content Management System)
- **Templates**: Create and manage medical test templates (FNS, BIOCHEM, HEMATO)
- **Parameters**: Define test parameters with subparameters, states, and ranges
- **Actions**: Configure process and result actions for decision trees
- **Global Parameters**: Manage system-wide parameters (age, gender, etc.)

### 3. Algorithm Builder
- **Select Template**: Choose a medical template to work with
- **Drag & Drop**: Build decision trees by dragging parameters and actions
- **Conditions**: Set up logical conditions with operators (equals, range, greater than, etc.)
- **Actions**: Add process actions (can continue) or result actions (terminal)
- **Save/Export**: Save to database or export as JSON file
- **Import**: Load existing algorithms from JSON files

## Data Models

### Template Schema
```javascript
{
  name: String,           // Display name
  code: String,           // Unique identifier
  parameters: [{
    name: String,         // Parameter identifier
    label: String,        // Display label
    subParameters: [{
      name: String,       // Subparameter name
      type: String,       // Data type
      defaultValue: String
    }],
    states: [String],     // Possible states
    defaultRange: {
      min: String,
      max: String
    }
  }],
  actions: [{
    name: String,         // Action name
    type: String,         // 'process' or 'result'
    parameters: [String]  // Associated parameters
  }],
  description: String,
  isActive: Boolean
}
```

### Algorithm Schema
```javascript
{
  name: String,           // Algorithm name
  template: String,       // Associated template code
  tree: {                 // Decision tree structure
    parameter: String,    // Parameter to evaluate
    operator: String,     // Comparison operator
    value: Mixed,         // Value or range to compare
    processActions: [String], // Process actions to execute
    resultActions: [String],  // Result actions (terminal)
    children: [TreeNode]  // Child conditions
  },
  description: String,
  version: String,
  isActive: Boolean
}
```

## Development

### Adding New Features
1. **Backend**: Add new API routes in `pages/api/`
2. **Models**: Create/modify Mongoose schemas in `models/`
3. **Frontend**: Add components in `components/` and pages in `app/`
4. **Hooks**: Extend API utilities in `hooks/useApi.ts`

### Testing
- Test API endpoints using tools like Postman or curl
- Verify database operations in MongoDB shell or MongoDB Compass
- Test responsive design across different screen sizes
- Validate drag-and-drop functionality in Algorithm Builder

### Deployment Considerations
- Set up MongoDB Atlas for production database
- Configure environment variables for production
- Optimize build for static export if needed
- Set up proper error logging and monitoring

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify MongoDB is running (local) or connection string is correct (cloud)
   - Check firewall settings and network connectivity
   - Ensure database user has proper permissions

2. **API Routes Not Working**
   - Verify API route file structure matches Next.js conventions
   - Check console for CORS or network errors
   - Validate request/response formats

3. **Drag and Drop Not Working**
   - Ensure browser supports HTML5 drag and drop
   - Check for JavaScript errors in console
   - Verify event handlers are properly attached

4. **Data Not Saving**
   - Check MongoDB connection and permissions
   - Verify request payload matches schema expectations
   - Review server logs for validation errors

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Review the troubleshooting section
- Check the API documentation for proper usage