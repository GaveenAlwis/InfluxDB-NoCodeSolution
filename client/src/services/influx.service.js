import axios from "axios";

/**
 * Get all buckets
 * @return {Promise<Array<Object>>} an array of bucket objects, which contains `id`, `name`, `orgID`, etc.
 */
const getBuckets = async () => {
  const response = await axios.get("/api/buckets");
  return response.data["buckets"];
};

/**
 * Get measurements from the specified bucket
 * @param {string} bucketName Name of the bucket
 * @return {Promise<Array<object>>} an array of Object which contain the measurement names as `_value`
 */
const getMeasurements = async (bucketName) => {
  const response = await axios.get(`/api/measurements?bucket=${bucketName}`);
  return response.data;
};

/**
 * Get fields of the specified measurement in the specified bucket
 * @param {string} bucketName Name of the bucket
 * @param {string} measurementName Name of the measurement
 * @return {Promise<Array<object>>} an array of Object which contain the field names as `_value`
 */
const getFields = async (bucketName, measurementName) => {
  const response = await axios.get(`/api/fields?bucket=${bucketName}&measurement=${measurementName}`);
  return response.data;
};

const postQuery = async (query) => {
  const response = await axios.post("/api/query", {query});
  return response.data;
};

export {
  getBuckets,
  getMeasurements,
  getFields,
  postQuery,
};
