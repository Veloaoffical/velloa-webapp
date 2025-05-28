import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
  } from '@react-email/components';
  import { Tailwind } from '@react-email/tailwind';
  
  interface DeclineRentalApplicationProps {
    propertyName: string;
    unitNumber?: string;
    propertyAddress?: string;
    applicantName: string;
  }
  
  export default function DeclineRentalApplication({
    propertyName,
    unitNumber,
    propertyAddress,
    applicantName,
  }: DeclineRentalApplicationProps) {
    const previewText = `Update Regarding Your Rental Application for ${propertyName}`;
  
    return (
      <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Tailwind>
          <Body className="bg-white font-sans">
            <Container className="mx-auto py-8 px-4">
              <Heading className="text-2xl font-bold text-gray-900 mb-6">
                Application Update
              </Heading>
  
              <Text className="text-gray-700 mb-4">
                Dear {applicantName},
              </Text>
  
              <Text className="text-gray-700 mb-4">
                Thank you for your interest in {propertyName}
                {unitNumber ? ` Unit ${unitNumber}` : ''} 
                {propertyAddress ? ` at ${propertyAddress}` : ''}.
              </Text>
  
              <Text className="text-gray-700 mb-4">
                After careful consideration of your rental application, we regret to inform you that we have decided to proceed with other applicants whose qualifications more closely match our current requirements.
              </Text>
  
              <Text className="text-gray-700 mb-4">
                We appreciate the time you took to apply and wish you the best in your housing search.
              </Text>
  
              <Text className="text-gray-700 mb-8">
                Best regards,<br />
                The Property Management Team
              </Text>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  } 