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

interface WelcomeTemplateProps {
  email: string;
  link: string;
  siteUrl?: string;
}

export const Welcome = ({ email, link, siteUrl }: WelcomeTemplateProps) => (
  <Html>
    <RootWrapper>
      <Head />
      <Preview>欢迎使用星澜！</Preview>
      <Body className="bg-white">
        <ContentWrapper siteUrl={siteUrl}>
          <Heading className="text-gray-900 text-center font-bold m-auto text-xl md:text-2xl">
            欢迎使用星澜！
          </Heading>
          <Section className="py-6 mx-auto font-bold text-center text-gray-900 text-base">
            {email}
          </Section>
          <Text className="text-gray-600 text-center text-sm !mt-0">
            我们非常高兴您能加入！🚀 将您的数据库转变为强大的智能表格，并以您想要的方式管理您的数据 —— 无需编写代码。
          </Text>
          <Text className="text-gray-600 text-center text-sm !mt-0">
            从创建您的第一个项目或探索模板开始，看看有什么可能。
          </Text>
          <Text className="text-gray-600 text-center text-sm !mt-0">
            需要帮助？我们的文档和社区只需点击一下即可。
          </Text>
          <Text className="text-gray-600 text-center text-sm !mt-0 !mb-6">
            让我们一起创造精彩！💡
          </Text>
          <Button
            className="text-center w-full text-base font-bold bg-brand-500 text-white rounded-lg h-10"
            href={link}
          >
            <Text className="!my-[8px]">前往您的工作区</Text>
          </Button>
        </ContentWrapper>
        <Footer />
      </Body>
    </RootWrapper>
  </Html>
);

Welcome.PreviewProps = {
  email: 'user@example.com',
  link: 'https://xinglan.com',
};

export default Welcome;
