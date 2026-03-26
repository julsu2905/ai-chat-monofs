import type { Provider } from "@/App";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./ui/button";
import { ChevronDownIcon } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

interface DropdownModelsProps extends React.HTMLAttributes<HTMLSelectElement> {
  value: string;
  onValueChange: (provider: string, model: string) => void;
  options: Provider[];
  disabled?: boolean;
}

const DropdownModels = ({
  value,
  onValueChange,
  options,
  disabled,
}: DropdownModelsProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="chat-item rounded-full!"
        >
          {value}
          <ChevronDownIcon className="ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="shadow-lg border bg-white">
        <PopoverHeader>
          <PopoverTitle className="font-bold text-lg">
            Select AI Model
          </PopoverTitle>
          <div className="mt-4 flex flex-col gap-3 mx-2">
            {options.map((option) => (
              <div key={option.name}>
                <h2 className="font-semibold uppercase">{option.name}</h2>
                <hr />
                <div className="my-2 flex gap-3 flex-wrap">
                  {option.supportedModels.map((model) => (
                    <Button
                      variant="default"
                      key={model.id}
                      onClick={() => {
                        onValueChange(option.name, model.name);
                        setOpen(false);
                      }}
                      className={clsx("col-span-1 chat-item", {
                        active: value === model.name,
                      })}
                    >
                      <p>{model.name}</p>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
};

export default DropdownModels;
