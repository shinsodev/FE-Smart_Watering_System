import React, { useState, useEffect } from "react"; // Bỏ useRef nếu không dùng
import { message, Card, Form, Button, Spin } from "antd"; // Bỏ Tabs, Select, Input, Slider nếu dùng component con
import { SaveOutlined, SettingOutlined, BulbOutlined, WifiOutlined, SyncOutlined } from "@ant-design/icons"; // Giữ lại icons cần thiết
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Bỏ useParams nếu không dùng
import API_ENDPOINTS from "../../services/ApiEndpoints";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Typography } from 'antd'; // Import Typography

// Component con 
import SliderCard from "../../components/SliderCard/SliderCard";
import './ConfigDevice.css'; // Import file CSS mới
import configbg from "../../assets/images/Bg-config.jpg"
const { Title, Paragraph } = Typography; // Sử dụng Title, Paragraph từ Typography

const ConfigDevice = () => {
    // Cấu hình mặc định
    const defaultConfig = {
        soilMoisture: { min: 20, max: 80 },
        temperature: { min: 20, max: 35 },
        airHumidity: { min: 40, max: 80 }
    };

    const [configs, setConfigs] = useState(defaultConfig);
    const [loading, setLoading] = useState(false); // State cho nút Lưu
    const [fetchingConfig, setFetchingConfig] = useState(true); // State cho việc load cấu hình ban đầu

    const navigate = useNavigate();
    const { user } = useAuth(); // Giả sử bạn cần user để kiểm tra quyền hạn sau này

    // Lấy cấu hình hiện tại từ API khi component mount
    useEffect(() => {
        const fetchCurrentConfig = async () => {
            try {
                setFetchingConfig(true);
                const response = await axios.get(
                    API_ENDPOINTS.DEVICES.GET_CONFIG('current'),
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

                console.log('Cấu hình nhận được từ API:', response.data);

                if (response.data && response.data.success && response.data.config) {
                    const configData = response.data.config;
                    // Cập nhật state với dữ liệu từ API, fallback về default nếu thiếu
                    setConfigs({
                        soilMoisture: {
                            min: configData.soilMoisture?.min ?? defaultConfig.soilMoisture.min,
                            max: configData.soilMoisture?.max ?? defaultConfig.soilMoisture.max
                        },
                        temperature: {
                            min: configData.temperature?.min ?? defaultConfig.temperature.min,
                            max: configData.temperature?.max ?? defaultConfig.temperature.max
                        },
                        airHumidity: {
                            min: configData.airHumidity?.min ?? defaultConfig.airHumidity.min,
                            max: configData.airHumidity?.max ?? defaultConfig.airHumidity.max
                        }
                    });
                    console.log('Đã cập nhật cấu hình từ API');
                } else {
                    console.warn('Không tìm thấy cấu hình từ API, sử dụng cấu hình mặc định');
                    setConfigs(defaultConfig); // Sử dụng default nếu API không trả về config hợp lệ
                }
            } catch (error) {
                console.error("Lỗi khi lấy cấu hình:", error);
                 // Hiển thị lỗi cụ thể hơn nếu có từ server, nếu không thì hiển thị lỗi chung
                 const errorMessage = error.response?.data?.message || error.message || "Unknown error";
                toast.error(`Không thể lấy cấu hình: ${errorMessage}`);
                setConfigs(defaultConfig); // Sử dụng default khi có lỗi
            } finally {
                setFetchingConfig(false);
            }
        };

        fetchCurrentConfig();
    }, []); // Chỉ chạy một lần khi mount

    // Xử lý thay đổi giá trị của SliderCard (min/max)
    const handleRangeChange = (key, value) => {
         // Đảm bảo value là [min, max]
         if (Array.isArray(value) && value.length === 2) {
            setConfigs((prev) => ({
                ...prev,
                [key]: { min: value[0], max: value[1] }
            }));
         } else {
            console.warn("Invalid range value received:", value);
         }
    };

    // Lưu tất cả cấu hình hiện tại
    const handleSaveAll = async () => {
        // Kiểm tra quyền trước khi lưu (ví dụ)
        if (!(user && user.isAccepted)) {
            toast.error("Tài khoản chưa được duyệt để lưu cấu hình.");
            return;
        }

        try {
            setLoading(true);
            console.log('Lưu cấu hình:', configs);
            const saveConfigResponse = await axios.post(
                API_ENDPOINTS.DEVICES.SAVE_CONFIG,
                configs, // Gửi toàn bộ object configs
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!saveConfigResponse.data || !saveConfigResponse.data.success) {
                throw new Error(saveConfigResponse.data?.message || "Không thể lưu cấu hình");
            }

            toast.success("Đã lưu cấu hình thành công");

        } catch (error) {
            console.error("Error saving device configs:", error);
            const errorMessage = error.response?.data?.message || error.message || "Unknown error saving config";
            toast.error(`Lỗi khi lưu cấu hình: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Khôi phục về cấu hình mặc định
    const handleResetToDefault = () => {
        setConfigs(defaultConfig);
        toast.info("Đã khôi phục về cấu hình mặc định");
    };

    return (
        // Áp dụng container và header từ CSS
        <div className="config-page-container">
            <div className="config-header">
                {/* Thay đổi ảnh nền nếu cần */}
                <img src={configbg} alt="Configuration background" className="config-header-bg"/>
                <div className="config-header-content">
                    {/* Thay đổi Title và Paragraph cho phù hợp */}
                    <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>Sensor Configuration</Title>
                    <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 600 }}>
                        Set the threshold parameters for your sensors. These settings will affect monitoring and automated actions.
                    </Paragraph>
                </div>
            </div>

            {/* Áp dụng body content wrapper từ CSS */}
            <div className="config-body-content">
                {/* Có thể giữ lại H1 hoặc bỏ đi nếu Title trong header đã đủ */}
                <div className="flex justify-between items-center mb-6">
                     <h1 className="text-xl md:text-2xl font-semibold text-gray-700">
                        Sensor Threshold Settings
                    </h1>
                </div>

                {/* Card chứa các cấu hình */}
                <Card title="Sensor Thresholds" className="mb-6" loading={fetchingConfig}>
                    {/* Phần hướng dẫn */}
                    <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4 text-sm">
                        <p className="font-medium text-blue-700 mb-1">Instructions:</p>
                        <p className="text-blue-600">
                            Adjust the thresholds below and click "Save Configuration" to apply them.
                            These values are used for system monitoring and automated controls.
                        </p>
                    </div>

                    {/* Grid chứa các SliderCard */}
                    <div className="grid grid-cols-1 gap-6">
                        <SliderCard
                            title="Soil Moisture Threshold (%)"
                            // Truyền mảng [min, max] vào value của SliderCard
                            value={[configs.soilMoisture.min, configs.soilMoisture.max]}
                             // Nhận lại mảng [min, max] từ onChange
                            onChange={(value) => handleRangeChange('soilMoisture', value)}
                            min={0}
                            max={100}
                            step={1}
                            description="Set min/max soil moisture. Affects automated watering."
                        />
                        <SliderCard
                            title="Temperature Threshold (°C)"
                            value={[configs.temperature.min, configs.temperature.max]}
                            onChange={(value) => handleRangeChange('temperature', value)}
                            min={0}
                            max={50}
                            step={1}
                            description="Set min/max temperature. May trigger alerts or fan controls."
                        />
                        <SliderCard
                            title="Air Humidity Threshold (%)"
                            value={[configs.airHumidity.min, configs.airHumidity.max]}
                            onChange={(value) => handleRangeChange('airHumidity', value)}
                            min={0}
                            max={100}
                            step={1}
                            description="Set min/max air humidity. May trigger alerts or ventilation."
                        />
                    </div>
                </Card>

                {/* Các nút Lưu và Reset */}
                <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-end">
                    <Button
                        onClick={handleResetToDefault}
                        className="min-w-[120px]"
                        disabled={loading || fetchingConfig} // Disable khi đang load hoặc đang lưu
                    >
                        Reset to Default
                    </Button>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveAll}
                        loading={loading} // Hiển thị loading khi đang lưu
                        disabled={loading || fetchingConfig} // Disable khi đang load hoặc đang lưu
                        className="min-w-[150px]"
                    >
                        {loading ? "Saving..." : "Save Configuration"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfigDevice;