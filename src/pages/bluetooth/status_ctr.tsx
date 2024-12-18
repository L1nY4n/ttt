import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const  StatusCtr = () => {
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex p-0.5 rounded-sm bg-slate-200">
        {StatusIcon}
        <Separator orientation="vertical" />
        <Settings2 className="h-4" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuGroup>
        {statusList.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => {
              onStatusChange(item.value);
            }}
          >
            {item.title}
            <DropdownMenuShortcut>{item.icon}</DropdownMenuShortcut>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
};