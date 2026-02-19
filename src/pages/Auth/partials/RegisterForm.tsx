import { z } from "zod";
import { useState, useRef, useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { authService } from "../../../services/authService";
import { toast } from "sonner";
import { Loader2, Lock, Mail, User, CheckCircle } from "lucide-react";

interface RegisterFormProps {
  onSwitch: () => void;
}

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, { message: "Full name is too short" }),
    username: z
      .string()
      .regex(/^[a-z0-9_]+$/, {
        message:
          "Username can only contain lowercase letters, numbers, and underscores",
      })
      .min(2, { message: "Username is too short" })
      .max(12, { message: "Username is too long" })
      .transform((val) => val.toLocaleLowerCase()),
    email: z.email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(15, { message: "Password too lengthy. Must be below 15 letters." })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/, {
        message:
          "Password must contain one number, one lowercase and one uppercase letter, and one special character.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitch }) => {
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const emailValue = watch("email");

  // Reset OTP verification if email changes
  useEffect(() => {
    if (isOtpVerified) {
      setIsOtpVerified(false);
      setOtp(new Array(6).fill(""));
    }
  }, [emailValue]);

  const sendOtpMutation = useMutation({
    mutationFn: authService.sendOtp,
    onSuccess: () => {
      toast.success("OTP sent to your email!");
    },
    onError: (error) => {
      const msg =
        (error as AxiosError<{ message: string }>).response?.data?.message ||
        "Failed to send OTP";
      toast.error(msg);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (otpCode: string) => {
      await authService.verifyOtp({ email: emailValue, otp: otpCode });
    },
    onSuccess: () => {
      setIsOtpVerified(true);
      toast.success("OTP Verified Successfully!");
    },
    onError: () => {
      toast.error("Invalid OTP. Please try again.");
      setOtp(new Array(6).fill(""));
      if (otpRefs.current[0]) otpRefs.current[0].focus();
    },
  });

  const handleSendOtp = async () => {
    const isEmailValid = await trigger("email");
    if (!isEmailValid) {
      toast.error("Please enter a valid email address first.");
      return;
    }
    sendOtpMutation.mutate(emailValue);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    const code = newOtp.join("");
    if (code.length === 6 && newOtp.every((char) => char !== "")) {
      verifyOtpMutation.mutate(code);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0 &&
      otpRefs.current[index - 1]
    ) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      onSwitch();
      toast.success("Account created! You can now sign in!");
    },
    onError: (error) => {
      const msg =
        (error as AxiosError<{ message: string }>).response?.data?.message ||
        "Registration failed";
      toast.error(msg);
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    if (!isOtpVerified) {
      toast.error("Please verify your email first!");
      return;
    }
    mutation.mutate(data);
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-dark mb-2">Create Your Account</h2>
      <p className="text-gray-500 text-sm mb-8">Join our community</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label
            htmlFor="fullName"
            className="block text-gray-700 mb-2 text-sm"
          >
            Full Name
          </label>
          <div className="relative mb-2">
            <User className="absolute insset-y-0 left-3 size-5 text-gray-400 top-1/2 -translate-y-1/2" />
            <input
              {...register("fullName")}
              className="text-sm w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="John Doe"
            />
          </div>
          {errors.fullName && (
            <p className="text-red-500 text-sm">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="username"
            className="block text-gray-700 mb-2 text-sm"
          >
            UserName
          </label>
          <div className="relative mb-2">
            <User className="absolute insset-y-0 left-3 size-5 text-gray-400 top-1/2 -translate-y-1/2" />
            <input
              {...register("username")}
              className="text-sm w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="johndoe"
            />
          </div>
          {errors.username && (
            <p className="text-red-500 text-sm">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-gray-700 mb-2 text-sm">
            Email
          </label>
          <div className="relative mb-2">
            <Mail className="absolute insset-y-0 left-3 size-5 text-gray-400 top-1/2 -translate-y-1/2" />
            <input
              {...register("email")}
              type="email"
              className="text-sm w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-gray-700 mb-2 text-sm"
          >
            Password
          </label>
          <div className="relative mb-2">
            <Lock className="absolute insset-y-0 left-3 size-5 text-gray-400 top-1/2 -translate-y-1/2" />
            <input
              {...register("password")}
              type="password"
              className="text-sm w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="******"
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-gray-700 mb-2 text-sm"
          >
            Confirm Password
          </label>
          <div className="relative mb-2">
            <Lock className="absolute insset-y-0 left-3 size-5 text-gray-400 top-1/2 -translate-y-1/2" />
            <input
              {...register("confirmPassword")}
              type="password"
              className="text-sm w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="******"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 text-sm flex items-center">
              One-Time Password (OTP)
              {isOtpVerified && (
                <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
              )}
            </label>
            {!isOtpVerified && (
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={sendOtpMutation.isPending || !emailValue}
              >
                {sendOtpMutation.isPending ? "Sending..." : "Get OTP"}
              </button>
            )}
          </div>
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                title="OTP Box"
                key={index}
                ref={(el) => {
                  otpRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isOtpVerified || verifyOtpMutation.isPending}
                className={`w-10 h-10 text-center border rounded-lg focus:outline-none focus:ring-2 text-lg font-semibold ${
                  isOtpVerified
                    ? "border-green-500 text-green-600 bg-green-50"
                    : "border-gray-300 focus:ring-primary"
                }`}
              />
            ))}
          </div>
          {verifyOtpMutation.isPending && (
            <p className="text-xs text-gray-500 mt-1">Verifying OTP...</p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !isOtpVerified}
          className="mt-4 w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition duration-300 flex justify-center items-center"
        >
          {mutation.isPending ? (
            <Loader2 className="animate-spin size-5" />
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="text-center text-sm mt-4">
        <span className="text-gray-600">Already have an account? </span>
        <span
          onClick={onSwitch}
          className="text-primary font-medium cursor-pointer hover:underline"
        >
          Sign In
        </span>
      </div>
    </>
  );
};

export default RegisterForm;
