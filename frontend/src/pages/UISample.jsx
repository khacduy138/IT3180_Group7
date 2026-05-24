import { Button } from '../components/ui/Button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import { Form, FormItem, FormLabel, FormField, FormControl, FormMessage } from '../components/ui/Form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Tag } from '../components/ui/Tag';
import { useForm } from 'react-hook-form';
import TopBar from '../components/ui/TopBar';
import { Home } from 'lucide-react';

export default function UISample() {
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      role: 'resident',
    },
  });

  return (
    <div>
      <TopBar />
      <div className="bg-background text-foreground min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-2">BlueMoon AMS</h1>
          <p className="text-lg text-muted-foreground mb-8">Apartment Management System</p>
          <div className="flex flex-col flex-wrap gap-4">
            <Button variant="default">Test Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="with-icon">Button with Icon <Home /></Button>

            <div className="rounded-lg border border-border p-4">
              <h2 className="mb-3 text-lg font-semibold">Header</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Apartment A-1203</TableCell>
                    <TableCell>
                      <Tag color="green">Active</Tag>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Apartment B-0401</TableCell>
                    <TableCell>
                      <Tag color="yellow">Pending</Tag>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Apartment C-0902</TableCell>
                    <TableCell>
                      <Tag color="red">Blocked</Tag>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList>
                <TabsTrigger value="profile">Profile Form</TabsTrigger>
                <TabsTrigger value="asasdas">some collapsible</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">User Profile</h2>
                  <p className="text-sm text-muted-foreground mb-6">To disprises of thus againsolution da we must give shuffles cast office, or with that under be, to suffer deat merit of outraveller who would fardels bear that dream: ay, to </p>
                </div>
                <Form {...form}>
                  <form className="space-y-4 border border-border rounded-lg p-4" onSubmit={form.handleSubmit((data) => console.log(data))}>
                    <FormField
                      control={form.control}
                      name="username"
                      rules={{ required: 'Username is required' }}
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

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <Select
                              placeholder="Choose a role"
                              options={[
                                { value: 'resident', label: 'Resident' },
                                { value: 'manager', label: 'Manager' },
                                { value: 'accountant', label: 'Accountant' },
                              ]}
                              value={field.value}
                              onValueChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              className="w-32"
                            />
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
                <Button variant="destructive" className="mt-4">Delete Account</Button>
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
    </div>
  );
}
