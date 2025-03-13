import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FaArrowRight } from "react-icons/fa";
import { toast } from "react-toastify";

// Image
import Logo from "../../assets/images/logo.jpeg";
import BackGround from "../../assets/images/bg.jpeg";

// Component
import Loading from "../../components/Loading/Loading";

// API
import { register } from "../../services/AuthServices";

const SignUp = () => {
  // userDTO
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formUserDTO, setFormUserDTO] = useState({
    username: "",
    name: "",
    faculty: "",
    password: "",
  });

  const handleChangeUserDTO = (e) => {
    setFormUserDTO({ ...formUserDTO, [e.target.name]: e.target.value });
  };

  // studentDTO
  // const [studentId, setStudentId] = useState("");
  // const [enrolledCourse, setEnrolledCourse] = useState("");
  // const [major, setMajor] = useState("");

  const [formStudentDTO, setStudentDTO] = useState({
    studentId: "",
    enrolledCourse: "",
    major: "",
  });

  const handleChangeStudentDTO = (e) => {
    setStudentDTO({ ...formStudentDTO, [e.target.name]: e.target.value });
  };

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await register(formUserDTO, formStudentDTO);

      if (response?.data?.statusCode === 200) {
        toast.success(response.data.message);
        navigate("/login");
      }
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
    //       {/* Logo */}
    //       {/* <div className="w-20 md:w-28 mb-4">
    //         <img src={Logo} alt="Logo" />
    //       </div> */}

    //       {/* Title */}
    //       <h1 className="text-2xl md:text-3xl font-secondary font-semibold text-blue-600 mb-2">
    //         Grade Portal Of HCMUT
    //       </h1>
    //       <p className="text-sm text-gray-600 mb-6">
    //         Please enter your information
    //       </p>

    //       {/* Form */}
    //       <form className="flex flex-col gap-4 w-full" onSubmit={handleSignup}>
    //         <input
    //           className="p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition"
    //           name="username"
    //           type="text"
    //           placeholder="Email"
    //           value={formUserDTO.username}
    //           onChange={handleChangeUserDTO}
    //           required
    //         />

    //         <input
    //           className="p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition"
    //           name="name"
    //           type="text"
    //           placeholder="Name"
    //           value={formUserDTO.name}
    //           onChange={handleChangeUserDTO}
    //           required
    //         />

    //         <div className="flex flex-row space-x-4">
    //           <input
    //             className="p-3 border w-[100%] border-gray-300 rounded-lg outline-none focus:border-blue-500 transition"
    //             name="faculty"
    //             type="text"
    //             placeholder="Faculty"
    //             value={formUserDTO.faculty}
    //             onChange={handleChangeUserDTO}
    //             required
    //           />

    //           <input
    //             className="p-3 border w-[100%] border-gray-300 rounded-lg outline-none focus:border-blue-500 transition"
    //             name="major"
    //             type="text"
    //             placeholder="Major"
    //             value={formStudentDTO.major}
    //             onChange={handleChangeStudentDTO}
    //             required
    //           />
    //         </div>

    //         <div className="flex flex-row space-x-4">
    //           <input
    //             className="p-3 border w-[100%] border-gray-300 rounded-lg outline-none focus:border-blue-500 transition"
    //             name="studentId"
    //             type="number"
    //             placeholder="Student ID"
    //             value={formStudentDTO.studentId}
    //             onChange={handleChangeStudentDTO}
    //             required
    //           />

    //           <input
    //             className="p-3 border w-[100%] border-gray-300 rounded-lg outline-none focus:border-blue-500 transition"
    //             name="enrolledCourse"
    //             type="number"
    //             placeholder="Intake"
    //             value={formStudentDTO.enrolledCourse}
    //             onChange={handleChangeStudentDTO}
    //             required
    //           />
    //         </div>

    //         <div className="relative">
    //           <input
    //             className="p-3 w-full border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition"
    //             name="password"
    //             type={showPassword ? "text" : "password"}
    //             placeholder="Password"
    //             value={formUserDTO.password}
    //             onChange={handleChangeUserDTO}
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

    //         <button className="group bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-medium flex items-center justify-center transition-all shadow-md">
    //           <span>Sign in</span>
    //           <FaArrowRight className="ml-2 transition-transform group-hover:translate-x-2" />
    //         </button>
    //       </form>

    //       {/* OR LOGIN WITH */}
    //       <div className="my-4 text-gray-500 text-sm">- OR LOGIN WITH -</div>

    //       {/* Google Login */}
    //       <button className="bg-white border border-gray-300 p-2 rounded-full flex justify-center items-center text-sm hover:shadow-md transition-transform duration-300">
    //         <img src={GoogleImg} alt="Google" className="h-6" />
    //       </button>

    //       {/* Sign Up Link */}
    //       <div className="mt-5 text-xs flex justify-center items-center">
    //         <span className="text-gray-600 mr-1">
    //           {"Already have an account?"}
    //         </span>
    //         <button
    //           onClick={() => navigate("/login")}
    //           className="text-blue-600 hover:underline"
    //         >
    //           Login
    //         </button>
    //       </div>
    //     </div>
    //   </div>
    // </div>

    <>
      <div className="flex flex-row max-h-screen overflow-hidden relative">
        <div className="w-[867px]">
          <img
            src={BackGround}
            alt="background signup"
            className="w-full object-cover"
          />
        </div>
        <div className="w-[571px]">
          {/* Logo  */}
          <div className="mt-[50px] flex flex-row items-center justify-center">
            <img src={Logo} alt="logo" className="w-[80px]" />
            <div className="flex font-quicksand font-bold text-[32px]">
              <p className="text-[#2AF598]">Green</p>
              <p className="text-[#08AEEA]">Tech</p>
            </div>
          </div>
        </div>

        {/* Form signup  */}
        <div
          className="absolute top-1/2 left-1/2 bg-white transform -translate-x-1/2 -translate-y-1/2
            w-[532px] h-[618px] px-[95px] py-[28px] rounded-[10px] border border-black 
            shadow-[6px_6px_0px_0px_#9CDBA6] font-poppins"
        >
          {/* Title  */}
          <div className=" font-semibold ">
            <div className="text-[48px] text-[#52ACFF]">Sign Up</div>
            <div className="text-[24px] bg-gradient-to-t from-black/60 to-black/60 bg-clip-text text-transparent">
              To Create Your Account
            </div>
          </div>

          {/* Form */}
          <form
            className="flex flex-col w-full mt-[45px]"
            onSubmit={handleSignup}
          >
            <div>
              <div className="text-[#013220] text-[14px] font-normal">
                E-mail
              </div>
              <input
                className="p-3 w-full border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition"
                name="email"
                type="text"
                placeholder="Enter E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="text-[#013220] text-[14px] font-normal mt-[13px]">
              Password
            </div>
            <div className="relative">
              <input
                className="p-3 w-full border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <AiFillEye size={20} />
                ) : (
                  <AiFillEyeInvisible size={20} />
                )}
              </div>
            </div>

            <div className="text-[#013220] text-[14px] font-normal mt-[13px]">
              Confirm Password
            </div>
            <div className="relative">
              <input
                className="p-3 w-full border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition"
                name="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <AiFillEye size={20} />
                ) : (
                  <AiFillEyeInvisible size={20} />
                )}
              </div>
            </div>

            {/* Button  */}
            <div className="flex items-center justify-center">
              <button
                className="mt-[42px] bg-[#0D986A] rounded-[20px] px-[40px] py-[20px] shadow-[0px_8px_28px_0px_#4F756980]
              text-[19px] text-white font-medium w-[300px] hover:opacity-80"
              >
                Sign Up
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-[26px] text-[15px] font-normal flex justify-center items-center">
            <span className="text-[#AFAFAF] mr-1">
              {"Already have an account?"}
            </span>
            <button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-t from-[#0D986A] to-[#0D986A] bg-clip-text text-transparent"
            >
              <div className="hover:underline decoration-[#013220]">Login</div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;
