import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/endpoints';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const statCards = [
  { key: 'totalPacientes', label: 'Total Pacientes', icon: 'bi-people-fill', color: 'blue' },
  { key: 'citasDelDia', label: 'Citas del Día', icon: 'bi-calendar-check-fill', color: 'green' },
  { key: 'citasPendientes', label: 'Citas Pendientes', icon: 'bi-clock-fill', color: 'orange' },
  { key: 'citasConfirmadas', label: 'Citas Confirmadas', icon: 'bi-check-circle-fill', color: 'teal' },
  { key: 'ingresosDelDia', label: 'Ingresos del Día', icon: 'bi-cash-stack', color: 'purple' },
  { key: 'ingresosDelMes', label: 'Ingresos del Mes', icon: 'bi-graph-up-arrow', color: 'red' },
];

const formatCurrency = (value) => {
  if (value == null) return '$0';
  return '$' + Number(value).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardService.getDashboard();
        setData(response.data);
      } catch (err) {
        const msg = err.response?.data?.message || 'Error al cargar el dashboard';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <div className="text-center">
          <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '3rem' }}></i>
          <p className="mt-3 text-muted">{error}</p>
          <button className="btn btn-dental-primary mt-2" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const d = data || {};
  const ingresosMensuales = d.ingresosMensuales || [];
  const citasAtendidas = d.citasAtendidas ?? 0;
  const citasCanceladas = d.citasCanceladas ?? 0;
  const pacientesPorMes = d.pacientesPorMes || [];

  const barData = {
    labels: ingresosMensuales.map((item) => item.mes || ''),
    datasets: [{
      label: 'Ingresos',
      data: ingresosMensuales.map((item) => item.total || 0),
      backgroundColor: 'rgba(13, 110, 253, 0.7)',
      borderColor: 'rgba(13, 110, 253, 1)',
      borderWidth: 1,
      borderRadius: 6,
    }],
  };

  const doughnutData = {
    labels: ['Atendidas', 'Canceladas'],
    datasets: [{
      data: [citasAtendidas, citasCanceladas],
      backgroundColor: ['#4CAF50', '#EF5350'],
      borderWidth: 0,
    }],
  };

  const lineData = {
    labels: pacientesPorMes.map((item) => item.mes || ''),
    datasets: [{
      label: 'Pacientes',
      data: pacientesPorMes.map((item) => item.total || 0),
      fill: true,
      backgroundColor: 'rgba(38, 166, 154, 0.15)',
      borderColor: '#26A69A',
      tension: 0.4,
      pointBackgroundColor: '#26A69A',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
    },
    cutout: '65%',
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  const getValue = (key) => {
    const val = d[key];
    if (key.startsWith('ingresos')) return formatCurrency(val);
    return val ?? 0;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
      </div>

      <div className="row g-3 mb-4">
        {statCards.map((card) => (
          <div key={card.key} className="col-xl-2 col-lg-4 col-md-6 col-sm-6">
            <div className="stat-card">
              <div className={`stat-icon ${card.color}`}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div className="stat-info">
                <h3>{getValue(card.key)}</h3>
                <p>{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="chart-container">
            <h5 className="chart-title">
              <i className="bi bi-bar-chart-fill me-2 text-primary"></i>Ingresos Mensuales
            </h5>
            {ingresosMensuales.length > 0 ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <p className="text-muted text-center py-4">No hay datos disponibles</p>
            )}
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="chart-container h-100">
            <h5 className="chart-title">
              <i className="bi bi-pie-chart-fill me-2 text-success"></i>Citas Atendidas vs Canceladas
            </h5>
            {(citasAtendidas > 0 || citasCanceladas > 0) ? (
              <div className="d-flex justify-content-center">
                <div style={{ maxWidth: 220 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No hay datos disponibles</p>
            )}
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="chart-container h-100">
            <h5 className="chart-title">
              <i className="bi bi-graph-up me-2 text-secondary"></i>Pacientes por Mes
            </h5>
            {pacientesPorMes.length > 0 ? (
              <Line data={lineData} options={lineOptions} />
            ) : (
              <p className="text-muted text-center py-4">No hay datos disponibles</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
