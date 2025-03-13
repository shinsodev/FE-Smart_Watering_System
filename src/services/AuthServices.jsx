import axios from "./CustomizeAxios";
import { toast } from "react-toastify";
export async function login(username, password) {
  try {
    const res = await axios.post("/auth/login", {
      username,
      password,
    });

    return res;
  } catch (error) {
    toast.error(error?.response?.data?.message);
  }
}

export async function forgotPassword(email) {
  try {
    const res = await axios.post("/auth/forgot-password", {
      email,
    });

    return res;
  } catch (error) {
    toast.error(error?.response?.data?.message);
  }
}

export async function verifyOTP(email, otp) {
  try {
    const res = await axios.post("/auth/verify-otp", {
      email,
      otp,
    });

    return res;
  } catch (error) {
    toast.error(error?.response?.data?.message);
  }
}

export async function resetPassword(email, newPassword, confirmPassword) {
  try {
    const res = await axios.post("/auth/reset-password", {
      email,
      newPassword,
      confirmPassword,
    });

    return res;
  } catch (error) {
    toast.error(error?.response?.data?.message);
  }
}

export async function register(userDTO, studentDTO) {
  try {
    const res = await axios.post("/students/register", {
      userDTO,
      studentDTO,
    });

    return res;
  } catch (error) {
    toast.error(error?.response?.data?.message);
  }
}

// export async function getInfo(token) {
//   try {
//     const res = await axios.get("/", {
//       token,
//     });
//     return res;
//   } catch (error) {
//     console.log(error);
//   }
// }
