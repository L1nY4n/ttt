"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { RadioTower } from "lucide-react";
import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,

  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { GatewayItem, State } from "@/types";


type TreeContextProps = {
  selectedId: string | undefined;
  expendedItems: string[] | undefined;
  indicator: boolean;
  handleExpand: (id: string) => void;
  selectItem: (id: string) => void;
  setExpendedItems?: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  openIcon?: React.ReactNode;
  closeIcon?: React.ReactNode;
  direction: "rtl" | "ltr";
};

const TreeContext = createContext<TreeContextProps | null>(null);

const useTree = () => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error("useTree must be used within a TreeProvider");
  }
  return context;
};

interface TreeViewComponentProps extends React.HTMLAttributes<HTMLDivElement> {}

type Direction = "rtl" | "ltr" | undefined;

type TreeViewProps = {
  initialSelectedId?: string;
  indicator?: boolean;
  elements?:  State;
  initialExpendedItems?: string[];
  openIcon?: React.ReactNode;
  closeIcon?: React.ReactNode;
} & TreeViewComponentProps;

const Tree = forwardRef<HTMLDivElement, TreeViewProps>(
  (
    {
      className,
      elements,
      initialSelectedId,
      initialExpendedItems,
      children,
      indicator = true,
      openIcon,
      closeIcon,
      dir,
      ...props
    },
    ref
  ) => {
    const [selectedId, setSelectedId] = useState<string | undefined>(
      initialSelectedId
    );
    const [expendedItems, setExpendedItems] = useState<string[] | undefined>(
      initialExpendedItems
    );

    const selectItem = useCallback((id: string) => {
      setSelectedId(id);
    }, []);

    const handleExpand = useCallback((id: string) => {
      setExpendedItems((prev) => {
        if (prev?.includes(id)) {
          return prev.filter((item) => item !== id);
        }
        return [...(prev ?? []), id];
      });
    }, []);

    const expandSpecificTargetedElements = useCallback(
      (elements?: State, selectId?: string) => {
        if (!elements || !selectId) return;
        const findParent = (
          currentElement: GatewayItem,
          currentPath: string[] = []
        ) => {
          const isSelectable = currentElement.isSelectable ?? true;
          const newPath = [...currentPath, currentElement.id];
          if (currentElement.id === selectId) {
            if (isSelectable) {
              setExpendedItems((prev) => [...(prev ?? []), ...newPath]);
            } else {
              if (newPath.includes(currentElement.id)) {
                newPath.pop();
                setExpendedItems((prev) => [...(prev ?? []), ...newPath]);
              }
            }
            return;
          }
          if (
            isSelectable &&
            currentElement.children &&
            currentElement.children.length > 0
          ) {
            currentElement.children.forEach((child) => {
              findParent(child, newPath);
            });
          }
        };
        Object.values(elements.gateway).forEach((element) => {
          findParent(element);
        });
      },
      []
    );

    useEffect(() => {
      if (initialSelectedId) {
        expandSpecificTargetedElements(elements, initialSelectedId);
      }
    }, [initialSelectedId, elements]);

    const direction = dir === "rtl" ? "rtl" : "ltr";

    return (
      <TreeContext.Provider
        value={{
          selectedId,
          expendedItems,
          handleExpand,
          selectItem,
          setExpendedItems,
          indicator,
          openIcon,
          closeIcon,
          direction,
        }}
      >
        <div className={cn("size-full", className)} {...props}>
          <ScrollArea
            ref={ref}
            className="relative h-full px-2"
            dir={dir as Direction}
          >
            <AccordionPrimitive.Root
              type="multiple"
              value={expendedItems ?? []}
              className="flex flex-col gap-1"
              onValueChange={setExpendedItems}
              dir={dir as Direction}
            >
              {children}
            </AccordionPrimitive.Root>
          </ScrollArea>
        </div>
      </TreeContext.Provider>
    );
  }
);

Tree.displayName = "Tree";

const TreeIndicator = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { direction } = useTree();

  return (
    <div
      dir={direction}
      ref={ref}
      className={cn(
        "h-full w-px bg-muted absolute left-1.5 rtl:right-1.5 py-3 rounded-md hover:bg-slate-300 duration-300 ease-in-out",
        className
      )}
      {...props}
    />
  );
});

TreeIndicator.displayName = "TreeIndicator";

