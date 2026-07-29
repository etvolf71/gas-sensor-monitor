# Gas Sensor Monitor

A standalone static site for the PCP Gas Sensor Monitoring System (GIGA_R1_Sensor_Array_01).

Pulls live readings from an AWS API Gateway endpoint backed by a Lambda + DynamoDB pipeline processing data from a GIGA R1 board with an MQ-sensor array and a Senseair S88 NDIR CO2 sensor.

## Pages

- `gas_sensor_dashboard.html` — live readings, OSHA mixture stats, per-sensor diagnostics (this is the site root, via `vercel.json`)
- `gas_sensor_history.html` — historical trend graphs (gas concentration, CO2, sensor voltage) over a selectable time range
- `gas_sensor_records.html` — full per-record timeline log over a selectable time range

## Stack

Plain static HTML/CSS/JS, no build step. The animated background (`wave-bg.js`) is a vanilla-JS port of a 21st.dev canvas component. Deployed on Vercel as a static site.

## Notes

- `vercel.json` rewrites `/` to `gas_sensor_dashboard.html` so the root URL loads the dashboard.
- The API Gateway endpoint's CORS config must allow whatever origin this ends up deployed on (e.g. `*.vercel.app` or a custom domain), or the fetch calls will fail with a CORS error even though the page itself loads fine.
