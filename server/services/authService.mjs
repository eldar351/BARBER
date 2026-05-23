import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.mjs';
import { findAdminByEmail, findAdminById } from '../repositories/adminRepo.mjs';

export async function loginAdmin(email, password) {
  const admin = await findAdminByEmail(email);
  if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) return null;
  const token = jwt.sign({ sub: admin.id, email: admin.email }, config.jwtSecret, { expiresIn: '7d' });
  return { token, admin: { id: admin.id, email: admin.email } };
}

export async function verifyAdminToken(token) {
  const payload = jwt.verify(token, config.jwtSecret);
  return findAdminById(payload.sub);
}
