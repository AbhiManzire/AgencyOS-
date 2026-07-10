module.exports = {
  apps: [
    {
      name: 'agencyos-backend',
      cwd: './backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'agencyos-frontend',
      cwd: './frontend',
      script: 'pnpm',
      args: 'start',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
