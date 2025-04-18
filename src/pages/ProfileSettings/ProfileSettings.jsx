import React, { useState, useEffect } from "react";
import { Card, Form, Input, Button, Tabs, Spin, Divider, message, Typography, Tag } from "antd"; // Added Tag for consistency if needed later
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import UserServices from "../../services/UserServices";

import './ProfileSettings.css'; // Import CSS

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs; // Keep TabPane as per original logic

const ProfileSettings = () => {
    const { user, fetchUserProfile } = useAuth(); // Assuming fetchUserProfile exists if needed after update
    const [loading, setLoading] = useState(false); // General loading (can be removed if unused)
    const [saving, setSaving] = useState(false); // Saving state for buttons
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    // Keep original useEffect logic
    useEffect(() => {
        if (user) {
            profileForm.setFieldsValue({
                fullname: user.fullname || "",
                username: user.username || "",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || ""
            });
        }
    }, [user, profileForm]);

    // Keep original handleUpdateProfile logic (with English messages)
    const handleUpdateProfile = async (values) => {
        const { username, ...updateData } = values;
        setSaving(true);
        try {
            const response = await UserServices.updateUserProfile(updateData);
             // Basic success message, more detailed handling can be added later
             message.success("Profile information updated successfully!");
             // Optionally call fetchUserProfile if available and needed
             if (typeof fetchUserProfile === 'function') {
                 fetchUserProfile();
             }
        } catch (error) {
            console.error("Error updating profile:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to update profile";
            message.error(`Error updating profile: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    // Keep original handleUpdatePassword logic (with English messages)
    const handleUpdatePassword = async (values) => {
        const { currentPassword, newPassword, confirmPassword } = values;
        if (newPassword !== confirmPassword) {
            message.error("New password and confirmation password do not match");
            return;
        }
        setSaving(true);
        try {
            const response = await UserServices.updateUserPassword(currentPassword, newPassword);
             // Basic success message, more detailed handling can be added later
             message.success("Password updated successfully!");
            passwordForm.resetFields();
        } catch (error) {
            console.error("Error updating password:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to update password";
            message.error(`Error updating password: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    // Keep original loading state render
    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" />
            </div>
        );
    }

    // Apply container and header structure
    return (
        <div className="profile-page-container">
            <div className="profile-header">
                <img src="..\src\assets\images\avt.jpeg" alt="Profile background" className="profile-header-bg"/> {/* Update image path */}
                <div className="profile-header-content">
                    {/* English Title and Paragraph */}
                    <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>Account Settings</Title>
                    <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 600 }}>
                        Manage your personal information, account details, and security settings.
                    </Paragraph>
                </div>
            </div>

             {/* Apply body content wrapper */}
            <div className="profile-body-content">
                 {/* Keep original Tabs with TabPane structure */}
                <Tabs defaultActiveKey="profile" type="card" className="profile-tabs bg-white rounded-lg shadow">
                    <TabPane tab="Personal Information" key="profile"> {/* English Tab Name */}
                        <Card title="User Information" bordered={false}> {/* English Title */}
                            <Form
                                form={profileForm}
                                layout="vertical"
                                onFinish={handleUpdateProfile}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                    <Form.Item
                                        name="fullname"
                                        label="Full Name" // English Label
                                        rules={[{ required: true, message: 'Please input your full name!' }]} // English Message
                                    >
                                        <Input prefix={<UserOutlined />} placeholder="Full Name" />
                                    </Form.Item>
                                    <Form.Item name="username" label="Username">
                                        <Input prefix={<UserOutlined />} disabled />
                                    </Form.Item>
                                    <Form.Item
                                        name="email"
                                        label="Email"
                                        rules={[
                                            { required: true, message: 'Please input your email!' }, // English Message
                                            { type: 'email', message: 'The input is not valid E-mail!' } // English Message
                                        ]}
                                    >
                                        <Input prefix={<MailOutlined />} placeholder="Email" />
                                    </Form.Item>
                                    <Form.Item
                                        name="phone"
                                        label="Phone Number" // English Label
                                        rules={[{ required: true, message: 'Please input your phone number!' }]} // English Message
                                    >
                                        <Input prefix={<PhoneOutlined />} placeholder="Phone Number" />
                                    </Form.Item>
                                    <Form.Item name="address" label="Address" className="md:col-span-2">
                                        <Input prefix={<HomeOutlined />} placeholder="Address" />
                                    </Form.Item>
                                </div>
                                <Form.Item className="mt-4">
                                    <Button type="primary" htmlType="submit" loading={saving}>
                                        Update Profile {/* English Text */}
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </TabPane>

                    <TabPane tab="Change Password" key="password"> {/* English Tab Name */}
                        <Card title="Change Your Password" bordered={false}> {/* English Title */}
                            <Form
                                form={passwordForm}
                                layout="vertical"
                                onFinish={handleUpdatePassword}
                            >
                                <Form.Item
                                    name="currentPassword"
                                    label="Current Password" // English Label
                                    rules={[{ required: true, message: 'Please input your current password!' }]} // English Message
                                >
                                    <Input.Password prefix={<LockOutlined />} placeholder="Current Password" />
                                </Form.Item>
                                <Form.Item
                                    name="newPassword"
                                    label="New Password" // English Label
                                    rules={[
                                        { required: true, message: 'Please input your new password!' }, // English Message
                                        { min: 6, message: 'Password must be at least 6 characters!' } // English Message
                                    ]}
                                    hasFeedback
                                >
                                    <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
                                </Form.Item>
                                <Form.Item
                                    name="confirmPassword"
                                    label="Confirm New Password" // English Label
                                    dependencies={['newPassword']}
                                    hasFeedback
                                    rules={[
                                        { required: true, message: 'Please confirm your new password!' }, // English Message
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('newPassword') === value) {
                                                    return Promise.resolve();
                                                }
                                                // English Message
                                                return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm New Password" />
                                </Form.Item>
                                <Form.Item className="mt-4">
                                    <Button type="primary" htmlType="submit" loading={saving}>
                                        Update Password {/* English Text */}
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </TabPane>

                    <TabPane tab="Account Information" key="account"> {/* English Tab Name */}
                        <Card title="Account Details" bordered={false}> {/* English Title & Removed border */}
                            {/* Keep original simple display structure */}
                            <div className="flex flex-col space-y-4">
                                <div>
                                    <Text strong>User ID:</Text> {/* English Label */}
                                    <Text className="ml-2" copyable>{user.id}</Text> {/* Added copyable */}
                                </div>
                                <Divider className="my-1" /> {/* Added Divider */}
                                <div>
                                    <Text strong>Username:</Text> {/* English Label */}
                                    <Text className="ml-2">{user.username}</Text>
                                </div>
                                <Divider className="my-1" />
                                <div>
                                    <Text strong>Role:</Text> {/* English Label */}
                                    <Text className="ml-2">{user.role || "User"}</Text> {/* Default to User */}
                                </div>
                                <Divider className="my-1" />
                                <div>
                                    <Text strong>Account Created:</Text> {/* English Label */}
                                    <Text className="ml-2">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : "N/A"} {/* English date format */}
                                    </Text>
                                </div>
                                <Divider className="my-1" />
                                <div>
                                    <Text strong>Account Status:</Text> {/* English Label */}
                                    {/* Use Tag for better visual status */}
                                    <Tag className="ml-2" color={user.isAccepted ? "success" : "warning"}>
                                        {user.isAccepted ? "Accepted" : "Pending Approval"}
                                    </Tag>
                                </div>
                            </div>
                        </Card>
                    </TabPane>
                </Tabs>
            </div>
        </div>
    );
};

export default ProfileSettings;