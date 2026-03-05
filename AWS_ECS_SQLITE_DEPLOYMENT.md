# Deploy to AWS ECS with SQLite (SIT Environment)

คู่มือนี้สำหรับ deploy Secret Message App ไปยัง AWS ECS โดยใช้ SQLite แทน PostgreSQL (เหมาะสำหรับ SIT/Testing environment)

## ⚠️ คำเตือนสำคัญ

**SQLite บน ECS มีข้อจำกัด:**
- ข้อมูลจะหายเมื่อ container restart
- ไม่เหมาะสำหรับ production
- ใช้สำหรับ testing/demo เท่านั้น

**สำหรับ Production:** ควรใช้ RDS PostgreSQL หรือ Aurora

---

## วิธีที่ 1: ECS with EFS (แนะนำ - ข้อมูลไม่หาย)

ใช้ EFS (Elastic File System) เก็บ SQLite database file

### ขั้นตอนที่ 1: สร้าง EFS

```bash
# 1. สร้าง EFS File System
aws efs create-file-system \
  --performance-mode generalPurpose \
  --throughput-mode bursting \
  --encrypted \
  --tags Key=Name,Value=secret-message-sqlite \
  --region ap-southeast-1

# บันทึก FileSystemId ที่ได้ เช่น: fs-1234567890abcdef0
```

### ขั้นตอนที่ 2: สร้าง Mount Target

```bash
# 2. สร้าง Mount Target ในแต่ละ subnet
aws efs create-mount-target \
  --file-system-id fs-1234567890abcdef0 \
  --subnet-id subnet-xxxxx \
  --security-groups sg-xxxxx \
  --region ap-southeast-1
```

### ขั้นตอนที่ 3: สร้าง ECR Repository

```bash
# 3. สร้าง ECR repository
aws ecr create-repository \
  --repository-name secret-message-app \
  --region ap-southeast-1

# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com
```

### ขั้นตอนที่ 4: Build และ Push Docker Image

```bash
# 4. Build image
docker build -t secret-message-app .

# Tag image
docker tag secret-message-app:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest
```

### ขั้นตอนที่ 5: สร้าง ECS Task Definition

สร้างไฟล์ `ecs-task-definition-sqlite.json`:

```json
{
  "family": "secret-message-app-sqlite",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "secret-message-app",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "USE_SQLITE",
          "value": "true"
        },
        {
          "name": "BASE_URL",
          "value": "https://sit.mysecretmsg.com"
        },
        {
          "name": "PORT",
          "value": "3000"
        },
        {
          "name": "BCRYPT_ROUNDS",
          "value": "10"
        },
        {
          "name": "ALLOWED_ORIGINS",
          "value": "https://sit.mysecretmsg.com"
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "sqlite-data",
          "containerPath": "/app",
          "readOnly": false
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/secret-message-app",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "node -e \"require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ],
  "volumes": [
    {
      "name": "sqlite-data",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-1234567890abcdef0",
        "transitEncryption": "ENABLED",
        "authorizationConfig": {
          "iam": "ENABLED"
        }
      }
    }
  ]
}
```

### ขั้นตอนที่ 6: Register Task Definition

```bash
# 5. Register task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition-sqlite.json \
  --region ap-southeast-1
```

### ขั้นตอนที่ 7: สร้าง ECS Cluster

```bash
# 6. สร้าง ECS Cluster
aws ecs create-cluster \
  --cluster-name secret-message-cluster \
  --region ap-southeast-1
```

### ขั้นตอนที่ 8: สร้าง Application Load Balancer

```bash
# 7. สร้าง ALB (ผ่าน Console หรือ CLI)
# - สร้าง Target Group (port 3000)
# - สร้าง ALB
# - เพิ่ม Listener (HTTP:80, HTTPS:443)
# - ตั้งค่า SSL Certificate
```

### ขั้นตอนที่ 9: สร้าง ECS Service

