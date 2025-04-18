import React, { useState, useEffect, useMemo } from "react";
import { Card, Spin, Typography, DatePicker, Button, Empty } from "antd";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  TimeScale,
  Colors,
} from "chart.js";
import "chart.js/auto";
import DeviceServices from "../../services/DeviceServices";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween"; // Import isBetween plugin
import "./Report.css";

// Extend dayjs with isBetween plugin
dayjs.extend(isBetween);

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  TimeScale,
  Colors
);

const Report = () => {
  const [loading, setLoading] = useState(false);
  const [sensorData, setSensorData] = useState({
    temperature: [],
    humidity: [],
    soilMoisture: [],
  });
  // Default to last 7 days
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);

  // Fetch sensor data when component mounts or dateRange changes
  useEffect(() => {
    fetchSensorData();
  }, [dateRange]);

  // Fetch sensor data for all devices
  const fetchSensorData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      toast.warn("Please select a valid date range.");
      return;
    }

    setLoading(true);
    try {
      const devices = await DeviceServices.getAllDevices();

      let temperatureData = [];
      let humidityData = [];
      let soilMoistureData = [];

      const fetchPromises = devices.map(async (device) => {
        const deviceIdentifier =
          device.deviceName || device.deviceCode || `Device ${device.id}`;
        const commonInfo = { deviceName: deviceIdentifier };

        if (device.deviceType === "temperature_humidity") {
          try {
            const tempHumidRaw =
              await DeviceServices.getTemperatureHumidityData(device.id);
            const deviceTempHumidData = Array.isArray(tempHumidRaw)
              ? tempHumidRaw
              : tempHumidRaw?.data || [];
            return {
              temp: deviceTempHumidData.map((d) => ({ ...d, ...commonInfo })),
              humid: deviceTempHumidData.map((d) => ({ ...d, ...commonInfo })),
              soil: [],
            };
          } catch (err) {
            console.error(
              `Error fetching temp/humid data for ${deviceIdentifier}:`,
              err
            );
            return { temp: [], humid: [], soil: [] };
          }
        } else if (device.deviceType === "soil_moisture") {
          try {
            const soilRaw = await DeviceServices.getSoilMoistureData(device.id);
            const deviceSoilData = Array.isArray(soilRaw)
              ? soilRaw
              : soilRaw?.data || [];
            return {
              temp: [],
              humid: [],
              soil: deviceSoilData.map((d) => ({ ...d, ...commonInfo })),
            };
          } catch (err) {
            console.error(
              `Error fetching soil data for ${deviceIdentifier}:`,
              err
            );
            return { temp: [], humid: [], soil: [] };
          }
        }
        return { temp: [], humid: [], soil: [] };
      });

      const results = await Promise.all(fetchPromises);

      results.forEach((res) => {
        temperatureData = temperatureData.concat(res.temp);
        humidityData = humidityData.concat(res.humid);
        soilMoistureData = soilMoistureData.concat(res.soil);
      });

      // Sort data by time
      const sortByTime = (a, b) =>
        dayjs(a.readingTime).valueOf() - dayjs(b.readingTime).valueOf();
      temperatureData.sort(sortByTime);
      humidityData.sort(sortByTime);
      soilMoistureData.sort(sortByTime);

      setSensorData({
        temperature: temperatureData,
        humidity: humidityData,
        soilMoisture: soilMoistureData,
      });
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      toast.error(`Cannot load sensor data: ${errorMessage}`);
      setSensorData({ temperature: [], humidity: [], soilMoisture: [] });
    } finally {
      setLoading(false);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
    } else {
      setDateRange(null);
      toast.info("Date range cleared or invalid.");
    }
  };

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return { temp: [], humid: [], soil: [] };
    }
    const startDate = dateRange[0].startOf("day");
    const endDate = dateRange[1].endOf("day");

    const filterFunc = (item) => {
      const itemDate = dayjs(item.readingTime);
      return itemDate.isBetween(startDate, endDate, null, "[]"); // Fixed with isBetween plugin
    };

    return {
      temp: sensorData.temperature.filter(filterFunc),
      humid: sensorData.humidity.filter(filterFunc),
      soil: sensorData.soilMoisture.filter(filterFunc),
    };
  }, [sensorData, dateRange]);

  // Prepare chart data
  const combinedChartData = useMemo(
    () => ({
      labels: filteredData.temp.map((item) =>
        dayjs(item.readingTime).format("DD/MM HH:mm")
      ),
      datasets: [
        {
          label: "Temperature (°C)",
          data: filteredData.temp.map((item) => item.temperature),
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          yAxisID: "yValues",
          tension: 0.3,
          borderWidth: 1.5,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
        {
          label: "Air Humidity (%)",
          data: filteredData.humid.map((item) => item.humidity),
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 0.5)",
          yAxisID: "yValues",
          tension: 0.3,
          borderWidth: 1.5,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
        {
          label: "Soil Moisture (%)",
          data: filteredData.soil.map((item) => item.moistureValue),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          yAxisID: "yValues",
          tension: 0.3,
          borderWidth: 1.5,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    }),
    [filteredData]
  );

  // Chart options
  const combinedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: "Combined Sensor Data Report",
        font: { size: 16 },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let sourceArray;
            if (context.datasetIndex === 0) sourceArray = filteredData.temp;
            else if (context.datasetIndex === 1)
              sourceArray = filteredData.humid;
            else sourceArray = filteredData.soil;

            const dataPoint = sourceArray[context.dataIndex];
            const deviceName = dataPoint?.deviceName || "N/A";
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) label += context.parsed.y;
            return [label, `Device: ${deviceName}`];
          },
        },
      },
      legend: {
        position: "top",
      },
      colors: {
        enabled: true,
      },
    },
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Time",
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 15,
        },
      },
      yValues: {
        type: "linear",
        display: true,
        position: "left",
        min: 0,
        title: {
          display: true,
          text: "Value (%) / (°C)",
        },
      },
    },
  };

  // Refresh data
  const refreshData = () => {
    fetchSensorData();
    toast.success("Data refreshed");
  };

  // Check if there is filtered data to display
  const hasFilteredData = () => {
    return (
      filteredData.temp.length > 0 ||
      filteredData.humid.length > 0 ||
      filteredData.soil.length > 0
    );
  };

  return (
    <div className="report-page-container">
      <div className="report-header">
        <img
          src="../src/assets/images/Bg-report.jpg"
          alt="Report background"
          className="report-header-bg"
        />
        <div className="report-header-content">
          <Title level={2} style={{ color: "#fff", marginBottom: 8 }}>
            Sensor Data Report
          </Title>
          <Paragraph
            style={{ color: "rgba(255, 255, 255, 0.85)", maxWidth: 600 }}
          >
            Analyze historical sensor data trends for temperature, air humidity,
            and soil moisture. Select a date range to view specific periods.
          </Paragraph>
        </div>
      </div>

      <div className="report-body-content">
        <Card className="mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <label className="block mb-1 font-medium text-sm text-gray-700">
                Date Range:
              </label>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                allowClear={false}
              />
            </div>
            <Button type="primary" onClick={refreshData} loading={loading}>
              Refresh Data
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : !hasFilteredData() ? (
          <Card>
            <Empty
              description={
                !dateRange
                  ? "Please select a date range."
                  : "No sensor data found for the selected period."
              }
            />
          </Card>
        ) : (
          <Card>
            <div
              className="chart-container"
              style={{ height: "500px", width: "100%" }}
            >
              <Line data={combinedChartData} options={combinedChartOptions} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Report;
