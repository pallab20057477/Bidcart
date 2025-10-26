# 🛒 BidCart - Advanced E-commerce Platform with Real-Time Auctions

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://mongodb.com/)

A modern, full-stack MERN e-commerce platform that revolutionizes online shopping by combining traditional "Buy Now" functionality with real-time auction bidding. Features multi-vendor marketplace capabilities, comprehensive admin dashboard, and enterprise-grade security.

## 🌟 Live Demo
- **Frontend**: [https://bidcart-demo.vercel.app](https://bidcart-demo.vercel.app)
- **Admin Panel**: [https://bidcart-demo.vercel.app/admin](https://bidcart-demo.vercel.app/admin)
- **API Documentation**: [https://bidcart-api.herokuapp.com/docs](https://bidcart-api.herokuapp.com/docs)

## 📸 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=BidCart+Homepage" alt="Homepage" width="400"/>
  <img src="https://via.placeholder.com/800x400/059669/FFFFFF?text=Auction+Interface" alt="Auction Interface" width="400"/>
</div>

## ✨ Key Features

### � **Dsual Shopping Experience**
- **Traditional E-commerce**: Standard "Buy Now" functionality with shopping cart
- **Real-Time Auctions**: Live bidding system with Socket.IO integration
- **Hybrid Products**: Items available for both immediate purchase and auction

### 🏪 **Multi-Vendor Marketplace**
- **Vendor Registration & Verification**: Complete business onboarding process
- **Vendor Dashboard**: Comprehensive analytics, product management, earnings tracking
- **Commission Management**: Automated commission calculation and payout system
- **Vendor Reviews**: Rating and review system for vendor credibility

### 🔥 **Advanced Auction System**
- **Real-Time Bidding**: Live auction participation with instant updates
- **Auction Scheduling**: Pre-scheduled auctions with countdown timers
- **Bid Management**: Automatic bid validation and winner determination
- **Auction Analytics**: Comprehensive auction performance tracking

### 💳 **Payment & Financial Management**
- **Razorpay Integration**: Secure payment processing with multiple methods
- **Vendor Withdrawals**: Automated payout system for vendors
- **Order Management**: Complete order lifecycle tracking
- **Financial Analytics**: Revenue tracking and commission management

### 🛡️ **Enterprise Security**
- **Rate Limiting**: API protection against abuse and DDoS
- **Input Sanitization**: XSS and NoSQL injection prevention
- **Authentication**: JWT-based secure authentication system
- **Role-Based Access**: Granular permissions for users, vendors, and admins

### 📊 **Admin Dashboard**
- **Real-Time Analytics**: Live sales, user, and auction metrics
- **User Management**: Complete user and vendor administration
- **Product Oversight**: Product approval and management system
- **Dispute Resolution**: Built-in dispute management system

### 🔔 **Real-Time Features**
- **Live Notifications**: Instant updates for bids, orders, and system events
- **Socket.IO Integration**: Real-time communication across the platform
- **Activity Tracking**: Live activity feeds and status updates
- **Responsive UI**: Real-time updates without page refreshes

## 🚀 Tech Stack

<div align="center">

| **Frontend** | **Backend** | **Database** | **Real-Time** |
|:---:|:---:|:---:|:---:|
| ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) | ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) | ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) | ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101) |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) | ![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge) | ![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logoColor=white) | ![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens) |

</div>

### **Frontend Technologies**
- **React 18+** - Modern React with hooks and context
- **React Router v6** - Client-side routing and navigation
- **TailwindCSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time bidirectional communication
- **React Hot Toast** - Beautiful toast notifications
- **React Icons** - Comprehensive icon library

### **Backend Technologies**
- **Node.js & Express.js** - Server-side JavaScript runtime and framework
- **MongoDB & Mongoose** - NoSQL database with ODM
- **Socket.IO** - Real-time WebSocket communication
- **JWT** - JSON Web Token authentication
- **Razorpay** - Payment gateway integration
- **Cloudinary** - Image storage and optimization

### **Security & Performance**
- **Helmet.js** - Security headers and protection
- **Express Rate Limit** - API rate limiting
- **Express Mongo Sanitize** - NoSQL injection prevention
- **XSS Clean** - Cross-site scripting protection
- **Compression** - Response compression for performance

## 📁 Project Structure

```
E-commerce/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── admin/      # Admin-specific components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── coupons/    # Coupon management
│   │   │   ├── delivery/   # Delivery tracking
│   │   │   ├── layout/     # Layout components
│   │   │   └── tokens/     # Token management
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   │   └── admin/          # Admin-specific routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   └── package.json
└── README.md
```

## 🛠️ Quick Start

### **Prerequisites**
- **Node.js** (v18+ recommended)
- **MongoDB** (v6+ or MongoDB Atlas)
- **npm** or **yarn**
- **Git**

### **1. Clone Repository**
```bash
git clone https://github.com/pallab20057477/Bidcart.git
cd Bidcart
```

### **2. Backend Setup**
```bash
cd server
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### **3. Frontend Setup**
```bash
cd client
npm install

# Start React development server
npm start
```

### **4. Environment Configuration**

#### **Server (.env)**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/bidcart

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Image Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### **Client (.env)**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Payment Gateway
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id

# Image Storage
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

### **5. Database Setup**
```bash
# Option 1: Local MongoDB
mongod --dbpath /path/to/your/db

