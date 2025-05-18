#!/bin/bash

# Update system packages
sudo yum update -y

# Install Node.js and npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 16

# Install PM2 globally
npm install -g pm2

# Install Git
sudo yum install -y git

# Create application directory
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

# Clone your repository
git clone https://github.com/Khuza1ma/skill-serve-backend.git .

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb+srv://skill-serve:skill-serve@cluster0.mongodb.net/skill-serve-db?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
EOF

# Start the application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup 