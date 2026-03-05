# Deploy to AWS ECS Express Mode (SIT Environment)

คู่มือนี้สำหรับ deploy Secret Message App ไปยัง AWS ECS Express Mode - วิธีที่ง่ายและเร็วที่สุด!

## 🚀 ECS Express Mode คืออะไร?

**ECS Express Mode** เป็นฟีเจอร์ใหม่ของ AWS ECS ที่ทำให้การ deploy container ง่ายมาก:
- ✅ ไม่ต้องสร้าง VPC, Subnet, Security Groups
- ✅ ไม่ต้องสร้าง Load Balancer
- ✅ ไม่ต้องสร้าง Task Definition
- ✅ ได้ HTTPS endpoint ทันที
- ✅ Deploy ด้วยคำสั่งเดียว!

**เหมาะสำหรับ:** SIT, Testing, Demo, Proof of Concept

---

## ⚠️ ข้อจำกัดสำคัญ

**SQLite บน ECS Express:**
- ข้อมูลจะหายเมื่อ container restart (ไม่มี EFS support)
- เหมาะสำหรับ testing/demo เท่านั้น
- สำหรับ production ควรใช้ RDS PostgreSQL

---

## วิธีที่ 1: ใช้ AWS CLI (แนะนำ)

### ขั้นตอนที่ 1: ติดตั้ง AWS CLI

```bash
# ตรวจสอบว่าติดตั้งแล้วหรือยัง
aws --version

# ถ้ายังไม่มี ติดตั้งจาก: https://aws.amazon.com/cli/
```

### ขั้นตอนที่ 2: Configure AWS Credentials

```bash
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region name: ap-southeast-1
# Default output format: json
```

### ขั้นตอนที่ 3: Build Docker Image

```bash
# Build image
docker build -t secret-message-app .

# Test locally (optional)
docker run -p 3000:3000 \
  -e USE_SQLITE=true \
  -e BASE_URL=http://localhost:3000 \
  secret-message-app
```

### ขั้นตอนที่ 4: สร้าง ECR Repository

```bash
# สร้าง ECR repository
aws ecr create-repository \
  --repository-name secret-message-app \
  --region ap-southeast-1

# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com
```

### ขั้นตอนที่ 5: Push Image to ECR

```bash
# Tag image
docker tag secret-message-app:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest
```

### ขั้นตอนที่ 6: Deploy ด้วย ECS Express Mode

```bash
# Deploy ด้วยคำสั่งเดียว!
aws ecs create-service \
  --service-name secret-message-sit \
  --desired-count 1 \
  --launch-type FARGATE \
  --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}" \
  --service-connect-configuration '{
    "enabled": true,
    "namespace": "secret-message",
    "services": [{
      "portName": "http",
      "clientAliases": [{
        "port": 3000
      }]
    }]
  }' \
  --deployment-controller type=ECS \
  --enable-execute-command \
  --task-definition secret-message-task \
  --region ap-southeast-1
```

**หมายเหตุ:** คำสั่งข้างต้นเป็นตัวอย่าง - ECS Express Mode อาจต้องใช้ Console หรือ CLI ใหม่

---

## วิธีที่ 2: ใช้ AWS Console (ง่ายที่สุด)

### ขั้นตอนที่ 1: เข้า ECS Console

