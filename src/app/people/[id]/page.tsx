import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, FileText, ClipboardList, StickyNote, FolderOpen, Settings, Building2 } from "lucide-react";
import Link from 'next/link';
import { PersonOverview } from '@/app/people/[id]/components/PersonOverview';
import { PersonSettings } from '@/app/people/[id]/components/PersonSettings';
import { PersonFiles } from '@/app/people/[id]/components/PersonFiles';
import { PersonNotes } from '@/app/people/[id]/components/PersonNotes';
import { PersonRentalApplication } from '@/app/people/[id]/components/PersonRentalApplication';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

interface PersonDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  company_id: string;
  property_id: string;
  unit_id: string | null;
  role: string;
  unit?: {
    unit_number: string;
    property_name?: string;
  } | null;
  status: string | null;
  assignee_id: string | null;
  lead_source: string | null;
  agreement_start: string | null;
  agreement_end: string | null;
  portal_status: boolean;
  address_info?: {
    primary?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
    secondary?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    } | null;
  };
  payments_settings?: {
    enabled: boolean;
    method?: 'email' | 'mail_check';
    billing_email?: string;
  };
}

async function getPersonDetails(id: string): Promise<PersonDetails> {
  try {
    console.log('Fetching person details for ID:', id);
    const supabase = await createClient();
    
    // First get the person details
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('*')
      .eq('id', id)
      .single();

    console.log('Person query result:', { person, error: personError });

    if (personError) {
      console.error('Error fetching person details:', personError);
      notFound();
    }

    if (!person) {
      console.error('No person found with ID:', id);
      notFound();
    }

    // If person has a unit_id, fetch the unit and property details
    let unitDetails = null;
    if (person.unit_id) {
      console.log('Fetching unit details for unit_id:', person.unit_id);
      const { data: units, error: unitError } = await supabase
        .from('units')
        .select('*')
        .eq('unit_id', person.unit_id)
        .single();

      console.log('Unit query result:', { units, error: unitError });

      if (units) {
        unitDetails = {
          unit_number: units.unit_name || units.name || 'Unknown',
          property_name: null
        };
      } else if (unitError?.message) {
        console.error('Error fetching unit details:', unitError.message);
      }
    }

    const personDetails = {
      ...person,
      unit: unitDetails
    };

    console.log('Final person details:', personDetails);

    return personDetails;
  } catch (error) {
    console.error('Unexpected error in getPersonDetails:', error);
    throw error;
  }
}

async function getUserRole(): Promise<string> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return '';
    }

    // Get the user's role from company_members
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('role')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Error fetching company member:', companyError);
      return '';
    }

    return companyMember.role || '';
  } catch (error) {
    console.error('Error getting user role:', error);
    return '';
  }
}

export default async function PersonDetails(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  // Ensure params is treated as a promise and properly awaited
  const id = (await Promise.resolve(params)).id;

  if (!id) {
    notFound();
  }

  const personDetails = await getPersonDetails(id);
  const userRole = await getUserRole();

  return (
    <div className="h-screen flex flex-col">
      <Tabs defaultValue="overview" className="flex flex-col h-full">
        {/* Top section with white background */}
        <div className="bg-card flex-shrink-0">
          <div className="flex flex-col p-6 pb-6">
            <Link href="/people" className="mb-12">
              <Button variant="outline" size="sm" className="gap-2 w-fit">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{`${personDetails.first_name} ${personDetails.last_name}`}</h1>
          </div>

          {/* Tabs navigation */}
          <div className="border-b-2 border-border">
            <ScrollArea>
              <TabsList className="mb-0 h-auto rounded-none bg-transparent py-1 text-foreground">
                <div className="px-6 flex gap-2">
                  <TabsTrigger
                    value="overview"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <User className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Overview
                  </TabsTrigger>
                  {personDetails.role === 'vendor' && (
                    <TabsTrigger
                      value="billing"
                      className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                    >
                      <FileText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                      Billing
                    </TabsTrigger>
                  )}
                  {personDetails.role !== 'owner' && personDetails.role !== 'vendor' && (
                    <TabsTrigger
                      value="rental-application"
                      className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                    >
                      <FileText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                      Rental Application
                    </TabsTrigger>
                  )}
                  {personDetails.role === 'owner' && (
                    <>
                      <TabsTrigger
                        value="properties"
                        className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                      >
                        <Building2 className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                        Properties
                      </TabsTrigger>
                      <TabsTrigger
                        value="transactions"
                        className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                      >
                        <FileText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                        Transactions
                      </TabsTrigger>
                    </>
                  )}
                  {(personDetails.role === 'owner' || personDetails.role === 'vendor' || personDetails.role === 'tenant') && (
                    <TabsTrigger
                      value="tasks"
                      className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                    >
                      <ClipboardList className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                      Tasks
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="notes"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <StickyNote className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger
                    value="files"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <FolderOpen className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Files
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <Settings className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Settings
                  </TabsTrigger>
                </div>
              </TabsList>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            <TabsContent value="overview" className="m-0">
              <PersonOverview personDetails={personDetails} />
            </TabsContent>
            {personDetails.role === 'vendor' && (
              <TabsContent value="billing" className="m-0">
                <div className="text-muted-foreground text-center py-8">
                  Billing content coming soon
                </div>
              </TabsContent>
            )}
            {personDetails.role !== 'owner' && personDetails.role !== 'vendor' && (
              <TabsContent value="rental-application" className="m-0">
                <PersonRentalApplication />
              </TabsContent>
            )}
            {(personDetails.role === 'owner' || personDetails.role === 'vendor' || personDetails.role === 'tenant') && (
              <TabsContent value="tasks" className="m-0">
                <div className="text-muted-foreground text-center py-8">
                  Tasks content coming soon
                </div>
              </TabsContent>
            )}
            {personDetails.role === 'owner' && (
              <>
                <TabsContent value="properties" className="m-0">
                  <div className="text-muted-foreground text-center py-8">
                    Properties content coming soon
                  </div>
                </TabsContent>
                <TabsContent value="transactions" className="m-0">
                  <div className="text-muted-foreground text-center py-8">
                    Transactions content coming soon
                  </div>
                </TabsContent>
              </>
            )}
            <TabsContent value="notes" className="m-0">
              <PersonNotes personId={params.id} />
            </TabsContent>
            <TabsContent value="files" className="m-0">
              <PersonFiles />
            </TabsContent>
            <TabsContent value="settings" className="m-0">
              <PersonSettings personDetails={personDetails} userRole={userRole} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
} 