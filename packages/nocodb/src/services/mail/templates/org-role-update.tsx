import {
  Body,
  Button,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { NC_EMAIL_ASSETS_BASE_URL } from '~/constants';
import {
  ContentWrapper,
  Footer,
  RootWrapper,
} from '~/services/mail/templates/components';

interface OrganizationRoleUpdateTemplateProps {
  oldRole: string;
  newRole: string;
  name: string;
  email: string;
  link: string;
}

export const OrganizationRoleUpdate = ({
  oldRole,
  newRole,
  email,
  name,
  link,
}: OrganizationRoleUpdateTemplateProps) => (
  <Html>
    <RootWrapper>
      <Head />
      <Preview>您的组织角色已更新</Preview>
      <Body className="bg-white">
        <ContentWrapper>
          <Heading className="text-gray-900 !mb-0 text-center font-bold m-auto text-xl md:text-2xl">
            您的组织角色已更新
          </Heading>
          <Section className="py-6 text-center">
            <Row>
              <Column className="flex max-w-[210px] mx-auto">
                <Img
                  src={`${NC_EMAIL_ASSETS_BASE_URL}/badges/${oldRole}.png`}
                  alt={oldRole}
                  className="h-7"
                />
                <Text className="h-5 text-gray-800 !mt-0.5 !ml-2">➜</Text>
                <Img
                  src={`${NC_EMAIL_ASSETS_BASE_URL}/badges/${newRole}.png`}
                  alt={newRole}
                  className="h-7 ml-2"
                />
              </Column>
            </Row>
          </Section>
          <Text className="text-gray-600 text-center text-sm !mt-0 !mb-6">
            您在星澜中的访问权限已被 <span className="font-bold text-gray-800">{name}</span> ({email}) 更新为
            <span className="font-bold text-gray-800 capitalize">
              {' '}
              {newRole}{' '}
            </span>
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

OrganizationRoleUpdate.PreviewProps = {
  newRole: 'creator',
  oldRole: 'editor',
  email: 'janedoe@nocodb.com',
  name: 'Jane Doe',
  link: 'https://nocodb.com',
};

export default OrganizationRoleUpdate;
