import { getVersion } from "@tauri-apps/api/app";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Button } from "@/components/ui/button";
import { Download, Undo2 } from "lucide-react";
 
import { Progress } from "@/components/ui/progress"

export const Updater = () => {
  const [currentVersion, setCurrentVersion] = useState("");

  const [update, setUpdate] = useState<Update | null>(null);
  const [contentLength, setContentLength] = useState(0);
  const [downloaded, setDownloaded] = useState(0);
  const [updateState, setupdateState] = useState<
    null | "Started" | "Progress" | "Finished"
  >(null);

  useEffect(() => {
    getVersion().then((version) => {
      setCurrentVersion(version);
    });

    check().then((up) => {
      setUpdate(up);
    });
  });

  function downloadAndInstall() {
    if (update) {
      update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            setupdateState("Started");
            setDownloaded(0);
            setContentLength(event.data.contentLength as number);

            break;
          case "Progress":
            setupdateState("Progress");
            setDownloaded((v) => v + event.data.chunkLength);


            break;
          case "Finished":
            setupdateState("Finished");
            break;
        }
      });
    }
  }

  function cancelUpdate() {
    update?.close();
    getCurrentWebviewWindow()?.hide();
    setUpdate(null);
    setupdateState(null);
    setContentLength(0);
    setDownloaded(0);
  }

  return (
    <div className="update-dialog">
      <div className="current-version">当前版本: {currentVersion}</div>
      <div className="update-body">
        {update && update.available ? (
          <div>
            <div  className="new-version">
              新版本: {update.currentVersion} ➤ {update.version}
            </div>
            <p className="update-content">{update.body}</p>
            {(updateState === "Progress" || updateState === "Finished") && (
              <div className="flex items-center gap-2 mt-2">
               <Progress  value={Math.floor((downloaded / contentLength) * 100)} className="  w-[50%]" />
                {(downloaded / 1024).toFixed(2)} /{" "}
                {(contentLength / 1024).toFixed(2)} KB (
                {Math.floor((downloaded / contentLength) * 100)}%)
              </div>
            )}
          </div>
        ) : (
          <p className="">无可用更新</p>
        )}
      </div>
      <div className="absolute flex gap-2 bottom-1 right-1">
        {update?.available && updateState == null && (
          <Button  size={"sm"}  onClick={() => downloadAndInstall()}><Download className="w-4 h-4 mr-2" />下载并安装</Button>
        )}
        {updateState == "Finished" && (
          <Button   size={"sm"} onClick={() => relaunch()}>重启</Button>
        )}
        {(updateState == null  || updateState === "Progress") && (
          <Button size={"sm"} onClick={() => cancelUpdate()}><Undo2 className="w-4 h-4 mr-2" />取消</Button>
        )}
      </div>
    </div>
  );
};
