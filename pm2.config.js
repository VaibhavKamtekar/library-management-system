const path = require("path");

module.exports = {
  apps: [
    {
      name: "library-backend",
      script: "server.js",
      cwd: path.resolve(__dirname, "Backend"),
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        PORT: 5000
      },
      error_file: path.resolve(__dirname, "logs/error.log"),
      out_file: path.resolve(__dirname, "logs/out.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
      max_size: "10M",
      retain: 7
    }
  ]
};
