import {
    Body,
    Button,
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
    name?: string;
    address?: string;
    CompanyName?: string;
  }
  
  export const ApplicationSubmittedEmail = ({
    name = "No Name",
    CompanyName = "Velloa",
  }: ApplicationSubmittedEmailProps) => {
    return (
      <Html>
        <Head />
        <Preview>Complete your application for {CompanyName}</Preview>
        <Body style={main}>
          <Container style={container}>
            <Img
              src="https://wjimlmhgabvojfoutcrq.supabase.co/storage/v1/object/public/%20%20%20%20email:%20formData.get('email')%20as%20string,/VelloaMain.png"
              width="250"
              height="83"
              alt="Velloa"
              style={headerImage}
              draggable={false}
            />
            
            <Section style={section}>
              <Text style={title}>Welcome to {CompanyName} Property Management Platform</Text>
              
              <Text style={text}>
                Dear {name},
              </Text>
              
              <Text style={text}>
                Your property management dashboard is ready! Access real-time insights about your properties, including revenue tracking, expense management, and occupancy rates. Our platform helps you make data-driven decisions to maximize your investment returns.
              </Text>
  
              <Button style={button} href="https://www.velloaapp.com">
                Access Dashboard
              </Button>
  
              <Text style={text}>
                Here&apos;s what you can monitor in your dashboard:
              </Text>
  
              <ul style={listStyle}>
                <li style={listItem}>Monthly revenue and profit analytics</li>
                <li style={listItem}>Expense tracking and categorization</li>
                <li style={listItem}>Occupancy rates and tenant turnover</li>
                <li style={listItem}>Maintenance costs and property value trends</li>
              </ul>
  
      
            </Section>
  
            <Section style={downloadSection}>
              <Text style={downloadTitle}>Get our mobile app</Text>
              <Text style={downloadText}>
                Complete your application on the go and track your rental journey from anywhere
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
              <Link href="https://www.velloaapp.com" style={link}>
                www.velloaapp.com
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
  
            <Link href="#" style={unsubscribeLink}>
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
  
  const button = {
    backgroundColor: '#4CAF50',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 20px',
    margin: '24px 0',
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
  
  const listStyle = {
    listStyleType: 'disc',
    paddingLeft: '20px',
  };
  
  const listItem = {
    fontSize: '16px',
    color: '#484848',
    marginBottom: '8px',
  };
  
  const headerImage = {
    marginBottom: '50px',
    width: '250px',
    height: 'auto',
    objectFit: 'contain' as const,
    pointerEvents: 'none' as const,
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