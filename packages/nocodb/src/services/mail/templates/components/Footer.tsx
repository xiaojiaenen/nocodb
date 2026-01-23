import { Container, Text } from '@react-email/components';
import * as React from 'react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Container className="px-4">
      <Text className="text-gray-400 text-xs text-center leading-6">
        &copy; {currentYear} 星澜 (XingLan). 保留所有权利。
      </Text>
      <Text className="text-gray-400 text-xs text-center leading-6 mt-2">
        此邮件由系统自动发送，请勿直接回复。
      </Text>
    </Container>
  );
};
