import { Construction, Lightbulb, LightbulbOff, PersonStanding, TrainFront, Zap } from "lucide-react";

const status_on = <Lightbulb className="w-4 h-4 text-orange-400" />;
const status_off = <LightbulbOff className="w-4 h-4 text-gray-600" />;
const status_flash = (
  <Zap className="w-4 h-4 text-purple-600 duration-150 animate-pulse" />
);

const mode_running = <TrainFront className="w-4 h-4 text-green-500" />;
const mode_engineering = <Construction className="w-4 h-4 text-slate-600" />;
const mode_induction = (
  <PersonStanding className="w-4 h-4 text-indigo-600 " />
);


const modeList = [
  { title: "Running", value: 1, icon: mode_running },
  { title: "Engineering", value: 2, icon: mode_engineering },
  { title: "Induction", value: 3, icon: mode_induction },
];
const statusList = [
  { title: "On", value: 1, icon: status_on },
  { title: "Off", value: 0, icon: status_off },
  { title: "Flash", value: 2, icon: status_flash },
];


export { status_on, status_off, status_flash, mode_running, mode_engineering, mode_induction, modeList, statusList }