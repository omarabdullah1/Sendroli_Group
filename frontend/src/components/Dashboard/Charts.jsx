import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export const OrdersBarChart = ({ labels = [], data = [], height = 180, ariaLabel = 'Orders bar chart' }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Orders Count',
        data,
        backgroundColor: 'rgba(99,102,241,0.85)',
        borderColor: 'rgba(99,102,241,1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: true },
      title: { display: false },
    },
    scales: {
      x: { display: true },
      y: { display: true, beginAtZero: true },
    },
  };

  return (
    <div style={{ height, position: 'relative', zIndex: 10 }} role="img" aria-label={ariaLabel}>
      <Bar data={chartData} options={options} canvasProps={{ role: 'img', 'aria-label': ariaLabel }} />
    </div>
  );
};

export const ClientsBarChart = ({ labels = [], data = [], height = 180, label = 'Clients', ariaLabel = 'Clients bar chart' }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor: 'rgba(14,165,233,0.85)',
        borderColor: 'rgba(14,165,233,1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: true },
      title: { display: false },
    },
    scales: {
      x: { display: true },
      y: { display: true, beginAtZero: true },
    },
  };

  return (
    <div style={{ height, position: 'relative', zIndex: 10 }} role="img" aria-label={ariaLabel}>
      <Bar data={chartData} options={options} canvasProps={{ role: 'img', 'aria-label': ariaLabel }} />
    </div>
  );
};

export const RevenueLineChart = ({ labels = [], data = [], height = 180, ariaLabel = 'Revenue line chart', onIntervalChange, currentInterval = 'week', isLoading = false }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Revenue (EGP)',
        data,
        fill: true,
        backgroundColor: 'rgba(37,99,235,0.12)',
        borderColor: '#2563eb',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
      axis: 'x',
    },
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: false, text: 'Revenue over time' },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: { display: true },
      y: { display: true, beginAtZero: true },
    },
  };

  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  return (
    <div style={{ height, position: 'relative', zIndex: 10 }} role="img" aria-label={ariaLabel}>
      <Line data={chartData} options={options} canvasProps={{ role: 'img', 'aria-label': ariaLabel }} />
    </div>
  );
};

export const StatusPieChart = ({ labels = [], data = [], height = 180, ariaLabel = 'Status pie chart' }) => {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: ['#f97316', '#06b6d4', '#10b981', '#ef4444', '#6366f1'],
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'right' },
      tooltip: { enabled: true },
    },
  };

  return (
    <div style={{ height, position: 'relative', zIndex: 10 }} role="img" aria-label={ariaLabel}>
      <Pie data={chartData} options={options} canvasProps={{ role: 'img', 'aria-label': ariaLabel }} />
    </div>
  );
};

export default {
  RevenueLineChart,
  StatusPieChart,
  OrdersBarChart,
  ClientsBarChart,
};
