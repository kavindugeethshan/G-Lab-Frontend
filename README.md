# G-Lab Frontend

A modern, high-performance e-commerce Single Page Application (SPA) and PC building studio built for computer hardware enthusiasts, gamers, and professional workstation builders.

The frontend is built with React, Vite, Vanilla CSS, FontAwesome, Chart.js, and DotLottie animations. It connects to the separate [G-Lab Backend](https://github.com/kavindugeethshan/G-Lab-backend) REST API and real-time Socket.IO service.

---

## Overview

**G-Lab Frontend** provides a responsive shopping experience focused on PC hardware and custom system building.

The platform includes:

* Hardware product catalog
* Product search, filtering, and sorting
* Product details and customer reviews
* Interactive PC Builder
* Hardware compatibility checking
* Budget tracking
* AI-powered hardware assistance
* User authentication and OTP verification
* Shopping cart and checkout
* Order tracking
* PayHere payment integration
* Customer profile management
* Admin dashboard
* Firebase image storage
* Responsive UI for desktop and mobile devices

---

## Key Features

### 1. Storefront & Product Catalog

* Cinematic homepage with hero content and hardware categories
* Hardware catalog with search, filtering, sorting, and category browsing
* Product detail pages with specifications, images, stock information, and reviews
* Customer ratings and reviews
* Add-to-cart functionality

### 2. PC Builder Studio

The `/pc-builder` section provides an interactive environment for creating custom PC configurations.

#### Build Modes

* **Manual Studio**

  * Select CPU
  * Motherboard
  * Memory
  * Storage
  * GPU
  * Power Supply
  * PC Case
  * CPU Cooler
  * Case Fans

* **Auto Budget Builder**

  * Create configurations based on a selected budget
  * Compare component costs
  * Track total build price

* **Game Performance Optimizer**

  * Select supported games
  * Select target resolution
  * View estimated performance information
  * Receive component recommendations

#### Hardware Compatibility

The builder provides compatibility checks including:

* CPU and motherboard socket compatibility
* RAM generation compatibility
* Power supply capacity
* PC case and component compatibility
* Component clearance validation

#### Budget Tracking

* Real-time total cost calculation
* Budget utilization tracking
* Budget warnings
* Component-by-component cost breakdown

#### Saved Builds

* Save custom configurations locally
* Reload saved builds
* Review build summaries
* Share build configurations

---

## 3. AI Hardware Assistant

G-Lab includes an AI-powered hardware assistant designed to help users with PC hardware related questions.

Features include:

* Hardware recommendations
* Component comparisons
* Hardware-related questions
* Build guidance
* Product recommendations
* Interactive product information

The AI functionality communicates with the backend AI service rather than exposing provider credentials in the frontend.

---

## 4. Authentication & Account Security

The frontend supports:

* User registration
* Email OTP verification
* User login
* JWT-based authentication
* Password reset
* Protected routes
* Admin route protection
* Automatic handling of expired authentication sessions

Authentication requests are handled through the backend API.

---

## 5. Shopping Cart & Checkout

The shopping system includes:

* Persistent shopping cart
* Product quantity management
* Stock validation
* Real-time cart total calculation
* Delivery address management
* Checkout workflow
* Order creation
* Order history

---

## 6. PayHere Payment Integration

G-Lab integrates with **PayHere Sandbox** for payment testing.

### Local Development

PayHere Sandbox can be tested through the local development environment as part of the development workflow.

### Online / Deployed Environment

When testing the PayHere payment flow through an online deployment, a **publicly accessible domain** is required for the PayHere callback/IPN communication.

The deployed backend and PayHere configuration must therefore be configured with the appropriate public URL before testing the online payment flow.

> **Note:** PayHere Sandbox is intended for testing and does not process real payments.

---

## 7. Customer Dashboard

The `/profile` section provides customer account functionality.

Features include:

* Profile information management
* Phone number updates
* Delivery address management
* Password changes
* Profile picture upload
* Order history
* Order status tracking
* Order cancellation where applicable

Supported order states include:

`Pending` → `Confirmed` → `Processing` → `Dispatched` → `Delivered`

---

## 8. Administration Dashboard

The `/admin` section provides administrative management functionality.

### Admin Features

* Protected administrator routes
* Dashboard statistics
* Revenue and order analytics
* Product management
* Product stock management
* Customer management
* Order management
* Review moderation
* Administrative user management
* Chart.js data visualization

Administrators can manage products, customers, orders, reviews, and other platform operations through the dashboard.

---

## Tech Stack

| Layer              | Technology        |
| :----------------- | :---------------- |
| Frontend Framework | React             |
| Build Tool         | Vite              |
| Routing            | React Router      |
| State Management   | React Context API |
| HTTP Client        | Axios             |
| Styling            | Vanilla CSS       |
| Icons              | FontAwesome       |
| Animations         | DotLottie         |
| Data Visualization | Chart.js          |
| Cloud Storage      | Firebase Storage  |
| Code Quality       | Oxlint            |
| Containerization   | Docker            |
| Deployment         | Vercel / Docker   |

---

## Project Structure

```text
G-Lab-frontend/
│
├── public/
│   ├── animation/
│   ├── hero/
│   └── images/
│
├── src/
│   ├── components/
│   │   ├── ai/
│   │   ├── common/
│   │   ├── layout/
│   │   └── products/
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   └── ToastContext.jsx
│   │
│   ├── pages/
│   │   ├── admin/
│   │   ├── pc-builder/
│   │   ├── AuthPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── EditProfilePage.jsx
│   │   ├── HomePage.jsx
│   │   ├── NotFoundPage.jsx
│   │   ├── PaymentGatewayPage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── ProductsPage.jsx
│   │   └── ProfilePage.jsx
│   │
│   ├── routes/
│   │   ├── AdminRoute.jsx
│   │   ├── AppRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── services/
│   │   ├── adminService.js
│   │   ├── aiService.js
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── cartService.js
│   │   ├── firebase.js
│   │   ├── orderService.js
│   │   ├── paymentService.js
│   │   └── productService.js
│   │
│   ├── utils/
│   │   └── fileValidation.js
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .dockerignore
├── .gitignore
├── Dockerfile
├── index.html
├── nginx.conf
├── package.json
├── vercel.json
├── vite.config.js
└── README.md
```

---

## Installation & Local Setup

### Prerequisites

* Node.js 20+ 
* npm
* Running G-Lab Backend instance

### 1. Clone the Repository

```bash
git clone https://github.com/kavindugeethshan/G-Lab-frontend.git
cd G-Lab-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root when a custom backend URL is required.

```env
VITE_API_URL=http://localhost:3001
```

For local development, the backend normally runs on:

```text
http://localhost:3001
```

### 4. Start Development Server

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

## Production Build

Create an optimized production build:

```bash
npm run build
```

The production files will be generated inside:

```text
dist/
```

To preview the production build locally:

```bash
npm run preview
```

---

## Docker Deployment

The project includes a multi-stage Docker build that builds the React application and serves the production files using Nginx.

### Build Image

```bash
docker build -t g-lab-frontend:latest .
```

### Run Container

```bash
docker run -d -p 8080:80 --name g-lab-frontend g-lab-frontend:latest
```

The application will then be available at:

```text
http://localhost:8080
```

---

## Vercel Deployment

The project includes a `vercel.json` configuration for React SPA routing.

When deploying to Vercel:

1. Connect the GitHub repository to Vercel.
2. Configure the required environment variables.
3. Set `VITE_API_URL` to the deployed backend URL.
4. Deploy the application.

The SPA rewrite configuration allows client-side routes such as:

```text
/products
/profile
/pc-builder
/admin
```

to work correctly after page refreshes.

---

## Backend Integration

The frontend communicates with the separate G-Lab Backend.

### Backend Repository

[G-Lab Backend](https://github.com/kavindugeethshan/G-Lab-backend)

### Backend Technologies

* Node.js
* Express
* MongoDB
* Mongoose
* Socket.IO
* PayHere
* Google Gemini AI

The backend handles authentication, products, cart operations, orders, reviews, payments, AI services, and other server-side functionality.

---

## System Architecture

```text
                    G-Lab Application
                           │
                           ▼
                  ┌─────────────────┐
                  │ React Frontend  │
                  │   Vite + SPA    │
                  └────────┬────────┘
                           │
                    REST API / Socket.IO
                           │
                           ▼
                  ┌─────────────────┐
                  │ Node.js Backend │
                  │ Express + APIs  │
                  └────────┬────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
        MongoDB         Firebase      PayHere
        Database        Storage       Sandbox
```

---

## DevOps & Deployment

The frontend is designed to work as part of a containerized deployment architecture.

```text
GitHub
   │
   ▼
GitHub Actions
   │
   ▼
Docker Build
   │
   ▼
Container Registry
   │
   ▼
Linux Server
   │
   ├── G-Lab Frontend Container
   │       └── Nginx
   │
   └── G-Lab Backend Container
           └── Node.js / Express
```

The frontend can also be deployed independently through Vercel.

---

## Security

The frontend follows several security practices including:

* JWT authentication through the backend
* Protected application routes
* Admin route protection
* Client-side file validation
* Environment variables for configurable API endpoints
* No backend secrets embedded in the frontend
* HTTPS support through production hosting
* SPA route protection and authentication handling

> Client-side validation improves user experience and provides an additional layer of protection, but sensitive validation and authorization must always be enforced by the backend.

---

## Current Stable Version

The frontend currently uses the stable baseline:

```text
Commit: 295f4d7
Branch: main
```

This version represents the stable frontend state used before the recent changes that were rolled back.

---

## Related Project

**G-Lab Backend**

The backend repository contains the REST API, database models, authentication, payment processing, Socket.IO services, and server-side application logic.

Repository:

https://github.com/kavindugeethshan/G-Lab-backend

---

## Author

**Kavindu Geethshan**

Bachelor of Information Technology (BIT)
University of Colombo School of Computing

GitHub:

https://github.com/kavindugeethshan

---

## License

This project is developed for educational and portfolio purposes under the ISC License.
