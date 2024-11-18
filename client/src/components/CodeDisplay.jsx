import React, {useEffect, useState, useRef} from "react";
import PropTypes from "prop-types";
import FluxQuery from "../services/flux-query.service";
import {postQuery} from "../services/influx.service";

const CodeDisplay = ({queryItems, filterItems, ...props}) => {
  // State to handle the loading spinner and query execution state
  const [isRunning, setIsRunning] = useState(false);
  const [fluxQuery, setFluxQuery] = useState("");
  const [queryResult, setQueryResult] = useState("");
  const [queryError, setQueryError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [graphEmbedLink, setGraphEmbedLink] = useState("");
  const [tableEmbedLink, setTableEmbedLink] = useState("");

  const modalRef = useRef();

  useEffect(() => {
    if (showResult) modalRef.current?.showModal();
    else modalRef.current?.close();
  }, [showResult]);

  useEffect(() => {
    const graphanaBaseLink = "http://localhost:3000/d-solo/dashboard_uid/flux-queries?orgId=1";
    setGraphEmbedLink(`${graphanaBaseLink}&panelId=1&var-fluxQuery=${fluxQuery}`);
    setTableEmbedLink(`${graphanaBaseLink}&panelId=2&var-fluxQuery=${fluxQuery}`);
  }, [fluxQuery]);

  useEffect(() => {
    const queryBuilder = new FluxQuery();
    for (const queryItem of queryItems) {
      switch (queryItem.type) {
      case "BUCKET":
        queryBuilder.setBucket(queryItem.data.name);
        break;
      case "MEASUREMENT":
        queryBuilder.addMeasurement(queryItem.data.name);
        break;
      case "FIELD":
        queryBuilder.addField(queryItem.data.name);
        break;
      }
    }

    for (const filterItem of filterItems) {
      switch (filterItem.data.name) {
      case "Date Range":
        queryBuilder.setDateRange(filterItem.data.minValue, filterItem.data.maxValue);
        break;
      case "Value Range":
        queryBuilder.addFilterValue(filterItem.data.minValue, filterItem.data.maxValue);
        break;
      }
    }

    const query = queryBuilder.build();
    if (query !== fluxQuery) setFluxQuery(query);
  }, [queryItems, filterItems]);

  // Function to handle query execution
  const handleRunQuery = () => {
    setIsRunning(true);
    postQuery(fluxQuery)
      .then((result) => {
        setQueryError(null);
        setQueryResult(result);
      })
      .catch((error) => {
        setQueryError(error.response.data ?? "Unknown error running query");
      }).finally(() => {
        setIsRunning(false);
        setShowResult(true);
      });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-2 border border-slate-700 h-2/4 overflow-auto">
        <div className="flex justify-between p-2">
          <h2>Code</h2>

          <button
            className="bg-sky-500 text-white px-4 py-2 mb-4 rounded hover:bg-sky-700
        disabled:bg-gray-400"
            onClick={handleRunQuery}
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "Run Query"}
          </button>

        </div>
        <pre className="text-left overflow-scroll w-full p-3 select-all">
          {fluxQuery}
        </pre>
      </div>

      <div className="flex-none p-2 border border-slate-700 h-2/4 overflow-auto">
        <h2>Preview</h2>
        <iframe
          src={graphEmbedLink}
          className="w-full h-5/6"
        />
      </div>

      <dialog ref={modalRef} onClose={() => setShowResult(false)}
        className="w-5/6 h-5/6 bg-slate-900 p-3 border border-slate-400">
        <div className="flex justify-between">
          <h2 className="text-white">Result</h2>
          <button onClick={() => setShowResult(false)} className="bg-sky-500">Close</button>
        </div>
        <div className="text-red-500">{queryError}</div>
        <div className="flex h-3/4">
          <iframe
            src={graphEmbedLink}
            className="w-full h-full"
          />
          <iframe
            src={tableEmbedLink}
            className="w-full h-full"
          />
        </div>
      </dialog>
    </div>
  );
};

CodeDisplay.propTypes = {
  queryItems: PropTypes.array,
  filterItems: PropTypes.array,
};

export default CodeDisplay;
