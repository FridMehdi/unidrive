// components/ThemedText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
  className?: string;
  color?: string;
  children: React.ReactNode;
}

export default function ThemedText({ className = '', color = 'text-text', children, ...props }: ThemedTextProps) {
  return (
    <Text
      className={`${color} ${className}`}
      {...props}
    >
      {children}
    </Text>
  );
}
