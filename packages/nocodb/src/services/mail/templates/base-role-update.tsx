import {
  Body,
  Button,
  Column,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import {
  ContentWrapper,
  Footer,
  RootWrapper,
} from '~/services/mail/templates/components';

interface BaseRoleUpdateTemplateProps {
  baseTitle: string;
  oldRole: string;
  newRole: string;
  name: string;
  email: string;
  link: string;
  siteUrl?: string;
}

export const BaseRoleUpdate = ({
  baseTitle,
  email,
  link,
  oldRole,
  newRole,
  name,
  siteUrl,
}: BaseRoleUpdateTemplateProps) => (
  <Html>
    <RootWrapper>
      <Head />
      <Preview>您的项目角色已更新</Preview>
      <Body className="bg-white">
        <ContentWrapper siteUrl={siteUrl}>
          <Heading className="text-gray-900 text-center font-bold m-auto text-xl md:text-2xl">
            您的项目角色已更新
          </Heading>
          <Section className="py-6 text-center font-bold text-gray-900 text-base">
            {baseTitle}
          </Section>
          <Section className="pb-6 text-center">
            <Row align="center">
              <Column className="text-right pr-2">
                <Text className="text-gray-500 text-sm m-0">旧角色</Text>
                <Text className="text-gray-800 font-bold m-0 capitalize">{oldRole}</Text>
              </Column>
              <Column className="w-8 text-center">
                <Text className="text-gray-400 text-xl m-0">➜</Text>
              </Column>
              <Column className="text-left pl-2">
                <Text className="text-gray-500 text-sm m-0">新角色</Text>
                <Text className="text-brand-600 font-bold m-0 capitalize">{newRole}</Text>
              </Column>
            </Row>
          </Section>
          <Text className="text-gray-600 text-center text-sm !mt-0 !mb-6">
            <span className="font-bold text-gray-800">{` ${name}`}</span> (
            {email}) 更新了您在项目
            <span className="font-bold text-gray-800"> {baseTitle} </span> 中的访问权限。
          </Text>
          <Button
            className="text-center w-full text-base font-bold bg-brand-500 text-white rounded-lg h-10"
            href={link}
          >
            <Text className="!my-[8px]">前往项目</Text>
          </Button>
        </ContentWrapper>
        <Footer />
      </Body>
    </RootWrapper>
  </Html>
);

BaseRoleUpdate.PreviewProps = {
  baseTitle: '项目名称',
  oldRole: 'creator',
  newRole: 'editor',
  name: '张三',
  email: 'zhangsan@example.com',
  link: 'https://xinglan.com',
};

export default BaseRoleUpdate;
