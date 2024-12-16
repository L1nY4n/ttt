import { Button } from "@/components/ui/button";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/plugin-process";
export const QuitConfirm = () => {
  async function cancel() {
  await getCurrentWindow().minimize();
  await getCurrentWindow().hide();


}

  return (
    <div className="quit_confirm">
      <div className="lin">确定要<strong >退出</strong>吗?</div>
      <div className="absolute flex gap-2 bottom-1 right-1">
      <Button size={"sm"} variant="outline" className="py-0" onClick={() =>cancel()}>取消</Button>
      <Button size={"sm"}  autoFocus onClick={() => exit(0)}>确定</Button>
      </div>
    </div>
  );
};
