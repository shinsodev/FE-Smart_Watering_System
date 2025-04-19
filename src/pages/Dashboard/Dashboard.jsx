import React, { useState, useEffect } from "react";
import SensorServices from "../../services/SensorServices";
import DeviceServices from "../../services/DeviceServices";
import DeviceList from "../../components/DeviceList/DeviceList";
import { useSensorData } from "../../context/SensorContext";
import socketService from '../../services/socketService';
import axios from "axios";
import API_ENDPOINTS from "../../services/ApiEndpoints";

// Icon
import IconIncrease from "../../assets/images/icon-increase.svg";
import Icon3Dots from "../../assets/images/icon-3dots.svg";
import IconChart from "../../assets/images/icon-chart.svg";
import IconDecrease from "../../assets/images/icon-decrease.svg";

const Dashboard = () => {
  const {
    sensorData,
    prevData,
    socketConnected,
    calculatePercentChange,
    updateFromAPI,
    forceSaveData,
    clearSavedData,
    updateFromSocketData,
    thresholdAlerts,
    thresholdConfig,
    updateThresholdConfig,
    checkThresholds
  } = useSensorData();

  const [devices, setDevices] = useState([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [showDebug, setShowDebug] = useState(true);

  const [thresholds, setThresholds] = useState({
    SOIL_MOISTURE: { min: 20, max: 80 },
    TEMPERATURE: { min: 18, max: 32 },
    AIR_HUMIDITY: { min: 40, max: 80 },
    PUMP_SPEED: { min: 0, max: 100 }
  });

  // Đăng ký lắng nghe sự kiện cập nhật từ socket
  useEffect(() => {
    const handleSensorUpdate = (data) => {
      console.log('Dashboard: Socket sensor update received:', data);

      if (updateFromSocketData) {
        const formattedData = {};

        if (data.type === 'temperature_humidity' && data.data) {
          formattedData.temperature = data.data.location;
          formattedData.airHumidity = data.data.humidity;
        }
        else if (data.type === 'soil_moisture' && data.data) {
          formattedData.soilMoisture = data.data.soilMoisture;
        }
        else if ((data.type === 'pump_water' || data.type === 'pump_status' || data.type === 'pump-water' || data.type === 'pump-status') && data.data) {
          const pumpSpeed = data.data.pumpSpeed !== undefined ? data.data.pumpSpeed :
                           (data.data.speed !== undefined ? data.data.speed : null);
          let pumpStatus = data.data.status;

          formattedData.pumpWater = {};

          if (pumpSpeed !== null) {
            formattedData.pumpWater.speed = pumpSpeed;
            formattedData.pumpWater.status = pumpSpeed > 0 ? 'On' : 'Off';
          }
          else if (pumpStatus) {
            formattedData.pumpWater.status = pumpStatus;
            formattedData.pumpWater.speed = pumpStatus.toLowerCase() === 'on' ? 50 : 0;
          }

          console.log('Dashboard: Formatted pump data for context:', formattedData.pumpWater);
        }
        else if ((data.type === 'light' || data.type === 'light_status' || data.type === 'light-status') && data.data) {
          formattedData.light = {
            status: data.data.status
          };
        }

        if (Object.keys(formattedData).length > 0) {
          console.log('Dashboard: Updating sensor context with:', formattedData);
          updateFromSocketData(formattedData);
        }
      }
    };

    if (socketService.socket) {
      socketService.socket.on('sensor-update', handleSensorUpdate);
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('sensor-update', handleSensorUpdate);
      }
    };
  }, [updateFromSocketData]);

  // Lấy dữ liệu từ API khi component mount
  useEffect(() => {
    console.log('Dashboard: Component mounted');
    console.log('Dashboard: Initial pump water data:', sensorData.pumpWater);

    const fetchInitialData = async () => {
      try {
        if (!socketConnected) {
          console.log('Dashboard: Socket not connected, fetching data from API');
          const data = await updateFromAPI(SensorServices);
          console.log('Dashboard: Data after API fetch:', data);
          console.log('Dashboard: Pump water data after API fetch:', data?.pumpWater);
        } else {
          console.log('Dashboard: Socket connected, skipping initial API fetch');
          forceSaveData();
          console.log('Dashboard: Current pump water data:', sensorData.pumpWater);
        }
      } catch (error) {
        console.error('Dashboard: Error fetching sensor data:', error);
        forceSaveData();
        console.log('Dashboard: Current pump water data after error:', sensorData.pumpWater);
      }
    };

    const fetchDevices = async () => {
      try {
        setIsLoadingDevices(true);
        const result = await DeviceServices.getDevices();
        console.log('Dashboard: User devices:', result);
        setDevices(result);
        setIsLoadingDevices(false);
      } catch (error) {
        console.error("Dashboard: Error fetching devices:", error);
        setIsLoadingDevices(false);
      }
    };

    const fetchThresholds = async () => {
      try {
        console.log('Dashboard: Fetching threshold configs');
        const response = await axios.get(API_ENDPOINTS.DEVICES.GET_CONFIG('current'), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          timeout: 5000
        });

        console.log('Dashboard: Raw API threshold response:', response.data);

        if (response.data && response.data.success && response.data.config) {
          const configData = response.data.config;
          console.log('Dashboard: Parsed config data:', configData);

          const newThresholds = {
            SOIL_MOISTURE: {
              min: configData.soilMoisture?.min || 20,
              max: configData.soilMoisture?.max || 80
            },
            TEMPERATURE: {
              min: configData.temperature?.min || 18,
              max: configData.temperature?.max || 32
            },
            AIR_HUMIDITY: {
              min: configData.airHumidity?.min || 40,
              max: configData.airHumidity?.max || 80
            },
            PUMP_SPEED: {
              min: 0,
              max: 100
            }
          };

          console.log('Dashboard: New thresholds:', newThresholds);
          setThresholds(newThresholds);
          updateThresholdConfig(newThresholds);

          // Kiểm tra ngưỡng sau khi cập nhật
          console.log('Dashboard: Checking thresholds after updating config');
          checkThresholds(sensorData);
        } else {
          console.warn('Dashboard: Invalid config data, using defaults');
          const defaultThresholds = {
            SOIL_MOISTURE: { min: 20, max: 80 },
            TEMPERATURE: { min: 18, max: 32 },
            AIR_HUMIDITY: { min: 40, max: 80 },
            PUMP_SPEED: { min: 0, max: 100 }
          };
          setThresholds(defaultThresholds);
          updateThresholdConfig(defaultThresholds);
          checkThresholds(sensorData);
        }
      } catch (error) {
        console.error('Dashboard: Error fetching threshold configs:', error);
        const defaultThresholds = {
          SOIL_MOISTURE: { min: 20, max: 80 },
          TEMPERATURE: { min: 18, max: 32 },
          AIR_HUMIDITY: { min: 40, max: 80 },
          PUMP_SPEED: { min: 0, max7
        };
        setThresholds(defaultThresholds);
        updateThresholdConfig(defaultThresholds);
        checkThresholds(sensorData);
      }
    };

    fetchInitialData();
    fetchDevices();
    fetchThresholds();

    const intervalId = !socketConnected ?
      setInterval(() => {
        console.log('Dashboard: Updating sensor data periodically');
        updateFromAPI(SensorServices);
      }, 30000) : null;

    return () => {
      console.log('Dashboard: Component unmounting, saving data...');
      if (intervalId) clearInterval(intervalId);
      forceSaveData();
    };
  }, [socketConnected]);

  // Lưu dữ liệu vào localStorage khi thay đổi
  useEffect(() => {
    if (!sensorData.loading) {
      console.log('Dashboard: Sensor data changed, forcing save');
      forceSaveData();
    }
  }, [sensorData]);

  // Đồng bộ ngưỡng định kỳ
  useEffect(() => {
    if (!sensorData.loading && socketConnected) {
      const refreshThresholds = async () => {
        console.log('Dashboard: Refreshing threshold configs');
        try {
          const response = await axios.get(API_ENDPOINTS.DEVICES.GET_CONFIG('current'), {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          console.log('Dashboard: Refresh threshold response:', response.data);

          if (response.data && response.data.success && response.data.config) {
            const configData = response.data.config;

            const newThresholds = {
              SOIL_MOISTURE: {
                min: configData.soilMoisture?.min || 20,
                max: configData.soilMoisture?.max || 80
              },
              TEMPERATURE: {
                min: configData.temperature?.min || 18,
                max: configData.temperature?.max || 32
              },
              AIR_HUMIDITY: {
                min: configData.airHumidity?.min || 40,
                max: configData.airHumidity?.max || 80
              },
              PUMP_SPEED: {
                min: 0,
                max: 100
              }
            };

            setThresholds(newThresholds);
            updateThresholdConfig(newThresholds);
            checkThresholds(sensorData);
          }
        } catch (error) {
          console.error('Dashboard: Error refreshing threshold configs:', error);
        }
      };

      const timeoutId = setTimeout(refreshThresholds, 2000);
      const intervalId = setInterval(refreshThresholds, 60000);

      return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
      };
    }
  }, [sensorData.loading, socketConnected, updateThresholdConfig]);

  // Tính toán phần trăm thay đổi
  const soilMoistureChange = calculatePercentChange(
    sensorData.soilMoisture,
    prevData.soilMoisture
  );

  const temperatureChange = calculatePercentChange(
    sensorData.temperature,
    prevData.temperature
  );

  const airHumidityChange = calculatePercentChange(
    sensorData.airHumidity,
    prevData.airHumidity
  );

  const pumpSpeedChange = calculatePercentChange(
    sensorData.pumpWater?.speed,
    prevData.pumpWater?.speed
  );

  // Xử lý nút xóa dữ liệu
  const handleClearData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dữ liệu đã lưu? Trang sẽ tải lại sau khi xóa.')) {
      clearSavedData();
      window.location.reload();
    }
  };

  // Kiểm tra giá trị vượt ngưỡng
  const getThresholdClass = (value, thresholdMax) => {
    return value > thresholdMax ? 'bg-red-200 border-2 border-red-500' : '';
  };

  const soilMoistureThresholdClass = getThresholdClass(sensorData.soilMoisture, thresholds.SOIL_MOISTURE?.max || 80);
  const temperatureThresholdClass = getThresholdClass(sensorData.temperature, thresholds.TEMPERATURE?.max || 32);
  const airHumidityThresholdClass = getThresholdClass(sensorData.airHumidity, thresholds.AIR_HUMIDITY?.max || 80);
  const pumpSpeedThresholdClass = getThresholdClass(sensorData.pumpWater?.speed, thresholds.PUMP_SPEED?.max || 100);

  console.log('Dashboard Render - Pump Water Data:', sensorData.pumpWater);
  console.log('Dashboard Render - Thresholds Data:', {
    soilMoisture: thresholds.SOIL_MOISTURE,
    temperature: thresholds.TEMPERATURE,
    airHumidity: thresholds.AIR_HUMIDITY,
    pumpSpeed: thresholds.PUMP_SPEED
  });

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Soil Moisture */}
        <div className={`w-full h-[170px] bg-gradient-to-b from-[#0093E9] to-[#80D0C7] rounded relative ${soilMoistureThresholdClass}`}>
          <div className="p-[12px]">
            <div className="font-poppins text-[14px] font-semibold flex justify-between items-center">
              <div>
                Soil Moisture
                {(thresholdAlerts.soilMoisture?.high || thresholdAlerts.soilMoisture?.low) &&
                  <span className="ml-2 text-red-700 font-bold">⚠️ Quá ngưỡng!</span>
                }
              </div>
              <button className="w-[20px] h-[20px]">
                <img src={Icon3Dots} alt="icon 3 dots" />
              </button>
            </div>
            <div className="font-roboto text-[28px] font-bold text-white leading-[42px] my-[8px]">
              {sensorData.loading ? "Loading..." : `${sensorData.soilMoisture}%`}
            </div>
            <div className="text-white font-roboto text-[14px] font-normal leading-[20px] flex space-x-1">
              <img
                src={soilMoistureChange >= 0 ? IconIncrease : IconDecrease}
                alt="change icon"
                className="w-[20px] h-[20px]"
              />
              <div>{Math.abs(soilMoistureChange)}% vs last reading</div>
            </div>
            <div className="absolute right-2 bottom-6">
              <img src={IconChart} alt="icon chart" />
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className={`w-full h-[170px] bg-gradient-to-b from-[#FF55AACD] to-[#FBDA61] rounded relative ${temperatureThresholdClass}`}>
          <div className="p-[12px]">
            <div className="font-poppins text-[14px] font-semibold flex justify-between items-center">
              <div>
                Temperature
                {(thresholdAlerts.temperature?.high || thresholdAlerts.temperature?.low) &&
                  <span className="ml-2 text-red-700 font-bold">⚠️ Quá ngưỡng!</span>
                }
              </div>
              <button className="w-[20px] h-[20px]">
                <img src={Icon3Dots} alt="icon 3 dots" />
              </button>
            </div>
            <div className="font-roboto text-[28px] font-bold text-white leading-[42px] my-[8px]">
              {sensorData.loading ? "Loading..." : `${sensorData.temperature}°C`}
            </div>
            <div className="text-white font-roboto text-[14px] font-normal leading-[20px] flex space-x-1">
              <img
                src={temperatureChange >= 0 ? IconIncrease : IconDecrease}
                alt="change icon"
                className="w-[20px] h-[20px]"
              />
              <div>{Math.abs(temperatureChange)}% vs last reading</div>
            </div>
            <div className="absolute right-2 bottom-6">
              <img src={IconChart} alt="icon chart" />
            </div>
          </div>
        </div>

        {/* Air Humidity */}
        <div className={`w-full h-[170px] bg-gradient-to-b from-[#64E39E] to-[#53ECE5] rounded relative ${airHumidityThresholdClass}`}>
          <div className="p-[12px]">
            <div className="font-poppins text-[14px] font-semibold flex justify-between items-center">
              <div>
                Air Humidity
                {(thresholdAlerts.airHumidity?.high || thresholdAlerts.airHumidity?.low) &&
                  <span className="ml-2 text-red-700 font-bold">⚠️ Quá ngưỡng!</span>
                }
              </div>
              <button className="w-[20px] h-[20px]">
                <img src={Icon3Dots} alt="icon 3 dots" />
              </button>
            </div>
            <div className="font-roboto text-[28px] font-bold text-white leading-[42px] my-[8px]">
              {sensorData.loading ? "Loading..." : `${sensorData.airHumidity}%`}
            </div>
            <div className="text-white font-roboto text-[14px] font-normal leading-[20px] flex space-x-1">
              <img
                src={airHumidityChange >= 0 ? IconIncrease : IconDecrease}
                alt="change icon"
                className="w-[20px] h-[20px]"
              />
              <div>{Math.abs(airHumidityChange)}% vs last reading</div>
            </div>
            <div className="absolute right-2 bottom-6">
              <img src={IconChart} alt="icon chart" />
            </div>
          </div>
        </div>

        {/* Pump Water */}
        <div className={`w-full h-[170px] bg-gradient-to-b from-[#8E7AFF] to-[#A682FF] rounded relative ${pumpSpeedThresholdClass}`}>
          <div className="p-[12px]">
            <div className="font-poppins text-[14px] font-semibold flex justify-between items-center">
              <div>
                Pump Water
                {(sensorData.pumpWater?.status === 'On') &&
                  <span className="ml-2 text-yellow-300 font-bold">⚠️ Đang hoạt động</span>
                }
              </div>
              <button className="w-[20px] h-[20px]">
                <img src={Icon3Dots} alt="icon 3 dots" />
              </button>
            </div>
            <div className="font-roboto text-[28px] font-bold text-white leading-[42px] my-[8px]">
              {sensorData.loading
                ? "Loading..."
                : sensorData.pumpWater?.status === 'On'
                  ? `${sensorData.pumpWater.status} (${sensorData.pumpWater.speed}%)`
                  : `Off (0%)`
              }
            </div>
            <div className="text-white font-roboto text-[14px] font-normal leading-[20px] flex space-x-1">
              <img
                src={pumpSpeedChange >= 0 ? IconIncrease : IconDecrease}
                alt="change icon"
                className="w-[20px] h-[20px]"
              />
              <div>{Math.abs(pumpSpeedChange)}% speed vs last reading</div>
            </div>
            <div className="absolute right-2 bottom-6">
              <img src={IconChart} alt="icon chart" />
            </div>
          </div>
        </div>

        {/* Light Device */}
        <div className="w-full h-[170px] bg-gradient-to-b from-[#FF6B6B] to-[#FF8E53] rounded relative">
          <div className="p-[12px]">
            <div className="font-poppins text-[14px] font-semibold flex justify-between items-center">
              <div>
                Light
                {(sensorData.light?.status === 'On') &&
                  <span className="ml-2 text-yellow-300 font-bold">⚠️ Đang hoạt động</span>
                }
              </div>
              <button className="w-[20px] h-[20px]">
                <img src={Icon3Dots} alt="icon 3 dots" />
              </button>
            </div>
            <div className="font-roboto text-[28px] font-bold text-white leading-[42px] my-[8px]">
              {sensorData.loading ? "Loading..." : sensorData.light?.status || 'Off'}
            </div>
            <div className="text-white font-roboto text-[14px] font-normal leading-[20px]">
              Status: {sensorData.light?.status || 'Off'}
            </div>
            <div className="absolute right-2 bottom-6">
              <img src={IconChart} alt="icon chart" />
            </div>
          </div>
        </div>
      </div>

      {/* Device List section */}
      <div className="mt-8">
        <DeviceList />
      </div>

      {/* Debug section */}
      {showDebug && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Debug Info</h3>
          <div className="mb-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
            >
              Refresh Page
            </button>
            <button
              onClick={handleClearData}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Clear Saved Data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">Current Sensor Data:</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify({
                  soilMoisture: sensorData.soilMoisture,
                  temperature: sensorData.temperature,
                  airHumidity: sensorData.airHumidity,
                  pumpWater: sensorData.pumpWater,
                  light: sensorData.light
                }, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold">Threshold Alerts (Status):</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40 border-2 border-blue-300">
                {JSON.stringify({
                  ...thresholdAlerts,
                  _explanation: 'HIGH/LOW: TRUE = Đang vượt ngưỡng, FALSE = OK'
                }, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold">Thresholds from Dashboard (Config):</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40 border-2 border-green-300">
                {JSON.stringify(thresholds, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold">Thresholds in SensorContext:</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40 border-2 border-purple-300">
                {JSON.stringify({
                  ...thresholdConfig,
                  _info: 'Nên giống với Dashboard config nhưng định dạng khác'
                }, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold">Connection Status:</h4>
              <p className={socketConnected ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                Socket: {socketConnected ? "Connected ✅" : "Disconnected ❌"}
              </p>
              <button
                onClick={() => checkThresholds && checkThresholds(sensorData)}
                className="bg-gray-500 text-white px-3 py-1 rounded mt-2"
              >
                Force Check Thresholds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;