interface BaseComponentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {}




type GwProps = {
  expendedItems?: string[];
  element:  React.ReactNode;
  actions?: React.ReactNode;
  isSelectable?: boolean;
  isSelect?: boolean;
} & BaseComponentProps;


const Gateway = forwardRef<
  HTMLDivElement,
  GwProps & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      className,
      element,
      actions,
      value,
      isSelectable = true,
      isSelect,
      children,
      ...props
    },
    ref
  ) => {
    const {
      direction,
      expendedItems,
      indicator,
      openIcon,
      closeIcon,
    } = useTree();

    return (
      <AccordionPrimitive.Item
        {...props}
        ref={ref}
        value={value}
        className="relative h-full overflow-hidden "
      >
        <div
          className={cn(
            "flex items-start rounded-md bg-gray-200",
            isSelect && isSelectable && "bg-muted",
            className
          )}
        >
          <AccordionPrimitive.Trigger
            className={cn(
              "flex min-w-0 flex-1 items-center gap-1 rounded-md text-left text-sm",
              isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            )}
            disabled={!isSelectable}
          >
            <span className="pl-2">
              {expendedItems?.includes(value)
                ? openIcon ?? <RadioTower className="h-4 w-4" />
                : closeIcon ?? <RadioTower className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1">{element}</span>
          </AccordionPrimitive.Trigger>
          {actions && <div className="shrink-0 p-2">{actions}</div>}
        </div>
        <AccordionPrimitive.Content className="text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down relative overflow-hidden h-full">
          {element && indicator && <TreeIndicator aria-hidden="true" />}
          <div
            dir={direction}
            className="flex flex-wrap gap-1 py-1 ml-5 rtl:mr-5"
          >
            {children}
          </div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    );
  }
);

Gateway.displayName = "Gateway";

const Light = forwardRef<
  HTMLDivElement,
  {
    value: string;
    handleSelect?: (id: string) => void;
    isSelectable?: boolean;
    isSelect?: boolean;
    fileIcon?: React.ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      value,
      className,
      handleSelect,
      isSelectable = true,
      isSelect,
      fileIcon,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const { direction, selectedId, selectItem } = useTree();
    const isSelected = isSelect ?? selectedId === value;
    return (
      <div
        ref={ref}
        {...props}
        dir={direction}
        role="treeitem"
        aria-selected={isSelected}
        aria-disabled={!isSelectable}
        className={cn(
          "rounded-md bg-blue-50 pr-1 text-sm duration-200 ease-in-out rtl:pl-1 rtl:pr-0",
          isSelected && isSelectable && "bg-blue-100",
          isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
          className
        )}
        onClick={(event) => {
          onClick?.(event);
          if (isSelectable && !event.defaultPrevented) selectItem(value);
        }}
      >
        {children}
      </div>
    );
  }
);

Light.displayName = "Light";


const CollapseButton = forwardRef<
  HTMLButtonElement,
  {
    elements: GatewayItem[];
    expandAll?: boolean;
  } & React.HTMLAttributes<HTMLButtonElement>
>(({ className, elements, expandAll = false, children, ...props }, ref) => {
  const { expendedItems, setExpendedItems } = useTree();

  const expendAllTree = useCallback((elements: GatewayItem[]) => {
    const expandTree = (element: GatewayItem) => {
      const isSelectable = element.isSelectable ?? true;
      if (isSelectable && element.children && element.children.length > 0) {
        setExpendedItems?.((prev) => [...(prev ?? []), element.id]);
        element.children.forEach(expandTree);
      }
    };

    elements.forEach(expandTree);
  }, []);

  const closeAll = useCallback(() => {
    setExpendedItems?.([]);
  }, []);

  useEffect(() => {
    console.log(expandAll);
    if (expandAll) {
      expendAllTree(elements);
    }
  }, [expandAll]);

  return (
    <Button
      variant={"ghost"}
      className="absolute h-8 p-1 w-fit bottom-1 right-2"
      onClick={
        expendedItems && expendedItems.length > 0
          ? closeAll
          : () => expendAllTree(elements)
      }
      ref={ref}
      {...props}
    >
      {children}
      <span className="sr-only">Toggle</span>
    </Button>
  );
});

CollapseButton.displayName = "CollapseButton";

export { Tree, CollapseButton, Gateway,Light  };
