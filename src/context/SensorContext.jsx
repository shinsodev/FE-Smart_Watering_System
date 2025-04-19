import React, { createContext, useContext, useState, useEffect } from "react";
import socketService from "../services/socketService";

// Tên khóa để lưu dữ liệu vào localStorage
const SENSOR_DATA_KEY = "smart_watering_system_sensor_data";
const PREV_DATA_KEY = "smart_watering_system_prev_data";
const THRESHOLD_ALERTS_KEY = "smart_watering_system_threshold_alerts";

// Kiểm tra khả năng sử dụng localStorage
const isLocalStorageAvailable = () => {
  return true; // Giả định localStorage luôn khả dụng trong môi trường hiện tại
};

// Lấy dữ liệu cảm biến đã lưu từ localStorage
const getSavedSensorData = () => {
  try {
    const savedData = localStorage.getItem(SENSOR_DATA_KEY);
    console.log("SensorContext: Trying to load saved data:", savedData);

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log(
          "SensorContext: Successfully loaded saved sensor data:",
          parsedData
        );

        if (parsedData && typeof parsedData === "object") {
          const validData = {
            soilMoisture:
              typeof parsedData.soilMoisture === "number"
                ? parsedData.soilMoisture
                : 0,
            temperature:
              typeof parsedData.temperature === "number"
                ? parsedData.temperature
                : 0,
            airHumidity:
              typeof parsedData.airHumidity === "number"
                ? parsedData.airHumidity
                : 0,
            pumpWater: {
              speed:
                parsedData.pumpWater &&
                typeof parsedData.pumpWater.speed === "number"
                  ? parsedData.pumpWater.speed
                  : 0,
            },
            light: {
              status: parsedData.light?.status || "Off",
              brightness:
                typeof parsedData.light?.brightness === "number"
                  ? parsedData.light.brightness
                  : 0,
            },
            loading: false,
            error: null,
          };

          validData.pumpWater.status =
            validData.pumpWater.speed > 0 ? "On" : "Off";

          console.log("SensorContext: Using saved sensor data:", validData);
          console.log(
            "SensorContext: Pump water data loaded:",
            validData.pumpWater
          );
          return validData;
        }
      } catch (parseError) {
        console.error(
          "SensorContext: Error parsing saved sensor data:",
          parseError
        );
      }
    }
  } catch (e) {
    console.error("SensorContext: Error accessing localStorage:", e);
  }

  console.log(
    "SensorContext: No valid saved data found, using default sensor data"
  );
  return getDefaultSensorData();
};

// Giá trị mặc định cho dữ liệu cảm biến
const getDefaultSensorData = () => ({
  soilMoisture: 0,
  temperature: 0,
  airHumidity: 0,
  pumpWater: {
    status: "Off",
    speed: 0,
  },
  light: {
    status: "Off",
  },
  loading: true,
  error: null,
});

// Lấy dữ liệu cảm biến trước đó từ localStorage
const getSavedPrevData = () => {
  if (!isLocalStorageAvailable()) {
    return getDefaultPrevData();
  }

  try {
    const savedData = localStorage.getItem(PREV_DATA_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log(
          "SensorContext: Successfully loaded previous sensor data:",
          parsedData
        );

        if (parsedData && typeof parsedData === "object") {
          const validData = {
            soilMoisture:
              typeof parsedData.soilMoisture === "number"
                ? parsedData.soilMoisture
                : 0,
            temperature:
              typeof parsedData.temperature === "number"
                ? parsedData.temperature
                : 0,
            airHumidity:
              typeof parsedData.airHumidity === "number"
                ? parsedData.airHumidity
                : 0,
            pumpWater: {
              speed:
                typeof parsedData.pumpWater?.speed === "number"
                  ? parsedData.pumpWater.speed
                  : 0,
            },
            light: {
              status: parsedData.light?.status || "Off",
            },
          };
          return validData;
        }
      } catch (parseError) {
        console.error(
          "SensorContext: Error parsing saved previous data:",
          parseError
        );
      }
    }
  } catch (e) {
    console.error(
      "SensorContext: Error accessing localStorage for previous data:",
      e
    );
  }

  return getDefaultPrevData();
};

