"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ArSession } from "@/features/ar-experience/application/use-cases/create-ar-session";
import type {
  ArExperienceConfig,
  ArExperienceStatus,
} from "@/features/ar-experience/domain/ar-experience";
import {
  MindArImageEngine,
  preloadMindArRuntime,
} from "@/features/ar-experience/infrastructure/mindar/mindar-image-engine";

const RUNTIME_TIMEOUT_MS = 15_000;
const CAMERA_PERMISSION_TIMEOUT_MS = 8_000;
const IOS_CAMERA_RELEASE_DELAY_MS = 180;

export type CameraPermissionIssue = "blocked" | "timeout" | null;

class CameraPermissionFlowError extends Error {
  constructor(
    readonly code: Exclude<CameraPermissionIssue, null>,
    message: string,
  ) {
    super(message);
    this.name = "CameraPermissionFlowError";
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(message)), timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (cause) => {
        window.clearTimeout(timeout);
        reject(cause);
      },
    );
  });
}

function describeCameraError(cause: unknown) {
  if (!(cause instanceof DOMException)) {
    return cause instanceof Error ? cause.message : "Unable to access the camera.";
  }

  switch (cause.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera permission is blocked for this site.";
    case "NotFoundError":
      return "No usable camera was found on this iPhone.";
    case "NotReadableError":
      return "Safari could not open the camera. Close other camera apps and try again.";
    case "OverconstrainedError":
      return "Safari could not select the rear camera. Reload the page and try again.";
    default:
      return cause.message || "Unable to access the camera.";
  }
}

function releaseStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function requestCameraPermission() {
  if (!window.isSecureContext) {
    return Promise.reject(new Error("Camera access requires HTTPS."));
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(
      new Error(
        "Camera access is unavailable. Open this page directly in Safari, not an in-app browser.",
      ),
    );
  }

  return new Promise<MediaStream>((resolve, reject) => {
    let finished = false;

    const timeout = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(
        new CameraPermissionFlowError(
          "timeout",
          "Safari did not show a camera permission prompt.",
        ),
      );
    }, CAMERA_PERMISSION_TIMEOUT_MS);

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      })
      .then((stream) => {
        if (finished) {
          releaseStream(stream);
          return;
        }

        finished = true;
        window.clearTimeout(timeout);
        resolve(stream);
      })
      .catch((cause: unknown) => {
        if (finished) return;

        finished = true;
        window.clearTimeout(timeout);

        if (
          cause instanceof DOMException &&
          (cause.name === "NotAllowedError" || cause.name === "SecurityError")
        ) {
          reject(
            new CameraPermissionFlowError(
              "blocked",
              "Camera permission is blocked for this site.",
            ),
          );
          return;
        }

        reject(new Error(describeCameraError(cause)));
      });
  });
}

export function useArExperience(config: ArExperienceConfig, onRecognized?: (index: number) => void) {
  const recognizedRef = useRef(onRecognized);
  useEffect(() => { recognizedRef.current = onRecognized; }, [onRecognized]);
  const sessionRef = useRef<ArSession | null>(null);
  const startInFlightRef = useRef(false);
  const runtimePromiseRef = useRef<Promise<void> | null>(null);
  const [status, setStatus] = useState<ArExperienceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cameraPermissionIssue, setCameraPermissionIssue] =
    useState<CameraPermissionIssue>(null);

  useEffect(() => {
    runtimePromiseRef.current = preloadMindArRuntime();
    runtimePromiseRef.current.catch(() => undefined);
  }, []);

  const start = useCallback(
    async (container: HTMLElement) => {
      if (startInFlightRef.current) return;

      startInFlightRef.current = true;
      setError(null);
      setCameraPermissionIssue(null);
      setStatus("starting");

      let permissionStream: MediaStream | null = null;

      try {
        // Keep the first browser request tied to the explicit user gesture.
        // On older iOS Safari versions this may reject immediately or never
        // show a permission prompt, so requestCameraPermission has a timeout.
        permissionStream = await requestCameraPermission();

        const runtimePromise =
          runtimePromiseRef.current ?? preloadMindArRuntime();
        runtimePromiseRef.current = runtimePromise;

        await withTimeout(
          runtimePromise,
          RUNTIME_TIMEOUT_MS,
          "The AR engine took too long to load on Safari. Reload the page and try again.",
        );

        releaseStream(permissionStream);
        permissionStream = null;

        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, IOS_CAMERA_RELEASE_DELAY_MS);
        });

        const session = new ArSession(new MindArImageEngine());
        sessionRef.current = session;

        await session.start(container, config, {
          onScanning: () => setStatus("scanning"),
          onTargetFound: (index) => {
          setStatus("found");
          recognizedRef.current?.(index);
        },
          onTargetLost: () => setStatus("scanning"),
          onError: (arError) => {
            setError(arError.message);
            setStatus("error");
          },
        });
      } catch (cause) {
        releaseStream(permissionStream);
        permissionStream = null;

        if (cause instanceof CameraPermissionFlowError) {
          setCameraPermissionIssue(cause.code);
          setError(cause.message);
        } else {
          const message =
            cause instanceof Error
              ? cause.message
              : "Unable to start the AR camera.";
          setError(message);
        }

        setStatus("error");
      } finally {
        startInFlightRef.current = false;
      }
    },
    [config],
  );

  const stop = useCallback(async () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) await session.stop();
    setStatus("idle");
  }, []);

  const dismissCameraPermissionHelp = useCallback(() => {
    setCameraPermissionIssue(null);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    status,
    error,
    cameraPermissionIssue,
    start,
    stop,
    dismissCameraPermissionHelp,
  };
}