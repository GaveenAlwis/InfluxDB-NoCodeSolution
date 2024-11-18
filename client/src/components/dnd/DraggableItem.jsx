import React, {useEffect, useState} from "react";
import {useDrag} from "react-dnd";
import PropTypes from "prop-types";


const FilterItem=({item, handleInputChange, inputDisabled=false}) => {
  const isDateRange = item.data?.name === "Date Range";
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  useEffect(() => {
    const newItem = {...item};
    newItem.data.minValue = minValue;
    newItem.data.maxValue = maxValue;
    handleInputChange(newItem);
  }, [minValue, maxValue]);

  if (!item?.type) return <></>;

  return (
    <DraggableItem item={item}>
      <div className="text-xs text-slate-500">{item?.type}</div>

      <div className="filter-container">
        <label htmlFor={isDateRange ? "date-range" : "value-range"}>
          {isDateRange ? "Date Range" : "Value Range"}
        </label>

        { !inputDisabled &&
        <div>
          <input type="text"
            placeholder="Min Value"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            className="bg-slate-950 text-white p-2 rounded"
          />
          <input type="text"
            placeholder="Max Value"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            className="bg-slate-950 text-white p-2 rounded"
          />
        </div>
        }
      </div>
    </DraggableItem>
  );
};

const GeneralItem=({item})=>{
  if (!item?.type) return <></>;

  return (
    <DraggableItem item={item}>
      <div className="text-xs text-slate-500">{item?.type}</div>
      <div>{item.data?.name}</div>
    </DraggableItem>
  );
};

const DraggableItem = ({item, ...props}) => {
  const [marginClass, setMarginClass] = useState("");

  useEffect(() => {
    if (item?.type === "BUCKET" || item?.type === "FILTER") setMarginClass("");
    else if (item?.type === "MEASUREMENT") setMarginClass("ml-3");
    else if (item?.type === "FIELD") setMarginClass("ml-6");
  }, [item?.type]);

  const [{isDragging}, drag] = useDrag({
    type: item?.type,
    item: item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;
  if (!item?.type) return <></>;

  return (
    <div
      ref={drag}
      className={`cursor-grab active:cursor-grabbing text-left 
          p-2 pl-3 border-b border-l border-slate-600 hover:border-sky-700 
          ${marginClass} ${props.className}`}
      style={{opacity}}
      {...props}
    >
    </div>
  );
};

FilterItem.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.string,
    data: PropTypes.shape({
      name: PropTypes.string}),
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  inputDisabled: PropTypes.bool,
};

GeneralItem.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.string,
    data: PropTypes.shape({
      name: PropTypes.string}),
  }).isRequired,
};

DraggableItem.propTypes = {
  item: PropTypes.object,
  className: PropTypes.string,
};

export {
  GeneralItem,
  FilterItem,
};
