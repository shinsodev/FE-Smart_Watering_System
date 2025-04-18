import React, { useEffect } from "react";
import { Card, Table, Tag, Button, Space, Typography } from "antd";
import { WifiOutlined, ReloadOutlined, SettingOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import {
  ActiveSchedulesList,
  PumpControls,
  LightControls,
  DeviceConfigModal
} from "../../components/DeviceControl";

import { useDeviceControl } from "../../hooks/useDeviceControl";
import { useSchedules } from "../../hooks/useSchedules";
import { useDeviceConfig } from "../../hooks/useDeviceConfig";

import './ControlDevice.css'; 
import controlbg from "../src/assets/images/Bg-control.jpg"

const { Title, Paragraph } = Typography;

const ControlDevice = () => {
  const navigate = useNavigate();

  // --- State and Logic from Custom Hooks ---
  const {
    loading,
    deviceList,
    displayStates,
    deviceLoadingStatus,
    fetchDeviceList,
    handlePumpSpeedChange,
    handleToggleLight,
    isDeviceOnline
  } = useDeviceControl(); // Handles device fetching, status, and control actions

  const {
    schedules,
    schedulesLoading,
    fetchAllDeviceSchedules,
    handleToggleSchedule,
    handleDeleteSchedule
  } = useSchedules(); // Handles schedule fetching and management

  const {
    selectedDevice,
    deviceConfig,
    savingConfig,
    handleSelectDevice,
    handleCloseConfig,
    handleAutoModeChange,
    handleScheduleChange,
    handleSaveConfig
  } = useDeviceConfig(); // Handles device configuration modal state and actions

  // --- Effects ---
  // Fetch initial data on component mount
  useEffect(() => {
    fetchDeviceList();
    fetchAllDeviceSchedules();
    // Empty dependency array [] ensures this runs only once on mount.
  }, []);

  // --- Render Functions for Device Controls ---

  // Renders controls for water pump devices
  const renderPumpControls = (device) => {
    if (!device || device.deviceType !== 'pump_water') return null;
    const isCurrentDevice = selectedDevice && selectedDevice.id === device.id;
    const isAutoMode = isCurrentDevice && deviceConfig.autoMode;
    const isWateringScheduleEnabled = isCurrentDevice && deviceConfig.wateringSchedule?.enabled;
    const isInAutoMode = isAutoMode && isWateringScheduleEnabled;
    const isDeviceLoading = deviceLoadingStatus[device.id] === true;
    const displayState = displayStates[device.id] || {};
    const pumpSpeed = displayState.pumpWaterSpeed !== undefined ? displayState.pumpWaterSpeed : 0;

    return (
      <PumpControls
        device={device}
        isDeviceLoading={isDeviceLoading}
        pumpSpeed={pumpSpeed}
        isInAutoMode={isInAutoMode}
        onSpeedChange={handlePumpSpeedChange}
        isDeviceOnline={isDeviceOnline}
      />
    );
  };

  // Renders controls for light devices
  const renderLightControls = (device) => {
    if (!device || device.deviceType !== 'light') return null;
    const isCurrentDevice = selectedDevice && selectedDevice.id === device.id;
    const isAutoMode = isCurrentDevice && deviceConfig.autoMode;
    const isLightScheduleEnabled = isCurrentDevice && deviceConfig.lightSchedule?.enabled;
    const isInAutoMode = isAutoMode && isLightScheduleEnabled;
    const isDeviceLoading = deviceLoadingStatus[device.id] === true;
    const displayState = displayStates[device.id] || {};
    const lightValue = displayState.light !== undefined ? displayState.light : false;

    return (
      <LightControls
        device={device}
        isDeviceLoading={isDeviceLoading}
        isLightOn={lightValue}
        isInAutoMode={isInAutoMode}
        onToggleLight={handleToggleLight}
        isDeviceOnline={isDeviceOnline}
      />
    );
  };

  // Renders the 'Configure' button for a device row
  const renderConfigButton = (device) => (
    <Button
      size="small"
      icon={<SettingOutlined />}
      onClick={() => handleSelectDevice(device)}
    >
      Configure
    </Button>
  );

  // --- Ant Design Table Column Definitions ---
  const columns = [
    {
      title: 'Device Code',
      dataIndex: 'deviceCode',
      key: 'deviceCode',
    },
    {
      title: 'Device Type',
      dataIndex: 'deviceType',
      key: 'deviceType',
      render: (type) => { // Display type with a colored tag
        const config = {
          'pump_water': { color: 'cyan', text: 'Water Pump' },
          'light': { color: 'gold', text: 'Light' },
          default: { color: 'default', text: type }
        };
        const { color, text } = config[type] || config.default;
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [ // Allow filtering by type
        { text: 'Water Pump', value: 'pump_water' },
        { text: 'Light', value: 'light' }
      ],
      onFilter: (value, record) => record.deviceType === value,
    },
    {
      title: 'Controls',
      key: 'controls',
      render: (_, record) => { // Render specific controls based on type
        if (record.deviceType === 'pump_water') return renderPumpControls(record);
        if (record.deviceType === 'light') return renderLightControls(record);
        return null;
      },
    },
    {
      title: 'Actions', // Changed title for clarity
      key: 'action',
      width: 180,
      render: (_, record) => ( // Render action buttons
        <Space size="small">
          {renderConfigButton(record)}
          <Button
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => navigate(`/dashboard/device/${record.id}`)} // Navigate to details page
          >
            Details
          </Button>
        </Space>
      ),
    },
  ];

  // --- Component JSX Structure ---
  return (
    <div className="control-page-container">
      {/* Page Header */}
      <div className="control-header">
        <img src={controlbg} alt="Device Control background" className="control-header-bg"/>
        <div className="control-header-content">
          <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>Device Control </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 600 }}>
            Manually control your pumps and lights, manage automation schedules, and configure device settings.
          </Paragraph>
        </div>
      </div>

      {/* Page Body Content */}
      <div className="control-body-content">
        {/* Device Control Table */}
        <Card title="Device Controls" className="mb-6 shadow-md">
          <Table
            // Only show pumps and lights in this table
            dataSource={deviceList.filter(d => d.deviceType === 'pump_water' || d.deviceType === 'light')}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "No water pumps or lights found" }}
          />
        </Card>

        {/* Active Schedules List */}
        <Card
          title="Active Schedules List"
          className="mb-6 shadow-md"
          loading={schedulesLoading}
        >
          <ActiveSchedulesList
            schedules={schedules}
            onToggle={handleToggleSchedule}
            onDelete={handleDeleteSchedule}
          />
        </Card>

        {/* Device Configuration Modal (conditional rendering) */}
        {selectedDevice && (
          <DeviceConfigModal
            device={selectedDevice}
            config={deviceConfig}
            onClose={handleCloseConfig}
            onAutoModeChange={handleAutoModeChange}
            onScheduleChange={handleScheduleChange}
            onSave={handleSaveConfig}
            saving={savingConfig}
          />
        )}
      </div>
    </div>
  );
};

export default ControlDevice;