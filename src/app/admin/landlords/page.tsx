"use client";

import { useGetAllManagersQuery, useUpdateManagerStatusMutation, useDeleteManagerMutation, useGetAuthUserQuery } from "@/state/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, AlertTriangle, Ban, Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

export default function LandlordsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || "all");
  // Define Manager type for TypeScript
  type Manager = {
    id: number;
    cognitoId: string;
    name: string;
    email: string;
    phoneNumber?: string; // Optional to match prismaTypes.ts definition
    status: 'Pending' | 'Active' | 'Disabled' | 'Banned';
  };
  
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: authUser } = useGetAuthUserQuery();
  const { data: managers, isLoading, refetch } = useGetAllManagersQuery({ 
    status: selectedStatus !== "all" ? selectedStatus : undefined 
  }, {
    skip: !authUser?.cognitoInfo?.userId || authUser?.userRole !== "admin"
  });
  const [updateManagerStatus] = useUpdateManagerStatusMutation();
  const [deleteManager] = useDeleteManagerMutation();

  const filteredManagers = managers?.filter(manager => {
    const matchesSearch = manager.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         manager.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil((filteredManagers?.length || 0) / itemsPerPage);
  const paginatedManagers = filteredManagers?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusChange = async () => {
    if (!selectedManager || !newStatus) return;
    
    try {
      await updateManagerStatus({
        cognitoId: selectedManager.cognitoId,
        status: newStatus,
        notes: notes
      }).unwrap();
      
      setIsDialogOpen(false);
      setSelectedManager(null);
      setNewStatus("");
      setNotes("");
      refetch();
    } catch (error) {
      console.error("Failed to update manager status:", error);
    }
  };

  const openStatusDialog = (manager: Manager, initialStatus: string) => {
    setSelectedManager(manager);
    setNewStatus(initialStatus);
    setIsDialogOpen(true);
  };
  
  const openDeleteDialog = (manager: Manager) => {
    setSelectedManager(manager);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteManager = async () => {
    if (!selectedManager) return;
    
    try {
      await deleteManager(selectedManager.cognitoId).unwrap();
      setIsDeleteDialogOpen(false);
      setSelectedManager(null);
      refetch();
    } catch (error) {
      console.error("Failed to delete manager:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case "Active":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
      case "Disabled":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Disabled</Badge>;
      case "Banned":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Banned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Manage Landlords</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search landlords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Disabled">Disabled</SelectItem>
            <SelectItem value="Banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredManagers?.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No landlords found matching your criteria.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paginatedManagers?.map((manager) => (
            <Card key={manager.id} className="p-4 bg-white dark:bg-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-medium">{manager.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{manager.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{manager.phoneNumber}</p>
                  <div className="mt-2">{getStatusBadge(manager.status)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Status change buttons - with conditional rendering based on current status */}
                  {/* For Pending accounts - show Approve button */}
                  {manager.status === "Pending" && (
                    <Button 
                      variant="outline" 
                      className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                      onClick={() => openStatusDialog(manager, "Active")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  )}
                  
                  {/* For Disabled and Banned accounts - show Reactivate button */}
                  {(manager.status === "Disabled" || manager.status === "Banned") && (
                    <Button 
                      variant="outline" 
                      className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                      onClick={() => openStatusDialog(manager, "Active")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Reactivate
                    </Button>
                  )}
                  
                  {/* For Active and Pending accounts - show Disable button */}
                  {(manager.status === "Active" || manager.status === "Pending") && (
                    <Button 
                      variant="outline" 
                      className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      onClick={() => openStatusDialog(manager, "Disabled")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Disable
                    </Button>
                  )}
                  
                  {/* For all non-banned accounts - show Ban button */}
                  {manager.status !== "Banned" && (
                    <Button 
                      variant="outline" 
                      className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      onClick={() => openStatusDialog(manager, "Banned")}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Ban
                    </Button>
                  )}
                  
                  {/* Delete button - with special highlight for demo accounts */}
                  <Button 
                    variant="outline" 
                    className={`${manager.email === 'manager@example.com' ? 'bg-red-400 hover:bg-red-500 text-white font-bold' : 'bg-red-50 hover:bg-red-100 text-red-600'} border-red-200`}
                    onClick={() => openDeleteDialog(manager)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {manager.email === 'manager@example.com' ? 'Delete Demo Account' : 'Delete'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {(filteredManagers?.length || 0) > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredManagers?.length || 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Status change dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Landlord Status</DialogTitle>
            <DialogDescription>
              You are about to change {selectedManager?.name}&apos;s status to <strong>{newStatus}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Add notes about this status change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusChange}>
              Confirm Status Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Landlord Account</DialogTitle>
            <DialogDescription>
              {selectedManager?.email === 'manager@example.com' ? (
                <>
                  You are about to delete the demo account for <strong>{selectedManager?.name}</strong>. 
                  This will remove the account and all associated demo properties.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete <strong>{selectedManager?.name}</strong>? 
                  This action cannot be undone and will remove all properties managed by this account.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteManager}>
              {selectedManager?.email === 'manager@example.com' ? 'Delete Demo Account' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
