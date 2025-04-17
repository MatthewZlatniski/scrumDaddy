import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function BurndownChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Expected Progress',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Actual Progress',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }
    ]
  });
  const [chartType, setChartType] = useState('project');

  useEffect(() => {
    fetchBurndownData();
  }, [chartType]);

  const fetchBurndownData = async () => {
    try {
      const projectId = sessionStorage.getItem('currentProjectID');
      const response = await Axios.get(`http://localhost:3001/getBurndownData`, {
        params: {
          projectID: projectId,
          chartType: chartType,
        },
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        const { labels, expectedProgress, actualProgress } = response.data;
        setChartData((prevData) => ({
          ...prevData,
          labels,
          datasets: [
            {
              ...prevData.datasets[0],
              data: expectedProgress,
            },
            {
              ...prevData.datasets[1],
              data: actualProgress,
            },
          ],
        }));
      } else {
        console.error('Error fetching burndown data:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching burndown data:', error);
    }
  };

  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <Box sx={{ width: 700, height: 500 }}>
      <FormControl variant="outlined" sx={{ m: 1, minWidth: 120 }}>
        <InputLabel id="chart-type-label">Chart Type</InputLabel>
        <Select
          labelId="chart-type-label"
          id="chart-type-select"
          value={chartType}
          onChange={handleChartTypeChange}
          label="Chart Type"
        >
          <MenuItem value="project">Entire Project</MenuItem>
          <MenuItem value="sprint">Current Sprint</MenuItem>
        </Select>
      </FormControl>
      <Line data={chartData} options={options} />
    </Box>
  );
}

export default BurndownChart;