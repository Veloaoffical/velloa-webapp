import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, DollarSign, StickyNote, Calendar, FileText, Wallet, Building2, ShieldCheck, AlertCircle } from "lucide-react";
import { useState } from "react";

interface OverviewContentProps {
  leaseDetails: {
    tenant: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    } | null;
    start_date: string | null;
    end_date: string | null;
    rent_amount: string | null;
    lease_type: string | null;
    deposit_amount: string | null;
    unit_id?: string | null;
    property?: {
      name: string;
    } | null;
    unit?: {
      unit_name: string;
    } | null;
  };
}

export function OverviewContent({ leaseDetails }: OverviewContentProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement payment submission
    setIsPaymentDialogOpen(false);
  };

  const handleNoteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement note submission
    setIsNoteDialogOpen(false);
  };

  const handleChangeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement change submission
    setIsChangeDialogOpen(false);
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">What would you like to do next?</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Dialog open={isChangeDialogOpen} onOpenChange={setIsChangeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Post a Change
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleChangeSubmit}>
                  <DialogHeader>
                    <DialogTitle>Post a Change</DialogTitle>
                    <DialogDescription>
                      Add a change to the lease. This will be recorded in the lease history.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="change-type">Type of Change</Label>
                      <Input id="change-type" placeholder="e.g., Rent Increase, Term Extension" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="change-description">Description</Label>
                      <Textarea
                        id="change-description"
                        placeholder="Describe the change in detail..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="change-amount">Amount (if applicable)</Label>
                      <Input id="change-amount" type="number" placeholder="0.00" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Submit Change</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <DollarSign className="w-4 h-4" />
                  Receive Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handlePaymentSubmit}>
                  <DialogHeader>
                    <DialogTitle>Receive Payment</DialogTitle>
                    <DialogDescription>
                      Record a new payment for this lease.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment-amount">Amount</Label>
                      <Input id="payment-amount" type="number" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-type">Payment Type</Label>
                      <Input id="payment-type" placeholder="e.g., Rent, Deposit, Late Fee" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <Input id="payment-method" placeholder="e.g., Cash, Check, Bank Transfer" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-note">Note</Label>
                      <Textarea
                        id="payment-note"
                        placeholder="Add any additional notes..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Record Payment</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <StickyNote className="w-4 h-4" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleNoteSubmit}>
                  <DialogHeader>
                    <DialogTitle>Add Note</DialogTitle>
                    <DialogDescription>
                      Add a note to this lease for future reference.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="note-title">Title</Label>
                      <Input id="note-title" placeholder="Brief title for the note" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="note-content">Note</Label>
                      <Textarea
                        id="note-content"
                        placeholder="Write your note here..."
                        className="min-h-[150px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Add Note</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <FileText className={`h-6 w-6 mb-2 ${
              leaseDetails.start_date
                ? new Date() >= new Date(leaseDetails.start_date)
                  ? leaseDetails.end_date && new Date() > new Date(leaseDetails.end_date)
                    ? 'text-red-500'  // Inactive
                    : 'text-green-600'  // Active
                  : 'text-yellow-500'  // Pending
                : 'text-muted-foreground'  // Not Set
            }`} />
            <p className="text-sm text-muted-foreground">Lease Status</p>
            <p className="font-medium">
              {leaseDetails.start_date
                ? new Date() >= new Date(leaseDetails.start_date)
                  ? leaseDetails.end_date && new Date() > new Date(leaseDetails.end_date)
                    ? 'Inactive'
                    : 'Active'
                  : 'Pending'
                : 'Not Set'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <DollarSign className="h-6 w-6 mb-2 text-blue-600" />
            <p className="text-sm text-muted-foreground">Monthly Rent</p>
            <p className="font-medium">
              {formatCurrency(leaseDetails.rent_amount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Wallet className="h-6 w-6 mb-2 text-blue-600" />
            <p className="text-sm text-muted-foreground">Deposits Held</p>
            <p className="font-medium">
              {formatCurrency(leaseDetails.deposit_amount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Calendar className="h-6 w-6 mb-2 text-blue-600" />
            <p className="text-sm text-muted-foreground">Lease Type</p>
            <p className="font-medium">
              {leaseDetails.lease_type || 'Not Set'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Outstanding Balance</h3>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-semibold text-blue-600">
                $0
              </span>
              <span className="text-sm text-muted-foreground">
                outstanding
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Linked Units</h3>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-semibold">
                {leaseDetails.unit ? '1' : '0'}
              </span>
              <span className="text-sm text-muted-foreground">
                {leaseDetails.unit ? 'unit' : 'units'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Insurance Policy</h3>
              </div>
              <Button variant="outline" size="sm">Update</Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium text-yellow-500">Not Verified</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expiry</span>
                <span className="text-sm font-medium">Not Set</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 