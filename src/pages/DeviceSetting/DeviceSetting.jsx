import React, { useState, useEffect, useRef } from "react";
import {
    Table, Button, Modal, Form, Input, Select, Spin, Popconfirm, message, Tag, Space, Row, Col, Card, Tooltip, Divider, Typography, InputNumber
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    SettingOutlined, ReloadOutlined, EyeOutlined, // SettingOutlined không còn dùng trong render nhưng có thể giữ lại import nếu cần ở chỗ khác
    ExclamationCircleOutlined, MinusCircleOutlined,
    CheckCircleOutlined, CloseCircleOutlined, SyncOutlined
} from "@ant-design/icons";
import axiosInstance from "../../services/CustomizeAxios";
import DeviceServices from "../../services/DeviceServices";
import { useAuth } from "../../context/AuthContext";
import './DeviceSetting.css';
import bgDevice from '../../assets/images/Bg-device.jpg';


const { Option } = Select;
const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const DeviceSetting = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState("Add New Device");
    const [editingDevice, setEditingDevice] = useState(null);
    const [form] = Form.useForm();
    const { user } = useAuth();
    const [deviceConnectionStatus, setDeviceConnectionStatus] = useState({});
    const [refreshingAll, setRefreshingAll] = useState(false);
    const refreshIntervalRef = useRef(null);
    const [recentlyUpdatedDevices, setRecentlyUpdatedDevices] = useState([]);

    useEffect(() => {
        fetchDevices();
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const result = await DeviceServices.getAllDevices();
            setDevices(result);
        } catch (error) {
            console.error("Error fetching devices:", error);
            message.error("Error loading device list");
        } finally {
            setLoading(false);
        }
    };

    const checkDeviceConnections = async (deviceList) => {
        try {
            const statusObj = {};
            for (const device of deviceList) {
                try {
                    const response = await axiosInstance.get(`/devices/${device.id}/mqtt-status`).catch(async () => {
                        const deviceDetail = await DeviceServices.getDeviceById(device.id).catch(() => null);
                        let hasRecentData = false;
                        if (deviceDetail && deviceDetail.feed && deviceDetail.feed.length > 0) {
                            for (const feed of deviceDetail.feed) {
                                if (feed.lastValue && feed.updatedAt) {
                                    const lastUpdateTime = new Date(feed.updatedAt);
                                    const fiveMinutesAgo = new Date();
                                    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
                                    if (lastUpdateTime > fiveMinutesAgo) {
                                        hasRecentData = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (!hasRecentData && deviceDetail && deviceDetail.lastSeen) {
                            const lastUpdateDate = new Date(deviceDetail.lastSeen);
                            const fiveMinutesAgo = new Date();
                            fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
                            hasRecentData = lastUpdateDate > fiveMinutesAgo;
                        }
                        return { data: { success: true, data: { isConnected: hasRecentData } } };
                    });

                    if (response && response.data && response.data.success) {
                        statusObj[device.id] = response.data.data.isConnected;
                    } else {
                        let hasRecentDataFallback = false;
                        const fiveMinutesAgo = new Date();
                        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
                        try {
                            if (device.deviceType === 'temperature_humidity') {
                                const sensorData = await DeviceServices.getTemperatureHumidityData(device.id).catch(() => []);
                                if (sensorData && sensorData.length > 0) {
                                    const readingTime = new Date(sensorData[0].readingTime);
                                    hasRecentDataFallback = readingTime > fiveMinutesAgo;
                                }
                            } else if (device.deviceType === 'soil_moisture') {
                                const sensorData = await DeviceServices.getSoilMoistureData(device.id).catch(() => []);
                                if (sensorData && sensorData.length > 0) {
                                     const readingTime = new Date(sensorData[0].readingTime);
                                     hasRecentDataFallback = readingTime > fiveMinutesAgo;
                                 }
                            } else if (device.deviceType === 'pump_water') {
                                 const sensorData = await DeviceServices.getPumpWaterData(device.id).catch(() => []);
                                 if (sensorData && sensorData.length > 0) {
                                    const readingTime = new Date(sensorData[0].readingTime);
                                    hasRecentDataFallback = readingTime > fiveMinutesAgo;
                                }
                            } else if (device.deviceType === 'light') {
                                 const sensorData = await DeviceServices.getLightData(device.id).catch(() => []);
                                 if (sensorData && sensorData.length > 0) {
                                    const readingTime = new Date(sensorData[0].readingTime);
                                    hasRecentDataFallback = readingTime > fiveMinutesAgo;
                                }
                            }
                        } catch (sensorError) {
                             console.error(`Error fetching sensor data for ${device.id}:`, sensorError);
                             hasRecentDataFallback = false;
                        }
                        statusObj[device.id] = hasRecentDataFallback;
                    }
                } catch (error) {
                    console.error(`Error checking device connection for device ${device.id}:`, error);
                    statusObj[device.id] = false;
                }
            }
            setDeviceConnectionStatus(statusObj);
        } catch (error) {
            console.error("Error checking device connections:", error);
        }
    };

    const showAddModal = () => {
        if (!(user && user.isAccepted)) {
            message.error("Your account is pending approval. Please contact an administrator.");
            return;
        }
        setEditingDevice(null);
        setModalTitle("Add New Device");
        form.resetFields();
        form.setFieldsValue({ feeds: [{ name: '', feedKey: '' }], status: "Off" });
        setModalVisible(true);
    };

    const showEditModal = (device) => {
        setEditingDevice(device);
        setModalTitle(`Edit Device: ${device.deviceCode}`);
        const initialValues = {
            deviceCode: device.deviceCode,
            description: device.description,
            status: device.status,
            feeds: device.feed && device.feed.length > 0
                ? device.feed.map(feed => ({
                    id: feed.id,
                    name: feed.name,
                    feedKey: feed.feedKey,
                    minValue: feed.minValue,
                    maxValue: feed.maxValue
                }))
                : []
        };
        form.resetFields();
        form.setFieldsValue(initialValues);
        console.log('Initializing form with data:', JSON.stringify(initialValues, null, 2));
        setModalVisible(true);
    };

    const handleCancel = () => {
        setModalVisible(false);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (editingDevice) {
                console.log('Updating device data:', JSON.stringify(values, null, 2));
                const result = await DeviceServices.updateDevice(editingDevice.id, values);
                if (result.success) {
                    message.success(result.message || "Device updated successfully");
                    fetchDevices();
                    setModalVisible(false);
                } else {
                    message.error(result.message || "Device update failed");
                }
            } else {
                 if (!(user && user.isAccepted)) {
                     message.error("Your account is pending approval. Please contact an administrator.");
                     return;
                 }
                if (!values.feeds || values.feeds.length === 0) {
                    message.error("At least one feed is required for the device");
                    return;
                }
                 for (const feed of values.feeds) {
                    if (!feed.name || !feed.feedKey) {
                        message.error("Each feed must have a Name and a Feed Key");
                        return;
                    }
                 }
                console.log('Adding new device data:', JSON.stringify(values, null, 2));
                try {
                    const result = await DeviceServices.addDevice(values);
                    if (result.success) {
                        message.success(result.message || "Device added successfully");
                        fetchDevices();
                        setModalVisible(false);
                    } else {
                        message.error(result.message || "Failed to add device");
                    }
                } catch (apiError) {
                    console.error("API Error:", apiError);
                    message.error("Error adding new device. Please try again later.");
                }
            }
        } catch (error) {
            console.error("Form submission error:", error);
            if (error.errorFields) {
                message.error("Please fill in all required fields correctly.");
            } else {
                message.error("Error saving device information");
            }
        }
    };

    const handleDelete = async (deviceId) => {
        try {
            const response = await axiosInstance.delete(`/devices/${deviceId}`);
            if (response.data.success) {
                message.success("Device deleted successfully");
                fetchDevices();
                setDeviceConnectionStatus((prev) => {
                    const newStatus = { ...prev };
                    delete newStatus[deviceId];
                    return newStatus;
                });
            } else {
                message.error(response.data.message || "Failed to delete device");
            }
        } catch (error) {
            console.error("Error deleting device:", error);
            message.error("Error deleting device");
            if (error.response && error.response.status === 403) {
                 message.error("You do not have permission to delete this device.");
            }
        }
    };

    // Column definitions for the device table
    const columns = [
        {
            title: "Device Code",
            dataIndex: "deviceCode",
            key: "deviceCode",
        },
        {
            title: "Device Type",
            dataIndex: "deviceType",
            key: "deviceType",
            render: (type) => {
                let color;
                let text;
                switch (type) {
                    case 'temperature_humidity': color = 'blue'; text = 'Temperature & Humidity'; break;
                    case 'soil_moisture': color = 'green'; text = 'Soil Moisture'; break;
                    case 'pump_water': color = 'cyan'; text = 'Water Pump'; break;
                    case 'light': color = 'gold'; text = 'Light'; break;
                    default: color = 'default'; text = type;
                }
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            ellipsis: true,
        },
        {
            title: "Actions",
            key: "action",
            render: (_, record) => (
                <Space size="small">
                    {/* Bỏ nút Config Setting ở đây */}
                    <Tooltip title={!(user && user.isAccepted) ? "Account pending approval" : "Edit Device"}>
                        <Button
                            type="default"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => (user && user.isAccepted) ? showEditModal(record) : message.error("Account pending approval. Cannot edit.")}
                            disabled={!(user && user.isAccepted)}
                        />
                    </Tooltip>
                    <Tooltip title={!(user && user.isAccepted) ? "Account pending approval" : "Delete Device"}>
                        <Popconfirm
                            title="Are you sure you want to delete this device?"
                            onConfirm={() => (user && user.isAccepted) ? handleDelete(record.id) : message.error("Account pending approval. Cannot delete.")}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                            disabled={!(user && user.isAccepted)}
                        >
                            <Button
                                type="danger"
                                size="small"
                                icon={<DeleteOutlined />}
                                disabled={!(user && user.isAccepted)}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // JSX Structure of the component
    return (
        <div className="devicesetting-page-container">

            <div className="devicesetting-header">
                <img
                    src={bgDevice}
                    alt="Device Management background"
                    className="devicesetting-header-bg"
                />
                <div className="devicesetting-header-content">
                    <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
                       Device Management
                    </Title>
                    <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 600 }}>
                       Add, edit, delete, and view the status of your IoT devices here.
                    </Paragraph>
                </div>
            </div>

            <div className="devicesetting-body-content">

                <div className="title-container">
                    <Title level={3} className="typewriter-gradient-title"> Customize Your Device Management </Title>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Device Management</h1>
                    <div className="flex space-x-2">
                         {(user && user.isAccepted) ? (
                             <Tooltip title="Add New Device">
                                <button
                                    type="button"
                                    onClick={showAddModal}
                                    className="inline-flex items-center gap-2 px-[20px] py-[8px] border bg-black text-white hover:bg-[#0D986A] transition-all duration-300 ease-in-out rounded"
                                >
                                    <PlusOutlined />
                                    <span>Add Device</span>
                                </button>
                            </Tooltip>
                         ) : (
                            <Tooltip title="Your account is pending approval. Contact admin to add devices.">
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex items-center gap-2 px-[20px] py-[8px] border border-gray-400 bg-gray-200 text-gray-500 transition-all duration-300 ease-in-out rounded cursor-not-allowed"
                                >
                                    <PlusOutlined />
                                    <span>Add Device</span>
                                </button>
                            </Tooltip>
                         )}
                    </div>
                </div>

                {!(user && user.isAccepted) && user != null && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ExclamationCircleOutlined className="text-yellow-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Your account is pending approval. You can view devices but cannot add, edit, or delete until approved by an administrator.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={devices}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: "No devices found" }}
                    />
                )}

            </div>

            <Modal
                title={modalTitle}
                open={modalVisible}
                onCancel={handleCancel}
                onOk={handleSubmit}
                okText={editingDevice ? "Update" : "Add New"}
                cancelText="Cancel"
                width={700}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="deviceForm"
                >
                    {!editingDevice && (
                        <Form.Item name="deviceType" label="Device Type" rules={[{ required: true, message: "Please select device type" }]}>
                            <Select placeholder="Select device type">
                                <Option value="temperature_humidity">Temperature & Humidity Sensor</Option>
                                <Option value="soil_moisture">Soil Moisture Sensor</Option>
                                <Option value="pump_water">Water Pump</Option>
                                <Option value="light">Light</Option>
                            </Select>
                        </Form.Item>
                    )}
                    <Form.Item name="deviceCode" label="Device Code" rules={[{ required: true, message: "Please enter device code" }]}>
                        <Input placeholder="Enter unique device code (e.g., Farm01_Sensor_T1)" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <TextArea rows={4} placeholder="Enter device description (location, function, etc.)" />
                    </Form.Item>
                     {editingDevice && (
                        <div className="mb-4">
                            <Divider orientation="left" plain>Edit Device Feeds</Divider>
                            <Card size="small" className="mb-2 bg-gray-50 border border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Update the feed names and keys associated with this device.</p>
                                <p className="text-xs text-gray-500">Note: Feed keys should match the last part of your MQTT topic (e.g., 'temperature' for topic 'user/feeds/temperature').</p>
                            </Card>
                            <Form.List name="feeds">
                                {(fields) => (
                                    <div className="space-y-3 mt-2">
                                        {fields.map((field) => (
                                            <Card key={field.key} size="small" bordered className="bg-white">
                                                <Row gutter={16} align="middle">
                                                    <Col xs={24} sm={11}>
                                                        <Form.Item
                                                            {...field}
                                                            label={<span className="text-sm font-medium">Feed Name</span>}
                                                            name={[field.name, 'name']}
                                                            rules={[{ required: true, message: 'Feed name required' }]}
                                                            className="mb-0"
                                                        >
                                                            <Input placeholder="E.g., Temperature" size="small" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={24} sm={11}>
                                                        <Form.Item
                                                            {...field}
                                                            label={<span className="text-sm font-medium">Feed Key</span>}
                                                            name={[field.name, 'feedKey']}
                                                            rules={[{ required: true, message: 'Feed key required' }]}
                                                            className="mb-0"
                                                        >
                                                            <Input placeholder="E.g., temperature" size="small" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Form.Item {...field} name={[field.name, 'id']} noStyle hidden><Input /></Form.Item>
                                                </Row>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </Form.List>
                        </div>
                     )}
                     {!editingDevice && (
                        <div className="mb-4">
                            <Divider orientation="left" plain>Device Feeds <span className="text-red-500">*</span></Divider>
                            <Card size="small" className="mb-2 bg-gray-50 border border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Define at least one feed. The <strong className="font-semibold">Feed Key</strong> must match the last part of the MQTT topic used to send data.</p>
                                <p className="text-xs text-gray-500">Example: For MQTT topic <code>username/feeds/sensor1-temp</code>, the Feed Key is <code>sensor1-temp</code>.</p>
                            </Card>
                            <Form.List
                                name="feeds"
                                rules={[{ validator: async (_, feeds) => { if (!feeds || feeds.length < 1) { return Promise.reject(new Error('At least one feed is required')); } return Promise.resolve(); } }]}
                            >
                                {(fields, { add, remove }, { errors }) => (
                                    <>
                                        <div className="space-y-3">
                                            {fields.map(({ key, name, ...restField }, index) => (
                                                <Row key={key} gutter={8} align="middle" className="p-2 border rounded bg-white">
                                                    <Col flex="auto">
                                                        <Row gutter={8}>
                                                            <Col xs={24} sm={12}>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'name']}
                                                                    validateTrigger={['onChange', 'onBlur']}
                                                                    rules={[{ required: true, whitespace: true, message: 'Please input feed name or delete this field.' }]}
                                                                    className="mb-0"
                                                                >
                                                                    <Input placeholder={`Feed Name ${index + 1} (e.g., Temperature)`} />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col xs={24} sm={12}>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'feedKey']}
                                                                    validateTrigger={['onChange', 'onBlur']}
                                                                    rules={[{ required: true, whitespace: true, message: 'Please input feed key or delete this field.' }]}
                                                                    className="mb-0"
                                                                >
                                                                    <Input placeholder={`Feed Key ${index + 1} (e.g., temperature)`} />
                                                                </Form.Item>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                    <Col flex="none">
                                                        {fields.length > 1 ? (
                                                            <Tooltip title="Remove Feed">
                                                                <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                                                            </Tooltip>
                                                        ) : null}
                                                    </Col>
                                                </Row>
                                            ))}
                                        </div>
                                        <Form.Item className="mt-3">
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                               Add Feed
                                            </Button>
                                            <Form.ErrorList errors={errors} />
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </div>
                     )}
                </Form>
            </Modal>
        </div>
    );
};

export default DeviceSetting;