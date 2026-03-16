import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';

const STATUS_OPTIONS = ['Pendiente', 'En Preparación', 'Enviado', 'Entregado', 'Cancelado'];

export default function AdminOrdersPanel({ onClose }) {
  const { authFetch } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await authFetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await authFetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setOrders(prev => prev.map(o => 
          String(o.id) === String(orderId) ? { ...o, status: newStatus } : o
        ));
        if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm('¿Eliminar este pedido?')) return;
    
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setOrders(prev => prev.filter(o => String(o.id) !== String(orderId)));
        if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
          setSelectedOrder(null);
        }
      }
    } catch (err) {
      alert('Error al eliminar pedido');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'En Preparación': 'bg-blue-100 text-blue-800',
      'Enviado': 'bg-purple-100 text-purple-800',
      'Entregado': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-primary">Gestión de Pedidos</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowStats(!showStats)}
              className={`px-3 py-1 rounded-full text-sm ${showStats ? 'bg-primary text-white' : 'bg-gray-200'}`}
            >
              📊 Stats
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {showStats && stats && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.pedidosHoy}</p>
                <p className="text-xs text-gray-600">Pedidos Hoy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.ingresosHoy}€</p>
                <p className="text-xs text-gray-600">Ingresos Hoy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{stats.totalPedidos}</p>
                <p className="text-xs text-gray-600">Total Pedidos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.stockTotal}</p>
                <p className="text-xs text-gray-600">Stock Total</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Lista de pedidos */}
          <div className="w-1/2 border-r overflow-y-auto p-4">
            {orders.length === 0 ? (
              <p className="text-center text-gray-500 py-10">No hay pedidos</p>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedOrder?.id === order.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-primary">#{order.id.slice(-6)}</span>
                        <span className="text-sm text-gray-500 ml-2">{order.customer?.nombre}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{formatDate(order.date)}</span>
                      <span className="font-bold text-accent">{order.total}€</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{order.items?.length || 0} producto(s)</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detalle del pedido */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedOrder ? (
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-display text-xl font-bold text-primary">Pedido #{selectedOrder.id.slice(-6)}</h3>
                    <p className="text-sm text-gray-500">{formatDate(selectedOrder.date)}</p>
                  </div>
                  <button
                    onClick={() => deleteOrder(selectedOrder.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    title="Eliminar pedido"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-primary mb-2">Cambiar Estado</h4>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map(status => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          selectedOrder.status === status
                            ? getStatusColor(status)
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-primary mb-2">Datos del Cliente</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                    <p><strong>Nombre:</strong> {selectedOrder.customer?.nombre} {selectedOrder.customer?.apellidos}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer?.email}</p>
                    <p><strong>Teléfono:</strong> {selectedOrder.customer?.telefono}</p>
                    <p><strong>Dirección:</strong> {selectedOrder.customer?.direccion || 'No especificada'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-primary mb-2">Productos</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                        <img src={item.imagen} alt={item.nombre} className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.nombre}</p>
                          <p className="text-xs text-gray-500">{item.qty} x {item.precio}€</p>
                        </div>
                        <span className="font-semibold text-sm">{(item.qty * item.precio).toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-xl text-accent">{selectedOrder.total}€</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Selecciona un pedido para ver detalles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
