
import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  start: z.string().min(1, "Start time is required"),
  end: z.string().min(1, "End time is required"),
  residentId: z.string().min(1, "Please select a resident"),
  type: z.enum(["check_in", "appointment", "meeting", "goal_review", "assessment", "other"]),
  description: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface TouchpointCalendarProps {
  residentId?: string;
}

export function TouchpointCalendar({ residentId }: TouchpointCalendarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const queryClient = useQueryClient();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      type: "check_in",
      description: "",
    },
  });

  const { data: events } = useQuery({
    queryKey: ['/api/events', residentId],
    queryFn: () => apiRequest(`/api/events${residentId ? `?residentId=${residentId}` : ''}`),
  });

  const { data: residents } = useQuery({
    queryKey: ['/api/residents'],
  });

  const createEventMutation = useMutation({
    mutationFn: (data: EventFormData) =>
      apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success('Event created successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast.error('Failed to create event');
    },
  });

  const handleDateSelect = (selectInfo: any) => {
    const start = selectInfo.start.toISOString().slice(0, 16);
    const end = selectInfo.end.toISOString().slice(0, 16);
    
    form.setValue('start', start);
    form.setValue('end', end);
    
    if (residentId) {
      form.setValue('residentId', residentId);
    }
    
    setSelectedDate(selectInfo.startStr);
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    if (confirm(`Delete event '${clickInfo.event.title}'?`)) {
      // Handle event deletion
      clickInfo.event.remove();
    }
  };

  const onSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
  };

  const calendarEvents = events?.map((event: any) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: getEventColor(event.type),
    borderColor: getEventColor(event.type),
  })) || [];

  function getEventColor(type: string) {
    switch (type) {
      case 'check_in': return '#10b981';
      case 'appointment': return '#3b82f6';
      case 'meeting': return '#8b5cf6';
      case 'goal_review': return '#f59e0b';
      case 'assessment': return '#ef4444';
      default: return '#6b7280';
    }
  }

  return (
    <div className="w-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={calendarEvents}
        select={handleDateSelect}
        eventClick={handleEventClick}
        height="auto"
        className="bg-white rounded-lg border"
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Touchpoint</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!residentId && (
                <FormField
                  control={form.control}
                  name="residentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resident</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select resident" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {residents?.map((resident: any) => (
                            <SelectItem key={resident.id} value={resident.id}>
                              {resident.firstName} {resident.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="check_in">Check-in</SelectItem>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="goal_review">Goal Review</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details..." 
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