// Giá trị mặc định cho dữ liệu trước đó
const getDefaultPrevData = () => ({
  soilMoisture: 0,
  temperature: 0,
  airHumidity: 0,
  pumpWater: {
    speed: 0,
  },
  light: {
    status: "Off",
  },
});

// Lấy dữ liệu cảnh báo ngưỡng từ localStorage
const getSavedThresholdAlerts = () => {
  if (!isLocalStorageAvailable()) {
    return {
      soilMoisture: { high: false, low: false, timestamp: null },
      temperature: { high: false, low: false, timestamp: null },
      airHumidity: { high: false, low: false, timestamp: null },
    };
  }

  try {
    const savedData = localStorage.getItem(THRESHOLD_ALERTS_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log(
        "SensorContext: Successfully loaded threshold alerts:",
        parsedData
      );
      if (parsedData && typeof parsedData === "object") {
        return {
          soilMoisture: {
            high: !!parsedData.soilMoisture?.high,
            low: !!parsedData.soilMoisture?.low,
            timestamp: parsedData.soilMoisture?.timestamp || null,
          },
          temperature: {
            high: !!parsedData.temperature?.high,
            low: !!parsedData.temperature?.low,
            timestamp: parsedData.temperature?.timestamp || null,
          },
          airHumidity: {
            high: !!parsedData.airHumidity?.high,
            low: !!parsedData.airHumidity?.low,
            timestamp: parsedData.airHumidity?.timestamp || null,
          },
        };
      }
    }
  } catch (e) {
    console.error("SensorContext: Error loading threshold alerts:", e);
  }

  return {
    soilMoisture: { high: false, low: false, timestamp: null },
    temperature: { high: false, low: false, timestamp: null },
    airHumidity: { high: false, low: false, timestamp: null },
  };
};

// Lưu dữ liệu vào localStorage an toàn
const saveToLocalStorage = (key, data) => {
  try {
    const processedData = { ...data };

    if (processedData.pumpWater) {
      const speed =
        processedData.pumpWater.speed !== undefined
          ? processedData.pumpWater.speed
          : 0;
      const status = speed > 0 ? "On" : "Off";

      processedData.pumpWater = {
        status: status,
        speed: speed,
      };

      console.log(
        `SensorContext: Processed pump data for storage:`,
        processedData.pumpWater
      );
    }

    const serialized = JSON.stringify(processedData);
    localStorage.setItem(key, serialized);
    console.log(
      `SensorContext: Successfully saved data to ${key}:`,
      processedData
    );
    return true;
  } catch (e) {
    console.error(`SensorContext: Error saving data to ${key}:`, e);
    return false;
  }
};

// Tạo context
const SensorContext = createContext();

// Hook để sử dụng SensorContext
export const useSensorData = () => {
  return useContext(SensorContext);
};

