import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const partnerSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  serviceType: z.enum(["parole", "probation", "stop", "ecm", "cbo"], {
    required_error: "Please select a service type",
  }),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface PartnerSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PartnerSignupModal({ isOpen, onClose }: PartnerSignupModalProps) {
  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      organizationName: "",
      contactName: "",
      email: "",
    },
  });

  const partnerMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      const response = await apiRequest("POST", "/api/partners", data);
      return response.json();
    },
    onSuccess: () => {
      toast.success("Thank you for partnering with Life House! We'll be in touch soon.");
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit partner request. Please try again.");
    },
  });

  const onSubmit = (data: PartnerFormData) => {
    partnerMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Partner with Life House</DialogTitle>
          <DialogDescription>
            Join our network of community partners working together to support successful reentry. We'll get back to you within 24 hours.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sacramento Reentry Services" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane@organization.org" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="parole">Parole</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                      <SelectItem value="stop">STOP Provider</SelectItem>
                      <SelectItem value="ecm">Enhanced Care Management (ECM)</SelectItem>
                      <SelectItem value="cbo">Community Based Organization</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={partnerMutation.isPending}
            >
              {partnerMutation.isPending ? "Submitting..." : "Submit Partner Request"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}