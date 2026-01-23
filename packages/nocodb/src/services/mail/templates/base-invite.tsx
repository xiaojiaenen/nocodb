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

interface BaseInviteTemplateProps {
  baseTitle: string;
  name: string;
  email: string;
  link: string;
  siteUrl?: string;
}

export const BaseInvite = ({
  baseTitle,
  name,
  email,
  link,
  siteUrl,
}: BaseInviteTemplateProps) => (
  <Html>
    <RootWrapper>
      <Head />
      <Preview>您已被邀请加入项目</Preview>
      <Body className="bg-white">
        <ContentWrapper siteUrl={siteUrl}>
          <Heading className="text-gray-900 text-center font-bold m-auto text-xl md:text-2xl">
            您已被邀请加入项目
          </Heading>
          <Section className="py-6 mx-auto font-bold mx-auto text-center text-gray-900 text-base">
            {baseTitle}
          </Section>
          <Text className="text-gray-600 text-center text-sm !mt-0 !mb-6">
            <span className="font-bold text-gray-800">{name}</span> ({email})
            邀请您在项目{' '}
            <span className="font-bold text-gray-800">{baseTitle}</span> 中进行协作。
          </Text>
          <Button
            className="text-center w-full text-base font-bold bg-brand-500 text-white rounded-lg h-10"
            href={link}
          >
            <Text className="!my-[8px]">接受项目邀请</Text>
          </Button>
        </ContentWrapper>
        <Footer />
      </Body>
    </RootWrapper>
  </Html>
);

BaseInvite.PreviewProps = {
  baseTitle: '项目名称',
  name: '张三',
  email: 'zhangsan@example.com',
  link: 'https://xinglan.com',
};

export default BaseInvite;
