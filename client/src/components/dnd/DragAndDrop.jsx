import React, {useEffect, useState} from "react";
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";

import DropZone from "./DropZone";
import {GeneralItem, FilterItem} from "./DraggableItem";
import CodeDisplay from "../CodeDisplay";

import {
  getBuckets,
  getFields,
  getMeasurements,
} from "../../services/influx.service";


const DragAndDrop = () => {
  const sources = {
    list: "list",
    query: "query",

  };
  const hierarchy = ["BUCKET", "MEASUREMENT", "FIELD", "FILTER"];
  const predefinedFilters=[
    {id: 1, name: "Date Range"},
    {id: 2, name: "Value Range"},
  ];
  const [listItems, setListItems] = useState([]); // JSON data of the items in the list of draggable items
  const [queryItems, setQueryItems] = useState([]); // JSON data of the items in the query builder
  const [filterQueryItems, setFilterQueryItems] = useState([]); // JSON data of the items in the query builder

  useEffect(() => {
    getListItems();
  }, []);

  /**
   * Initialize the data in the list of draggable items.
   * Contains buckets, measurements, and fields.
  */
  const getListItems = async () => {
    const getFieldItems = async (bucketName, measurementName) => {
      const fields = await getFields(bucketName, measurementName);
      return fields.map((field) => ({
        data: {name: field["_value"]},
        index: 0,
        source: sources.list,
        type: "FIELD",
      }));
    };

    const getMeasurementItems = async (bucketName) => {
      const measurements = await getMeasurements(bucketName);
      return await Promise.all(
        measurements.map(async (measurement) => {
          const measurementName = measurement["_value"];
          return {
            data: {name: measurementName},
            index: 0,
            source: sources.list,
            type: "MEASUREMENT",
            children: await getFieldItems(bucketName, measurementName),
          };
        }),
      );
    };

    const getBucketItems = async () => {
      const buckets = await getBuckets();
      return await Promise.all(
        buckets.map(async (bucket) => {
          return {
            data: bucket,
            index: 0,
            source: sources.list,
            type: "BUCKET",
            children: await getMeasurementItems(bucket.name),
          };
        }),
      );
    };

    try {
      const buckets = await getBucketItems();
      setListItems(buckets);
    } catch (error) {
      console.error(error.message);
    }
  };

  /**
   * Handle the item when it's dropped from the `fromSource` zone
   * to the `destIndex` position of the destination zone.
   * @param {object} item item to be moved
   * @param {string} fromSource the source where the item comes from (e.g. `query` or `list`)
   * @param {number} destIndex the index in the destination zone
   */
  const onDrop = (item, fromSource, destIndex = -1) => {
    if (item.type=="FILTER") {
      setFilterQueryItems((previousItems) => insertQueryItem([...previousItems], item, fromSource, destIndex));
    } else {
      setQueryItems((previousItems) => insertQueryItem([...previousItems], item, fromSource, destIndex));
    }
  };

  /**
   * Returns the new array that has the new inserted item.
   *
   * @param {Array} items array of query items to be changed
   * @param {object} item item to be inserted/moved into the specified query items
   * @param {string} fromSource the source where the item comes from (e.g. `query` or `list`)
   * @param {number} destIndex the index in the destination zone
   * @return {Array} new array that has the new inserted item
   */
  const insertQueryItem = (items, item, fromSource, destIndex) => {
    // Remove the item and children if its destination is the query builder
    let children = [];
    if (item.source === sources.query) {
      let childCount = 0;
      for (let i = item.index + 1; i < items.length; i++) {
        if (hierarchy.indexOf(items[i].type) <= hierarchy.indexOf(item.type)) {
          break;
        }
        childCount++;
      }
      children = items.splice(item.index, childCount + 1).splice(1); // Remove self and children, then remove self
    }

    // Insert the item and its children at the right destination
    if (fromSource === sources.query) {
      const newItems = [
        {...item, source: sources.query},
        ...children.map((child) => ({...child, source: sources.query})),
      ];

      // Get the real destination index in the array based on the destIndex
      destIndex = items.findIndex((i) => i.index >= destIndex);
      destIndex = destIndex <= -1 ? items.length : destIndex;

      items.splice(destIndex, 0, ...newItems);
    }

    // Re-index items
    items = items.map((i, index) => ({...i, index}));

    return items;
  };


  /**
   * Check whether the item can be dropped in the query builder drop zone
   * @param {Object} prevItem item that comes before the current drop zone
   * @param {Object} itemToBeDropped item to be dropped in the current drop zone
   * @return {boolean}
   */
  const canDrop = (prevItem, itemToBeDropped) => {
    const {source, type, data} = itemToBeDropped;

    // Cannot add item that already in query builder if it's not from the query builder
    if (source !== sources.query && queryItems.some((item) => item.data.name === data.name)) {
      return false;
    }

    if (type === "BUCKET" || type === "FILTER") return true;


    const currentHierarchy = hierarchy.indexOf(type);
    const previousHierarchy = hierarchy.indexOf(prevItem.type);

    // Can add item if dropped item has higher hierarchy e.g Buckets
    if (currentHierarchy < previousHierarchy) return true;

    // Find the potential parent of the item to be dropped
    let parent = prevItem;
    if (currentHierarchy == previousHierarchy) {
      const prevIndex = queryItems.findIndex((item) => item.data.name === prevItem.data.name);
      parent = queryItems.slice(0, prevIndex)
        .findLast((item) => hierarchy.indexOf(item.type) < previousHierarchy);
    }

    // true if item exists in the parent's children
    return parent.children.some((child) => child.data.name === data.name);
  };

  /**
   * Get a list of acceptable types for the drag zone that comes after the specified `item`
   * @param {Object} item Draggable Item which is above the current drag zone
   * @param {number} index index of the item in the query builder
   * @return {Array<string>}
   */
  const getQueryZoneAccept = (item, index) => {
    /* Idea: Each zone accepts item from the next lower hierarchy
      (e.g. Bucket accepts Measurement, Measurement accepts Field).
      Check the next item to ensure proper positioning, especially
      with consecutive mixed type (e.g. add a bucket between Bucket1
      and Bucket2 in:  Bucket1 - Measurement1 - Bucket2)
    */
    const subzoneAccept = new Set();
    const currentHierarchyIndex = hierarchy.indexOf(item.type);

    // The zone accepts immediate lower hierarchy type
    if (currentHierarchyIndex < hierarchy.length - 1) {
      subzoneAccept.add(hierarchy[currentHierarchyIndex + 1]);
    }

    const nextItem = queryItems[index + 1] || {type: "BUCKET"};
    const nextHierarchyIndex = hierarchy.indexOf(nextItem.type);

    // Accept the any type in between the current and the next item
    for (let i = nextHierarchyIndex; i <= currentHierarchyIndex; i++) {
      subzoneAccept.add(hierarchy[i]);
    }

    return [...subzoneAccept];
  };

  /**
   * Render the item and its children if existed as `DraggableItem`
   * @param {Object} item draggable item data
   * @param {number} index index of the item in the list (to pass the key in the for loop)
   * @return {React.Fragment}
   */
  const renderListRecursive = (item, index) => {
    return <React.Fragment key={index}>
      <GeneralItem item={item} />
      {item.children?.map((child, childIndex) => renderListRecursive(child, childIndex))}
    </React.Fragment>;
  };

  return (
    <div className="flex h-screen">
      <DndProvider backend={HTML5Backend}>
        {/* Bucket, field, and measurement list */}
        <div className="flex-none w-64 border border-slate-700 overflow-auto" >
          {/* This drop zone only acts as the bin for items from query builder */}
          <DropZone source={sources.list} onDrop={onDrop}>
            {
              listItems.length !== 0 ?
                listItems.map((bucketItem, index) => renderListRecursive(bucketItem, index)) :
                <div>Loading...</div>
            }
          </DropZone>
          <DropZone source={sources.list} onDrop={onDrop}>
            <div className="mt-4">
              <h2>Predefined Filters</h2>
              {predefinedFilters.map((filter, index)=>(
                <FilterItem
                  key={filter.id}
                  item={{data: {name: filter.name}, type: "FILTER", source: sources.list}}
                  handleInputChange={() => {}}
                  inputDisabled={true}
                />
              ))}
            </div>
          </DropZone>
        </div>

        {/* Query builder zone */}
        <div className="flex flex-none flex-col" style={{width: 600}}>
          <div className="flex-none p-2 border border-slate-700 h-2/4 overflow-auto">
            <h2>Query Builder</h2>
            {queryItems.map((item, index) => (
              item.type !== "FILTER" && (
                <React.Fragment key={index}>
                  <GeneralItem item={item} />
                  <DropZone
                    accept={getQueryZoneAccept(item, index)}
                    source={sources.query} destIndex={index+1} onDrop={onDrop}
                    checkCanDrop={(droppedItem) => canDrop(item, droppedItem)}>
                    <div className="flex items-center justify-center w-full">
                      <div className="border-t border-slate-700 w-full"></div>
                      <div className="px-4 text-slate-500">+</div>
                      <div className="border-t border-slate-700 w-full"></div>
                    </div>
                  </DropZone>
                </React.Fragment>)
            ))}

            {
              queryItems.length === 0 &&
              <DropZone accept={["BUCKET"]} source={sources.query} onDrop={onDrop}>
                <div className="h-20 border border-dashed border-slate-700 text-slate-500 place-content-center">
                  + Drop here
                </div>
              </DropZone>
            }

          </div>
          <div className="flex-auto p-2 border border-slate-700 h-1/8 overflow-auto">
            <h2>Filters</h2>
            {filterQueryItems.map((filterItem, index) => (
              filterItem.type === "FILTER" && (
                <React.Fragment key={index}>
                  <FilterItem item={filterItem} handleInputChange={(item) => onDrop(item, sources.query, item.index)} />
                  <DropZone
                    accept={getQueryZoneAccept(filterItem, index)}
                    source={sources.query} destIndex={index+1} onDrop={onDrop}
                    checkCanDrop={(droppedItem) => canDrop(filterItem, droppedItem)}>
                    <div className="flex items-center justify-center w-full">
                      <div className="border-t border-slate-700 w-full"></div>
                      <div className="px-4 text-slate-500">+</div>
                      <div className="border-t border-slate-700 w-full"></div>
                    </div>
                  </DropZone>
                </React.Fragment>)

            ))}

            {
              filterQueryItems.length === 0 &&
              <DropZone accept={["FILTER"]} source={sources.query} onDrop={onDrop}>
                <div className="h-20 border border-dashed border-slate-700 text-slate-500 place-content-center">
                  + Filter
                </div>
              </DropZone>
            }
          </div>
        </div>
        <div className="flex-auto border border-slate-700 overflow-auto">
          <CodeDisplay queryItems={queryItems} filterItems={filterQueryItems} />
        </div>
      </DndProvider>
    </div>
  );
};

export default DragAndDrop;
