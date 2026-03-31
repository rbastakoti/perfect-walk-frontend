# 🚶‍♀️ Perfect Walk

> **Your burnout-aware walk companion** - Intelligently designed to help you find balance through mindful walking experiences.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-5.0%20beta-green?logo=auth0)](https://next-auth.js.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🌟 **Overview**

Perfect Walk is an intelligent wellness application that helps users combat burnout through data-driven walking experiences. The app integrates with your calendar, real-time weather data, and nearby locations to suggest the perfect moments for restorative walks, while building a supportive community around mental wellness.

### 🎯 **Key Philosophy**
- **Proactive, not reactive** - Schedule rest before burnout hits
- **Data-informed wellness** - Use real metrics to guide decisions  
- **Community-driven support** - Share experiences and build connections
- **Nature-based recovery** - Leverage proven outdoor wellness benefits

---

## ✨ **Features**

### 🍃 **Smart Burnout Tracking**
- **Real-time Burnout Score**: Visual leaf indicator that reflects your mental energy
- **Mood Tracking**: Before/after walking mood comparisons with trend analysis
- **Burnout Mitigation**: Intelligent recommendations for optimal break timing

### 📅 **Calendar Integration**
- **Google Calendar Sync**: Reads your schedule to find optimal walking windows
- **Automatic Break Scheduling**: Carves out recovery moments proactively
- **Meeting Load Analysis**: Identifies high-stress periods requiring intervention

### 🗺️ **Location Intelligence**
- **Nearby Parks & Trails**: Discovers walking routes within your vicinity  
- **Difficulty Ratings**: Easy, Moderate, and Hard trail classifications
- **Weather Integration**: Real-time weather data for optimal walking conditions
- **Step & Calorie Tracking**: Comprehensive session analytics

### 🏘️ **Community Platform**
- **Social Walking Feed**: Share achievements and walking experiences
- **Walking Achievements**: Showcase completed trails with detailed metrics
- **Like & Engagement System**: Support fellow walkers in their journeys
- **Feeling Tags**: Express post-walk emotions (energized, peaceful, accomplished)

### 📊 **Analytics Dashboard**
- **Walking History**: Complete session tracking with mood improvements
- **Statistics Overview**: Total distance, calories, and sessions completed
- **Progress Visualization**: Mood trend charts and walking consistency metrics
- **Achievement Tracking**: Personal milestones and accomplishments

---

## 🛠️ **Technology Stack**

### **Frontend Framework**
- **[Next.js 16.2.1](https://nextjs.org/)** - React framework with App Router
- **[TypeScript 5.0](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 3.0](https://tailwindcss.com/)** - Utility-first styling
- **[React 18](https://react.dev/)** - Modern React with concurrent features

### **Authentication & Security**
- **[NextAuth.js v5](https://next-auth.js.org/)** - Secure authentication system
- **Google OAuth 2.0** - Primary authentication provider  
- **Session Management** - JWT-based user sessions
- **Route Protection** - Middleware-based access control

### **External API Integration**
- **[Google Calendar API](https://developers.google.com/calendar)** - Calendar synchronization
- **[Google Places API](https://developers.google.com/maps/documentation/places/web-service)** - Location discovery
- **[OpenWeather API](https://openweathermap.org/api)** - Real-time weather data
- **[Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)** - AI-powered recommendations

### **Backend Integration**
- **FastAPI Backend** - RESTful API server (separate repository)
- **Real-time Data Sync** - Walking sessions, community posts, user analytics
- **Authentication Headers** - Secure API communication

---

## 🚀 **Getting Started**

### **Prerequisites**
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm or yarn** - Package manager
- **Google Cloud Account** - For OAuth and API access
- **OpenWeather Account** - For weather data
- **Azure OpenAI** - For AI features

### **1. Clone Repository**
```bash
git clone <repository-url>
cd perfect-walk-backend
```

### **2. Install Dependencies**
```bash
npm install
# or
yarn install
```

### **3. Environment Setup**
Copy the environment example file and configure your API keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your API credentials:

```env
# Authentication
AUTH_SECRET=your-secret-key-here

# Google OAuth & APIs
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_PLACES_API_KEY=your-google-places-api-key

# Weather API
OPENWEATHER_API_KEY=your-openweather-api-key

# Backend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=your-azure-endpoint
AZURE_OPENAI_KEY=your-azure-key
AZURE_OPENAI_MODEL=gpt-4.1-mini
```

### **4. API Key Setup Guide**

#### **Google OAuth Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API and Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

#### **Google Places API**
1. In Google Cloud Console, enable Places API
2. Create API key and restrict to Places API
3. Add your domain to API restrictions

#### **OpenWeather API**
1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your free API key from the dashboard

#### **Azure OpenAI** 
1. Create Azure OpenAI resource
2. Deploy GPT-4 model
3. Get endpoint and API key from Azure portal

### **5. Run Development Server**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### **6. Production Build**
```bash
npm run build
npm start
```

---

## 📁 **Project Structure**

```
perfect-walk-backend/
├── 📱 app/                    # Next.js App Router pages
│   ├── api/                   # API routes & integrations
│   ├── calendar/              # Calendar sync & management
│   ├── community/             # Social wall & community features
│   ├── dashboard/             # Main dashboard with burnout tracking  
│   ├── places/                # Location discovery & trail search
│   ├── profile/               # User profile management
│   ├── stats/                 # Analytics & walking statistics
│   ├── walk/                  # Walking session tracking
│   └── layout.tsx             # Root application layout
├── 🧩 components/             # Reusable React components
│   ├── app-shell.tsx          # Main navigation shell
│   ├── CalendarCard.tsx       # Calendar integration widget
│   ├── Header.tsx             # Application header
│   ├── ParksCard.tsx          # Parks & trails display
│   ├── Sidebar.tsx            # Navigation sidebar  
│   └── WeatherCard.tsx        # Weather information widget
├── 🔧 lib/                    # Utility libraries & APIs
│   ├── backend-api.ts         # FastAPI backend integration
│   ├── backend-hooks.ts       # React hooks for API calls
│   ├── calendar.ts            # Google Calendar utilities
│   ├── types.ts               # TypeScript type definitions
│   └── mock-data.ts           # Development mock data
├── 🔐 types/                  # TypeScript declarations
├── 📄 *.md                    # API documentation files
├── 🔑 auth.ts                 # NextAuth configuration
├── ⚙️ middleware.ts           # Route protection middleware
└── 📋 package.json            # Dependencies & scripts
```

---

## 🔌 **API Integration**

Perfect Walk integrates with a FastAPI backend for data persistence and advanced features:

### **Walking Sessions API**
```typescript
POST /api/walking-sessions     // Store walking session data
GET  /api/walking-sessions/history    // Get user session history  
GET  /api/walking-sessions/stats      // Get analytics & statistics
```

### **Community Wall API**
```typescript
POST /api/wall/post           // Create community posts
GET  /api/wall/feed           // Get community feed
POST /api/wall/{id}/like      // Like/unlike posts
GET  /api/wall/walks          // Get walking achievements
```

### **Authentication Headers**
All API requests include authentication headers:
```typescript
{
  'X-User-Email': user.email,
  'X-User-Name': user.name,
  'X-User-ID': user.id
}
```

---

## 🧪 **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:prod` | Start development with production environment |
| `npm run build` | Create production build |
| `npm run build:prod` | Build with production environment |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint code analysis |

---

## 🌍 **Environment Configuration**

### **Development Mode**
```bash
cp .env.local.example .env.local
npm run dev
```

### **Production Mode** 
```bash
cp .env.local.example .env.prod
npm run dev:prod
```

Environment files:
- `.env.local` - Local development
- `.env.prod` - Production configuration  
- `.env.local.example` - Template with required variables

---

## 🔐 **Authentication Flow**

1. **Google OAuth** - Primary authentication method
2. **Access Control** - Middleware protects dashboard routes
3. **Session Management** - JWT-based user sessions  
4. **API Security** - User headers for backend requests
5. **Calendar Permissions** - Read-only Google Calendar access

---

## 📊 **Key Features Deep Dive**

### **Burnout Score Algorithm**
- Tracks user activity patterns and mood changes
- Integrates calendar load with walking frequency
- Provides actionable recommendations for break timing
- Visual representation through dynamic leaf indicator

### **Smart Walking Recommendations**  
- Weather-aware trail suggestions
- Calendar gap identification for optimal walk timing
- Difficulty matching based on user energy levels
- Historical performance analysis for personalized recommendations

### **Community Engagement**
- Anonymous and authenticated posting options
- Walking achievement sharing with detailed metrics
- Mood improvement tracking across community
- Supportive engagement through likes and comments

### **Analytics & Insights**
- Mood trend visualization with session correlation
- Walking consistency tracking over time
- Calorie and step count aggregation
- Personal milestone celebrations and achievements

---

## 🤝 **Contributing**

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### **Development Guidelines**
- Follow TypeScript strict mode requirements
- Use Tailwind CSS for styling consistency
- Implement proper error handling for API calls
- Add JSDoc comments for complex functions
- Test authentication flows thoroughly

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Environment Variables Not Loading**
```bash
# Verify .env.local exists and has correct format
cp .env.local.example .env.local
```

**Google Calendar API Errors**
- Ensure Calendar API is enabled in Google Cloud Console
- Verify OAuth redirect URIs match exactly
- Check if user granted calendar permissions

**Backend Connection Issues**
```bash
# Update backend URL in .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Build Failures**
```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

---

## 📖 **Documentation**

- **[Authentication Setup](AUTHENTICATION.md)** - Detailed auth configuration
- **[Backend Integration](BACKEND_INTEGRATION_GUIDE.md)** - API integration guide  
- **[Walking Sessions API](WALKING_SESSION_API.md)** - Session tracking endpoints
- **[TheWall API](THEWALL_API.md)** - Community features documentation
- **[NextAuth Integration](NEXTAUTH_INTEGRATION.md)** - Authentication implementation

---

## � **Team**

### **Backend, AI & Integration Team**
- **Rajan Bastakoti** - Backend Architecture & Data Systems
- **Manash Lamichhane** - API Development & AI Integration
- **Dhiraj Majhi** - Integration & Infrastructure

### **Frontend Team** 
- **Nishu Shrestha** - Frontend Development & UI/UX
- **Prasamsha Singh Thakuri** - Frontend Development & User Experience

---

## �📜 **License**

This project is created for the **Nepal-US Hackathon 2026** and is available for educational and development purposes.

---

## 🙏 **Acknowledgments**

- **Next.js Team** - For the incredible React framework
- **NextAuth.js** - For simplified authentication
- **Google APIs** - Calendar and Places integration
- **OpenWeather** - Real-time weather data
- **Azure OpenAI** - AI-powered recommendations
- **Nepal-US Hackathon** - For the opportunity to build wellness technology

---

<div align="center">

**Built with ❤️ for mental wellness and community connection**

*Perfect Walk - Because every step toward balance matters*

</div>
