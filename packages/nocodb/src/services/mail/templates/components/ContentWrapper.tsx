import { Container, Hr, Img, Section, Text } from '@react-email/components';
import * as React from 'react';

export const ContentWrapper = ({
  children,
  disableContainerPadding,
  siteUrl,
}: {
  children: React.ReactNode;
  disableContainerPadding?: boolean;
  siteUrl?: string;
}) => {
  return (
    <Container className="px-4 mt-8 max-w-[600px]">
      {/* Header with Logo and Brand Name */}
      <Section className="py-8 text-center bg-white border border-gray-100 border-solid rounded-t-2xl shadow-sm">
        <Section className="inline-block">
          <table align="center" border={0} cellPadding="0" cellSpacing="0" role="presentation">
            <tr>
              <td align="center" style={{ verticalAlign: 'middle' }}>
                {siteUrl ? (
                  <Img
                    alt="Logo"
                    src={`${siteUrl}/logo.svg`}
                    width={40}
                    height={40}
                    className="mx-auto"
                  />
                ) : (
                  <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">X</span>
                  </div>
                )}
              </td>
              <td style={{ verticalAlign: 'middle', paddingLeft: '12px' }}>
                <Text className="text-2xl font-bold text-gray-800 m-0 leading-none">星澜</Text>
              </td>
            </tr>
          </table>
        </Section>
        <Text className="text-gray-500 text-sm mt-2 mb-0">无代码数字化转型平台</Text>
      </Section>

      {/* Main Content Area */}
      <Section
        className={`border border-gray-100 border-solid border-t-0 rounded-b-2xl bg-white shadow-sm ${
          disableContainerPadding ? 'p-0' : 'p-8 md:p-12'
        }`}
      >
        {children}
      </Section>

      <Hr className="my-12 border-gray-200" />
    </Container>
  );
};