```bash
# 8. สร้าง ECS Service
aws ecs create-service \
  --cluster secret-message-cluster \
  --service-name secret-message-service \
  --task-definition secret-message-app-sqlite \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:ap-southeast-1:YOUR_ACCOUNT_ID:targetgroup/secret-message-tg/xxxxx,containerName=secret-message-app,containerPort=3000" \
  --region ap-southeast-1
```

---

## วิธีที่ 2: ECS without EFS (ง่ายกว่า - ข้อมูลหายเมื่อ restart)

ถ้าไม่ต้องการเก็บข้อมูลถาวร (เหมาะสำหรับ demo/testing)

### Task Definition (ไม่มี EFS)

```json
{
  "family": "secret-message-app-sqlite-ephemeral",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "secret-message-app",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "USE_SQLITE",
          "value": "true"
        },
        {
          "name": "BASE_URL",
          "value": "https://sit.mysecretmsg.com"
        },
        {
          "name": "ALLOWED_ORIGINS",
          "value": "https://sit.mysecretmsg.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/secret-message-app",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**ข้อดี:**
- ตั้งค่าง่ายกว่า (ไม่ต้องสร้าง EFS)
- ถูกกว่า (ไม่มีค่า EFS)

**ข้อเสีย:**
- ข้อมูลหายเมื่อ container restart
- ไม่เหมาะสำหรับ testing ที่ต้องเก็บข้อมูล

---

## วิธีที่ 3: ใช้ AWS Copilot (ง่ายที่สุด)

AWS Copilot ช่วยจัดการ ECS ให้อัตโนมัติ

### ติดตั้ง Copilot

```bash
# macOS
brew install aws/tap/copilot-cli

# Windows
# Download from: https://github.com/aws/copilot-cli/releases
```

### Deploy ด้วย Copilot

```bash
# 1. Initialize application
copilot app init secret-message-app

# 2. Initialize service
copilot init \
  --app secret-message-app \
  --name api \
  --type "Load Balanced Web Service" \
  --dockerfile ./Dockerfile \
  --port 3000

# 3. Deploy to SIT environment
copilot env init \
  --name sit \
  --profile default \
  --default-config

# 4. Deploy service
copilot deploy \
  --name api \
  --env sit
```

### Copilot Manifest (copilot/api/manifest.yml)

```yaml
name: api
type: Load Balanced Web Service

image:
  build: Dockerfile
  port: 3000

cpu: 256
memory: 512
count: 1

http:
  path: '/'
  healthcheck:
    path: /
    success_codes: '200'
    interval: 30s
    timeout: 5s
    healthy_threshold: 2
    unhealthy_threshold: 3

variables:
  NODE_ENV: production
  USE_SQLITE: "true"
  BASE_URL: https://sit.mysecretmsg.com
  ALLOWED_ORIGINS: https://sit.mysecretmsg.com

# เพิ่ม EFS สำหรับเก็บ SQLite database
storage:
  volumes:
    sqliteData:
      path: /app
      read_only: false
      efs:
        id: fs-1234567890abcdef0
```

---

## Environment Variables สำหรับ SIT

```bash
# Required
NODE_ENV=production
USE_SQLITE=true
BASE_URL=https://sit.mysecretmsg.com
PORT=3000

# Optional
BCRYPT_ROUNDS=10
ALLOWED_ORIGINS=https://sit.mysecretmsg.com
```

---

## Security Group Configuration

### ECS Task Security Group

**Inbound Rules:**
- Port 3000 from ALB Security Group

**Outbound Rules:**
- All traffic (0.0.0.0/0)

### ALB Security Group

**Inbound Rules:**
- Port 80 (HTTP) from 0.0.0.0/0
- Port 443 (HTTPS) from 0.0.0.0/0

**Outbound Rules:**
- Port 3000 to ECS Task Security Group

### EFS Security Group (ถ้าใช้ EFS)

**Inbound Rules:**
- Port 2049 (NFS) from ECS Task Security Group

---

## IAM Roles

### ecsTaskExecutionRole

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### ecsTaskRole (ถ้าใช้ EFS)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticfilesystem:ClientMount",
        "elasticfilesystem:ClientWrite"
      ],
      "Resource": "arn:aws:elasticfilesystem:ap-southeast-1:YOUR_ACCOUNT_ID:file-system/fs-1234567890abcdef0"
    }
  ]
}
```

