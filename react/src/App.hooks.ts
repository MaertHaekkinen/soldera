// hooks.ts
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type { AuctionResults, RefreshResponse, Task } from "./types";
import Cookies from "universal-cookie";

axios.defaults.xsrfHeaderName = "X-CSRFToken";

export type Toast = {
  isOpen: boolean;
  message: string;
  color: "success" | "danger" | "info";
};

export function useAuctionData() {
  const [auctionResults, setAuctionResults] = useState<AuctionResults[] | null>(
    null,
  );
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>({
    isOpen: false,
    message: "",
    color: "info",
  });

  const fetchAuctionResults = useCallback(() => {
    axios
      .get<AuctionResults[]>("/api/auction-results")
      .then((response) => {
        const previousResults = auctionResults;
        setAuctionResults(response.data);
        if (response.data.length > 0) {
          const lastAuction = response.data[0].date;
          if (!selectedAuction) {
            setSelectedAuction(lastAuction);
          } else {
            const hadNewResults =
              response.data.length != previousResults?.length;
            setToast({
              isOpen: true,
              message: hadNewResults
                ? "Auction results refreshed. New results found, check the auction dropdown for new auctions."
                : "Auction results refreshed. No new results found.",
              color: hadNewResults ? "success" : "info",
            });
            setTimeout(
              () => setToast({ isOpen: false, message: "", color: "info" }),
              3000,
            );
          }
        }
      })
      .catch((error) => {
        setToast({
          isOpen: true,
          message: `Failed to fetch auction results: ${
            error.response?.data?.message || error.message
          }`,
          color: "danger",
        });
      });
  }, [auctionResults, selectedAuction]);

  return {
    auctionResults,
    selectedAuction,
    setSelectedAuction,
    toast,
    setToast,
    fetchAuctionResults,
  };
}

export function useTaskPolling(
  taskId: string | null,
  onTaskComplete: () => void,
  setErrorToast: (error: Toast) => void,
) {
  useEffect(() => {
    if (taskId) {
      const interval = setInterval(() => {
        axios
          .get<Task>(`/api/tasks/${taskId}`)
          .then((response) => {
            if (response.data.finished_at) {
              clearInterval(interval);
              onTaskComplete();
            }
          })
          .catch((error) => {
            clearInterval(interval);
            setErrorToast({
              isOpen: true,
              message: `Failed to check task status: ${
                error.response?.data?.message || error.message
              }`,
              color: "danger",
            });
          });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [taskId, onTaskComplete, setErrorToast]);
}

const cookies = new Cookies(null, { path: "/" });
const csrftoken = cookies.get("csrftoken");

export function useRefreshResults(
  setTaskId: (id: string) => void,
  setErrorToast: (error: Toast) => void,
) {
  return useCallback(() => {
    axios
      .post<RefreshResponse>(
        "/api/auction-results/refresh",
        {},
        {
          headers: {
            Cookie: `csrftoken=${csrftoken}`,
            "X-CSRFToken": csrftoken,
          },
        },
      )
      .then((response) => {
        setTaskId(response.data.id);
      })
      .catch((error) => {
        setErrorToast({
          isOpen: true,
          message: `Failed to refresh results: ${
            error.response?.data?.message || error.message
          }`,
          color: "danger",
        });
      });
  }, [setTaskId, setErrorToast, csrftoken]);
}
