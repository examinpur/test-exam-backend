import User from '../../../models/authModel';

const registerUser = async (userPhoneNumber: string) => {
  try {

  } catch (error: any) {
    console.error(
      'Error occurred while registering new user:',
      error?.message || error?.response?.error || error?.response || error,
    );

    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while registering new user',
    };
  }
}