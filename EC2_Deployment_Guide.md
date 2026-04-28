# AWS EC2 Full Deployment Guide

This guide provides step-by-step instructions to deploy your AI Voice Agent to an AWS EC2 instance. We will use a Linux instance, install Docker, and run your application.

> **IMPORTANT: Instance Size & Cost**  
> Because your application uses `faster-whisper` locally, it requires a fair amount of memory. A Free Tier `t2.micro` or `t3.micro` (1 GB RAM) will likely run out of memory. We strongly recommend using at least a **`t3.small` (2 GB RAM)** or **`t3.medium` (4 GB RAM)** instance. This will incur a small monthly cost (approx. $15-$30/month) while it is running.

---

## Step 1: Launch the EC2 Instance

1. Log into your [AWS Management Console](https://console.aws.amazon.com/ec2/).
2. Navigate to **EC2 Dashboard** and click **Launch instance**.
3. **Name and tags:** Give it a name like `ai-voice-agent-server`.
4. **Application and OS Images (Amazon Machine Image):** 
   - Select **Ubuntu**.
   - Choose **Ubuntu Server 22.04 LTS (HVM)** or newer.
5. **Instance type:**
   - Select **`t3.small`** or **`t3.medium`**.
6. **Key pair (login):**
   - Click **Create new key pair**.
   - Name it (e.g., `voice-agent-key`).
   - Select **RSA** and **.pem**.
   - Click **Create key pair**. This will download the `.pem` file to your computer. Keep it safe!
7. **Network settings:**
   - Under Firewall (security groups), check **Allow SSH traffic from Anywhere (0.0.0.0/0)**.
   - Click **Edit** in the network settings and **Add security group rule**.
   - Set **Type** to **Custom TCP**.
   - Set **Port range** to **`8000`**.
   - Set **Source type** to **Anywhere (0.0.0.0/0)**.
   *(This allows access to the FastAPI server running on port 8000).*
8. **Configure storage:** Leave default (usually 8 GB gp2/gp3 is enough, but you can increase to 16 GB to be safe for Docker images).
9. Click **Launch instance**.

---

## Step 2: Connect to the Instance

1. Open your terminal (or PowerShell on Windows).
2. Navigate to the folder where your `.pem` key was downloaded.
3. Change permissions on the key (Mac/Linux only, skip on Windows):
   ```bash
   chmod 400 voice-agent-key.pem
   ```
4. Connect using SSH:
   ```bash
   ssh -i "voice-agent-key.pem" ubuntu@[3.107.74.166]
   ```
   *(You can find your Public IP on the EC2 Dashboard by clicking your running instance).*
   Type `yes` when asked if you want to continue connecting.

---

## Step 3: Install Docker and Git

Once connected to your Ubuntu instance, run the following commands to update the system and install Docker and Git.

```bash
# Update package list
sudo apt-get update

# Install Git
sudo apt-get install -y git

# Install Docker
sudo apt-get install -y docker.io

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# (Optional) Add ubuntu user to docker group to run docker without sudo
sudo usermod -aG docker ubuntu
# Note: You need to log out and log back in for the group change to take effect. 
# For this guide, we'll just use 'sudo docker'.
```

---

## Step 4: Clone the Repository and Setup

1. Clone your project repository onto the server. If it's a private repo, you'll need to use a personal access token or configure SSH keys for GitHub on the server.
   ```bash
   git clone <YOUR_GITHUB_REPOSITORY_URL>
   ```
2. Navigate into the project folder:
   ```bash
   cd "AI voice agent" # (Or whatever your repo folder is named)
   ```
3. Create your `.env` file with your Groq API key:
   ```bash
   nano .env
   ```
4. Inside the nano editor, paste your API key:
   ```env
   GROQ_API_KEY=your_actual_api_key_here
   ```
5. Save and exit nano:
   - Press `CTRL + X`
   - Press `Y`
   - Press `Enter`

---

## Step 5: Build and Run the Docker Container

1. Build the Docker image (this might take a few minutes as it downloads dependencies):
   ```bash
   sudo docker build -t ai-voice-agent .
   ```
2. Run the Docker container in the background (detached mode) and map port 8000:
   ```bash
   sudo docker run -d --name voice-agent -p 8000:8000 --env-file .env ai-voice-agent
   ```
3. You can verify it's running by checking the container logs:
   ```bash
   sudo docker logs -f voice-agent
   ```
   *(Press `CTRL + C` to exit logs)*

---

## Step 6: Access Your Application

1. Open a web browser on your computer.
2. Navigate to your EC2 instance's public IP address at port 8000:
   ```
   http://<YOUR_EC2_PUBLIC_IP>:8000
   ```
   *(Make sure to use `http://`, not `https://`)*

Your AI Voice Agent should now be live and accessible over the internet! 

---

### Troubleshooting & Management

- **Container stopped?** Check why with: `sudo docker logs voice-agent`
- **Need to restart the app?** `sudo docker restart voice-agent`
- **Need to update the code?**
  ```bash
  # 1. Pull latest code
  git pull origin main
  
  # 2. Stop and remove old container
  sudo docker stop voice-agent
  sudo docker rm voice-agent
  
  # 3. Rebuild and run
  sudo docker build -t ai-voice-agent .
  sudo docker run -d --name voice-agent -p 8000:8000 --env-file .env ai-voice-agent
  ```

> **TIP To save money:** When you are not using the voice agent, you can go to the AWS EC2 Console, right-click your instance, and select **Stop instance**. You will not be billed for compute time while it's stopped (only a few cents for the stored data). You can **Start instance** again whenever you need it, though your Public IP address might change.
