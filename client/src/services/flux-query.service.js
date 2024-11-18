/**
 *
 */
class FluxQuery {
  /**
   * Constructor for FluxQuery - use builder pattern
   */
  constructor() {
    this.bucket = null;
    this.startTime = null;
    this.endTime = null;

    this.minValue = null;
    this.maxValue = null;

    this.measurements = [];
    this.fields = [];
  }

  /**
   * Set bucket of the flux query
   * @param {*} bucket
   * @return {FluxQuery} the FluxQuery object for chaining
   */
  setBucket(bucket) {
    this.bucket = bucket;
    return this;
  }

  /**
   * Set date range for the query
   * @param {*} startTime
   * @param {*} endTime
   * @return {FluxQuery} the FluxQuery object for chaining
   */
  setDateRange(startTime, endTime) {
    this.startTime = startTime;
    this.endTime = (endTime || endTime === "") ? "now()" : endTime;
    return this;
  }

  /**
   * Add a measurement filter to the query
   * @param {*} measurement
   * @return {FluxQuery} the FluxQuery object for chaining
   */
  addMeasurement(measurement) {
    this.measurements.push(measurement);
    return this;
  }

  /**
   * Add a field filter to the query
   * @param {*} field
   * @return {FluxQuery} the FluxQuery object for chaining
   */
  addField(field) {
    this.fields.push(field);
    return this;
  }

  /**
   * Add a value filter to the query
   * @param {*} minValue
   * @param {*} maxValue
   * @return {FluxQuery} the FluxQuery object for chaining
   */
  addFilterValue(minValue, maxValue) {
    this.minValue = minValue;
    this.maxValue = maxValue;
    return this;
  }

  /**
   * Build a Flux query string.
   * @return {string}
   */
  build() {
    let query = "";
    if (this.bucket === null) return query;
    // Select bucket
    query += `from(bucket: "${this.bucket}")\n`;

    // Filter by date range
    if (this.startTime && this.endTime) {
      query += `|> range(start: ${this.startTime}, stop: ${this.endTime})\n`;
    }

    // Filter by measurements
    for (const measurement of this.measurements) {
      query += `|> filter(fn: (r) => r._measurement == "${measurement}")\n`;
    }

    // Filter by fields
    const fieldTests = [];
    for (const field of this.fields) {
      fieldTests.push( `r._field == "${field}"`);
    }

    if (fieldTests.length) {
      query += `|> filter(fn: (r) => ${fieldTests.join(" or ")})\n`;
    }

    // Filter by value
    if (this.minValue) {
      query += `|> filter(fn: (r) => r._value >= ${this.minValue})\n`;
    }
    if (this.maxValue) {
      query += `|> filter(fn: (r) => r._value <= ${this.maxValue})\n`;
    }

    return query;
  }
}

export default FluxQuery;
