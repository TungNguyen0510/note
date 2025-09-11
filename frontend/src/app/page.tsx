import { AppSidebar } from "@/components/app-sidebar";
import { DynamicEditor } from "@/components/dynamic-editor";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col p-2">
          <DynamicEditor />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
