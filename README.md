# Water Quality Monitoring Admin Dashboard

![Government of India Logo](https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg)

A comprehensive React TypeScript admin dashboard for water quality monitoring in Northeast India, developed for government health officials as part of Smart India Hackathon 2025.

## 🏛️ Government Compliance

This application follows UX4G (User Experience for Government) design guidelines and adheres to government accessibility standards (WCAG 2.1 AA).

## 🎯 Features

### Core Functionality
- **Real-time Water Quality Monitoring**: Live data from IoT sensors and mobile app inputs
- **Disease Risk Prediction**: ML-powered health risk assessment based on water quality parameters
- **Interactive Mapping**: Google Maps integration with real-time sensor locations and risk levels
- **Alert Management**: Automated alert system with escalation and notification capabilities
- **Mobile App Synchronization**: Seamless data sync from field personnel mobile applications
- **Comprehensive Reporting**: Advanced analytics and exportable reports for government officials

### Government-Specific Features
- **UX4G Design Compliance**: Government-approved color schemes, typography, and accessibility
- **Multi-language Support**: Hindi and English interface options
- **Role-based Access Control**: Different access levels for various government officials
- **Audit Trail**: Complete activity logging for transparency and accountability
- **Data Retention**: 7-year data retention as per government requirements
- **Security**: Enhanced security measures for sensitive government data

## 🚀 Technology Stack

### Frontend
- **React 19** with TypeScript for type-safe development
- **React Router v7** for client-side routing
- **UX4G Design System** for government compliance
- **Lucide React** for consistent iconography
- **Chart.js & Recharts** for data visualization

### Backend Integration
- **Firebase Authentication** for secure user management
- **Supabase PostgreSQL** for real-time database operations
- **Google Maps JavaScript API** for interactive mapping
- **Custom ML API** for disease risk predictions

### Development Tools
- **TypeScript** for type safety
- **ESLint & Prettier** for code quality
- **React Testing Library** for comprehensive testing
- **Webpack Bundle Analyzer** for performance optimization

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  Mobile Apps    │────│  Admin Dashboard│────│   ML Services   │
│  (Field Teams)  │    │   (React TS)    │    │  (Python/API)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
        ┌─────────────────┐     │     ┌─────────────────┐
        │                 │     │     │                 │
        │   Firebase      │─────┼─────│   Supabase      │
        │ Authentication  │     │     │   PostgreSQL    │
        │                 │     │     │                 │
        └─────────────────┘     │     └─────────────────┘
                                │
                        ┌─────────────────┐
                        │                 │
                        │  Google Maps    │
                        │      API        │
                        │                 │
                        └─────────────────┘
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm 8+
- Firebase project with Authentication enabled
- Supabase project with PostgreSQL database
- Google Maps API key with Maps JavaScript API enabled
- ML model API endpoint (Python backend)

### Step 1: Clone and Install
```bash
git clone <repository-url>
cd water-quality-admin
npm install
```

### Step 2: Environment Configuration
Copy the example environment file and configure:
```bash
cp .env.example .env.development
```

Edit `.env.development` with your actual configuration:
```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY="your_firebase_api_key"
REACT_APP_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
REACT_APP_FIREBASE_PROJECT_ID="your-project-id"
# ... (see .env.example for complete configuration)

# Supabase Configuration
REACT_APP_SUPABASE_URL="https://your-project.supabase.co"
REACT_APP_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Google Maps
REACT_APP_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
```

### Step 3: Database Setup
1. **Supabase Setup**:
   - Create a new Supabase project
   - Run the SQL schema from `src/database/schema.sql`
   - Enable Row Level Security (RLS) policies
   - Configure real-time subscriptions

2. **Firebase Setup**:
   - Create Firebase project
   - Enable Authentication with Email/Password
   - Add your domain to authorized domains
   - Download and configure Firebase config

### Step 4: Google Maps Setup
1. Enable Maps JavaScript API in Google Cloud Console
2. Create API key with appropriate restrictions
3. Add your domain to API key restrictions

### Step 5: Start Development Server
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Firebase Authentication Setup
```javascript
// src/config/firebase.ts
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  // ...
};
```

### Supabase Database Schema
The complete database schema includes:
- **users**: Government official profiles
- **iot_devices**: Sensor and mobile device registry
- **water_quality_readings**: Real-time water quality data
- **disease_predictions**: ML-generated health risk assessments
- **alerts**: Automated alert management
- **mobile_sync_logs**: Mobile app synchronization tracking

### UX4G Theme Configuration
```css
/* Government-compliant color palette */
:root {
  --primary-color: #1F4E79;     /* Government Blue */
  --secondary-color: #C5282F;   /* India Red */
  --success-color: #4CAF50;     /* Success Green */
  --warning-color: #FF9800;     /* Warning Orange */
  --error-color: #F44336;       /* Error Red */
}
```

## 📱 Mobile App Integration

The admin dashboard synchronizes with field team mobile applications:

### Data Sync Process
1. **Mobile Data Collection**: Field teams collect water quality data using mobile sensors
2. **Automated Sync**: Data automatically syncs to Supabase when connectivity is available
3. **ML Processing**: Uploaded data triggers disease risk prediction models
4. **Real-time Updates**: Dashboard receives live updates via Supabase real-time subscriptions
5. **Alert Generation**: Automatic alerts for critical conditions

