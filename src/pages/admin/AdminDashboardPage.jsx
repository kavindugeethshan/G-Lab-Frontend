import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';
import { uploadFileToFirebase } from '../../services/firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './AdminDashboardPage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { validateImageSecurity } from '../../utils/fileValidation';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Message feedback
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const feedbackTimeout = useRef(null);

  const setMessage = (text, type = '') => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    setFeedback({ text, type });
    if (type === 'success' || type === 'error') {
      feedbackTimeout.current = setTimeout(() => {
        setFeedback({ text: '', type: '' });
      }, 4000);
    }
  };

  // Main Data States
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Orders Tab States
  const [updateOrderId, setUpdateOrderId] = useState('');
  const [updateOrderStatus, setUpdateOrderStatus] = useState('Confirmed');
  const [searchOrdersInput, setSearchOrdersInput] = useState('');
  const [filterStatusSelect, setFilterStatusSelect] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  // Products Tab States
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newDiscount, setNewDiscount] = useState('0');
  const [newDescription, setNewDescription] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const fileInputRef = useRef(null);

  // Edit / Restock Modal
  const [editingProduct, setEditingProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Users Tab States
  const [selectedUserModal, setSelectedUserModal] = useState(null);

  // Admin Tab States
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Loaders
  const loadDashboardStatistics = async () => {
    try {
      const data = await adminService.getStatistics();
      setStats(data?.statistics || data || {});
    } catch (err) {
      console.error('loadDashboardStatistics error:', err);
      setMessage(`Failed to load statistics: ${err.message}`, 'error');
    }
  };

  const loadAllOrders = async () => {
    try {
      const data = await adminService.getOrders();
      setOrders(data?.orders || data || []);
    } catch (err) {
      console.error('loadAllOrders error:', err);
      setMessage(`Failed to load orders: ${err.message}`, 'error');
    }
  };

  const loadProducts = async () => {
    try {
      const data = await adminService.getAllProducts();
      setProducts(data?.products || data || []);
    } catch (err) {
      console.error('loadProducts error:', err);
      setMessage(`Failed to load products: ${err.message}`, 'error');
    }
  };

  const loadAllUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data?.users || data || []);
    } catch (err) {
      console.error('loadAllUsers error:', err);
      setMessage(`Failed to load users: ${err.message}`, 'error');
    }
  };

  const loadAllReviews = async () => {
    try {
      const data = await adminService.getReviews();
      setReviews(data?.reviews || data || []);
    } catch (err) {
      console.error('loadAllReviews error:', err);
      setMessage(`Failed to load reviews: ${err.message}`, 'error');
    }
  };

  // Tab switching
  const switchTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'dashboard') loadDashboardStatistics();
    if (tabId === 'orders') loadAllOrders();
    if (tabId === 'products') loadProducts();
    if (tabId === 'users') loadAllUsers();
    if (tabId === 'admins') loadAllUsers();
    if (tabId === 'reviews') loadAllReviews();
  };

  useEffect(() => {
    loadDashboardStatistics();
  }, []);

  // Quick Update Order Status
  const handleQuickUpdateOrderStatus = async () => {
    if (!updateOrderId.trim()) {
      setMessage('Please enter an Order ID to update.', 'error');
      return;
    }
    setMessage(`Updating order status to "${updateOrderStatus}"...`, 'loading');
    try {
      await adminService.updateOrderStatus(updateOrderId.trim(), updateOrderStatus);
      setMessage(`Order #${updateOrderId.trim()} updated to "${updateOrderStatus}" successfully!`, 'success');
      showToast(`Order status updated to ${updateOrderStatus}`, 'success');
      loadAllOrders();
      loadDashboardStatistics();
      setUpdateOrderId('');
    } catch (err) {
      console.error('adminUpdateOrderStatus error:', err);
      setMessage(`Update failed: ${err.response?.data?.message || err.message}`, 'error');
      showToast('Order status update failed', 'error');
    }
  };

  // Search Orders
  const handleSearchOrders = async () => {
    const q = searchOrdersInput.trim();
    if (!q) {
      loadAllOrders();
      return;
    }
    setMessage('Searching orders...', 'loading');
    try {
      const data = await adminService.searchOrders(q);
      const list = data.orders || [];
      setOrders(list);
      setMessage(`Found ${list.length} order(s).`, 'success');
    } catch (err) {
      console.error('searchOrders error:', err);
      setMessage(`Search failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  // Filter Orders by Status
  const handleFilterOrdersByStatus = async (status) => {
    setFilterStatusSelect(status);
    if (!status) {
      loadAllOrders();
      return;
    }
    setMessage(`Filtering orders by ${status}...`, 'loading');
    try {
      const data = await adminService.getOrders(status);
      const list = data.orders || [];
      setOrders(list);
      setMessage(`Found ${list.length} ${status} order(s).`, 'success');
    } catch (err) {
      console.error('filterOrders error:', err);
      setMessage(`Filter failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  // View Order Details Modal
  const handleViewOrderDetails = async (orderId) => {
    try {
      const data = await adminService.getOrderDetails(orderId);
      setSelectedOrderModal(data.order || data);
    } catch {
      const found = orders.find((o) => o._id === orderId);
      setSelectedOrderModal(found || null);
    }
  };

  // Create Product Handler
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newImageFile) {
      setMessage('Please select a product image file.', 'error');
      return;
    }

    const validation = await validateImageSecurity(newImageFile);
    if (!validation.valid) {
      setMessage(validation.error, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsCreatingProduct(true);
    setMessage('Verifying security & uploading image...', 'loading');

    try {
      const imageUrl = await uploadFileToFirebase(newImageFile, 'products');

      const body = {
        name: newName.trim(),
        description: newDescription.trim(),
        category: newCategory.trim(),
        brand: newBrand.trim() || 'G-Lab',
        price: Number(newPrice),
        stock: Number(newStock) || 0,
        discount: Number(newDiscount) || 0,
        image: imageUrl,
        Image: imageUrl,
      };

      setMessage('Creating product in database...', 'loading');
      await adminService.createProduct(body);

      setMessage('Product created successfully with Firebase image!', 'success');
      showToast('Product created successfully!', 'success');

      setNewName('');
      setNewCategory('');
      setNewBrand('');
      setNewPrice('');
      setNewStock('');
      setNewDiscount('0');
      setNewDescription('');
      setNewImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      loadProducts();
      loadDashboardStatistics();
    } catch (err) {
      console.error('createProduct error:', err);
      setMessage(`Product creation failed: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Edit Product Modal Handlers
  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setEditPrice(String(prod.price ?? ''));
    setEditStock(String(prod.stock ?? ''));
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    const body = {};
    if (editPrice.trim() !== '') body.price = Number(editPrice);
    if (editStock.trim() !== '') body.stock = Number(editStock);

    if (Object.keys(body).length === 0) {
      setEditingProduct(null);
      return;
    }

    setIsSavingEdit(true);
    setMessage('Updating product...', 'loading');
    try {
      await adminService.updateProduct(editingProduct._id, body);
      setMessage('Product updated successfully!', 'success');
      showToast('Product updated successfully!', 'success');
      setEditingProduct(null);
      loadProducts();
      loadDashboardStatistics();
    } catch (err) {
      console.error('adminUpdateProduct error:', err);
      setMessage(`Update failed: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setMessage('Deleting product...', 'loading');
    try {
      await adminService.deleteProduct(id);
      setMessage('Product deleted successfully!', 'success');
      showToast('Product deleted', 'info');
      loadProducts();
      loadDashboardStatistics();
    } catch (err) {
      console.error('adminDeleteProduct error:', err);
      setMessage(`Delete failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  // Users Handlers
  const handleViewUserDetails = async (userId) => {
    try {
      const data = await adminService.getUserDetails(userId);
      setSelectedUserModal(data.user || data);
    } catch {
      const found = users.find((u) => u._id === userId);
      setSelectedUserModal(found || null);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to block this user?')) return;
    setMessage('Blocking user...', 'loading');
    try {
      await adminService.blockUser(userId);
      setMessage('User blocked successfully!', 'success');
      showToast('User blocked', 'info');
      loadAllUsers();
      loadDashboardStatistics();
    } catch (err) {
      setMessage(`Block failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const handleUnblockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to unblock this user?')) return;
    setMessage('Unblocking user...', 'loading');
    try {
      await adminService.unblockUser(userId);
      setMessage('User unblocked successfully!', 'success');
      showToast('User unblocked', 'success');
      loadAllUsers();
    } catch (err) {
      setMessage(`Unblock failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user permanently?')) return;
    setMessage('Deleting user...', 'loading');
    try {
      await adminService.deleteUser(userId);
      setMessage('User deleted successfully!', 'success');
      showToast('User deleted', 'info');
      loadAllUsers();
      loadDashboardStatistics();
    } catch (err) {
      setMessage(`Delete failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  // Create Admin Account
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (adminPassword !== adminConfirmPassword) {
      setMessage('Passwords do not match. Please check and re-enter.', 'error');
      return;
    }

    setIsCreatingAdmin(true);
    setMessage('Creating new administrator account...', 'loading');

    try {
      const data = await adminService.createAdmin({
        firstname: adminFirstName.trim(),
        lastname: adminLastName.trim(),
        email: adminEmail.trim().toLowerCase(),
        password: adminPassword,
      });

      setMessage(`🎉 ${data.message || 'Admin account created successfully'}!`, 'success');
      showToast('Admin account created successfully!', 'success');
      setAdminFirstName('');
      setAdminLastName('');
      setAdminEmail('');
      setAdminPassword('');
      setAdminConfirmPassword('');
      loadAllUsers();
    } catch (err) {
      console.error('handleCreateAdmin error:', err);
      setMessage(`Admin creation failed: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  // Reviews Handler
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    setMessage('Deleting review...', 'loading');
    try {
      await adminService.deleteReview(reviewId);
      setMessage('Review deleted successfully!', 'success');
      showToast('Review deleted', 'info');
      loadAllReviews();
    } catch (err) {
      setMessage(`Delete failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Computed Values & Chart Data from stats
  const totalUsers = stats?.totalUsers || 0;
  const totalProducts = stats?.totalProducts || 0;
  const totalOrders = stats?.totalOrders || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  const lowStockCount = stats?.lowStockCount || 0;
  const pendingOrders = stats?.pendingOrders || 0;
  const confirmedOrders = stats?.confirmedOrders || 0;
  const shippedOrders = stats?.shippedOrders || 0;
  const deliveredOrders = stats?.deliveredOrders || 0;
  const cancelledOrders = stats?.cancelledOrders || 0;

  const delRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0';
  const penRate = totalOrders > 0 ? ((pendingOrders / totalOrders) * 100).toFixed(1) : '0';
  const canRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : '0';

  // Chart 1: Sales Line Chart (Modern Neon Emerald Gradient Curve)
  const salesOverTime = stats?.salesOverTime || [];
  const salesLabels = salesOverTime.length > 0
    ? salesOverTime.map((d) => {
        if (!d._id) return 'Unknown';
        const parts = String(d._id).split('-');
        if (parts.length === 3) {
          const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return d._id;
      })
    : ['No Orders Yet'];
  const salesValues = salesOverTime.length > 0 ? salesOverTime.map((d) => d.revenue) : [0];

  const salesChartData = {
    labels: salesLabels,
    datasets: [
      {
        label: 'Sales Revenue (Rs.)',
        data: salesValues,
        borderColor: '#10b981',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(16, 185, 129, 0.15)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.38)');
          gradient.addColorStop(0.65, 'rgba(16, 185, 129, 0.08)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#070a12',
        pointBorderColor: '#10b981',
        pointBorderWidth: 2.5,
        pointHoverBackgroundColor: '#10b981',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2.5,
      },
    ],
  };

  // Chart 2: Category Bar Chart (Modern Vibrant Gradient Columns)
  const categoryStats = stats?.categoryStats || [];
  const catLabels = categoryStats.length > 0 ? categoryStats.map((c) => c._id || 'Unassigned') : ['No Products'];
  const catValues = categoryStats.length > 0 ? categoryStats.map((c) => c.count) : [0];

  const categoryGradients = [
    ['#38bdf8', '#0284c7'], // Cyan -> Blue
    ['#a855f7', '#7c3aed'], // Purple -> Violet
    ['#ec4899', '#db2777'], // Pink -> Rose
    ['#f59e0b', '#d97706'], // Amber -> Orange
    ['#10b981', '#059669'], // Emerald -> Teal
    ['#06b6d4', '#0891b2'], // Light Cyan -> Deep Cyan
    ['#6366f1', '#4f46e5'], // Indigo
    ['#f97316', '#ea580c'], // Orange
    ['#14b8a6', '#0d9488'], // Teal
    ['#8b5cf6', '#6d28d9'], // Violet
  ];

  const categoryChartData = {
    labels: catLabels,
    datasets: [
      {
        label: 'Total Products',
        data: catValues,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#38bdf8';
          const pair = categoryGradients[context.dataIndex % categoryGradients.length];
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, pair[1]);
          gradient.addColorStop(1, pair[0]);
          return gradient;
        },
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.8,
        hoverBackgroundColor: '#ffffff',
      },
    ],
  };

  // Chart 3: Order Status Doughnut Chart (Modern Thin Ring with Gap Spacing & Rounded Caps)
  const orderStatusChartData = {
    labels: ['Pending', 'Confirmed / Shipped', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [pendingOrders, confirmedOrders + shippedOrders, deliveredOrders, cancelledOrders],
        backgroundColor: ['#f59e0b', '#38bdf8', '#10b981', '#ef4444'],
        hoverBackgroundColor: ['#fbbf24', '#7dd3fc', '#34d399', '#f87171'],
        borderWidth: 3,
        borderColor: '#0b0f19',
        borderRadius: 6,
        spacing: 4,
      },
    ],
  };

  // Chart 4: Top Selling Products (Leaderboard Gradient Horizontal Bars)
  const topProductsList = stats?.topProducts || [];
  const topProdLabels = topProductsList.length > 0 ? topProductsList.map((p) => p.name) : ['No Sold Items'];
  const topProdValues = topProductsList.length > 0 ? topProductsList.map((p) => p.totalSold) : [0];

  const topProductGradients = [
    ['#f59e0b', '#fbbf24'], // Rank 1: Gold / Amber Leader
    ['#0284c7', '#38bdf8'], // Rank 2: Electric Cyan / Blue
    ['#7c3aed', '#c084fc'], // Rank 3: Radiant Purple
    ['#059669', '#34d399'], // Rank 4: Emerald
    ['#db2777', '#f472b6'], // Rank 5: Rose
  ];

  const topProductsChartData = {
    labels: topProdLabels,
    datasets: [
      {
        label: 'Units Sold',
        data: topProdValues,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#8b5cf6';
          const pair = topProductGradients[context.dataIndex % topProductGradients.length];
          const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
          gradient.addColorStop(0, pair[0]);
          gradient.addColorStop(1, pair[1]);
          return gradient;
        },
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.8,
        hoverBackgroundColor: '#ffffff',
      },
    ],
  };

  const recentOrdersList = stats?.recentOrders || [];
  const lowStockItemsList = stats?.lowStockItems || [];
  const recentActivityList = stats?.recentActivity || [];

  const adminUsersList = users.filter((u) => u.isadmin === true || u.isadmin === 'true' || u.isAdmin === true || u.role === 'admin');

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'Confirmed':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' };
      case 'Shipped':
        return { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc' };
      case 'Delivered':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' };
      case 'Cancelled':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' };
    }
  };

  return (
    <div className="admin-page-wrapper">
      {/* HEADER / NAVIGATION */}
      <header className="admin-header">
        <div className="admin-logo-title" onClick={() => switchTab('dashboard')}>
          <div className="admin-logo-icon">G</div>
          <div className="admin-logo-text">
            <h1>
              G LAB <span className="admin-badge">ADMIN</span>
            </h1>
            <span>E-Commerce Backend Control Panel</span>
          </div>
        </div>

        <div className="nav-actions">
          <span className="user-greeting" id="userGreeting">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.firstname || 'Admin'}
                className="user-nav-avatar"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <i className="fa-solid fa-user-shield"></i>
            )}
            <span>
              Hi, <strong>{user?.firstname || 'Admin'}</strong>
            </span>
          </span>
          <button type="button" className="btn btn-storefront" onClick={() => navigate('/')}>
            🌐 Storefront
          </button>
          <button type="button" className="btn btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-container">
        {/* Toast Feedback Message */}
        {feedback.text && (
          <div className={`admin-message ${feedback.type}`}>
            {feedback.text}
          </div>
        )}

        {/* NAVIGATION TABS BAR (Modern Segmented Dock) */}
        <div className="admin-tabs-nav">
          <button
            id="tab-dashboard"
            className={`admin-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => switchTab('dashboard')}
          >
            <i className="fa-solid fa-chart-pie"></i>
            <span>Dashboard</span>
          </button>
          <button
            id="tab-orders"
            className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => switchTab('orders')}
          >
            <i className="fa-solid fa-boxes-stacked"></i>
            <span>Orders</span>
            {totalOrders > 0 && <span className="admin-tab-badge">{totalOrders}</span>}
          </button>
          <button
            id="tab-products"
            className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => switchTab('products')}
          >
            <i className="fa-solid fa-microchip"></i>
            <span>Products</span>
            {totalProducts > 0 && <span className="admin-tab-badge">{totalProducts}</span>}
          </button>
          <button
            id="tab-users"
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => switchTab('users')}
          >
            <i className="fa-solid fa-users"></i>
            <span>Users</span>
            {totalUsers > 0 && <span className="admin-tab-badge">{totalUsers}</span>}
          </button>
          <button
            id="tab-admins"
            className={`admin-tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => switchTab('admins')}
          >
            <i className="fa-solid fa-shield-halved"></i>
            <span>Admins</span>
            {adminUsersList.length > 0 && <span className="admin-tab-badge">{adminUsersList.length}</span>}
          </button>
          <button
            id="tab-reviews"
            className={`admin-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => switchTab('reviews')}
          >
            <i className="fa-solid fa-star"></i>
            <span>Reviews</span>
            {reviews.length > 0 && <span className="admin-tab-badge">{reviews.length}</span>}
          </button>
        </div>

        {/* SECTION 1: DASHBOARD ANALYTICS & STATS */}
        {activeTab === 'dashboard' && (
          <div id="sec-dashboard" className="section-card active">
            <h2>📊 Admin Analytics & System Performance</h2>

            {/* KPI Metric Cards Grid (5 Cards) */}
            <div className="stats-grid">
              <div className="stat-card revenue">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <span className="stat-label">Total Revenue</span>
                  <span className="stat-value" id="statTotalRevenue" style={{ color: 'var(--success-color)' }}>
                    Rs. {totalRevenue.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
              <div className="stat-card orders">
                <div className="stat-icon">🛒</div>
                <div className="stat-info">
                  <span className="stat-label">Total Orders</span>
                  <span className="stat-value" id="statTotalOrders">
                    {totalOrders}
                  </span>
                </div>
              </div>
              <div className="stat-card products">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <span className="stat-label">Total Products</span>
                  <span className="stat-value" id="statTotalProducts">
                    {totalProducts}
                  </span>
                </div>
              </div>
              <div className="stat-card users">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <span className="stat-label">Total Customers</span>
                  <span className="stat-value" id="statTotalUsers">
                    {totalUsers}
                  </span>
                </div>
              </div>
              <div className="stat-card pending">
                <div className="stat-icon">⚠️</div>
                <div className="stat-info">
                  <span className="stat-label">Low Stock Warning</span>
                  <span className="stat-value" id="statLowStock" style={{ color: 'var(--error-color)' }}>
                    {lowStockCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Analytics Charts Grid */}
            <div className="charts-grid">
              {/* Chart 1: Sales Revenue Overview */}
              <div className="chart-box">
                <div className="chart-header-row">
                  <div className="chart-title">
                    <span>📈 Sales Revenue Overview</span>
                  </div>
                  <span
                    className="chart-badge-pill"
                    style={{
                      borderColor: 'rgba(16, 185, 129, 0.35)',
                      color: '#34d399',
                      background: 'rgba(16, 185, 129, 0.1)',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'inline-block',
                      }}
                    ></span>
                    Rs. {totalRevenue.toLocaleString()} Total
                  </span>
                </div>
                <div className="chart-container">
                  <Line
                    data={salesChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          titleColor: '#f8fafc',
                          bodyColor: '#34d399',
                          borderColor: 'rgba(16, 185, 129, 0.35)',
                          borderWidth: 1,
                          padding: 12,
                          boxPadding: 6,
                          usePointStyle: true,
                          cornerRadius: 10,
                          callbacks: {
                            label: (context) => ` Revenue: Rs. ${(context.raw || 0).toLocaleString()}`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: {
                            color: '#94a3b8',
                            font: { size: 11, weight: '500' },
                            maxRotation: 0,
                          },
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderDash: [5, 5],
                          },
                          ticks: {
                            color: '#94a3b8',
                            font: { size: 11, weight: '500' },
                            callback: (value) => {
                              if (value >= 1000000) return `Rs. ${(value / 1000000).toFixed(1)}M`;
                              if (value >= 1000) return `Rs. ${(value / 1000).toFixed(0)}k`;
                              return `Rs. ${value}`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Chart 2: Category Distribution */}
              <div className="chart-box">
                <div className="chart-header-row">
                  <div className="chart-title">
                    <span>📊 Category Distribution</span>
                  </div>
                  <span className="chart-badge-pill">
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        display: 'inline-block',
                      }}
                    ></span>
                    {catLabels.length} Categories · {totalProducts} Products
                  </span>
                </div>
                <div className="chart-container">
                  <Bar
                    data={categoryChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          titleColor: '#f8fafc',
                          bodyColor: '#38bdf8',
                          borderColor: 'rgba(56, 189, 248, 0.35)',
                          borderWidth: 1,
                          padding: 12,
                          boxPadding: 6,
                          usePointStyle: true,
                          cornerRadius: 10,
                          callbacks: {
                            label: (context) => {
                              const count = context.raw || 0;
                              const pct = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;
                              return ` ${count} Products (${pct}% of catalog)`;
                            },
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: {
                            color: '#94a3b8',
                            font: { size: 11, weight: '500' },
                            maxRotation: 35,
                          },
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderDash: [5, 5],
                          },
                          ticks: {
                            precision: 0,
                            color: '#94a3b8',
                            font: { size: 11, weight: '500' },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Secondary Analytics Charts Grid */}
            <div className="charts-grid">
              {/* Chart 3: Order Status Breakdown */}
              <div className="chart-box">
                <div className="chart-header-row">
                  <div className="chart-title">
                    <span>🍩 Order Status Breakdown</span>
                  </div>
                  <span
                    className="chart-badge-pill"
                    style={{
                      borderColor: 'rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.1)',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        display: 'inline-block',
                      }}
                    ></span>
                    {totalOrders} Total Orders
                  </span>
                </div>
                <div className="chart-container">
                  <Doughnut
                    data={orderStatusChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '72%',
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            color: '#cbd5e1',
                            font: { size: 12, weight: '600' },
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8,
                            boxHeight: 8,
                          },
                        },
                        tooltip: {
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          titleColor: '#f8fafc',
                          bodyColor: '#38bdf8',
                          borderColor: 'rgba(56, 189, 248, 0.25)',
                          borderWidth: 1,
                          padding: 12,
                          boxPadding: 6,
                          usePointStyle: true,
                          cornerRadius: 10,
                          callbacks: {
                            label: (context) => {
                              const val = context.raw || 0;
                              const pct = totalOrders > 0 ? Math.round((val / totalOrders) * 100) : 0;
                              return ` ${context.label}: ${val} Orders (${pct}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Chart 4: Top Selling Products */}
              <div className="chart-box">
                <div className="chart-header-row">
                  <div className="chart-title">
                    <span>🏆 Top Selling Products</span>
                  </div>
                  <span
                    className="chart-badge-pill"
                    style={{
                      borderColor: 'rgba(168, 85, 247, 0.35)',
                      color: '#c084fc',
                      background: 'rgba(168, 85, 247, 0.1)',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#a855f7',
                        display: 'inline-block',
                      }}
                    ></span>
                    Best Sellers Leaderboard
                  </span>
                </div>
                <div className="chart-container">
                  <Bar
                    data={topProductsChartData}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          titleColor: '#f8fafc',
                          bodyColor: '#c084fc',
                          borderColor: 'rgba(168, 85, 247, 0.35)',
                          borderWidth: 1,
                          padding: 12,
                          boxPadding: 6,
                          usePointStyle: true,
                          cornerRadius: 10,
                          callbacks: {
                            label: (context) => ` Total Sold: ${context.raw || 0} units`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderDash: [5, 5],
                          },
                          ticks: {
                            precision: 0,
                            color: '#94a3b8',
                            font: { size: 11, weight: '500' },
                          },
                        },
                        y: {
                          grid: { display: false },
                          ticks: {
                            color: '#e2e8f0',
                            font: { size: 11, weight: '600' },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Live Tables & Activity Widgets Grid */}
            <div className="dashboard-widgets-grid">
              {/* Recent Orders Widget */}
              <div className="chart-box" style={{ padding: '20px' }}>
                <div className="chart-title" style={{ justifyContent: 'space-between' }}>
                  <span>📦 Recent Orders</span>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={() => switchTab('orders')}
                  >
                    View All
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrdersList.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            No recent orders.
                          </td>
                        </tr>
                      ) : (
                        recentOrdersList.map((o) => {
                          const customer = o.User
                            ? `${o.User.firstname || ''} ${o.User.lastname || ''}`.trim() || o.User.email
                            : 'Guest';
                          const dateStr = new Date(o.createdAt || Date.now()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          });
                          const sc = getBadgeStyle(o.Orderstatus || 'Pending');

                          return (
                            <tr key={o._id}>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                #{String(o._id).substring(18)}
                              </td>
                              <td>
                                <strong>{customer}</strong>
                              </td>
                              <td style={{ fontSize: '0.82rem' }}>{dateStr}</td>
                              <td style={{ color: 'var(--success-color)', fontWeight: 700 }}>
                                Rs. {(o.FinalTotal || 0).toLocaleString()}
                              </td>
                              <td>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: sc.bg,
                                    color: sc.text,
                                  }}
                                >
                                  {o.Orderstatus || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Products Widget */}
              <div className="chart-box" style={{ padding: '20px' }}>
                <div className="chart-title" style={{ justifyContent: 'space-between' }}>
                  <span>⚠️ Low Stock Alert (Stock ≤ 5)</span>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={() => switchTab('products')}
                  >
                    Manage
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItemsList.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            Healthy stock level across all products.
                          </td>
                        </tr>
                      ) : (
                        lowStockItemsList.map((p) => (
                          <tr key={p._id}>
                            <td>
                              <strong>{p.name}</strong>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {p.category || '-'}
                              </span>
                            </td>
                            <td>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                }}
                              >
                                {p.stock} left
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                onClick={() => handleOpenEditProduct(p)}
                              >
                                Restock
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Activity Widget */}
            <div className="chart-box" style={{ padding: '20px', marginBottom: '24px' }}>
              <div className="chart-title">⚡ Recent Store Activity</div>
              <div>
                {recentActivityList.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px' }}>
                    No recent store activity recorded.
                  </p>
                ) : (
                  recentActivityList.map((act, idx) => {
                    let icon = '🔔';
                    if (act.type === 'order') icon = '🛒';
                    else if (act.type === 'user') icon = '👤';
                    else if (act.type === 'warning') icon = '⚠️';

                    const timeAgo = new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                          padding: '10px 0',
                          borderBottom: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ fontSize: '1.2rem', lineHeight: 1 }}>{icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{act.title}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            {act.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Order Fulfillment Progress Bars */}
            <div className="progress-card">
              <div className="chart-title">📈 Order Delivery & Fulfillment Rates</div>
              <div className="progress-group">
                <div className="progress-label-row">
                  <span>Delivered Rate</span>
                  <span id="rateDeliveredText">
                    {delRate}% ({deliveredOrders} orders)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-bar-fill"
                    id="rateDeliveredBar"
                    style={{ width: `${delRate}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }}
                  ></div>
                </div>
              </div>
              <div className="progress-group">
                <div className="progress-label-row">
                  <span>Pending Processing Rate</span>
                  <span id="ratePendingText">
                    {penRate}% ({pendingOrders} orders)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-bar-fill"
                    id="ratePendingBar"
                    style={{ width: `${penRate}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
                  ></div>
                </div>
              </div>
              <div className="progress-group">
                <div className="progress-label-row">
                  <span>Cancellation Rate</span>
                  <span id="rateCancelledText">
                    {canRate}% ({cancelledOrders} orders)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-bar-fill"
                    id="rateCancelledBar"
                    style={{ width: `${canRate}%`, background: 'linear-gradient(90deg, #ef4444, #dc2626)' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div id="sec-orders" className="section-card active">
            <h2>📦 Orders Management & Status Control</h2>

            {/* Update Order Status Controls */}
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                padding: '20px',
                borderRadius: '14px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>
                ⚡ Update Order Status (PATCH /admin/orders/:id/status)
              </h3>
              <div className="grid-inputs" style={{ gridTemplateColumns: '1fr 1fr auto', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="updateOrderId">Target Order ID</label>
                  <input
                    type="text"
                    id="updateOrderId"
                    placeholder="Paste Order ObjectId..."
                    value={updateOrderId}
                    onChange={(e) => setUpdateOrderId(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="updateOrderStatus">New Status</label>
                  <select
                    id="updateOrderStatus"
                    value={updateOrderStatus}
                    onChange={(e) => setUpdateOrderStatus(e.target.value)}
                  >
                    <option value="Confirmed">Confirmed (Triggers Atomic Stock Deduction)</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled (Restores Stock if Confirmed)</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ height: '45px' }}
                  onClick={handleQuickUpdateOrderStatus}
                >
                  Update Status
                </button>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '18px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '500px' }}>
                <input
                  type="text"
                  id="searchOrdersInput"
                  placeholder="Search by Order ID, User ID, or Email..."
                  value={searchOrdersInput}
                  onChange={(e) => setSearchOrdersInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchOrders()}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)',
                  }}
                />
                <button type="button" className="btn btn-outline" onClick={handleSearchOrders}>
                  🔍 Search
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  id="filterStatusSelect"
                  value={filterStatusSelect}
                  onChange={(e) => handleFilterOrdersByStatus(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)',
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <button type="button" className="btn btn-outline" onClick={loadAllOrders}>
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Final Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="ordersTableBody">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => {
                      const status = o.Orderstatus || 'Pending';
                      const sc = getBadgeStyle(status);
                      const orderDate = new Date(o.createdAt || Date.now()).toLocaleDateString();
                      const total = o.FinalTotal !== undefined ? o.FinalTotal : (o.Subtotal || 0);
                      const itemCount = (o.Products || []).reduce((s, p) => s + (p.quantity || 1), 0);

                      let customerName = '—';
                      if (o.User && typeof o.User === 'object') {
                        customerName = `${o.User.firstname || ''} ${o.User.lastname || ''}`.trim() || o.User.email || '—';
                      }

                      return (
                        <tr key={o._id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{o._id}</td>
                          <td>
                            <strong>{customerName}</strong>
                          </td>
                          <td>{orderDate}</td>
                          <td>
                            <span className="status-badge" style={{ background: sc.bg, color: sc.text }}>
                              {status}
                            </span>
                          </td>
                          <td>{itemCount} items</td>
                          <td style={{ color: 'var(--success-color)', fontWeight: 700 }}>
                            Rs. {total.toLocaleString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                              onClick={() => handleViewOrderDetails(o._id)}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: PRODUCT MANAGEMENT */}
        {activeTab === 'products' && (
          <div id="sec-products" className="section-card active">
            <h2>🛒 Product Inventory Management</h2>

            {/* Create Product Form */}
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                padding: '22px',
                borderRadius: '14px',
                marginBottom: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>➕ Create New Product</h3>
              <form id="createProductForm" onSubmit={handleCreateProduct}>
                <div className="grid-inputs">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      id="newName"
                      required
                      placeholder="e.g. RTX 4090 GPU"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <input
                      type="text"
                      id="newCategory"
                      required
                      placeholder="e.g. Graphics Cards"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Brand *</label>
                    <input
                      type="text"
                      id="newBrand"
                      required
                      placeholder="e.g. ASUS"
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Price (Rs.) *</label>
                    <input
                      type="number"
                      id="newPrice"
                      required
                      min="0"
                      placeholder="e.g. 450000"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      id="newStock"
                      required
                      min="0"
                      placeholder="e.g. 15"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount (%)</label>
                    <input
                      type="number"
                      id="newDiscount"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={newDiscount}
                      onChange={(e) => setNewDiscount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    id="newDescription"
                    rows="2"
                    required
                    placeholder="Product specifications and features..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Product Image *</label>
                  <input
                    type="file"
                    id="newImage"
                    ref={fileInputRef}
                    accept=".jpg, .jpeg, .png, .webp, image/jpeg, image/png, image/webp"
                    required
                    onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isCreatingProduct}>
                  {isCreatingProduct ? 'Uploading & Creating...' : 'Save Product'}
                </button>
              </form>
            </div>

            {/* Products List Table */}
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="productsTableBody">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading products...
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{p._id}</td>
                        <td>
                          <strong>{p.name || 'Unnamed'}</strong>
                        </td>
                        <td>{p.category || '-'}</td>
                        <td>{p.brand || '-'}</td>
                        <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                          Rs. {(p.price || 0).toLocaleString()}
                        </td>
                        <td>{p.stock !== undefined ? p.stock : '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              onClick={() => handleOpenEditProduct(p)}
                            >
                              Update
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              onClick={() => handleDeleteProduct(p._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div id="sec-users" className="section-card active">
            <h2>👥 Registered User Accounts & Security Control</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="usersTableBody">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading users...
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const fullName = `${u.firstname || ''} ${u.lastname || ''}`.trim() || '—';
                      const isAdmin = u.isadmin === true || u.isadmin === 'true' || u.role === 'admin';
                      const isBlocked = u.isblocked === true || u.isBlocked === true;

                      return (
                        <tr key={u._id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{u._id}</td>
                          <td>
                            <strong>{fullName}</strong>
                          </td>
                          <td>{u.email || '—'}</td>
                          <td>
                            {isAdmin ? (
                              <span className="user-badge badge-admin">Admin</span>
                            ) : (
                              <span
                                className="user-badge"
                                style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
                              >
                                Customer
                              </span>
                            )}
                          </td>
                          <td>
                            {isBlocked ? (
                              <span className="user-badge badge-blocked">Blocked</span>
                            ) : (
                              <span className="user-badge badge-active">Active</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                onClick={() => handleViewUserDetails(u._id)}
                              >
                                Details
                              </button>
                              {!isAdmin && (
                                <>
                                  {isBlocked ? (
                                    <button
                                      className="btn btn-success"
                                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                      onClick={() => handleUnblockUser(u._id)}
                                    >
                                      Unblock
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-warning"
                                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                      onClick={() => handleBlockUser(u._id)}
                                    >
                                      Block
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-danger"
                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                    onClick={() => handleDeleteUser(u._id)}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 5: ADMIN MANAGEMENT */}
        {activeTab === 'admins' && (
          <div id="sec-admins" className="section-card active">
            <h2>🛡️ Admin Management & Account Creation</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Create new authenticated administrator accounts. Admin accounts are granted system-wide control panel
              access and are protected from deletion.
            </p>

            {/* Card 1: Create Admin Form */}
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              }}
            >
              <h3
                style={{
                  fontSize: '1.15rem',
                  color: 'var(--text-main)',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ✨ Create New Admin Account
              </h3>
              <form id="createAdminForm" onSubmit={handleCreateAdmin}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="adminFirstName">First Name *</label>
                    <input
                      type="text"
                      id="adminFirstName"
                      required
                      placeholder="e.g. Kasun"
                      value={adminFirstName}
                      onChange={(e) => setAdminFirstName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="adminLastName">Last Name *</label>
                    <input
                      type="text"
                      id="adminLastName"
                      required
                      placeholder="e.g. Perera"
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="adminEmail">Email Address *</label>
                    <input
                      type="email"
                      id="adminEmail"
                      required
                      placeholder="e.g. admin@glab.lk"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="adminPassword">Password *</label>
                    <input
                      type="password"
                      id="adminPassword"
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="adminConfirmPassword">Confirm Password *</label>
                    <input
                      type="password"
                      id="adminConfirmPassword"
                      required
                      minLength={8}
                      placeholder="Repeat password"
                      value={adminConfirmPassword}
                      onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '12px 24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                    disabled={isCreatingAdmin}
                  >
                    🛡️ {isCreatingAdmin ? 'Creating Admin...' : 'Create Admin Account'}
                  </button>
                </div>
              </form>
            </div>

            {/* Card 2: Admin Accounts List */}
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '16px' }}>
                📋 Active Administrator Accounts
              </h3>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Admin ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="adminsTableBody">
                    {adminUsersList.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No admin accounts found.
                        </td>
                      </tr>
                    ) : (
                      adminUsersList.map((u) => {
                        const fullName = `${u.firstname || ''} ${u.lastname || ''}`.trim() || '—';
                        const joinedDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—';
                        return (
                          <tr key={u._id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{u._id}</td>
                            <td>
                              <strong>{fullName}</strong>
                            </td>
                            <td>{u.email || '—'}</td>
                            <td>
                              <span className="user-badge badge-admin">Administrator</span>
                            </td>
                            <td>
                              <span className="user-badge badge-active">Protected</span>
                            </td>
                            <td>{joinedDate}</td>
                            <td>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                onClick={() => handleViewUserDetails(u._id)}
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: REVIEW MANAGEMENT */}
        {activeTab === 'reviews' && (
          <div id="sec-reviews" className="section-card active">
            <h2>⭐ Product Reviews & Moderation</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Review ID</th>
                    <th>Product</th>
                    <th>Reviewer</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="reviewsTableBody">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading reviews...
                      </td>
                    </tr>
                  ) : (
                    reviews.map((r) => {
                      const product = r.product || {};
                      const reviewer = r.user || {};
                      const productName = product.name || (typeof r.product === 'string' ? r.product : '—');
                      const reviewerName =
                        `${reviewer.firstname || ''} ${reviewer.lastname || ''}`.trim() || reviewer.email || '—';
                      const reviewDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—';
                      const comment = r.comment || '—';

                      return (
                        <tr key={r._id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{r._id}</td>
                          <td>
                            <strong>{productName}</strong>
                          </td>
                          <td>{reviewerName}</td>
                          <td>
                            ⭐ <strong>{r.rating || 0}</strong>/5
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{comment}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{reviewDate}</td>
                          <td>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              onClick={() => handleDeleteReview(r._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ORDER DETAIL MODAL */}
      <div className={`modal ${selectedOrderModal ? 'active' : ''}`} id="orderDetailModal">
        <div className="modal-content">
          <div className="modal-header">
            <h3 style={{ margin: 0 }}>Order Full Details</h3>
            <button className="modal-close" onClick={() => setSelectedOrderModal(null)}>
              &times;
            </button>
          </div>
          {selectedOrderModal && (
            <div id="orderDetailContent">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <strong style={{ color: 'var(--admin-color)', fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif' }}>
                    Order #{selectedOrderModal._id}
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(selectedOrderModal.createdAt || Date.now()).toLocaleString()}
                  </div>
                </div>
                <span
                  className="status-badge"
                  style={{
                    background: getBadgeStyle(selectedOrderModal.Orderstatus || 'Pending').bg,
                    color: getBadgeStyle(selectedOrderModal.Orderstatus || 'Pending').text,
                  }}
                >
                  {selectedOrderModal.Orderstatus || 'Pending'}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                📍 <strong>Delivery Address:</strong>{' '}
                {[
                  selectedOrderModal.Diliveryaddress?.addressLine,
                  selectedOrderModal.Diliveryaddress?.city,
                  selectedOrderModal.Diliveryaddress?.district,
                  selectedOrderModal.Diliveryaddress?.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ') || 'No address provided'}
              </p>
              <div style={{ marginBottom: '14px' }}>
                <strong style={{ fontSize: '0.92rem' }}>Products:</strong>
                <ul style={{ marginLeft: '20px', marginTop: '6px', fontSize: '0.88rem' }}>
                  {(selectedOrderModal.Products || []).map((p, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{p.name}</strong> (x{p.quantity}) —{' '}
                      <span style={{ color: 'var(--success-color)' }}>
                        Rs. {((p.price || 0) * (p.quantity || 1)).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Final Total:</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--success-color)' }}>
                  Rs. {(selectedOrderModal.FinalTotal || selectedOrderModal.Subtotal || 0).toLocaleString()}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* USER DETAIL MODAL */}
      <div className={`modal ${selectedUserModal ? 'active' : ''}`} id="userDetailModal">
        <div className="modal-content">
          <div className="modal-header">
            <h3 style={{ margin: 0 }}>User Profile Details</h3>
            <button className="modal-close" onClick={() => setSelectedUserModal(null)}>
              &times;
            </button>
          </div>
          {selectedUserModal && (
            <div id="userDetailContent">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <img
                  src={selectedUserModal.Image || selectedUserModal.image || 'https://via.placeholder.com/70?text=User'}
                  alt="Avatar"
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    border: '2px solid var(--admin-color)',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/70?text=User';
                  }}
                />
                <div>
                  <strong
                    style={{
                      fontSize: '1.15rem',
                      color: 'var(--text-main)',
                      fontFamily: 'Outfit, sans-serif',
                      display: 'block',
                    }}
                  >
                    {`${selectedUserModal.firstname || ''} ${selectedUserModal.lastname || ''}`.trim() || '—'}
                  </strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {selectedUserModal.email || '—'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {selectedUserModal.isadmin ? (
                      <span className="user-badge badge-admin">Admin</span>
                    ) : (
                      <span className="user-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                        Customer
                      </span>
                    )}
                    {selectedUserModal.isblocked ? (
                      <span className="user-badge badge-blocked">Blocked</span>
                    ) : (
                      <span className="user-badge badge-active">Active</span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>User ID:</span>
                  <br />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{selectedUserModal._id}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>First Name:</span>
                  <br />
                  <strong>{selectedUserModal.firstname || '—'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Last Name:</span>
                  <br />
                  <strong>{selectedUserModal.lastname || '—'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                  <br />
                  <strong>{selectedUserModal.email || '—'}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Delivery Address:</span>
                  <br />
                  <strong>
                    {[
                      selectedUserModal.address?.addressLine,
                      selectedUserModal.address?.city,
                      selectedUserModal.address?.district,
                      selectedUserModal.address?.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Not provided'}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UPDATE / RESTOCK PRODUCT MODAL */}
      <div className={`modal ${editingProduct ? 'active' : ''}`}>
        <div className="modal-content" style={{ maxWidth: '450px' }}>
          <div className="modal-header">
            <h3 style={{ margin: 0 }}>Update Product Price & Stock</h3>
            <button className="modal-close" onClick={() => setEditingProduct(null)}>
              &times;
            </button>
          </div>
          {editingProduct && (
            <form onSubmit={handleSaveEditProduct}>
              <div style={{ marginBottom: '14px' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {editingProduct.name}
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Category: {editingProduct.category} | Current: Rs. {editingProduct.price?.toLocaleString()} ({editingProduct.stock} left)
                </span>
              </div>
              <div className="form-group">
                <label>New Price (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter new price..."
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>New Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter new stock quantity..."
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
