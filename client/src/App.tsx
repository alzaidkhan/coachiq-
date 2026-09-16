// CoachIQ shell: Field Notes design keeps the app in a persistent coaching-desk layout with a warm paper canvas, ink hierarchy, and Sunline Orange actions.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageSkeleton } from "./components/SkeletonLoader";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const Landing = lazy(() => import("./pages/Landing"));
const Legal = lazy(() => import("./pages/Legal"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Router() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/app" component={Home} />
        <Route path="/privacy" component={() => <Legal kind="privacy" />} />
        <Route path="/terms" component={() => <Legal kind="terms" />} />
        <Route path="/admin" component={Admin} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
