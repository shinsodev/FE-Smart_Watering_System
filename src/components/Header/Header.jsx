import React from "react"; // Import React
import { IoLogOutOutline } from "react-icons/io5";
// import { useAuth } from "../../context/AuthContext"; // Commented out if not used here
import { Link, useLocation } from "react-router-dom";

// Icon
import { IoNotifications } from "react-icons/io5";
// import IconSearch from "../../assets/images/icon-search.svg"; // Commented out if not used here
import Avt from "../../assets/images/avt.jpeg"; // Ensure this path is correct

const Header = () => {
  const location = useLocation();
  // const { user, logout } = useAuth(); // Assuming you might need logout or user info later

  // Hàm lấy tiêu đề từ URL - ĐÃ CẬP NHẬT LOGIC TRẢ VỀ KHI LÀ SỐ
  const formatHeaderTitle = (pathname) => {
    const paths = pathname.split('/').filter(p => p !== '');
    const lastPath = paths[paths.length - 1] || ''; // Lấy phần cuối, mặc định là chuỗi rỗng

    // Kiểm tra xem lastPath có phải là chuỗi chỉ chứa số và không rỗng không
    if (lastPath && /^\d+$/.test(lastPath)) {
      return "Config Device"; 
    } else if (lastPath) {
      return lastPath
        .replace(/-/g, ' ') 
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else {
      // Nếu lastPath rỗng (ví dụ: đường dẫn là '/'), trả về tiêu đề mặc định
      return "Dashboard"; // Hoặc trả về '' nếu muốn trống
    }
  };


  return (
    <>
      <header className="flex flex-row items-center justify-between pt-[20px] px-[30px] h-[112px] shadow">
        <div className="font-poppins text-[32px] font-bold text-black">
          {formatHeaderTitle(location.pathname)} {/* Sử dụng hàm đã cập nhật */}
        </div>
        <div className="flex flex-row space-x-[40px] items-center">
          <Link to="/notification">
            <IoNotifications
              size={25}
              className="text-black hover:opacity-60 cursor-pointer"
            />
          </Link>
          <Link to="/profile">
          <img
            src={Avt}
            alt="avt"
            className="h-[53px] w-[53px] object-cover rounded-full"
          />
          </Link>
        </div>
      </header>
    </>
  );
};

export default Header;