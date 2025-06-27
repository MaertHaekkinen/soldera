import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import { useEffect, useState } from "react";
import {
  Button,
  Toast,
  ToastBody,
  ToastHeader,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import AuctionCharts from "./AuctionCharts.tsx";
import { useAuctionData, useTaskPolling, useRefreshResults } from "./App.hooks";

function App() {
  const {
    auctionResults,
    selectedAuction,
    setSelectedAuction,
    toast,
    setToast,
    fetchAuctionResults,
  } = useAuctionData();

  const [taskId, setTaskId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen((prevState) => !prevState);
  const refreshResults = useRefreshResults(setTaskId, setToast);

  useTaskPolling(
    taskId,
    () => {
      setTaskId(null);
      fetchAuctionResults();
    },
    setToast,
  );

  // Initial fetch
  useEffect(() => {
    if (!auctionResults) {
      fetchAuctionResults();
      refreshResults();
    }
  }, [fetchAuctionResults, auctionResults, refreshResults]);

  const buttonText = selectedAuction ? "Check for updates" : "Fetch results";

  const selectedAuctionDetails = auctionResults?.find(
    (auction) => auction.date === selectedAuction,
  );

  return (
    <div className="container">
      <div className="d-flex row gy-3">
        <div className="col-12 col-sm-6 col-md-3">
          <Button onClick={refreshResults} disabled={taskId !== null}>
            {buttonText}
          </Button>
        </div>
        <div className="col-12 col-sm-6 col-md-3 order-md-last">
          <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
            <DropdownToggle caret style={{ whiteSpace: "break-spaces" }}>
              {selectedAuctionDetails
                ? `${selectedAuctionDetails.date} (${selectedAuctionDetails.number_of_participants} participants, ${selectedAuctionDetails.auctions.length} auctions)`
                : "Select Auction"}
            </DropdownToggle>
            <DropdownMenu>
              {auctionResults?.map((auction) => (
                <DropdownItem
                  key={auction.md5_hash}
                  onClick={() => setSelectedAuction(auction.date)}
                  active={selectedAuction === auction.date}
                  style={{ whiteSpace: "break-spaces" }}
                >
                  {auction.date} ({auction.number_of_participants} participants
                  {", "}
                  {auction.auctions.length} auctions)
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
        <div className="col-12 col-md-6">
          <h1 className="mb-3">French Auctions, Guarantees of Origin (GoO)</h1>
        </div>
      </div>
      <div className="border"></div>

      {auctionResults && selectedAuction && (
        <AuctionCharts
          data={auctionResults.filter(
            (auction) => auction.date === selectedAuction,
          )}
        />
      )}

      <Toast
        isOpen={toast.isOpen}
        className={`bg-${toast.color}`}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          minWidth: "250px",
        }}
      >
        <ToastHeader
          toggle={() => setToast((prev) => ({ ...prev, isOpen: false }))}
        >
          {toast.color !== "danger" ? "Results refreshed" : "An error occurred"}
        </ToastHeader>
        <ToastBody>{toast.message}</ToastBody>
      </Toast>
    </div>
  );
}

export default App;
