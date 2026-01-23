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

interface VerifyYourEmailTemplateProps {
  email: string;
  link: string;
  siteUrl?: string;
}

export const VerifyYourEmail = ({
  email,
  link,
  siteUrl,
}: VerifyYourEmailTemplateProps) => (
  <Html>
    <RootWrapper>
      <Head />
      <Preview>验证您的电子邮箱</Preview>
      <Body className="bg-white">
        <ContentWrapper siteUrl={siteUrl}>
          <Heading className="text-gray-900 text-center font-bold m-auto text-xl md:text-2xl">
            验证您的电子邮箱
          </Heading>
          <Section className="py-6 mx-auto font-bold text-center text-gray-900 text-base">
            {email}
          </Section>
          <Text className="text-gray-600 text-center text-sm !mt-0 !mb-6">
            请验证您的账户以完成注册流程。
          </Text>
          <Button
            className="text-center w-full text-base font-bold bg-brand-500 text-white rounded-lg h-10"
            href={link}
          >
            <Text className="!my-[8px]">验证电子邮箱</Text>
          </Button>
        </ContentWrapper>
        <Footer />
      </Body>
    </RootWrapper>
  </Html>
);

VerifyYourEmail.PreviewProps = {
  email: 'user@example.com',
  link: 'https://xinglan.com',
};

export default VerifyYourEmail;
