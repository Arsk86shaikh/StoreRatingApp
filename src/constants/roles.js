// src/constants/roles.js
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  STORE_OWNER: 'store_owner',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  user: 'Normal User',
  store_owner: 'Store Owner',
};

export const ROLE_HOME = {
  admin: '/admin/dashboard',
  user: '/',
  store_owner: '/store/dashboard',
};