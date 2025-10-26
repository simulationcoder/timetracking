import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers,
  Lock,
  ServerCog,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext.jsx";

const apiEndpoints = [
  {
    method: "POST",
    path: "/auth/login",
    description: "Authenticate a user and receive a session cookie.",
  },
  {
    method: "GET",
    path: "/projects",
    description: "List projects visible to the requester. Requires timesheets or manage-data panel.",
  },
  {
    method: "POST",
    path: "/timesheets",
    description: "Create or fetch the weekly timesheet for the authenticated employee.",
  },
  {
    method: "POST",
    path: "/timesheets/{id}/submit",
    description: "Submit a draft timesheet for approval.",
  },
  {
    method: "GET",
    path: "/management/teams",
    description: "Administrative listing of teams. Requires manage-data panel.",
  },
  {
    method: "POST",
    path: "/management/users/{id}/roles",
    description: "Replace the roles for the selected user. Requires permissions panel.",
  },
];

const productHighlights = [
  {
    title: "Track time quickly",
    description: "Employees capture weekly hours with project/activity validation and billable toggles.",
    icon: Activity,
  },
  {
    title: "Delegate approvals",
    description: "Managers review submissions, add comments, and keep workflows moving with clear statuses.",
    icon: CheckCircle2,
  },
  {
    title: "Stay organised",
    description: "Admins manage teams, assign roles, and curate project catalogs from a unified console.",
    icon: Layers,
  },
];

const roles = [
  {
    name: "Employee",
    panels: ["timesheets"],
    description: "Create and edit personal timesheets; view dashboard insights.",
  },
  {
    name: "Manager / Approver",
    panels: ["timesheets", "submitted", "manage-data"],
    description: "Approve submitted timesheets and maintain team catalogs.",
  },
  {
    name: "Administrator",
    panels: ["timesheets", "submitted", "manage-data", "permissions"],
    description: "Full access, including user provisioning, panel management, and catalog controls.",
  },
];

const DocumentationPage = () => {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-secondary/30">
      <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/20"
            >
              <BookOpen className="h-4 w-4" />
              TimeTrack Pro Docs
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <Button variant="outline" asChild>
                <Link to={user ? "/" : "/login"} className="inline-flex items-center gap-2">
                  {user ? "Open App" : "Sign in"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <Badge className="bg-primary/15 text-primary">Product Guide</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Master your team&apos;s time tracking.</h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              TimeTrack Pro unifies employee timesheets, approvals, and admin controls. This guide covers everything you need to get started and integrate with the API.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/login" className="inline-flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/approvals" className="inline-flex items-center gap-2">
                  View Manager Tools
                  <Users className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ServerCog className="h-5 w-5 text-primary" />
                API quick start
              </CardTitle>
              <CardDescription>
                Authenticate once, reuse your session cookie in subsequent calls. The API is RESTful and responds with JSON.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-lg bg-background/80 p-4 font-mono text-xs">
                <p className="text-primary mb-2 font-semibold uppercase">Login</p>
                <pre>
{`POST /auth/login
{
  "email": "eli.employee@example.com",
  "password": "Employee123!"
}`}
                </pre>
              </div>
              <p>Successful authentication returns a <code>session</code> cookie. Include it automatically by keeping <code>credentials: "include"</code> in fetch calls.</p>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        <section className="grid gap-6 md:grid-cols-3">
          {productHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="h-full border-border/70 bg-card/70 backdrop-blur">
                <CardHeader className="space-y-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <Separator className="my-12" />

        <section className="grid gap-10 lg:grid-cols-[1fr,1fr]">
          <Card className="border-border/70 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Using the web app</CardTitle>
              <CardDescription>Follow these steps to roll the product out to your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">1</span>
                  Invite administrators to log in with the seeded <code>admin@example.com</code> account, then update credentials under Settings.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">2</span>
                  Build out teams, assign leaders, and manage approvers from <strong>Permissions & Teams</strong>.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">3</span>
                  Curate the project catalog and map activities so employees see the right options when logging time.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">4</span>
                  Employees submit weekly timesheets; approvers review in <strong>Submitted Timesheets</strong> and return feedback when needed.
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Roles & panels</CardTitle>
              <CardDescription>Access is driven by roles and panels. Panels unlock navigation areas within the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {roles.map((role) => (
                <div key={role.name} className="rounded-lg border border-dashed border-primary/40 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-primary">{role.name}</p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <Lock className="h-4 w-4 text-primary/70" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {role.panels.map((panel) => (
                      <Badge key={panel} variant="secondary" className="bg-primary/10 text-primary">
                        {panel}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">REST API reference</h2>
              <p className="text-muted-foreground">
                All endpoints expect and return JSON. Provide the session cookie (`credentials: &quot;include&quot;`) or a bearer token generated by an admin workflow.
              </p>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary">Base URL: <span className="font-mono">/api</span></Badge>
          </div>
          <Card className="overflow-hidden border-border/70 bg-card/70 backdrop-blur">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiEndpoints.map((endpoint) => (
                  <TableRow key={`${endpoint.method}-${endpoint.path}`}>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 font-mono text-primary">
                        {endpoint.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{endpoint.path}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{endpoint.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        <Separator className="my-12" />

        <section className="grid gap-6 lg:grid-cols-[1fr,1fr]">
          <Card className="border-border/70 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Sample integration</CardTitle>
              <CardDescription>Use the session cookie to call the API from the browser or a server-side integration.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-muted p-4 text-xs leading-relaxed">
{`const response = await fetch('/api/timesheets', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ week_start: '2025-01-06' })
});
const data = await response.json();`}
              </pre>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <CardDescription>Need a hand? Keep these resources handy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-1 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Troubleshooting</p>
                  <p>Logs are streamed to Docker services <code>api</code> and <code>web</code>. Inspect with <code>docker compose logs -f api</code>.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-1 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Resetting passwords</p>
                  <p>Administrators can reset credentials from Settings after authenticating with seeded accounts.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-1 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Extending the API</p>
                  <p>New endpoints live in <code>api/app.py</code>. Mirror existing patterns and ensure role checks with <code>require_panel</code>.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="mt-16 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 p-6">
          <div>
            <p className="text-lg font-semibold text-primary">Ready to put TimeTrack Pro to work?</p>
            <p className="text-sm text-primary/80">Sign in, seed your data, and your team can start logging time immediately.</p>
          </div>
          <Button variant="default" size="lg" asChild>
            <Link to="/login" className="inline-flex items-center gap-2">
              Launch App
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="border-t bg-card/60">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} TimeTrack Pro.</p>
          <div className="flex items-center gap-3">
            <Link to="/login" className="inline-flex items-center gap-1 hover:text-primary">
              <ArrowLeft className="h-3 w-3" />
              Back to app
            </Link>
            <span>•</span>
            <span>Version 0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocumentationPage;

