# InfluxUI-UG3
Private repo for InfluxUI-UG3

## Getting started
### Pre-requisite
Docker and Docker Compose

### How to run

1. Set up Influx authentication
Default InfluxDB authentication is in `.env` file.

2. Build Docker images
```bash
docker compose build
```

3. Run Docker containers
```bash
docker compose up -d
```

4. Access the front-end
Go to http://localhost/ to use the front end

### Development setup
Run `npm install` to install all dev dependencies, then follow the `How to run` section.
