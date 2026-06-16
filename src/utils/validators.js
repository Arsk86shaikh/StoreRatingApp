// src/utils/validators.js

export const validate = {
  required: (value) => (!value || !value.toString().trim() ? 'This field is required' : null),

  email: (value) => {
    if (!value) return 'Email is required';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value) ? null : 'Enter a valid email address';
  },

  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must include at least one uppercase letter';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must include at least one special character';
    return null;
  },

  fullName: (value) => {
    if (!value) return 'Full name is required';
    if (value.length < 20) return 'Name must be at least 20 characters';
    if (value.length > 60) return 'Name must be at most 60 characters';
    return null;
  },

  address: (value) => {
    if (!value) return 'Address is required';
    if (value.length > 400) return 'Address must be at most 400 characters';
    return null;
  },

  storeName: (value) => {
    if (!value) return 'Store name is required';
    if (value.length < 20) return 'Store name must be at least 20 characters';
    if (value.length > 60) return 'Store name must be at most 60 characters';
    return null;
  },

  rating: (value) => {
    const n = Number(value);
    if (!value && value !== 0) return 'Rating is required';
    if (n < 1 || n > 5) return 'Rating must be between 1 and 5';
    return null;
  },
};

export function validateForm(fields, values) {
  const errors = {};
  for (const [field, validator] of Object.entries(fields)) {
    const error = validator(values[field]);
    if (error) errors[field] = error;
  }
  return errors;
}