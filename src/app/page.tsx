import AppRoot from "@/components/AppRoot";

// This is the only route in the app. What Is The Move is a single-page,
// tab-based experience (Home / Ask / Saved, plus Settings and an event-detail
// overlay) rather than a multi-route site — see README.md, "Architecture
// notes", for why that's the deliberate choice here rather than an
// unfinished routing structure.
export default function Page() {
  return <AppRoot />;
}
