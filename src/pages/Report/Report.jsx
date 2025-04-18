import React, { useState, useEffect, useMemo } from "react";
import { Card, Spin, Typography, DatePicker, Button, Empty } from "antd";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle, // Đổi tên để tránh xung đột với Typography.Title
  Tooltip,
  Legend,
  TimeScale,
  Colors,
} from "chart.js";
import "chart.js/auto"; // Import adapter nếu cần (thường chart.js/auto đã đủ)
// import 'chartjs-adapter-dayjs'; // Hoặc adapter khác nếu dùng
import DeviceServices from "../../services/DeviceServices";
import { toast } from "react-toastify";
import dayjs from "dayjs"; // Đổi thành dayjs nếu dùng adapter dayjs
// import moment from 'moment'; // Hoặc dùng moment nếu muốn

import './Report.css'; // Import CSS

const { Title, Paragraph } = Typography; // Giữ lại Title từ Antd nếu dùng ở header
const { RangePicker } = DatePicker;

// Đăng ký các components cần thiết cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle, // Sử dụng tên đã đổi
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
    soilMoisture: []
  });
  // Mặc định 7 ngày gần nhất
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()]);

  // Lấy dữ liệu cảm biến khi component mount hoặc khi dateRange thay đổi
  useEffect(() => {
    fetchSensorData();
  }, [dateRange]); // Phụ thuộc vào dateRange

  // Lấy dữ liệu cho các loại cảm biến
  const fetchSensorData = async () => {
    // Kiểm tra dateRange hợp lệ trước khi fetch
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
        toast.warn("Please select a valid date range.");
        return;
    }

    setLoading(true);
    try {
      // Lấy tất cả thiết bị
      const devices = await DeviceServices.getAllDevices();

      let temperatureData = [];
      let humidityData = [];
      let soilMoistureData = [];

      // Tạo mảng các promises để fetch song song
      const fetchPromises = devices.map(async (device) => {
        const deviceIdentifier = device.deviceName || device.deviceCode || `Device ${device.id}`;
        const commonInfo = { deviceName: deviceIdentifier };

        if (device.deviceType === 'temperature_humidity') {
          try {
            const tempHumidRaw = await DeviceServices.getTemperatureHumidityData(device.id);
             // Đảm bảo dữ liệu trả về là mảng
            const deviceTempHumidData = Array.isArray(tempHumidRaw) ? tempHumidRaw : (tempHumidRaw?.data || []);
            return {
              temp: deviceTempHumidData.map(d => ({ ...d, ...commonInfo })),
              humid: deviceTempHumidData.map(d => ({ ...d, ...commonInfo })),
              soil: []
            };
          } catch (err) {
            console.error(`Error fetching temp/humid data for ${deviceIdentifier}:`, err);
            return { temp: [], humid: [], soil: [] }; // Trả về mảng rỗng nếu lỗi
          }
        } else if (device.deviceType === 'soil_moisture') {
          try {
            const soilRaw = await DeviceServices.getSoilMoistureData(device.id);
             // Đảm bảo dữ liệu trả về là mảng
            const deviceSoilData = Array.isArray(soilRaw) ? soilRaw : (soilRaw?.data || []);
            return {
              temp: [],
              humid: [],
              soil: deviceSoilData.map(d => ({ ...d, ...commonInfo }))
            };
          } catch (err) {
            console.error(`Error fetching soil data for ${deviceIdentifier}:`, err);
            return { temp: [], humid: [], soil: [] }; // Trả về mảng rỗng nếu lỗi
          }
        }
        return { temp: [], humid: [], soil: [] }; // Mặc định cho các loại device khác
      });

      // Chạy tất cả các promises và tổng hợp kết quả
      const results = await Promise.all(fetchPromises);

      results.forEach(res => {
        temperatureData = temperatureData.concat(res.temp);
        humidityData = humidityData.concat(res.humid);
        soilMoistureData = soilMoistureData.concat(res.soil);
      });

      // Sắp xếp dữ liệu theo thời gian để biểu đồ hiển thị đúng
      const sortByTime = (a, b) => dayjs(a.readingTime).valueOf() - dayjs(b.readingTime).valueOf();
      temperatureData.sort(sortByTime);
      humidityData.sort(sortByTime);
      soilMoistureData.sort(sortByTime);


      setSensorData({
        temperature: temperatureData,
        humidity: humidityData,
        soilMoisture: soilMoistureData
      });

    } catch (error) {
      console.error("Error fetching sensor data:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      toast.error(`Cannot load sensor data: ${errorMessage}`);
      setSensorData({ temperature: [], humidity: [], soilMoisture: [] }); // Reset nếu lỗi
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi thay đổi khoảng thời gian
  const handleDateRangeChange = (dates) => {
    // dates là mảng [dayjs, dayjs] hoặc null
    if (dates && dates.length === 2) {
      setDateRange(dates);
    } else {
      setDateRange(null); // Hoặc set về giá trị mặc định
      toast.info("Date range cleared or invalid.");
    }
  };

  // --- Lọc và Chuẩn bị dữ liệu cho Biểu đồ ---
  // Sử dụng useMemo để chỉ tính toán lại khi dữ liệu hoặc bộ lọc thay đổi
  const filteredData = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
        return { temp: [], humid: [], soil: [] }; // Trả về dữ liệu rỗng nếu không có dateRange
    }
    const startDate = dateRange[0].startOf('day');
    const endDate = dateRange[1].endOf('day');

    const filterFunc = (item) => {
        const itemDate = dayjs(item.readingTime);
        // Dùng isBetween hoặc isSameOrAfter/isSameOrBefore tùy logic mong muốn
        return itemDate.isBetween(startDate, endDate, null, '[]'); // '[]' bao gồm cả ngày bắt đầu và kết thúc
    };

    return {
        temp: sensorData.temperature.filter(filterFunc),
        humid: sensorData.humidity.filter(filterFunc),
        soil: sensorData.soilMoisture.filter(filterFunc)
    };
  }, [sensorData, dateRange]);

  // Tạo dữ liệu cho biểu đồ từ dữ liệu đã lọc
  const combinedChartData = useMemo(() => ({
    // Dùng readingTime làm nhãn (labels), cần format lại
    labels: filteredData.temp.map(item => dayjs(item.readingTime).format('DD/MM HH:mm')), // Format nhãn trục X
    datasets: [
      {
        label: 'Temperature (°C)', // English Label
        data: filteredData.temp.map(item => item.temperature), // Dùng dữ liệu đã lọc
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'yValues', // Đặt ID cho trục Y chung
        tension: 0.3,
        borderWidth: 1.5,
        pointRadius: 2, // Giảm kích thước điểm
        pointHoverRadius: 4,
      },
      {
        label: 'Air Humidity (%)', // English Label
        data: filteredData.humid.map(item => item.humidity), // Dùng dữ liệu đã lọc
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'yValues',
        tension: 0.3,
        borderWidth: 1.5,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
      {
        label: 'Soil Moisture (%)', // English Label
        data: filteredData.soil.map(item => item.moistureValue), // Dùng dữ liệu đã lọc
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'yValues',
        tension: 0.3,
        borderWidth: 1.5,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  }), [filteredData]); // Chỉ tính lại khi filteredData thay đổi

  // Cấu hình cho biểu đồ tổng hợp
  const combinedChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Cho phép chart co giãn theo container
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: { // Plugin title của ChartJS
        display: true,
        text: 'Combined Sensor Data Report', // English Title
        font: { size: 16 },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        callbacks: { // Tùy chỉnh tooltip
          label: function (context) {
             // Tìm đúng mảng dữ liệu gốc đã lọc dựa trên datasetIndex
             let sourceArray;
             if (context.datasetIndex === 0) sourceArray = filteredData.temp;
             else if (context.datasetIndex === 1) sourceArray = filteredData.humid;
             else sourceArray = filteredData.soil;

             const dataPoint = sourceArray[context.dataIndex];
             const deviceName = dataPoint?.deviceName || 'N/A';
             let label = context.dataset.label || '';
             if (label) label += ': ';
             if (context.parsed.y !== null) label += context.parsed.y;
             // Trả về mảng string để hiển thị nhiều dòng
             return [label, `Device: ${deviceName}`];
          }
        }
      },
      legend: {
          position: 'top', // Vị trí của legend
      },
      colors: { // Plugin màu sắc (nếu đã register)
          enabled: true // Bật plugin màu (thường mặc định là true)
      }
    },
    scales: {
      x: { // Cấu hình trục X (thời gian)
        type: 'category', // Hoặc 'time' nếu dùng adapter và data đúng format
        title: {
            display: true,
            text: 'Time'
        },
        ticks: {
             maxRotation: 0, // Không xoay label
             autoSkip: true, // Tự động bỏ bớt label nếu quá dày
             maxTicksLimit: 15 // Giới hạn số lượng label hiển thị
        }
      },
      yValues: { // Trục Y chung cho các giá trị
        type: 'linear',
        display: true,
        position: 'left',
        min: 0, // Bắt đầu từ 0
        // max: 100, // Có thể bỏ max để tự động điều chỉnh
        title: {
          display: true,
          text: 'Value (%) / (°C)',
        },
      }
    },
  };
  // --- Kết thúc phần Chart ---

  // Hàm refresh dữ liệu
  const refreshData = () => {
    fetchSensorData();
    toast.success("Data refreshed");
  };

  // Kiểm tra xem có dữ liệu nào để hiển thị không (sau khi lọc)
  const hasFilteredData = () => {
    return filteredData.temp.length > 0 ||
           filteredData.humid.length > 0 ||
           filteredData.soil.length > 0;
  };


  return (
    <div className="report-page-container">
      <div className="report-header">
        <img src="..\src\assets\images\Bg-report.jpg" alt="Report background" className="report-header-bg"/> {/* Update path */}
        <div className="report-header-content">
          <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>Sensor Data Report</Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 600 }}>
            Analyze historical sensor data trends for temperature, air humidity, and soil moisture. Select a date range to view specific periods.
          </Paragraph>
        </div>
      </div>

      <div className="report-body-content">
        {/* Bỏ TitleAnt ở đây nếu đã có Title trong header */}
        {/* <TitleAnt level={2} className="mb-6">Sensor Data Report</TitleAnt> */}

        {/* Card chứa bộ lọc */}
        <Card className="mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <label className="block mb-1 font-medium text-sm text-gray-700">Date Range:</label>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                allowClear={false} // Không cho phép xóa trắng để luôn có giá trị
              />
            </div>
            <Button type="primary" onClick={refreshData} loading={loading}>
              Refresh Data
            </Button>
          </div>
        </Card>

        {/* Card chứa biểu đồ */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : !hasFilteredData() ? (
            // Hiển thị Empty với thông báo phù hợp
            <Card>
                <Empty description={
                    !dateRange
                    ? "Please select a date range."
                    : "No sensor data found for the selected period."
                } />
            </Card>
        ) : (
          <Card>
             {/* Container cho chart với chiều cao cố định */}
            <div className="chart-container" style={{ height: '500px', width: '100%' }}>
              <Line data={combinedChartData} options={combinedChartOptions} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Report;