"use client";

import * as React from "react";

import { SearchForm } from "@/components/search-form";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import {
  beginGoogleLogin,
  deleteAccount,
  getMe,
  getNotesByUserId,
  logout,
  createNote,
} from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile, setOpenMobile } = useSidebar();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const notesQuery = useQuery({
    enabled: !!profileQuery.data?.id,
    queryKey: ["notes", profileQuery.data?.id, debouncedSearch],
    queryFn: () =>
      getNotesByUserId(
        profileQuery.data!.id,
        debouncedSearch.trim() ? debouncedSearch : undefined
      ),
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isNoteDeleteDialogOpen, setIsNoteDeleteDialogOpen] =
    React.useState(false);
  const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] =
    React.useState(false);
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState<string>("");

  const deleteMutation = useMutation({
    mutationFn: async () => deleteAccount(),
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async () => createNote({}, "Untitled"),
    onSuccess: (note) => {
      if (profileQuery.data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["notes", profileQuery.data.id],
        });
      }
      if (typeof window !== "undefined") {
        window.location.hash = `#note/${note.id}`;
      }
    },
  });

  const updateTitleMutation = useMutation({
    mutationFn: async () => {
      if (!editingNoteId) return null as string | null;
      const { updateNote } = await import("@/lib/api");
      return updateNote(editingNoteId, { title: editingTitle });
    },
    onSuccess: () => {
      if (profileQuery.data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["notes", profileQuery.data.id],
        });
      }
      setIsEditTitleDialogOpen(false);
      setEditingNoteId(null);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      if (!editingNoteId) return { success: false } as { success: boolean };
      const { deleteNote } = await import("@/lib/api");
      return deleteNote(editingNoteId);
    },
    onSuccess: () => {
      if (profileQuery.data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["notes", profileQuery.data.id],
        });
      }
      if (typeof window !== "undefined") {
        const current = window.location.hash.match(/#note\/(.+)$/)?.[1];
        if (current && current === editingNoteId) {
          window.location.hash = "";
        }
      }
      setIsNoteDeleteDialogOpen(false);
      setEditingNoteId(null);
    },
  });

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        {profileQuery.data ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button className="mx-2">{profileQuery.data.email}</Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-2 w-56">
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                Logout
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleteMutation.isPending}
              >
                Delete account
              </Button>
            </PopoverContent>
          </Popover>
        ) : (
          <Button className="mx-2" onClick={beginGoogleLogin}>
            Continue with Google
          </Button>
        )}
        {/* Confirm delete dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Are you sure you want to delete your account?
              </DialogTitle>
              <DialogDescription>
                This will permanently delete your account. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteMutation.mutate();
                  setIsDeleteDialogOpen(false);
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <SearchForm query={search} onQueryChange={setSearch} />
      </SidebarHeader>
      <SidebarContent>
        {/* Your Notes */}
        <SidebarGroup>
          <Button
            className="mx-2"
            onClick={() => createNoteMutation.mutate()}
            disabled={createNoteMutation.isPending}
          >
            {createNoteMutation.isPending ? "Creating..." : "+ New Note"}
          </Button>
          <SidebarGroupLabel>Your Notes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {notesQuery.isLoading && (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>Loading...</SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {notesQuery.isError && (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    Error loading notes
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {notesQuery.data?.map((note) => (
                <SidebarMenuItem key={note.id}>
                  <div className="flex items-center justify-between w-full">
                    <SidebarMenuButton
                      className="flex-1 text-left"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.location.hash = `#note/${note.id}`;
                        }
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                    >
                      <Label className="truncate">
                        {note.title || "Untitled"}
                      </Label>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditingTitle(note.title || "");
                            setIsEditTitleDialogOpen(true);
                          }}
                        >
                          Edit title
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setIsNoteDeleteDialogOpen(true);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </SidebarMenuItem>
              ))}
              {notesQuery.data?.length === 0 &&
                !notesQuery.isLoading &&
                !notesQuery.isError && (
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>No notes yet</SidebarMenuButton>
                  </SidebarMenuItem>
                )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
      {/* Edit title dialog */}
      <Dialog
        open={isEditTitleDialogOpen}
        onOpenChange={setIsEditTitleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit note title</DialogTitle>
            <DialogDescription>
              Update the title for this note.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="edit-title">Title</Label>
            <input
              id="edit-title"
              className="h-9 rounded-md border px-3 text-sm"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              placeholder="Untitled"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditTitleDialogOpen(false)}
              disabled={updateTitleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateTitleMutation.mutate()}
              disabled={updateTitleMutation.isPending || !editingNoteId}
            >
              {updateTitleMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete note confirm dialog */}
      <Dialog
        open={isNoteDeleteDialogOpen}
        onOpenChange={setIsNoteDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this note?</DialogTitle>
            <DialogDescription>
              This action cannot be undone and will permanently remove the note.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNoteDeleteDialogOpen(false)}
              disabled={deleteNoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteNoteMutation.mutate()}
              disabled={deleteNoteMutation.isPending || !editingNoteId}
            >
              {deleteNoteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