### Supported Mobile Data
- Water quality parameters (pH, temperature, turbidity, etc.)
- GPS coordinates and location metadata
- Environmental conditions
- User-reported symptoms and observations
- Photos and additional documentation

## 🤖 ML Model Integration

### Disease Risk Prediction
The system integrates with a Python-based ML model that predicts disease risk based on:
- Water quality parameters
- Geographic location data
- Environmental conditions
- Historical outbreak patterns
- Seasonal factors

### API Endpoints
- `POST /api/v1/ml/predict-disease-risk`: Single prediction
- `POST /api/v1/ml/batch-predict`: Batch processing
- `GET /api/v1/ml/historical-analysis`: Trend analysis
- `GET /api/v1/ml/model-metrics`: Model performance

## 🔒 Security & Compliance

### Government Security Standards
- **Data Encryption**: All data encrypted in transit and at rest
- **Access Control**: Role-based permissions for different government levels
- **Audit Logging**: Complete activity tracking for transparency
- **Session Management**: Secure session handling with automatic timeout
- **API Security**: Rate limiting and request validation

### Privacy & Data Protection
- **Data Minimization**: Only necessary data collection
- **Retention Policy**: 7-year retention as per government requirements
- **Access Logs**: Detailed logging of all data access
- **Anonymization**: Personal data anonymization where applicable

## 📊 Analytics & Reporting

### Available Reports
1. **Water Quality Report**: Comprehensive water quality analysis
2. **Disease Risk Report**: Health risk assessment and trends
3. **Alert Report**: Alert management and response metrics
4. **Device Performance Report**: IoT sensor and mobile device analytics

### Export Formats
- JSON for API integration
- CSV for spreadsheet analysis
- PDF for official documentation

## 🎨 User Interface

### UX4G Compliance Features
- **Accessibility**: WCAG 2.1 AA compliant
- **Government Branding**: Official color schemes and typography
- **Multi-language**: Hindi and English support
- **Responsive Design**: Works on desktop, tablet, and mobile
- **High Contrast**: Enhanced visibility for government standards

### Key UI Components
- **Dashboard**: Real-time metrics and system overview
- **Interactive Map**: Live sensor data and risk visualization
- **Alert Center**: Centralized alert management
- **Data Tables**: Advanced filtering and sorting
- **Charts & Graphs**: Multiple visualization options

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment-Specific Deployment
1. **Development**: Local development with mock data
2. **Staging**: Government testing environment
3. **Production**: Live government deployment

### Hosting Recommendations
- **Government Cloud**: Preferred for sensitive data
- **Private Cloud**: Alternative for enhanced security
- **CDN**: Static asset delivery optimization

## 🧪 Testing

### Test Coverage
```bash
npm run test:coverage
```

### Testing Strategy
- **Unit Tests**: Component and service testing
- **Integration Tests**: API and database integration
- **E2E Tests**: Complete user workflow testing
- **Security Tests**: Vulnerability and penetration testing

## 📚 API Documentation

### Internal APIs
- **Authentication Service**: User management and role-based access
- **Data Service**: Water quality data operations
- **Alert Service**: Alert management and notifications
- **Reporting Service**: Analytics and report generation

### External Integrations
- **Firebase Auth API**: User authentication
- **Supabase API**: Database operations and real-time updates
- **Google Maps API**: Mapping and geolocation services
- **ML Model API**: Disease risk predictions

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript strict mode
2. Use UX4G design principles
3. Write comprehensive tests
4. Follow government coding standards
5. Document all government-specific requirements

### Code Style
```bash
npm run lint        # Check code style
npm run lint:fix    # Fix automatic issues
npm run format      # Format code with Prettier
```

## 📞 Support

### Government Support Channels
- **Technical Support**: [tech-support@gov.in]
- **Security Issues**: [security@gov.in]
- **Feature Requests**: [features@gov.in]

### Documentation
- **User Manual**: Government official training guide
- **API Documentation**: Complete API reference
- **Security Guidelines**: Government security compliance
- **Deployment Guide**: Infrastructure setup instructions

## 📄 License

This project is developed for the Government of India under Smart India Hackathon 2025. All rights reserved.

### Government Usage Rights
- Licensed for exclusive government use
- Modifications require government approval
- Distribution restricted to authorized personnel
- Compliance with government IP policies

## 🏆 Smart India Hackathon 2025

This project was developed as part of Smart India Hackathon 2025, addressing the critical need for water quality monitoring in Northeast India.

### Problem Statement
Develop a comprehensive admin dashboard for government health officials to monitor water quality and predict disease risks in real-time.

### Solution Features
- Real-time IoT sensor integration
- Mobile app data synchronization
- ML-powered disease risk prediction
- Government-compliant UX4G design
- Comprehensive reporting and analytics

### Impact
- Enhanced water quality monitoring across Northeast India
- Early disease risk detection and prevention
- Improved government response to water quality issues
- Data-driven decision making for health officials
- Streamlined field data collection and analysis

---

**Developed for:** Government of India, Ministry of Health & Family Welfare  
**Target Region:** Northeast India  
**Version:** 1.0.0  
**Last Updated:** 2025  
**Contact:** Smart India Hackathon 2025 Team
