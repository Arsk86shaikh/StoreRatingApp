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
  user: '/user/dashboard',
  store_owner: '/owner/dashboard',
};

export const ROLE_OPTIONS = [
  { value: 'user', label: 'Normal User' },
  { value: 'store_owner', label: 'Store Owner' },
  { value: 'admin', label: 'Administrator' },
];