# Option 2: MongoDB Atlas (Recommended)
# 1. Create account at https://mongodb.com/atlas
# 2. Create cluster and get connection string
# 3. Update MONGODB_URI in .env
```

### **6. Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Admin Panel**: http://localhost:3000/admin

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (Admin/Vendor)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Auctions
- `GET /api/products/auctions` - Get active auctions
- `GET /api/products/scheduled` - Get scheduled auctions
- `POST /api/products/:id/schedule` - Schedule auction

### Bidding
- `POST /api/bids` - Place a bid
- `GET /api/bids/product/:productId` - Get bid history
- `GET /api/bids/user` - Get user's bids

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `PUT /api/orders/:id/status` - Update order status

### Coupons
- `GET /api/coupons/admin` - Get all coupons (Admin)
- `POST /api/coupons/admin` - Create coupon (Admin)
- `POST /api/coupons/validate` - Validate coupon
- `GET /api/coupons/history` - Get coupon usage history

### Tokens
- `GET /api/tokens/balance` - Get user token balance
- `POST /api/tokens/daily-reward` - Claim daily reward
- `POST /api/tokens/spend` - Spend tokens for bidding
- `GET /api/tokens/history` - Get token transaction history
- `POST /api/tokens/admin/grant` - Grant tokens (Admin)

### Delivery Tracking
- `POST /api/delivery/create` - Create tracking (Admin)
- `GET /api/delivery/track/:trackingNumber` - Track delivery
- `PUT /api/delivery/update/:trackingNumber` - Update status (Admin)
- `GET /api/delivery/user/history` - User's delivery history

### Admin Dashboard
- `GET /api/admin/dashboard/overview` - Dashboard overview
- `GET /api/admin/dashboard/sales-chart` - Sales analytics
- `GET /api/admin/dashboard/user-growth` - User growth data
- `GET /api/admin/dashboard/category-distribution` - Category stats
- `GET /api/admin/dashboard/top-products` - Top performing products
- `GET /api/admin/dashboard/auction-performance` - Auction analytics
- `GET /api/admin/dashboard/token-analytics` - Token usage stats
- `GET /api/admin/dashboard/activity-feed` - Recent activity

## 🎨 User Experience

### **Modern Design System**
- **Responsive Design**: Mobile-first approach with seamless desktop experience
- **Dark/Light Themes**: Automatic theme switching based on user preference
- **Micro-interactions**: Smooth animations and transitions throughout
- **Loading States**: Elegant skeleton loaders and progress indicators
- **Toast Notifications**: Non-intrusive success/error messaging

### **Accessibility Features**
- **WCAG Compliance**: Meets web accessibility guidelines
- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Color Contrast**: High contrast ratios for better readability
- **Focus Management**: Clear focus indicators and logical tab order

### **Performance Optimizations**
- **Code Splitting**: Lazy loading for optimal bundle sizes
- **Image Optimization**: Cloudinary integration for responsive images
- **Caching Strategy**: Efficient API response caching
- **Bundle Analysis**: Optimized webpack configuration
- **SEO Friendly**: Server-side rendering ready structure

## 🔧 Configuration

### DaisyUI Theme
The platform uses DaisyUI with a custom theme configuration. You can customize colors and styling in the TailwindCSS configuration.

### Socket.IO Events
- `join-auction` - Join auction room
- `place-bid` - New bid placed
- `auction-ended` - Auction ended
- `bid-update` - Real-time bid updates

## 🚀 Deployment

### **Production Deployment Options**

#### **Option 1: Vercel + Railway (Recommended)**
```bash
# Frontend (Vercel)
npm run build
vercel --prod

# Backend (Railway)
# Connect GitHub repo to Railway
# Set environment variables in Railway dashboard
```

#### **Option 2: Netlify + Heroku**
```bash
# Frontend (Netlify)
npm run build
netlify deploy --prod

# Backend (Heroku)
heroku create your-app-name
git push heroku main
```

#### **Option 3: AWS/DigitalOcean**
- **Frontend**: S3 + CloudFront or DigitalOcean Spaces
- **Backend**: EC2 or DigitalOcean Droplets
- **Database**: MongoDB Atlas or self-hosted

### **Environment Setup for Production**
1. **Update environment variables** for production URLs
2. **Configure MongoDB Atlas** for cloud database
3. **Set up Cloudinary** for image storage
4. **Configure Razorpay** with production keys
5. **Enable HTTPS** for secure communication

### **Performance Monitoring**
- **Error Tracking**: Sentry integration ready
- **Analytics**: Google Analytics setup
- **Uptime Monitoring**: UptimeRobot configuration
- **Performance**: Lighthouse CI integration

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### **Development Guidelines**
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📊 Project Status

- ✅ **Core E-commerce Features**: Complete
- ✅ **Auction System**: Complete
- ✅ **Multi-vendor Support**: Complete
- ✅ **Payment Integration**: Complete
- ✅ **Admin Dashboard**: Complete
- ✅ **Security Implementation**: Complete
- 🔄 **Mobile App**: In Development
- 🔄 **Advanced Analytics**: Planned

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

- **Documentation**: [Full Documentation](PRODUCTION_READINESS_REPORT.md)
- **Issues**: [GitHub Issues](https://github.com/pallab20057477/Bidcart/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pallab20057477/Bidcart/discussions)
- **Email**: support@bidcart.com

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **MongoDB** for the flexible database solution
- **Socket.IO** for real-time communication
- **TailwindCSS** for the utility-first CSS framework
- **Razorpay** for payment processing

## 📈 Roadmap

- [ ] **Mobile Application** (React Native)
- [ ] **Advanced Analytics Dashboard**
- [ ] **Multi-language Support**
- [ ] **AI-powered Recommendations**
- [ ] **Blockchain Integration**
- [ ] **Advanced Search with Elasticsearch**

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

**BidCart** - *Revolutionizing E-commerce with Real-Time Auctions* 🛒⚡

Made with ❤️ by [Pallab](https://github.com/pallab20057477)

</div> 