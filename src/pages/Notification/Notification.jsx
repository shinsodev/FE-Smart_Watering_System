import React, { useState, useEffect, useMemo } from "react";
import { Table, Input, Typography, Space, Tag, Button, Row, Col, Dropdown, Menu, DatePicker, Spin, Tooltip, Empty } from "antd"; // Đã thêm Empty
import {
    ExclamationCircleOutlined, CheckCircleOutlined, InfoCircleOutlined, ToolOutlined,
    ApiOutlined, SearchOutlined, ClockCircleOutlined, UnorderedListOutlined, DownOutlined
} from "@ant-design/icons"; // Bỏ BellOutlined, FilterOutlined nếu không dùng
import axios from "axios";
import API_ENDPOINTS from "../../services/ApiEndpoints";
import { toast } from "react-toastify";
import moment from 'moment';
import './Notification.css';
import Noficationbg from "../../assets/images/Bg.jpg"

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;

const Notification = () => {
    const [notifications, setNotifications] = useState([]); // Dữ liệu gốc từ API
    const [displayNotifications, setDisplayNotifications] = useState([]); // Dữ liệu đã lọc để hiển thị
    const [loading, setLoading] = useState(true);

    // State cho các bộ lọc UI
    const [searchText, setSearchText] = useState('');
    const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'yesterday', 'last7days', 'custom'
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'THRESHOLD', 'CONNECTION', ...
    const [customDateRange, setCustomDateRange] = useState(null); // [moment, moment] or null

    // Fetch dữ liệu gốc khi component mount
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Fetch dữ liệu từ API
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_ENDPOINTS.NOTIFICATIONS.GET_ALL}?limit=1000`, // Lấy nhiều để lọc client-side
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            if (response.data && response.data.success) {
                setNotifications(response.data.data || []);
            } else {
                throw new Error(response.data?.message || "Cannot load notifications");
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Cannot load notifications: " + (error.response?.data?.message || error.message));
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    // Tính toán các loại notification duy nhất để hiển thị trong bộ lọc
    const uniqueEventTypes = useMemo(() => {
        if (!notifications) return ['all'];
        const types = notifications.map(item => item.type || 'UNKNOWN');
        return ['all', ...new Set(types)];
    }, [notifications]);

    // Effect này chạy mỗi khi bộ lọc hoặc dữ liệu gốc thay đổi để cập nhật danh sách hiển thị
    useEffect(() => {
        if (!notifications) return;

        let dataAfterFilter = [...notifications];

        // 1. Lọc theo Search Text (tìm kiếm trên tất cả các trường)
        if (searchText) {
            const lowerCaseValue = searchText.toLowerCase();
            dataAfterFilter = dataAfterFilter.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(lowerCaseValue)
                )
            );
        }

        // 2. Lọc theo Loại sự kiện
        if (typeFilter !== 'all') {
            dataAfterFilter = dataAfterFilter.filter(item => (item.type || 'UNKNOWN') === typeFilter);
        }

        // 3. Lọc theo Thời gian
        const today = moment().endOf('day');
        const yesterday = moment().subtract(1, 'days').startOf('day');
        const sevenDaysAgo = moment().subtract(7, 'days').startOf('day');

        if (timeFilter !== 'all') {
            dataAfterFilter = dataAfterFilter.filter(item => {
                const itemDate = moment(item.createdAt); // Giả sử API trả về 'createdAt'
                if (!itemDate.isValid()) return false; // Bỏ qua nếu ngày không hợp lệ

                switch (timeFilter) {
                    case 'yesterday':
                        return itemDate.isSame(yesterday, 'day');
                    case 'last7days':
                        return itemDate.isBetween(sevenDaysAgo, today, undefined, '[]'); // Bao gồm cả ngày bắt đầu và kết thúc
                    case 'custom':
                        if (customDateRange && customDateRange[0] && customDateRange[1]) {
                            const startDate = customDateRange[0].startOf('day');
                            const endDate = customDateRange[1].endOf('day');
                            return itemDate.isBetween(startDate, endDate, undefined, '[]');
                        }
                        return true; // Không lọc nếu chưa chọn custom range
                    default:
                        return true; // Mặc định không lọc theo thời gian nếu là 'all'
                }
            });
        }

        setDisplayNotifications(dataAfterFilter);

    }, [searchText, typeFilter, timeFilter, customDateRange, notifications]);


    // --- Các hàm xử lý sự kiện cho Dropdowns ---
    const handleTimeMenuClick = (e) => {
        const key = e.key;
        if (key === 'custom') {
            setTimeFilter('custom'); // Đánh dấu để hiển thị RangePicker
        } else {
            setTimeFilter(key);
            setCustomDateRange(null); // Reset custom range khi chọn cái khác
        }
    };

    const handleTypeMenuClick = (e) => {
        setTypeFilter(e.key);
    };

    const handleDateRangeChange = (dates) => {
        setCustomDateRange(dates);
        if(dates) {
            setTimeFilter('custom'); // Đảm bảo filter đang là custom
        } else if (timeFilter === 'custom') {
             // Nếu xóa range mà đang ở custom thì quay về 'all'
            setTimeFilter('all');
        }
    };

    // --- Menu cho Dropdowns ---
    const timeMenu = (
        <Menu onClick={handleTimeMenuClick} selectedKeys={[timeFilter]}>
            <Menu.Item key="all">All Time</Menu.Item>
            <Menu.Item key="yesterday">Yesterday ({moment().subtract(1, 'days').format('DD/MM')})</Menu.Item>
            <Menu.Item key="last7days">Last 7 days</Menu.Item>
            <Menu.Divider />
            <Menu.Item key="custom" disabled style={{ padding: 0, cursor: 'default' }}> {/* Cần style để không bị highlight */}
                 <div style={{ padding: '5px 12px' }}> {/* Thêm padding để RangePicker không sát mép */}
                    <RangePicker
                        value={customDateRange}
                        onChange={handleDateRangeChange}
                        style={{ width: '100%' }}
                        allowClear
                    />
                 </div>
            </Menu.Item>
        </Menu>
    );

    const typeMenu = (
        <Menu onClick={handleTypeMenuClick} selectedKeys={[typeFilter]}>
            {uniqueEventTypes.map(type => (
                <Menu.Item key={type}>
                    {type === 'all' ? 'All Types' : (type || 'UNKNOWN')}
                </Menu.Item>
            ))}
        </Menu>
    );
    // --- Kết thúc phần Dropdowns ---


    // --- Các hàm helper lấy Icon và Màu theo Type ---
    const getTypeIcon = (type) => {
        switch (type?.toUpperCase()) {
            case 'THRESHOLD': return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
            case 'CONNECTION': return <ApiOutlined style={{ color: '#1890ff' }} />;
            case 'PUMP': return <ToolOutlined style={{ color: '#52c41a' }} />;
            case 'USER_ACTION': return <CheckCircleOutlined style={{ color: '#722ed1' }} />;
            case 'AUTOMATION': return <ToolOutlined style={{ color: '#fa8c16' }} />;
            default: return <InfoCircleOutlined style={{ color: '#bfbfbf' }} />;
        }
    };

    const getTypeColor = (type) => {
        switch (type?.toUpperCase()) {
            case 'THRESHOLD': return 'error';
            case 'CONNECTION': return 'processing';
            case 'PUMP': return 'success';
            case 'USER_ACTION': return 'purple';
            case 'AUTOMATION': return 'warning';
            default: return 'default';
        }
    };
    // --- Kết thúc phần helpers ---


    // --- Định nghĩa cột cho Table ---
    const columns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 150,
            render: (type) => (
                <Tag icon={getTypeIcon(type)} color={getTypeColor(type)}>
                    {type || 'UNKNOWN'}
                </Tag>
            ),
        },
        {
            title: 'Content',
            dataIndex: 'message',
            key: 'message',
            render: (text) => <Text>{text}</Text>,
        },
        {
            title: 'Device/Source',
            dataIndex: 'source', // Trường này có thể có hoặc không từ API
            key: 'source',
            width: 180,
            render: (source, record) => (
                // Ưu tiên hiển thị 'source', nếu không có thì hiển thị 'iotdevice.deviceCode'
                <span>{source || (record.iotdevice?.deviceCode || 'N/A')}</span>
            ),
        },
        {
            title: 'Details/Value',
            dataIndex: 'value', // Trường này chứa nhiều loại dữ liệu (string, JSON string)
            key: 'value',
            width: 200,
            render: (value, record) => {
                // Trả về '-' nếu không có giá trị
                if (value === null || value === undefined || value === '') return <span>-</span>;

                // Xử lý đặc biệt cho type 'AUTOMATION' (thường là JSON)
                if (record.type?.toUpperCase() === 'AUTOMATION') {
                    try {
                        const jsonValue = JSON.parse(value);
                        // Hàm format ngày (ví dụ)
                        const formatDays = (days) => {
                            if (!days || !Array.isArray(days) || days.length === 0) return 'None';
                            const dayMap = { 'monday': 'Mon', 'tuesday': 'Tue', 'wednesday': 'Wed', 'thursday': 'Thu', 'friday': 'Fri', 'saturday': 'Sat', 'sunday': 'Sun' };
                            return days.map(day => dayMap[day.toLowerCase()] || day).join(', ');
                        };
                        // Tạo mảng các thông tin cần hiển thị
                        const items = [];
                        if (jsonValue.days) items.push(`Days: ${formatDays(jsonValue.days)}`);
                        if (jsonValue.startTime) items.push(`Start: ${jsonValue.startTime}`);
                        if (jsonValue.endTime) items.push(`End: ${jsonValue.endTime}`);
                        else if (jsonValue.duration) items.push(`Duration: ${jsonValue.duration} min`);
                        // Render các thông tin này
                        return (<div className="flex flex-col">{items.map((item, index) => (<div key={index} className="text-xs mb-1">{item}</div>))}</div>);
                    } catch (e) {
                        // Nếu không parse được JSON, hiển thị giá trị gốc
                        return <span>{value}</span>;
                    }
                }

                // Xử lý cho các loại khác, thử parse JSON nếu có thể
                try {
                    const jsonValue = JSON.parse(value);
                    // Nếu parse thành công và là object, hiển thị các cặp key-value hoặc giá trị đặc biệt
                    if (typeof jsonValue === 'object' && jsonValue !== null) {
                        if ('status' in jsonValue) return <span>{String(jsonValue.status)}</span>;
                        if ('value' in jsonValue) return <span>{String(jsonValue.value)}</span>;
                        const formatted = Object.entries(jsonValue).map(([key, val]) => `${key}: ${String(val)}`).join(', ');
                        return <span>{formatted || '-'}</span>; // Trả về '-' nếu object rỗng sau format
                    }
                    // Nếu parse thành công nhưng không phải object (vd: số, boolean), hiển thị dạng string
                    return <span>{String(jsonValue)}</span>;
                } catch (e) {
                    // Nếu không phải JSON string, hiển thị giá trị gốc
                    return <span>{value}</span>;
                }
            },
        },
        {
            title: 'Time',
            dataIndex: 'createdAt', // Dữ liệu thời gian từ API
            key: 'createdAt',
            width: 180,
            sorter: (a, b) => moment(a.createdAt).valueOf() - moment(b.createdAt).valueOf(), // Sắp xếp theo thời gian
            defaultSortOrder: 'descend', // Mặc định mới nhất lên trên
            render: (timestamp) => ( // Format thời gian hiển thị và thêm Tooltip
                <Tooltip title={moment(timestamp).format('YYYY-MM-DD HH:mm:ss')}>
                    {moment(timestamp).format('DD/MM/YYYY HH:mm')}
                </Tooltip>
            ),
        }
    ];
    // --- Kết thúc định nghĩa cột ---


    // --- JSX Render ---
    return (
        <div className="notification-page-container">
            <div className="notification-header">
                <img src={Noficationbg} alt="Notification background" className="notification-header-bg"/>
                <div className="notification-header-content">
                    <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>Notifications History</Title>
                    <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 600 }}>
                        Review your past notifications to stay updated on important alerts and system activities.
                    </Paragraph>
                </div>
            </div>

            <div className="notification-body-content">
                {/* Hàng Search và Filter */}
                <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
                    <Col flex="auto">
                        <Input
                            placeholder="Search across all fields..."
                            prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            style={{ borderRadius: 6 }}
                            size="large"
                        />
                    </Col>
                    <Col>
                        <Space>
                            {/* Dropdown Thời gian */}
                            <Dropdown overlay={timeMenu} trigger={['click']}>
                                <Button>
                                    <ClockCircleOutlined /> {
                                        timeFilter === 'all' ? 'Time' :
                                        timeFilter === 'yesterday' ? 'Yesterday' :
                                        timeFilter === 'last7days' ? 'Last 7 days' :
                                        customDateRange ? `${customDateRange[0].format('DD/MM')} - ${customDateRange[1].format('DD/MM')}` : 'Custom Range'
                                    } <DownOutlined />
                                </Button>
                            </Dropdown>
                            {/* Dropdown Loại sự kiện */}
                            <Dropdown overlay={typeMenu} trigger={['click']}>
                                <Button>
                                    <UnorderedListOutlined /> {typeFilter === 'all' ? 'Event Type' : (typeFilter || 'UNKNOWN')} <DownOutlined />
                                </Button>
                            </Dropdown>
                        </Space>
                    </Col>
                </Row>

                {/* Bảng dữ liệu */}
                {loading ? (
                    <div className="flex justify-center my-10">
                        <Spin size="large" />
                    </div>
                 ) : (
                     <div className="notification-table-wrapper">
                         <Table
                            columns={columns}
                            dataSource={displayNotifications}
                            rowKey="id"
                            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'], position: ["bottomCenter"] }}
                            loading={loading}
                            scroll={{ x: 800 }} // Đảm bảo scroll ngang hoạt động
                            locale={{
                                // Có thể tùy chỉnh thêm text ở đây nếu cần
                                emptyText: <Empty description={
                                    searchText || typeFilter !== 'all' || timeFilter !== 'all'
                                    ? "No notifications match the current filters."
                                    : "No notifications available."
                                } />
                            }}
                         />
                     </div>
                 )}
            </div>
        </div>
    );
    // --- Kết thúc JSX Render ---
};

export default Notification;