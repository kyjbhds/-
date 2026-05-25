#!/bin/bash

# 阿里云函数计算部署脚本

# 配置
REGION="cn-hangzhou"
SERVICE_NAME="student-growth-api"
FUNCTION_NAME="studentowth-api-jlpwzjexhc"
ZIP_FILE="aliyun-fc/bitable-proxy.zip"

echo "=== 开始部署函数计算 ==="

# 检查阿里云CLI是否安装
if ! command -v aliyun &> /dev/null; then
    echo "正在安装阿里云CLI..."
    curl -O https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz
    tar -xvf aliyun-cli-linux-latest-amd64.tgz
    sudo mv aliyun /usr/local/bin/
fi

# 配置阿里云CLI（需要手动输入Access Key）
echo "请确保已经配置了阿里云CLI"
echo "如果没有，请运行: aliyun configure"

# 更新函数代码
echo "正在更新函数代码..."
aliyun fc OpenFunction --region $REGION updateFunction \
    --serviceName $SERVICE_NAME \
    --functionName $FUNCTION_NAME \
    --code {"zipFile":"$(base64 -w 0 $ZIP_FILE)"}

echo "=== 部署完成 ==="
echo "请测试函数: https://studentowth-api-jlpwzjexhc.cn-hangzhou.fcapp.run/api/bitable-proxy/"