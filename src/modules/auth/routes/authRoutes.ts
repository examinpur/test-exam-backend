import { Router } from 'express';
import authController from '../controller/authController';

const router = Router();

router.post(
  '/register',
  authController.registerUser,
);

router.post(
  '/login',
  authController.loginUser,
);

router.patch(
  '/update-user',
  authController.updateUserDetails,
);

router.post(
  '/send-otp/email',
  authController.sendOtpToEmail,
);

router.post(
  '/verify/email',
  authController.verifyEmail,
);

router.post(
  '/send-otp/phone',
  authController.sendOtpToPhone,
);

router.post(
  '/verify/phone',
  authController.verifyPhone,
);

router.patch(
  '/update-password/verify',
  authController.updatePasswordAfterVerification,
);

router.patch(
  '/:userId/reset-password',
  authController.resetPassword,
);

router.get(
  '/:userId',
  authController.getUserDetails,
);

router.delete(
  '/:userId',
  authController.deleteUser,
);

export default router;
