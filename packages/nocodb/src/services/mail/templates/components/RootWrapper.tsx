import { Tailwind } from '@react-email/components';
import * as React from 'react';

export const RootWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Tailwind
      config={{
        theme: {
          fontFamily: {
            sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
          },
          fontSize: {
            xs: ['12px', { lineHeight: '16px' }],
            sm: ['14px', { lineHeight: '20px' }],
            base: ['16px', { lineHeight: '24px' }],
            lg: ['18px', { lineHeight: '28px' }],
            xl: ['20px', { lineHeight: '28px' }],
            '2xl': ['24px', { lineHeight: '32px' }],
            '3xl': ['30px', { lineHeight: '36px' }],
            '4xl': ['36px', { lineHeight: '36px' }],
            '5xl': ['48px', { lineHeight: '1' }],
          },
          spacing: {
            px: '1px',
            0: '0',
            0.5: '2px',
            1: '4px',
            1.5: '6px',
            2: '8px',
            2.5: '10px',
            3: '12px',
            3.5: '14px',
            4: '16px',
            5: '20px',
            6: '24px',
            7: '28px',
            8: '32px',
            9: '36px',
            10: '40px',
            12: '48px',
            16: '64px',
            20: '80px',
            24: '96px',
          },
          extend: {
            colors: {
              brand: {
                50: '#EBF0FF',
                100: '#D6E0FF',
                200: '#ADC2FF',
                300: '#85A3FF',
                400: '#5C85FF',
                500: '#3366FF',
                600: '#2952CC',
                700: '#1F3D99',
                800: '#142966',
                900: '#0A1433',
              },
              gray: {
                50: '#F9FAFB',
                100: '#F3F4F6',
                200: '#E5E7EB',
                300: '#D1D5DB',
                400: '#9CA3AF',
                500: '#6B7280',
                600: '#4B5563',
                700: '#374151',
                800: '#1F2937',
                900: '#111827',
              },
            },
          },
        },
      }}
    >
      {children}
    </Tailwind>
  );
};
