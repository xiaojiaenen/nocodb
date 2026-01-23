import {
  Body,
  Button,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import {
  ContentWrapper,
  Footer,
  RootWrapper,
} from '~/services/mail/templates/components';

interface PasswordResetTemplateProps {
  email: string;
  link: string;
  siteUrl?: string;
}

export const PasswordReset = ({
  email,
  link,
  siteUrl,
}: PasswordResetTemplateProps) => (
  <Html>
    <RootWrapper>
      <Head />
      <Preview>请求重置密码</Preview>
      <Body className="bg-white">
        <ContentWrapper siteUrl={siteUrl}>
          <Heading className="text-gray-900 text-center font-bold m-auto text-xl md:text-2xl">
            请求重置密码
          </Heading>
          <Section className="py-6 mx-auto font-bold text-center text-gray-900 text-base">
            {email}
          </Section>
          <Text className="text-gray-600 text-center text-sm !mt-0 !mb-6">
            您已请求重置密码，请点击“重置密码”按钮以重置您的密码。
          </Text>
          <Button
            className="text-center w-full text-base font-bold bg-brand-500 text-white rounded-lg h-10"
            href={link}
          >
            <Text className="!my-[8px]">重置密码</Text>
          </Button>
        </ContentWrapper>
        <Footer />
      </Body>
    </RootWrapper>
  </Html>
);

PasswordReset.PreviewProps = {
  email: 'user@example.com',
  link: 'https://xinglan.com',
};

export default PasswordReset;
