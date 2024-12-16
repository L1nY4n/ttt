import { getVersion } from "@tauri-apps/api/app";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

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
              <div>
                {" "}
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
      <div className="update-footer">
        {update?.available && updateState == null && (
          <button onClick={() => downloadAndInstall()}>下载并安装</button>
        )}
        {updateState == "Finished" && (
          <button onClick={() => relaunch()}>重启</button>
        )}
        {updateState == null && (
          <button onClick={() => cancelUpdate()}>退出</button>
        )}
      </div>
    </div>
  );
};
