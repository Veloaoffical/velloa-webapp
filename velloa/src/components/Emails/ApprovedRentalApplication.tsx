import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
  } from '@react-email/components';
  import * as React from 'react';
  
  interface ApplicationSubmittedEmailProps {
    firstName?: string;
    lastName?: string;
    CompanyName?: string;
    propertyAddress?: string;
    unitNumber?: string;
  }
  
  export const ApplicationSubmittedEmail = ({
    firstName = "No Name",
    lastName = "No Name",
    CompanyName = "",
    propertyAddress = "",
    unitNumber = "",
  }: ApplicationSubmittedEmailProps) => {
    return (
      <Html>
        <Head />
        <Preview>Good News - Your Rental Application Has Been Accepted!</Preview>
        <Body style={main}>
          <Container style={container}>
            <div style={{ textAlign: 'center' as const, marginBottom: '40px' }}>
              <Img
                src="https://wjimlmhgabvojfoutcrq.supabase.co/storage/v1/object/public/%20%20%20%20email:%20formData.get('email')%20as%20string,/VelloaMain.png"
                width="250"
                height="83"
                alt={CompanyName}
                style={headerImage}
                draggable={false}
              />
            </div>
            
            <Section style={section}>
              <Text style={title}>Congratulations - Application Approved!</Text>
              
              <Text style={text}>
                Dear {firstName} {lastName},
              </Text>
              
              <Text style={text}>
                We are pleased to inform you that your rental application for {unitNumber ? `Unit ${unitNumber} at ` : ''}{propertyAddress} has been approved! We are excited to welcome you as our new tenant.
              </Text>
  
              <Text style={text}>
                Our team is currently preparing your lease agreement and you will receive it via email shortly. Please review it carefully when you receive it, as it will contain important information about your tenancy, including move-in details and payment instructions.
              </Text>
  
              <Text style={text}>
                Best regards,
              </Text>
              <Text style={text}>
                Team {CompanyName}
              </Text>
  
            </Section>
  
            <Section style={downloadSection}>
              <Text style={downloadTitle}>Get our mobile app</Text>
              <Text style={downloadText}>
                Pay your rent, submit maintenance requests, and manage your tenancy easily with our mobile app
              </Text>
              
              <Section style={storeButtons}>
                <Link href="https://apps.apple.com/ca/app/velloa/id15908324/" style={storeButton}>
                  <Img
                    src="https://wjimlmhgabvojfoutcrq.supabase.co/storage/v1/object/public/%20%20%20%20email:%20formData.get('email')%20as%20string,/IOSApp.png"
                    width="135"
                    height="40"
                    alt="Download on the App Store"
                    style={storeImage}
                    draggable={false}
                  />
                </Link>
                <Link href="https://play.google.com/store/apps/details?id=com.velloa.app" style={storeButton}>
                  <Img
                    src="https://wjimlmhgabvojfoutcrq.supabase.co/storage/v1/object/public/%20%20%20%20email:%20formData.get('email')%20as%20string,/GoogleApp.png"
                    width="135"
                    height="40"
                    alt="Get it on Google Play"
                    style={storeImage}
                    draggable={false}
                  />
                </Link>
              </Section>
            </Section>
  
            <Hr style={hr} />
  
            <Text style={footer}>
              © {new Date().getFullYear()} Velloa Inc., Toronto, ON | {' '}
              <Link href="https://www.velloa.ca" style={link}>
                www.velloa.ca
              </Link>
            </Text>
  
            <Section style={socialLinks}>
              <Link href="https://www.facebook.com/people/Velloa/61568996534029/" style={socialLink}>
                <Img
                  src="https://wjimlmhgabvojfoutcrq.supabase.co/storage/v1/object/public/%20%20%20%20email:%20formData.get('email')%20as%20string,/facebook.png"
                  width="24"
                  height="24"
                  alt="Facebook"
                  style={iconStyle}
                />
              </Link>
              <Link href="https://www.instagram.com/velloaofficial/" style={socialLink}>
                <Img
                  src="https://wjimlmhgabvojfoutcrq.supabase.co/storage/v1/object/public/%20%20%20%20email:%20formData.get('email')%20as%20string,/instagram.png"
                  width="24"
                  height="24"
                  alt="Instagram"
                  style={iconStyle}
                />
              </Link>
              <Link href="https://www.tiktok.com/@velloaofficial" style={socialLink}>
                <Img
                  src="https://wjimlmhgabvojfoutcrq.supabase.co/storage/v1/object/public/%20%20%20%20email:%20formData.get('email')%20as%20string,/tiktok.png"
                  width="24"
                  height="24"
                  alt="TikTok"
                  style={iconStyle}
                />
              </Link>
              <Link href="https://www.linkedin.com/company/103679186" style={socialLink}>
                <Img
                  src="https://wjimlmhgabvojfoutcrq.supabase.co/storage/v1/object/public/%20%20%20%20email:%20formData.get('email')%20as%20string,/linkedin.png"
                  width="24"
                  height="24"
                  alt="LinkedIn"
                  style={iconStyle}
                />
              </Link>
            </Section>
  
            <Link href="https://www.velloa.ca/unsubscribe" style={unsubscribeLink}>
              Unsubscribe from our emails
            </Link>
          </Container>
        </Body>
      </Html>
    );
  };
  
  const main = {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  };
  
  const container = {
    margin: '0 auto',
    padding: '40px 0 48px',
    width: '580px',
  };
  
  const section = {
    padding: '40px 0',
  };
  
  const title = {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.3',
    margin: '16px 0',
    color: '#4CAF50',
  };
  
  const text = {
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#484848',
  };
  
  const downloadSection = {
    textAlign: 'center' as const,
    padding: '24px 0',
  };
  
  const downloadTitle = {
    fontSize: '20px',
    fontWeight: '600',
    margin: '16px 0',
    color: '#4CAF50',
  };
  
  const downloadText = {
    fontSize: '16px',
    color: '#666666',
    margin: '8px 0 16px',
  };
  
  const storeButtons = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    margin: '20px auto',
    width: 'fit-content',
    padding: '0',
  };
  
  const storeButton = {
    display: 'inline-flex',
    textDecoration: 'none',
    margin: '0',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
  };
  
  const footer = {
    color: '#666666',
    fontSize: '12px',
    textAlign: 'center' as const,
  };
  
  const link = {
    color: '#2563EB',
    textDecoration: 'underline',
  };
  
  const unsubscribeLink = {
    color: '#666666',
    fontSize: '12px',
    textDecoration: 'underline',
    textAlign: 'center' as const,
    display: 'block',
    marginTop: '12px',
  };
  
  const headerImage = {
    marginBottom: '50px',
    width: '250px',
    height: 'auto',
    objectFit: 'contain' as const,
    pointerEvents: 'none' as const,
    margin: '0 auto',
    display: 'block',
  };
  
  const storeImage = {
    width: '160px',
    height: '48px',
    display: 'block',
    objectFit: 'contain' as const,
    pointerEvents: 'none' as const,
  };
  
  const socialLinks = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '24px',
    margin: '20px auto',
    width: 'fit-content',
    padding: '0',
  };
  
  const socialLink = {
    display: 'inline-flex',
    textDecoration: 'none',
    color: '#4CAF50',
    margin: '0',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  const iconStyle = {
    width: '24px',
    height: '24px',
    pointerEvents: 'none' as const,
    display: 'block',
    filter: 'invert(58%) sepia(83%) saturate(385%) hue-rotate(84deg) brightness(92%) contrast(89%)',
  };
  
  export default ApplicationSubmittedEmail; 