// Provider component
export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState(getSavedSensorData());
  const [prevData, setPrevData] = useState(getSavedPrevData());
  const [socketConnected, setSocketConnected] = useState(false);
  const [storageAvailable] = useState(isLocalStorageAvailable());
  const [thresholdAlerts, setThresholdAlerts] = useState(
    getSavedThresholdAlerts()
  );
  const [thresholdConfig, setThresholdConfig] = useState({
    soilMoisture: { min: 20, max: 80 }, // Ngưỡng mặc định hợp lý
    temperature: { min: 18, max: 32 },
    airHumidity: { min: 40, max: 80 },
  });

  // Lưu thresholdAlerts vào localStorage khi thay đổi
  useEffect(() => {
    if (storageAvailable) {
      saveToLocalStorage(THRESHOLD_ALERTS_KEY, thresholdAlerts);
      console.log(
        "SensorContext: Saved threshold alerts to localStorage:",
        thresholdAlerts
      );
    }
  }, [thresholdAlerts, storageAvailable]);

  // Lưu dữ liệu cảm biến vào localStorage khi thay đổi
  useEffect(() => {
    if (sensorData.loading || sensorData.error) return;

    const dataToSave = {
      soilMoisture: sensorData.soilMoisture,
      temperature: sensorData.temperature,
      airHumidity: sensorData.airHumidity,
      pumpWater: sensorData.pumpWater,
      light: sensorData.light,
    };

    console.log("SensorContext: Auto saving data on change:", dataToSave);
    saveToLocalStorage(SENSOR_DATA_KEY, dataToSave);
  }, [sensorData]);

  // Hàm tính phần trăm thay đổi
  const calculatePercentChange = (current, previous) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Kiểm tra ngưỡng
  const checkThresholds = (data) => {
    console.log("SensorContext: Checking thresholds for data:", data);
    console.log("SensorContext: Current thresholdAlerts:", thresholdAlerts);
    console.log("SensorContext: Using threshold config:", thresholdConfig);

    if (!data) {
      console.warn("SensorContext: Missing data for threshold check");
      return false;
    }

    if (!thresholdConfig) {
      console.warn("SensorContext: Missing threshold config, using fallback");
      const fallbackConfig = {
        soilMoisture: { min: 20, max: 80 },
        temperature: { min: 18, max: 32 },
        airHumidity: { min: 40, max: 80 },
      };
      setThresholdConfig(fallbackConfig);
      return checkThresholds(data);
    }

    let newAlerts = { ...thresholdAlerts };
    let newTriggers = { ...deviceTriggers };
    let alertsChanged = false;
    let triggersChanged = false;

    // Soil Moisture Check
    if (data.soilMoisture !== undefined && thresholdConfig.soilMoisture) {
      const currentValue = Number(data.soilMoisture);
      const minThreshold = Number(thresholdConfig.soilMoisture.min);
      const maxThreshold = Number(thresholdConfig.soilMoisture.max);

      console.log("SensorContext: Soil Moisture Check", {
        currentValue,
        minThreshold,
        maxThreshold,
      });

      const isTooLow =
        !isNaN(currentValue) &&
        !isNaN(minThreshold) &&
        currentValue < minThreshold;
      const isTooHigh =
        !isNaN(currentValue) &&
        !isNaN(maxThreshold) &&
        currentValue > maxThreshold;

      console.log("SensorContext: Soil Moisture Threshold Result", {
        isTooLow,
        isTooHigh,
      });

      if (isTooLow !== newTriggers.pump.soilMoistureLow) {
        newTriggers.pump.soilMoistureLow = isTooLow;
        triggersChanged = true;
      }

      if (isTooHigh !== newTriggers.light.soilMoistureHigh) {
        newTriggers.light.soilMoistureHigh = isTooHigh;
        triggersChanged = true;
      }

      if (
        isTooLow !== newAlerts.soilMoisture.low ||
        isTooHigh !== newAlerts.soilMoisture.high
      ) {
        newAlerts.soilMoisture = {
          low: isTooLow,
          high: isTooHigh,
          timestamp: new Date().toISOString(),
        };
        alertsChanged = true;
      }
    }

    // Temperature Check
    if (data.temperature !== undefined && thresholdConfig.temperature) {
      const currentValue = Number(data.temperature);
      const minThreshold = Number(thresholdConfig.temperature.min);
      const maxThreshold = Number(thresholdConfig.temperature.max);

      console.log("SensorContext: Temperature Check", {
        currentValue,
        minThreshold,
        maxThreshold,
      });

      const isTooLow =
        !isNaN(currentValue) &&
        !isNaN(minThreshold) &&
        currentValue < minThreshold;
      const isTooHigh =
        !isNaN(currentValue) &&
        !isNaN(maxThreshold) &&
        currentValue > maxThreshold;

      console.log("SensorContext: Temperature Threshold Result", {
        isTooLow,
        isTooHigh,
      });

      if (isTooHigh !== newTriggers.pump.temperatureHigh) {
        newTriggers.pump.temperatureHigh = isTooHigh;
        triggersChanged = true;
      }

      if (isTooLow !== newTriggers.light.temperatureLow) {
        newTriggers.light.temperatureLow = isTooLow;
        triggersChanged = true;
      }

      if (
        isTooLow !== newAlerts.temperature.low ||
        isTooHigh !== newAlerts.temperature.high
      ) {
        newAlerts.temperature = {
          low: isTooLow,
          high: isTooHigh,
          timestamp: new Date().toISOString(),
        };
        alertsChanged = true;
      }
    }

    // Air Humidity Check
    if (data.airHumidity !== undefined && thresholdConfig.airHumidity) {
      const currentValue = Number(data.airHumidity);
      const minThreshold = Number(thresholdConfig.airHumidity.min);
      const maxThreshold = Number(thresholdConfig.airHumidity.max);

      console.log("SensorContext: Air Humidity Check", {
        currentValue,
        minThreshold,
        maxThreshold,
      });

      const isTooLow =
        !isNaN(currentValue) &&
        !isNaN(minThreshold) &&
        currentValue < minThreshold;
      const isTooHigh =
        !isNaN(currentValue) &&
        !isNaN(maxThreshold) &&
        currentValue > maxThreshold;

      console.log("SensorContext: Air Humidity Threshold Result", {
        isTooLow,
        isTooHigh,
      });

      if (isTooLow !== newTriggers.pump.airHumidityLow) {
        newTriggers.pump.airHumidityLow = isTooLow;
        triggersChanged = true;
      }

      if (isTooHigh !== newTriggers.light.airHumidityHigh) {
        newTriggers.light.airHumidityHigh = isTooHigh;
        triggersChanged = true;
      }

      if (
        isTooLow !== newAlerts.airHumidity.low ||
        isTooHigh !== newAlerts.airHumidity.high
      ) {
        newAlerts.airHumidity = {
          low: isTooLow,
          high: isTooHigh,
          timestamp: new Date().toISOString(),
        };
        alertsChanged = true;
      }
    }

    if (alertsChanged) {
      console.log("SensorContext: Updating threshold alerts:", newAlerts);
      setThresholdAlerts(newAlerts);
    }

    if (triggersChanged) {
      console.log("SensorContext: Updating device triggers:", newTriggers);
      setDeviceTriggers(newTriggers);
      updateDevicesBasedOnTriggers(newTriggers);
    }

    return true;
  };

  // Cập nhật trạng thái thiết bị dựa trên triggers
  const updateDevicesBasedOnTriggers = (triggers) => {
    console.log("SensorContext: Updating devices based on triggers:", triggers);

    const shouldPumpBeOn =
      triggers.pump.soilMoistureLow ||
      triggers.pump.airHumidityLow ||
      triggers.pump.temperatureHigh;

    const shouldLightBeOn =
      triggers.light.soilMoistureHigh ||
      triggers.light.airHumidityHigh ||
      triggers.light.temperatureLow;

    console.log(
      `SensorContext: Pump should be ${shouldPumpBeOn ? "ON" : "OFF"}`
    );
    console.log(
      `SensorContext: Light should be ${shouldLightBeOn ? "ON" : "OFF"}`
    );

    const currentPumpStatus = sensorData.pumpWater?.status || "Off";
    const currentPumpSpeed = sensorData.pumpWater?.speed || 0;
    const currentLightStatus = sensorData.light?.status || "Off";

    let newPumpStatus = currentPumpStatus;
    let newPumpSpeed = currentPumpSpeed;
    let pumpChanged = false;

    if (
      shouldPumpBeOn &&
      (currentPumpStatus !== "On" || currentPumpSpeed === 0)
    ) {
      newPumpStatus = "On";
      newPumpSpeed = 100;
      pumpChanged = true;
      console.log("SensorContext: BẬT máy bơm theo triggers");
    } else if (!shouldPumpBeOn && currentPumpStatus === "On") {
      newPumpStatus = "Off";
      newPumpSpeed = 0;
      pumpChanged = true;
      console.log("SensorContext: TẮT máy bơm vì không còn triggers kích hoạt");
    }

    let newLightStatus = currentLightStatus;
    let lightChanged = false;

    if (shouldLightBeOn && currentLightStatus !== "On") {
      newLightStatus = "On";
      lightChanged = true;
      console.log("SensorContext: BẬT đèn theo triggers");
    } else if (!shouldLightBeOn && currentLightStatus === "On") {
      newLightStatus = "Off";
      lightChanged = true;
      console.log("SensorContext: TẮT đèn vì không còn triggers kích hoạt");
    }

    if (pumpChanged || lightChanged) {
      setSensorData((prev) => {
        const updated = {
          ...prev,
          pumpWater: {
            ...prev.pumpWater,
            status: newPumpStatus,
            speed: newPumpSpeed,
          },
          light: {
            ...prev.light,
            status: newLightStatus,
          },
        };

        console.log("SensorContext: Updated devices state:", {
          pump: `${newPumpStatus} (${newPumpSpeed}%)`,
          light: newLightStatus,
        });

        return updated;
      });
    } else {
      console.log("SensorContext: No changes needed for devices");
    }
  };

  // Cập nhật dữ liệu từ socket
  const updateFromSocketData = (socketData) => {
    console.log("SensorContext: Updating from socket data:", socketData);

    setPrevData({
      soilMoisture: sensorData.soilMoisture,
      temperature: sensorData.temperature,
      airHumidity: sensorData.airHumidity,
      pumpWater: {
        speed: sensorData.pumpWater?.speed,
      },
      light: {
        status: sensorData.light?.status || "Off",
      },
    });

    const updatedData = { ...sensorData };

    if (socketData.soilMoisture !== undefined) {
      updatedData.soilMoisture = socketData.soilMoisture;
    }

    if (socketData.temperature !== undefined) {
      updatedData.temperature = socketData.temperature;
    }

    if (socketData.airHumidity !== undefined) {
      updatedData.airHumidity = socketData.airHumidity;
    }

    if (socketData.pumpWater) {
      const pumpSpeed =
        socketData.pumpWater.speed !== undefined
          ? socketData.pumpWater.speed
          : socketData.pumpWater.pumpSpeed !== undefined
          ? socketData.pumpWater.pumpSpeed
          : updatedData.pumpWater?.speed;

      const pumpStatus = pumpSpeed > 0 ? "On" : "Off";

      updatedData.pumpWater = {
        ...updatedData.pumpWater,
        status: pumpStatus,
        speed: pumpSpeed,
      };

      console.log(
        "SensorContext: Updated pump data from socket:",
        updatedData.pumpWater
      );
    }

    if (socketData.light) {
      updatedData.light = {
        ...updatedData.light,
        ...socketData.light,
      };
    }

    updatedData.loading = false;
    updatedData.error = null;

    setSensorData(updatedData);
    setSocketConnected(true);

    console.log("SensorContext: Checking thresholds after socket update");
    checkThresholds(updatedData);

    return true;
  };

  // Xử lý dữ liệu từ WebSocket
  const handleSensorUpdate = (data) => {
    console.log("SensorContext: Received sensor update:", data);

    setPrevData({
      soilMoisture: sensorData.soilMoisture,
      temperature: sensorData.temperature,
      airHumidity: sensorData.airHumidity,
      pumpWater: {
        speed: sensorData.pumpWater?.speed,
      },
      light: {
        status: sensorData.light?.status || "Off",
      },
    });

    let updatedData = { ...sensorData };

    if (data.type === "temperature_humidity") {
      setSensorData((prev) => {
        const updated = {
          ...prev,
          temperature:
            data.data.temperature !== undefined
              ? data.data.temperature
              : prev.temperature,
          airHumidity:
            data.data.humidity !== undefined
              ? data.data.humidity
              : prev.airHumidity,
          loading: false,
        };
        updatedData = updated;
        return updated;
      });
    } else if (data.type === "soil_moisture") {
      setSensorData((prev) => {
        const updated = {
          ...prev,
          soilMoisture:
            data.data.soilMoisture !== undefined
              ? data.data.soilMoisture
              : prev.soilMoisture,
          loading: false,
        };
        updatedData = updated;
        return updated;
      });
    } else if (
      data.type === "pump_water" ||
      data.type === "pump_status" ||
      data.type === "pump-water" ||
      data.type === "pump-status"
    ) {
      console.log("SensorContext: Processing pump data:", data);
      setSensorData((prev) => {
        const pumpSpeed =
          data.data.pumpSpeed !== undefined
            ? data.data.pumpSpeed
            : data.data.speed !== undefined
            ? data.data.speed
            : prev.pumpWater?.speed;

        const pumpStatus = pumpSpeed > 0 ? "On" : "Off";

        const updated = {
          ...prev,
          pumpWater: {
            ...prev.pumpWater,
            status: pumpStatus,
            speed: pumpSpeed,
          },
          loading: false,
        };

        updatedData = updated;
        console.log("SensorContext: Updated pump data:", updated.pumpWater);
        return updated;
      });
    } else if (data.type === "light") {
      setSensorData((prev) => {
        const updated = {
          ...prev,
          light: {
            status:
              data.data.status !== undefined
                ? data.data.status
                : prev.light?.status || "Off",
          },
          loading: false,
        };
        updatedData = updated;
        return updated;
      });
    }

    setTimeout(() => {
      checkThresholds(updatedData);
    }, 100);
  };

  // Thiết lập WebSocket connection
  useEffect(() => {
    console.log("SensorContext: Setting up persistent WebSocket connection");

    socketService.connect();
    socketService.on("sensor-update", handleSensorUpdate);
    socketService.on("sensor_update", handleSensorUpdate);

    const checkSocketConnection = setInterval(() => {
      const connected = socketService.isSocketConnected();
      setSocketConnected(connected);
      if (!connected) {
        console.log("SensorContext: Trying to reconnect WebSocket...");
        socketService.connect();
      }
    }, 5000);

    return () => {
      clearInterval(checkSocketConnection);
      socketService.off("sensor-update", handleSensorUpdate);
      socketService.off("sensor_update", handleSensorUpdate);
    };
  }, []);

  // Tải dữ liệu từ API khi component mount và định kỳ
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("SensorContext: Loading initial data from SensorServices");
        const SensorServices = (await import("../services/SensorServices"))
          .default;
        await contextValue.updateFromAPI(SensorServices);
      } catch (error) {
        console.error("SensorContext: Error loading initial data:", error);
      }
    };

    if (sensorData.loading) {
      loadInitialData();
    }

    const dataRefreshInterval = setInterval(async () => {
      if (!socketConnected) {
        console.log(
          "SensorContext: WebSocket disconnected, refreshing data from API"
        );
        try {
          const SensorServices = (await import("../services/SensorServices"))
            .default;
          await contextValue.updateFromAPI(SensorServices);
        } catch (error) {
          console.error("SensorContext: Error refreshing data:", error);
        }
      }
    }, 60000);

    return () => {
      clearInterval(dataRefreshInterval);
    };
  }, [socketConnected, sensorData.loading]);

  // Hàm buộc lưu dữ liệu
  const forceSaveData = () => {
    if (sensorData.loading) {
      console.warn("SensorContext: Cannot force save while loading data");
      return false;
    }

    const dataToSave = {
      soilMoisture: sensorData.soilMoisture,
      temperature: sensorData.temperature,
      airHumidity: sensorData.airHumidity,
      pumpWater: sensorData.pumpWater,
      light: sensorData.light,
    };

    console.log("SensorContext: Force saving data:", dataToSave);
    return saveToLocalStorage(SENSOR_DATA_KEY, dataToSave);
  };

  // Hàm xóa dữ liệu đã lưu
  const clearSavedData = () => {
    if (!storageAvailable) {
      console.warn(
        "SensorContext: Cannot clear data, localStorage not available"
      );
      return false;
    }

    try {
      localStorage.removeItem(SENSOR_DATA_KEY);
      localStorage.removeItem(PREV_DATA_KEY);
      localStorage.removeItem(THRESHOLD_ALERTS_KEY);
      console.log("SensorContext: Successfully cleared saved data");
      return true;
    } catch (e) {
      console.error("SensorContext: Error clearing saved data:", e);
      return false;
    }
  };

  // Giá trị context
  const contextValue = {
    sensorData,
    setSensorData,
    prevData,
    setPrevData,
    socketConnected,
    calculatePercentChange,
    forceSaveData,
    clearSavedData,
    thresholdAlerts,
    thresholdConfig,
    setThresholdConfig,
    updateThresholdConfig: (dashboardThresholds) => {
      console.log("SensorContext: Updating thresholds...");
      console.log("SensorContext: Current thresholds:", thresholdConfig);
      console.log(
        "SensorContext: New thresholds from Dashboard:",
        dashboardThresholds
      );

      const newConfig = {
        soilMoisture: {
          min: dashboardThresholds.SOIL_MOISTURE.min,
          max: dashboardThresholds.SOIL_MOISTURE.max,
        },
        temperature: {
          min: dashboardThresholds.TEMPERATURE.min,
          max: dashboardThresholds.TEMPERATURE.max,
        },
        airHumidity: {
          min: dashboardThresholds.AIR_HUMIDITY.min,
          max: dashboardThresholds.AIR_HUMIDITY.max,
        },
      };

      const hasChanges =
        JSON.stringify(thresholdConfig) !== JSON.stringify(newConfig);
      console.log("SensorContext: Thresholds changed:", hasChanges);

      setThresholdConfig(newConfig);

      setTimeout(() => {
        console.log("SensorContext: Thresholds after update:", newConfig);
        console.log("SensorContext: Rechecking thresholds with current data");
        checkThresholds(sensorData);
      }, 100);
    },
    checkThresholds,
    updateDevicesBasedOnTriggers,
    updateFromSocketData,
    updateFromAPI: async (apiService) => {
      try {
        const result = await apiService.getLatestSensorData();
        console.log("SensorContext: API result:", result);

        const isUsingFallbackData = result.hasFallbackData === true;
        if (isUsingFallbackData) {
          console.warn("SensorContext: API returned fallback data");
        }

        if (result && result.success && result.data && result.data.length > 0) {
          setPrevData({
            soilMoisture: sensorData.soilMoisture,
            temperature: sensorData.temperature,
            airHumidity: sensorData.airHumidity,
            pumpWater: {
              speed: sensorData.pumpWater?.speed || 0,
            },
            light: {
              status: sensorData.light?.status || "Off",
            },
          });

          let newSensorData = {
            soilMoisture: sensorData.soilMoisture,
            temperature: sensorData.temperature,
            airHumidity: sensorData.airHumidity,
            pumpWater: {
              status: sensorData.pumpWater?.status || "Off",
              speed: sensorData.pumpWater?.speed || 0,
            },
            light: {
              status: sensorData.light?.status || "Off",
            },
            loading: false,
            error: null,
          };

          let pumpUpdated = false;
          let temperatureUpdated = false;
          let humidityUpdated = false;
          let soilMoistureUpdated = false;
          let lightUpdated = false;

          for (const sensor of result.data) {
            const isFallback = sensor.isFallback === true;
            if (isFallback) {
              console.warn(
                `SensorContext: Using fallback data for ${sensor.deviceType}`
              );
            }

            if (
              sensor?.deviceType === "soil_moisture" &&
              "soilMoisture" in sensor
            ) {
              newSensorData.soilMoisture = sensor.soilMoisture;
              soilMoistureUpdated = true;
              console.log(
                `SensorContext: Updated soil moisture from ${
                  isFallback ? "fallback" : "API"
                }: ${sensor.soilMoisture}%`
              );
            } else if (sensor?.deviceType === "temperature_humidity") {
              if ("temperature" in sensor) {
                newSensorData.temperature = sensor.temperature;
                temperatureUpdated = true;
                console.log(
                  `SensorContext: Updated temperature from ${
                    isFallback ? "fallback" : "API"
                  }: ${sensor.temperature}°C`
                );
              }
              if ("airHumidity" in sensor) {
                newSensorData.airHumidity = sensor.airHumidity;
                humidityUpdated = true;
                console.log(
                  `SensorContext: Updated air humidity from ${
                    isFallback ? "fallback" : "API"
                  }: ${sensor.airHumidity}%`
                );
              }
            } else if (sensor?.deviceType === "pump_water") {
              pumpUpdated = true;
              const pumpSpeed =
                sensor.pumpSpeed !== undefined
                  ? sensor.pumpSpeed
                  : sensor.speed !== undefined
                  ? sensor.speed
                  : 0;

              const pumpStatus = pumpSpeed > 0 ? "On" : "Off";

              newSensorData.pumpWater = {
                status: pumpStatus,
                speed: pumpSpeed,
              };

              console.log(
                `SensorContext: Updated pump data from ${
                  isFallback ? "fallback" : "API"
                }: ${pumpStatus} (${pumpSpeed}%)`
              );
            } else if (sensor?.deviceType === "light") {
              newSensorData.light = {
                status: sensor.status || "Off",
              };
              lightUpdated = true;
              console.log(
                `SensorContext: Updated light status from ${
                  isFallback ? "fallback" : "API"
                }: ${sensor.status}`
              );
            }
          }

          if (!soilMoistureUpdated)
            console.warn(
              "SensorContext: No soil moisture data updated from API"
            );
          if (!temperatureUpdated)
            console.warn("SensorContext: No temperature data updated from API");
          if (!humidityUpdated)
            console.warn("SensorContext: No humidity data updated from API");
          if (!pumpUpdated)
            console.warn("SensorContext: No pump data updated from API");
          if (!lightUpdated)
            console.warn("SensorContext: No light status updated from API");

          setSensorData(newSensorData);

          setTimeout(() => {
            checkThresholds(newSensorData);
          }, 100);

          saveToLocalStorage(SENSOR_DATA_KEY, {
            soilMoisture: newSensorData.soilMoisture,
            temperature: newSensorData.temperature,
            airHumidity: newSensorData.airHumidity,
            pumpWater: newSensorData.pumpWater,
            light: newSensorData.light,
          });

          return newSensorData;
        } else {
          console.log(
            "SensorContext: No sensor data or data format issue from API"
          );
          setSensorData((prev) => ({ ...prev, loading: false }));
          setTimeout(() => {
            checkThresholds(sensorData);
          }, 100);
          return sensorData;
        }
      } catch (error) {
        console.error(
          "SensorContext: Error fetching sensor data from API:",
          error
        );
        setSensorData((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Failed to fetch sensor data",
        }));
        setTimeout(() => {
          checkThresholds(sensorData);
        }, 100);
        return sensorData;
      }
    },
  };

  return (
    <SensorContext.Provider value={contextValue}>
      {children}
    </SensorContext.Provider>
  );
};

export default SensorContext;
