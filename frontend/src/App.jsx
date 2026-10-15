import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/login';
import CustomerMenu from './pages/customer/CustomerMenu';
import OrderStatus from './pages/customer/OrderStatus';
import LiveOrders from './pages/staff/LiveOrders';
import Dashboard from './pages/admin/Dashboard';
import MenuManage from './pages/admin/MenuManage';
import TablesManage from './pages/admin/TablesManage';
import Reports from './pages/admin/Reports';
import Navbar from './components/Navbar';

const Protected = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Customer */}
          <Route path="/order/:tableId" element={<CustomerMenu />} />
          <Route path="/order/:tableId/status/:orderId" element={<OrderStatus />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Staff */}
          <Route path="/staff" element={<Protected><LiveOrders /></Protected>} />

          {/* Admin */}
          <Route path="/admin" element={<Protected role="admin"><Dashboard /></Protected>} />
          <Route path="/admin/menu" element={<Protected role="admin"><MenuManage /></Protected>} />
          <Route path="/admin/tables" element={<Protected role="admin"><TablesManage /></Protected>} />
          <Route path="/admin/reports" element={<Protected role="admin"><Reports /></Protected>} />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}