---

## CloudWatch Logs

สร้าง Log Group:

```bash
aws logs create-log-group \
  --log-group-name /ecs/secret-message-app \
  --region ap-southeast-1
```

ดู logs:

```bash
aws logs tail /ecs/secret-message-app --follow
```

---

## DNS Configuration

ตั้งค่า Route 53 หรือ DNS provider:

```
Type: A (Alias)
Name: sit.mysecretmsg.com
Value: ALB DNS name (xxx.ap-southeast-1.elb.amazonaws.com)
```

---

## Testing

```bash
# Test health check
curl https://sit.mysecretmsg.com/

# Test create message
curl -X POST https://sit.mysecretmsg.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message","password":"test1234"}'
```

---

## Monitoring

### CloudWatch Metrics

- CPU Utilization
- Memory Utilization
- Request Count
- Target Response Time

### CloudWatch Alarms

```bash
# สร้าง alarm สำหรับ high CPU
aws cloudwatch put-metric-alarm \
  --alarm-name secret-message-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## Cost Estimation (SIT Environment)

### ด้วย EFS:
- ECS Fargate (256 CPU, 512 MB): ~$10/month
- EFS (1 GB): ~$0.30/month
- ALB: ~$20/month
- **Total: ~$30/month**

### ไม่มี EFS:
- ECS Fargate (256 CPU, 512 MB): ~$10/month
- ALB: ~$20/month
- **Total: ~$30/month**

---

## Troubleshooting

### Container ไม่ start

```bash
# ดู logs
aws ecs describe-tasks \
  --cluster secret-message-cluster \
  --tasks TASK_ID \
  --region ap-southeast-1

# ดู CloudWatch Logs
aws logs tail /ecs/secret-message-app --follow
```

### Database file permission error

```bash
# ตรวจสอบ EFS mount point permissions
# ใน task definition เพิ่ม:
"mountPoints": [
  {
    "sourceVolume": "sqlite-data",
    "containerPath": "/app",
    "readOnly": false
  }
]
```

### Health check failed

```bash
# ตรวจสอบ health check endpoint
curl http://TASK_IP:3000/

# แก้ไข health check ใน task definition
"healthCheck": {
  "command": ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"],
  "interval": 30,
  "timeout": 5,
  "retries": 3,
  "startPeriod": 60
}
```

---

## Cleanup

```bash
# ลบ ECS Service
aws ecs delete-service \
  --cluster secret-message-cluster \
  --service secret-message-service \
  --force

# ลบ ECS Cluster
aws ecs delete-cluster \
  --cluster secret-message-cluster

# ลบ EFS
aws efs delete-file-system \
  --file-system-id fs-1234567890abcdef0

# ลบ ECR Repository
aws ecr delete-repository \
  --repository-name secret-message-app \
  --force
```

---

## Migration Path: SQLite → PostgreSQL

เมื่อพร้อม migrate ไป production:

1. สร้าง RDS PostgreSQL
2. เปลี่ยน environment variables:
   ```
   USE_SQLITE=false
   DATABASE_HOST=your-rds-endpoint
   DATABASE_NAME=secret_message_app
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your-password
   ```
3. Deploy task definition ใหม่
4. ไม่ต้องเปลี่ยน code!

---

## สรุป

**แนะนำสำหรับ SIT:**
- ใช้ **วิธีที่ 1 (ECS + EFS)** ถ้าต้องการเก็บข้อมูลระหว่าง restart
- ใช้ **วิธีที่ 2 (ECS only)** ถ้าเป็น demo/testing ชั่วคราว
- ใช้ **วิธีที่ 3 (Copilot)** ถ้าต้องการความง่ายสูงสุด

**สำหรับ Production:**
- ต้องใช้ RDS PostgreSQL หรือ Aurora
- ไม่แนะนำให้ใช้ SQLite

---

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Copilot Documentation](https://aws.github.io/copilot-cli/)
- [EFS with ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/efs-volumes.html)
