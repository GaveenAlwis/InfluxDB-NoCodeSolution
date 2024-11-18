import axios from "axios";

const INFLUXDB_HOST = "influxdb";
const INFLUXDB_PORT = 8086;
const influxAxios = axios.create({
  baseURL: `http://${INFLUXDB_HOST}:${INFLUXDB_PORT}/api/v2`,
});

export default influxAxios;
