'use client';

import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ChevronDown, 
  ListTodo, 
  Home, 
  Wrench, 
  UserCircle,
} from "lucide-react";

export default function TaskHeader() {
  return (
    <>
      <Input
        placeholder="Search tasks..."
        className="max-w-sm"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            Add Task
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem asChild className="focus:bg-gray-100">
            <Link href="/tasks/add-task" className="flex items-center py-1.5 px-2 w-full">
              <ListTodo className="mr-2 h-4 w-4" />
              <span>Task</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="focus:bg-gray-100">
            <Link href="/tasks/add-tenant-request" className="flex items-center py-1.5 px-2 w-full">
              <Home className="mr-2 h-4 w-4" />
              <span>Tenant Request</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="focus:bg-gray-100">
            <Link href="/tasks/add-work-order" className="flex items-center py-1.5 px-2 w-full">
              <Wrench className="mr-2 h-4 w-4" />
              <span>Work Order</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="focus:bg-gray-100">
            <Link href="/tasks/add-owner-request" className="flex items-center py-1.5 px-2 w-full">
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Owner Request</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
} 