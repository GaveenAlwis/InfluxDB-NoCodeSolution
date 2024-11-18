import express from "express";
import influxAxios from "../utils/influx-axios.js";


// eslint-disable-next-line new-cap
const router = express.Router();

/* GET home page. */
router.get("/", function(req, res) {
  res.send({message: "Hello from express!"});
});

/**
 * Return the Org ID in InfluxDB
 * @param {express.Request} req
 * @return {Promise}
 */
const getOrgID = (req) => {
  return new Promise((resolve, reject) => {
    influxAxios.get("/orgs", {
      headers: {
        "Content-Type": "application/json",
        "Cookie": req.headers.cookie,
      },
    })
      .then((response) => {
        const orgID = response.data.orgs[0].id;
        resolve(orgID);
      })
      .catch((error) => {
        console.error("Error fetching org ID:", error.response ? error.response.data : error.message);
        reject(error);
      });
  });
};

/**
 * Send an Flux query
 * @param {express.Request} req
 * @param {string} query
 * @return {Promise}
 */
const postFluxQuery = (req, query) => {
  return new Promise((resolve, reject) => {
    getOrgID(req)
      .then((orgID) => {
        const dialect = {
          annotations: ["group", "datatype", "default"],
        };

        influxAxios.post(`/query?orgID=${orgID}`, {query: query, dialect}, {
          headers: {
            "Cookie": req.headers.cookie,
            "Content-Type": "application/json",
            "Accept": "text/csv",
          },
        })
          .then((response) => resolve(response))
          .catch((error) => reject(error));
      })
      .catch((err) => reject(err));
  });
};

router.post("/query", (req, res) => {
  const {query} = req.body;

  if (!query) {
    return res.status(400).send("Query is required");
  }

  postFluxQuery(req, query)
    .then((response) => {
      res.status(200).json(response.data);
    })
    .catch((error) => {
      const errorResponse = `Error running query from InfluxDB: 
      ${ error.response?.data?.message ?? error.message}`;
      console.error(errorResponse);
      res.status(error.status).send(errorResponse);
    });
});


/**
 * Retrieves the list of all buckets
 * Requires the user to be authenticated (uses the session token stored in the cookie)
 */
router.get("/buckets", function(req, res) {
  influxAxios.get("/buckets", {
    headers: {Cookie: req.headers.cookie},
  })
    .then((response) => {
      res.status(response.status).send(response.data);
    })
    .catch((error) => {
      console.log("Error fetching buckets:", error.response ? error.response.data : error.message);
      res.status(error.status).send(error.message);
    });
});


/**
 * Retrieves the list of measurements for a given bucket
 */
router.get("/measurements", function(req, res) {
  const {bucket} = req.query;

  if (!bucket) {
    return res.status(400).send("Bucket is required");
  }

  const fluxQuery = `
    import "influxdata/influxdb/schema"
    schema.measurements(bucket: "${bucket}")
  `;

  postFluxQuery(req, fluxQuery)
    .then((response) => {
      const csvData = response.data;
      const rows = csvData.trim().split("\n");

      // Assuming data starts from the 4th row, update header row index and data start index
      const headers = rows[3].split(",").slice(1);

      // Skip the first three rows and start mapping from the actual data
      const records = rows.slice(4).map((row) => {
        const values = row.split(",").slice(1);
        return headers.reduce((acc, header, index) => {
          acc[header.trim()] = values[index].trim();
          return acc;
        }, {});
      });

      res.status(200).json(records);
    })
    .catch((error) => {
      console.error(
        "Error fetching measurements from InfluxDB:", error.response ? error.response.data : error.message,
      );
      res.status(error.status).send("Error fetching measurements from InfluxDB");
    });
});


/**
 * Retrieves the list of fields for a given bucket and measurement
 */
router.get("/fields", function(req, res) {
  const {bucket, measurement} = req.query;

  if (!bucket || !measurement) {
    return res.status(400).send("Bucket and measurement are required");
  }

  const fluxQuery = `
  import "influxdata/influxdb/schema"
  schema.fieldKeys(
    bucket: "${bucket}", 
    predicate: (r) => (r._measurement == "${measurement}"),
  )
  `;

  postFluxQuery(req, fluxQuery)
    .then((response) => {
      const csvData = response.data;
      const rows = csvData.trim().split("\n");

      // Adjusted to skip initial three rows and start at the fourth
      const headers = rows[3].split(",").slice(1);
      const records = rows.slice(4).map((row) => {
        const values = row.split(",").slice(1);
        return headers.reduce((obj, header, index) => {
          obj[header.trim()] = values[index].trim();
          return obj;
        }, {});
      });

      res.status(response.status).json(records);
    })
    .catch((error) => {
      console.error("Error fetching fields:", error.response ? error.response.data : error.message);
      res.status(error.status).send("Error fetching fields from InfluxDB");
    });
});

export default router;
