import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

import { toast } from "react-toastify";

// Image
import Logo from "../../assets/images/logo.jpeg";
import BackgroundLogin from "../../assets/images/bg-login.png";

// Component
import Loading from "../../components/Loading/Loading";

// API
import { login } from "../../services/AuthServices";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await login(email, password);

      if (response?.data?.statusCode === 200) {
        localStorage.setItem("token", response.data.token);
        toast.success(response.data.message);
        navigate("/");
      }

      // console.log(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <>
        <Loading></Loading>
      </>
    );

  return (
    // <div className="bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center h-screen px-4">
    //   <div className="bg-white shadow-2xl rounded-2xl w-full max-w-sm md:max-w-md p-8">
    //     <div className="flex flex-col items-center">
    //       {/* Title */}
    //       <h1 className="text-2xl md:text-3xl font-secondary font-semibold text-blue-600 mb-2">
    //         Grade Portal Of HCMUT
    //       </h1>
    //       <p className="text-sm text-gray-600 mb-6">
    //         Please login or sign up to continue
    //       </p>

    //       {/* Form */}
    //       <form className="flex flex-col gap-4 w-full" onSubmit={handleLogin}>
    //         <input
    //           className="p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition"
    //           name="email"
    //           type="text"
    //           placeholder="Email"
    //           value={email}
    //           onChange={(e) => setEmail(e.target.value)}
    //           required
    //         />

    //         <div className="relative">
    //           <input
    //             className="p-3 w-full border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition"
    //             name="password"
    //             type={showPassword ? "text" : "password"}
    //             placeholder="Password"
    //             value={password}
    //             onChange={(e) => setPassword(e.target.value)}
    //             required
    //             autoComplete="current-password"
    //           />
    //           <div
    //             className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
    //             onClick={() => setShowPassword(!showPassword)}
    //           >
    //             {showPassword ? (
    //               <AiFillEye size={20} />
    //             ) : (
    //               <AiFillEyeInvisible size={20} />
    //             )}
    //           </div>
    //         </div>

    //         <Link
    //           to="/forgot-password"
    //           className="text-xs text-blue-500 hover:underline mb-4"
    //         >
    //           Forgot Password?
    //         </Link>

    //         <button className="group bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-medium flex items-center justify-center transition-all shadow-md">
    //           <span>Log In</span>
    //         </button>
    //       </form>

    //       {/* Sign Up Link */}
    //       <div className="mt-5 text-xs flex justify-center items-center">
    //         <span className="text-gray-600 mr-1">
    //           {"Don't have an account?"}
    //         </span>
    //         <button
    //           onClick={() => navigate("/sign-up")}
    //           className="text-blue-600 hover:underline"
    //         >
    //           Create an account
    //         </button>
    //       </div>
    //     </div>
    //   </div>
    // </div>

    <>
      <div className="flex flex-row max-h-screen overflow-hidden">
        {/* Left side */}
        <div className="w-[595px]">
          {/* Logo  */}
          <div className="mt-[80px]">
            <img src={Logo} alt="logo" className="w-[80px] ml-[100px]" />
            <div className="flex font-quicksand font-bold text-[32px] ml-[60px]">
              <p className="text-[#2AF598]">Green</p>
              <p className="text-[#08AEEA]">Tech</p>
            </div>
          </div>

          {/* Welcome  */}
          <div className="font-roboto ml-[60px] mt-[109px]">
            <p className="text-[56px] font-bold">Welcome Back!</p>
            <p className="text-[18px] font-normal mt-[32px]">
              Log in to access your account and explore our latest features.
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="relative font-poppins">
          <img
            src={BackgroundLogin}
            alt="background login"
            className="object-cover"
          />

          {/* Form login */}
          <div
            className="absolute top-1/2 left-1/2 bg-white transform -translate-x-1/2 -translate-y-1/2
            w-[532px] h-[598px] px-[80px] py-[40px] rounded-[10px] border border-black 
            shadow-[6px_6px_0px_0px_#9CDBA6]"
          >
            {/* Title  */}
            <div className=" font-semibold ">
              <div className="text-[48px] text-[#52ACFF]">Login</div>
              <div className="text-[24px] bg-gradient-to-t from-black/60 to-black/60 bg-clip-text text-transparent">
                To Your Account
              </div>
            </div>

            {/* Form */}
            <form
              className="flex flex-col w-full mt-[25px]"
              onSubmit={handleLogin}
            >
              <div className="h-[70px] rounded-[10px] bg-[#F5F5F5] border-b-[2px] border-[#063] pt-[10px] px-[24px]">
                <div className=" text-[13px] text-[#A4A4A4]">User Name</div>
                <input
                  className="w-full bg-[#F5F5F5] outline-none"
                  name="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative mt-[30px] h-[70px] rounded-[10px] bg-[#F5F5F5] border-b-[2px] border-[#063] pt-[10px] px-[24px]">
                <div className=" text-[13px] text-[#A4A4A4]">Password</div>
                <input
                  className="w-full bg-[#F5F5F5] outline-none"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <AiFillEye size={24} />
                  ) : (
                    <AiFillEyeInvisible size={24} />
                  )}
                </div>
              </div>

              <Link
                to="/forgot-password"
                className="mt-[22px] text-[17px] font-normal bg-gradient-to-t from-[#013220] to-[#016734] bg-clip-text text-transparent
                flex justify-end"
              >
                <div className="hover:underline decoration-[#013220]">
                  Forgot Password?
                </div>
              </Link>

              {/* Button  */}
              <div className="flex items-center justify-center">
                <button
                  className="mt-[30px] bg-[#0D986A] rounded-[20px] px-[40px] py-[20px] shadow-[0px_8px_28px_0px_#4F756980]
              text-[19px] text-white font-medium w-[300px] hover:opacity-80"
                >
                  Log In
                </button>
              </div>
            </form>

            {/* Sign Up Link */}
            <div className="mt-[38px] text-[15px] font-normal flex justify-center items-center">
              <span className="text-[#AFAFAF] mr-1">
                {"Don't have an account?"}
              </span>
              <button
                onClick={() => navigate("/sign-up")}
                className="bg-gradient-to-t from-[#0D986A] to-[#0D986A] bg-clip-text text-transparent"
              >
                <div className="hover:underline decoration-[#013220]">
                  Create an account
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
