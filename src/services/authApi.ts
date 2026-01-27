/**
 * Authentication API service
 * Mock implementation for development
 */

export interface SendOtpResponse {
  success: boolean;
  message?: string;
  sessionId?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
}

/**
 * Send OTP to phone number
 * @param phone - Full phone number with country code (e.g., "+919876543210")
 * @returns Promise with response
 */
export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock validation
  if (!phone || phone.length < 10) {
    return {
      success: false,
      message: "Invalid phone number",
    };
  }

  // Mock successful response
  return {
    success: true,
    message: "OTP sent successfully",
    sessionId: `session_${Date.now()}`,
  };
};

/**
 * Verify OTP code
 * @param phone - Full phone number with country code (e.g., "+919876543210")
 * @param otp - 6 digit OTP code
 * @returns Promise with response
 */
export const verifyOtp = async (
  phone: string,
  otp: string
): Promise<VerifyOtpResponse> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock validation - accept "123456" as success
  if (otp === "123456") {
    return {
      success: true,
      message: "OTP verified successfully",
    };
  }

  return {
    success: false,
    message: "Invalid OTP. Please try again.",
  };
};
