import * as React from 'react';
import {
  Body,
  Button,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import {
  ContentWrapper,
  Footer,
  RootWrapper,
} from '~/services/mail/templates/components';

interface OrganizationInviteTemplateProps {
  name: string;
  email: string;
  link: string;
  siteUrl?: string;
}

export const OrganizationInvite = ({
  name,
  email,
  link,
  siteUrl,
}: OrganizationInviteTemplateProps) => (
  <Html>
    <RootWrapper>
      <Head />
      <Preview>您已被邀请加入星澜</Preview>
      <Body className="bg-white">
        <ContentWrapper siteUrl={siteUrl}>
          <Heading className="text-gray-900 text-center font-bold m-auto text-xl md:text-2xl">
            您已被邀请加入星澜
          </Heading>
          <Text className="text-gray-600 text-center !my-6 text-sm">
            <span className="font-bold text-gray-800">{name}</span> ( {email})
            邀请您在星澜上进行协作。
          </Text>
          <Button
            className="text-center w-full text-base font-bold bg-brand-500 text-white rounded-lg h-10"
            href={link}
          >
            <Text className="!my-[8px]">前往星澜</Text>
          </Button>
        </ContentWrapper>
        <Footer />
      </Body>
    </RootWrapper>
  </Html>
);

OrganizationInvite.PreviewProps = {
  name: '张三',
  email: 'zhangsan@example.com',
  link: 'https://xinglan.com',
};

export default OrganizationInvite;
