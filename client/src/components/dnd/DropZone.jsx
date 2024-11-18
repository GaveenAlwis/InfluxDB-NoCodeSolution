import React from "react";
import {useDrop} from "react-dnd";
import PropTypes from "prop-types";

const DropZone = (
  {
    accept = ["BUCKET", "MEASUREMENT", "FIELD", "FILTER"],
    onDrop,
    destIndex = -1,
    source,
    checkCanDrop = (_) => (true),
    ...props
  },
) => {
  const [{isOver, canDrop}, drop] = useDrop({
    accept: accept,
    drop: (item) => onDrop(item, source, destIndex),
    canDrop: (item) => {
      if (item.type=="FILTER") return checkCanDrop(item);
      if (item.source === source && item.index + 1 === destIndex) return false;
      return checkCanDrop(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`container place-content-center ${isOver && canDrop && "bg-sky-400/50"} ${props.className}`}
      {...props}
    >
    </div>
  );
};

DropZone.propTypes = {
  accept: PropTypes.array,
  onDrop: PropTypes.func,
  destIndex: PropTypes.number,
  source: PropTypes.string,
  className: PropTypes.string,
  checkCanDrop: PropTypes.func,
};

export default DropZone;
