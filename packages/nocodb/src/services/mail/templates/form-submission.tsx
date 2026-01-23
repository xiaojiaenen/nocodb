import {
  Body,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { UITypes } from 'nocodb-sdk';
import {
  ContentWrapper,
  Footer,
  RootWrapper,
} from '~/services/mail/templates/components';

interface FormSubmissionTemplateProps {
  formTitle: string;
  tableTitle: string;
  baseTitle: string;
  submissionData: Array<{
    parsedValue?: any;
    columnTitle: string;
    uidt: UITypes | string;
  }>;
  siteUrl?: string;
}

const FormSubmission = ({
  formTitle,
  baseTitle,
  tableTitle,
  submissionData,
  siteUrl,
}: FormSubmissionTemplateProps) => (
  <Html>
    <RootWrapper>
      <Head />
      <Preview>您有新的表单提交！</Preview>
      <Body className="bg-white">
        <ContentWrapper disableContainerPadding siteUrl={siteUrl}>
          <Section className="p-6 mx-auto">
            <Heading className="text-gray-900 text-center font-bold m-auto text-xl md:text-2xl">
              您有新的表单提交！
            </Heading>

            <Section
              align="center"
              className="my-6"
              style={{ textAlign: 'center', lineHeight: '28px' }}
            >
              <table
                cellPadding="0"
                cellSpacing="0"
                style={{ display: 'inline-block', verticalAlign: 'middle' }}
              >
                <tr>
                  <td style={{ verticalAlign: 'middle' }}>
                    <span
                      className="text-base font-bold mt-0.5 text-brand-600"
                      style={{
                        verticalAlign: 'middle',
                        display: 'inline-block',
                        lineHeight: '28px',
                      }}
                    >
                      📄 {formTitle}
                    </span>
                  </td>
                </tr>
              </table>
            </Section>

            <Text className="text-center font-weight-thin text-gray-600 !my-0">
              有人提交了您的表单，记录已添加到项目
              <span className="font-bold text-gray-800"> {baseTitle} </span>
              中的表
              <span className="font-bold text-gray-800"> {tableTitle}</span>。
            </Text>
          </Section>

          <Hr className="border-gray-100" />

          <Section className="p-6 mx-auto">
            <Text className="text-lg font-bold text-center !my-0 text-gray-800">
              提交内容详情
            </Text>

            <Section className="mt-6">
              {submissionData.map((item, index) => (
                <Row key={index} className="mb-4">
                  <Column className="py-2 border-b border-gray-50">
                    <Text className="text-xs font-bold text-gray-400 uppercase mb-1">
                      {item.columnTitle}
                    </Text>
                    <Text className="text-sm text-gray-700 m-0">
                      {String(item.parsedValue || '-')}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>
          </Section>
        </ContentWrapper>
        <Footer />
      </Body>
    </RootWrapper>
  </Html>
);

FormSubmission.PreviewProps = {
  formTitle: '表单标题',
  baseTitle: '项目名称',
  tableTitle: '数据表名称',
  submissionData: [
    {
      columnTitle: '姓名',
      parsedValue: '张三',
      uidt: UITypes.SingleLineText,
    },
    {
      columnTitle: '电子邮箱',
      parsedValue: 'zhangsan@example.com',
      uidt: UITypes.Email,
    },
  ],
};

export default FormSubmission;
