import React from 'react';
import { Line } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

export const RevenueLineChart = ({ labels = [], data = [], height = 180 }) => {
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
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: false, text: 'Revenue over time' },
    },
    scales: {
      x: { display: true },
      y: { display: true, beginAtZero: true },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export const StatusPieChart = ({ labels = [], data = [], height = 180 }) => {
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
    },
  };

  return (
    <div style={{ height }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default {
  RevenueLineChart,
  StatusPieChart,
};
