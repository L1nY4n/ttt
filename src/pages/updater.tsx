import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { CircleAlert, CircleCheck, Download, LoaderCircle, RefreshCw, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type UpdateState = "checking" | "upToDate" | "available" | "downloading" | "ready" | "error";

function formatBytes(bytes: number) {
  if (bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "无法连接 GitHub Release，请检查网络后重试。";
}

export const Updater = () => {
  const [currentVersion, setCurrentVersion] = useState("");
  const [update, setUpdate] = useState<Update | null>(null);
  const [updateState, setUpdateState] = useState<UpdateState>("checking");
  const [contentLength, setContentLength] = useState<number | null>(null);
  const [downloaded, setDownloaded] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const checkSequence = useRef(0);
  const hasCheckedInitially = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (updateState === "downloading" || updateState === "ready") {
      return;
    }

    const sequence = ++checkSequence.current;
    const previousUpdate = update;

    setUpdate(null);
    setUpdateState("checking");
    setContentLength(null);
    setDownloaded(0);
    setErrorMessage("");

    try {
      if (previousUpdate) {
        try {
          await previousUpdate.close();
        } catch {
          // The updater resource may already have been released after a failed installation.
        }
      }
      const nextUpdate = await check();

      if (sequence !== checkSequence.current) {
        await nextUpdate?.close();
        return;
      }

      setUpdate(nextUpdate);
      setUpdateState(nextUpdate ? "available" : "upToDate");
    } catch (error) {
      if (sequence !== checkSequence.current) {
        return;
      }

      setUpdateState("error");
      setErrorMessage(toErrorMessage(error));
    }
  }, [update, updateState]);

  useEffect(() => {
    void getVersion().then(setCurrentVersion).catch(() => setCurrentVersion("未知"));

    if (!hasCheckedInitially.current) {
      hasCheckedInitially.current = true;
      void checkForUpdate();
    }
  }, []);

  useEffect(() => {
    let unlistenFocus: (() => void) | undefined;

    void getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (focused) {
        void checkForUpdate();
      }
    }).then((unlisten) => {
      unlistenFocus = unlisten;
    });

    return () => {
      unlistenFocus?.();
    };
  }, [checkForUpdate]);

  async function downloadAndInstall() {
    if (!update) {
      return;
    }

    setUpdateState("downloading");
    setContentLength(null);
    setDownloaded(0);
    setErrorMessage("");

    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setContentLength(event.data.contentLength ?? null);
          return;
        }

        if (event.event === "Progress") {
          setDownloaded((current) => current + event.data.chunkLength);
        }
      });
      setUpdate(null);
      setUpdateState("ready");
    } catch (error) {
      setUpdateState("error");
      setErrorMessage(toErrorMessage(error));
    }
  }

  async function dismiss() {
    try {
      if (updateState !== "downloading") {
        await update?.close();
      }
    } finally {
      await getCurrentWindow().hide();
    }
  }

  const progress = contentLength && contentLength > 0 ? Math.min((downloaded / contentLength) * 100, 100) : null;
  const updateNotes = update?.body?.trim();

  return (
    <main className="flex h-screen flex-col bg-background p-4 text-foreground">
      <header className="flex items-start justify-between border-b pb-3">
        <div>
          <p className="text-sm font-semibold">软件更新</p>
          <p className="mt-1 text-xs text-muted-foreground">当前版本 {currentVersion || "读取中..."}</p>
        </div>
        {updateState === "available" && <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">发现新版本</span>}
      </header>

      <section className="flex min-h-0 flex-1 flex-col justify-center py-4">
        {updateState === "checking" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            正在检查 GitHub Release...
          </div>
        )}

        {updateState === "upToDate" && (
          <div className="flex items-center gap-2 text-sm">
            <CircleCheck className="size-5 text-emerald-600" />
            当前已是最新版本。
          </div>
        )}

        {updateState === "available" && update && (
          <div className="min-h-0 space-y-3">
            <div>
              <p className="text-sm font-medium">{update.currentVersion} → {update.version}</p>
              <p className="mt-1 text-xs text-muted-foreground">更新包来自 GitHub Release，下载后将进行签名校验。</p>
            </div>
            {updateNotes && <p className="max-h-24 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-2.5 text-xs leading-5 text-muted-foreground">{updateNotes}</p>}
          </div>
        )}

        {updateState === "downloading" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LoaderCircle className="size-4 animate-spin" />
              正在下载并安装 {update?.version ?? "更新"}
            </div>
            {progress !== null ? (
              <>
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">{formatBytes(downloaded)} / {formatBytes(contentLength ?? 0)} ({Math.floor(progress)}%)</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">已下载 {formatBytes(downloaded)}</p>
            )}
          </div>
        )}

        {updateState === "ready" && (
          <div className="flex items-center gap-2 text-sm">
            <CircleCheck className="size-5 text-emerald-600" />
            更新已安装，重启后生效。
          </div>
        )}

        {updateState === "error" && (
          <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-destructive">
              <CircleAlert className="size-4" />
              更新操作失败
            </div>
            <p className="break-words text-xs leading-5 text-muted-foreground">{errorMessage}</p>
          </div>
        )}
      </section>

      <footer className="flex justify-end gap-2 border-t pt-3">
        {(updateState === "upToDate" || updateState === "error") && (
          <Button type="button" variant="outline" onClick={() => void checkForUpdate()}>
            <RefreshCw className="size-4" />
            重新检查
          </Button>
        )}
        {updateState === "available" && (
          <Button type="button" onClick={() => void downloadAndInstall()}>
            <Download className="size-4" />
            下载并安装
          </Button>
        )}
        {updateState === "ready" && (
          <Button type="button" onClick={() => void relaunch()}>
            <RotateCcw className="size-4" />
            立即重启
          </Button>
        )}
        <Button type="button" variant="outline" disabled={updateState === "downloading"} onClick={() => void dismiss()}>
          <X className="size-4" />
          关闭
        </Button>
      </footer>
    </main>
  );
};
