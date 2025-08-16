// app/context/AuthContext.tsx
"use client";
import React from 'react';

// Removed: No authentication required. This context is deprecated.
export const AuthProvider = ({ children }: { children: React.ReactNode }) => children;
export const useAuth = () => ({ isAuthenticated: true, loading: false, login: () => {}, logout: () => {} });
// Deprecated: AuthContext is no longer used. File intentionally left blank.
