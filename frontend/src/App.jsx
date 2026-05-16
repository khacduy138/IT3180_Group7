import { Button } from './components/ui/Button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './components/ui/Accordion';
import { Form, FormItem, FormLabel, FormField, FormControl, FormDescription, FormMessage } from './components/ui/Form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/Tabs';
import { Input } from './components/ui/Input';
import { useForm } from 'react-hook-form';

function App() {
  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
    },
  });

  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-2">BlueMoon AMS</h1>
        <p className="text-lg text-muted-foreground mb-8">Apartment Management System</p>
        <div className="flex flex-col flex-wrap gap-4">
        <Button variant="default">Test Button</Button>

        

        <Tabs defaultValue="profile" className="space-y-6">

        <TabsList>
          <TabsTrigger value="profile">Profile Form</TabsTrigger>
          <TabsTrigger value="asasdas">some collapsible</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Form {...form}>
            <form className="space-y-4 border border-border rounded-lg p-4" onSubmit={form.handleSubmit((data) => console.log(data))}>
              <FormField
                control={form.control}
                name="username"
                rules={{ required: "Username is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" variant="default" className="mt-2">
                Save Changes
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="asasdas">
          <Accordion type="single" collapsible className="border border-border rounded-md px-4">
            <AccordionItem value="item-1">
              <AccordionTrigger variant="subtle">Subtle Styled Trigger</AccordionTrigger>
              <AccordionContent>Content lines go here...</AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" variant="no-border">
              <AccordionTrigger variant="subtle">Outline Style Trigger</AccordionTrigger>
              <AccordionContent>Content lines go here...</AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

      </Tabs>

        </div>
      </div>
    </div>
  );
}

export default App;
