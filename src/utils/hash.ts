import bcrypt from 'bcryptjs';

export const hashPassword = async (
  password: string,
) => {
  return await bcrypt.hash(password, 13);
};

export const comparePasswords = async (
  inputPassword: string,
  hashedPassword: string,
) => {
  return await bcrypt.compare(inputPassword, hashedPassword);
};