1. เปิด [AWS ECS Console](https://console.aws.amazon.com/ecs/)
2. เลือก Region: **ap-southeast-1** (Singapore)

### ขั้นตอนที่ 2: สร้าง Service ด้วย Express Mode

1. คลิก **"Create service"**
2. เลือก **"Express mode"** (ถ้ามี) หรือ **"Get started"**
3. กรอกข้อมูล:
   - **Service name:** `secret-message-sit`
   - **Container image:** `YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest`
   - **Port:** `3000`
   - **Environment variables:**
     ```
     NODE_ENV=production
     USE_SQLITE=true
     BASE_URL=https://YOUR_ECS_URL
     PORT=3000
     BCRYPT_ROUNDS=10
     ```

4. คลิก **"Create"**

### ขั้นตอนที่ 3: รอ Deployment เสร็จ

- AWS จะสร้าง VPC, Load Balancer, Security Groups อัตโนมัติ
- รอประมาณ 5-10 นาที
- คุณจะได้ HTTPS URL เช่น: `https://xxxxx.execute-api.ap-southeast-1.amazonaws.com`

### ขั้นตอนที่ 4: อัพเดท BASE_URL

```bash
# อัพเดท environment variable ด้วย URL ที่ได้
aws ecs update-service \
  --service secret-message-sit \
  --force-new-deployment \
  --region ap-southeast-1
```

---

## วิธีที่ 3: ใช้ Kiro Power (ecs-express-power)

คุณมี **ecs-express-power** ติดตั้งอยู่แล้ว ซึ่งจะช่วยให้ deploy ง่ายขึ้น!

### ขั้นตอนที่ 1: เตรียม Docker Image

```bash
# Build และ push image ไปยัง ECR (ตามขั้นตอนข้างต้น)
docker build -t secret-message-app .
docker tag secret-message-app:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest
```

### ขั้นตอนที่ 2: ใช้ Kiro Power Deploy

ใน Kiro, ใช้คำสั่ง:

```
Deploy this app to ECS Express Mode with:
- Image: YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest
- Port: 3000
- Environment:
  - NODE_ENV=production
  - USE_SQLITE=true
  - PORT=3000
  - BCRYPT_ROUNDS=10
```

Kiro จะใช้ **ecs-express-power** ช่วย deploy ให้อัตโนมัติ!

---

## Environment Variables สำหรับ ECS Express

```bash
# Required
NODE_ENV=production
USE_SQLITE=true
PORT=3000

# จะอัพเดทหลังได้ BASE_URL เมื่อ deploy เสร็จ
BASE_URL=https://YOUR_ECS_URL

# Optional
BCRYPT_ROUNDS=10
ALLOWED_ORIGINS=https://YOUR_ECS_URL
```

---

## การตั้งค่า Custom Domain (Optional)

ถ้าต้องการใช้ `sit.mysecretmsg.com`:

### ขั้นตอนที่ 1: ดู Load Balancer DNS

```bash
# หา ALB DNS name
aws elbv2 describe-load-balancers \
  --region ap-southeast-1 \
  --query 'LoadBalancers[*].[LoadBalancerName,DNSName]' \
  --output table
```

### ขั้นตอนที่ 2: ตั้งค่า DNS

ใน Route 53 หรือ DNS provider:

```
Type: CNAME
Name: sit.mysecretmsg.com
Value: xxxxx.ap-southeast-1.elb.amazonaws.com
TTL: 300
```

### ขั้นตอนที่ 3: ตั้งค่า SSL Certificate

1. ไปที่ **AWS Certificate Manager (ACM)**
2. Request certificate สำหรับ `sit.mysecretmsg.com`
3. Validate ด้วย DNS
4. เพิ่ม certificate ไปยัง Load Balancer

### ขั้นตอนที่ 4: อัพเดท Environment Variables

```bash
# อัพเดท BASE_URL และ ALLOWED_ORIGINS
aws ecs update-service \
  --service secret-message-sit \
  --force-new-deployment \
  --region ap-southeast-1
```

---

## Testing

```bash
# Test health check
curl https://YOUR_ECS_URL/

# Test create message
curl -X POST https://YOUR_ECS_URL/api/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"Test from ECS Express","password":"test1234"}'

# Test get message (ใช้ path ที่ได้จาก response)
curl https://YOUR_ECS_URL/api/messages/YOUR_PATH
```

---

## Monitoring

### CloudWatch Logs

```bash
# ดู logs
aws logs tail /aws/ecs/secret-message-sit --follow --region ap-southeast-1
```

### CloudWatch Metrics

ใน AWS Console:
1. ไปที่ **CloudWatch > Metrics**
2. เลือก **ECS > Service Metrics**
3. ดู:
   - CPU Utilization
   - Memory Utilization
   - Request Count

---

## Cost Estimation

**ECS Express Mode (SIT):**
- ECS Fargate (256 CPU, 512 MB): ~$10/month
- Application Load Balancer: ~$20/month
- Data Transfer: ~$1-5/month
- **Total: ~$30-35/month**

**ถูกกว่า EC2 และไม่ต้องจัดการ infrastructure!**

---

## Scaling (Optional)

### Auto Scaling

```bash
# ตั้งค่า auto scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/default/secret-message-sit \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 3 \
  --region ap-southeast-1

# สร้าง scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/default/secret-message-sit \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }' \
  --region ap-southeast-1
```

---

## Troubleshooting

### Service ไม่ start

```bash
# ดู service events
aws ecs describe-services \
  --services secret-message-sit \
  --region ap-southeast-1 \
  --query 'services[0].events[0:5]'

# ดู task logs
aws logs tail /aws/ecs/secret-message-sit --follow
```

### Health check failed

ตรวจสอบว่า:
- Container port = 3000
- Health check path = `/` (root)
- Application ฟัง port 3000

### Cannot connect to database

ตรวจสอบ environment variables:
```bash
aws ecs describe-services \
  --services secret-message-sit \
  --region ap-southeast-1 \
  --query 'services[0].taskDefinition'
```

---

## Update และ Rollback

### Deploy Version ใหม่

```bash
# Build และ push image ใหม่
docker build -t secret-message-app .
docker tag secret-message-app:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:v2
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:v2

# Update service
aws ecs update-service \
  --service secret-message-sit \
  --force-new-deployment \
  --region ap-southeast-1
```

### Rollback

```bash
# Rollback ไปยัง version ก่อนหน้า
aws ecs update-service \
  --service secret-message-sit \
  --task-definition secret-message-task:PREVIOUS_REVISION \
  --force-new-deployment \
  --region ap-southeast-1
```

---

## Cleanup

```bash
# ลบ ECS Service
aws ecs delete-service \
  --service secret-message-sit \
  --force \
  --region ap-southeast-1

# ลบ ECR Repository
aws ecr delete-repository \
  --repository-name secret-message-app \
  --force \
  --region ap-southeast-1

# ลบ Load Balancer (ถ้าสร้างแยก)
aws elbv2 delete-load-balancer \
  --load-balancer-arn YOUR_ALB_ARN \
  --region ap-southeast-1
```

---

## เปรียบเทียบ: ECS Express vs ECS Standard

| Feature | ECS Express | ECS Standard |
|---------|-------------|--------------|
| Setup Time | 5-10 นาที | 30-60 นาที |
| Configuration | Minimal | Full control |
| VPC/Networking | Auto | Manual |
| Load Balancer | Auto | Manual |
| Best For | SIT/Testing | Production |
| Cost | ~$30/month | ~$30-50/month |

---

## Migration Path: ECS Express → ECS Standard

เมื่อพร้อม migrate ไป production:

1. Export configuration จาก ECS Express
2. สร้าง VPC, Subnets, Security Groups
3. สร้าง Application Load Balancer
4. สร้าง Task Definition แบบเต็ม
5. สร้าง ECS Service ใน Standard mode
6. เปลี่ยน DNS ไปยัง ALB ใหม่

---

## สรุป

**ECS Express Mode เหมาะสำหรับ:**
- ✅ SIT/Testing environment
- ✅ Demo และ Proof of Concept
- ✅ ต้องการ deploy เร็ว
- ✅ ไม่ต้องการจัดการ infrastructure

**ข้อจำกัด:**
- ⚠️ SQLite = ข้อมูลหายเมื่อ restart
- ⚠️ ไม่เหมาะสำหรับ production
- ⚠️ Customization จำกัด

**สำหรับ Production:**
- ใช้ ECS Standard Mode
- ใช้ RDS PostgreSQL
- ตั้งค่า Auto Scaling
- ตั้งค่า Monitoring และ Alerting

---

## Additional Resources

- [AWS ECS Express Mode Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/)
- [ECS Express Power (Kiro)](https://github.com/aws/ecs-express-power)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)

---

## Quick Start Commands

```bash
# 1. Build image
docker build -t secret-message-app .

# 2. Create ECR repo
aws ecr create-repository --repository-name secret-message-app --region ap-southeast-1

# 3. Login to ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com

# 4. Tag and push
docker tag secret-message-app:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/secret-message-app:latest

# 5. Deploy ผ่าน Console หรือใช้ Kiro Power!
```

**ใช้ Kiro Power ง่ายที่สุด!** 🚀
