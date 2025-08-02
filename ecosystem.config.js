module.exports = {
  apps: [
    {
      name: 'kingsnake-server',
      script: 'bun',
      args: 'run src/server/main.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
}
