#!/bin/bash
# Automatic ML Retraining Cron Job
# This runs every hour to retrain the model on new data

# Run the training script
docker exec voltaxe_api python /app/train_incremental.py

# Log the result
echo "[$(date)] Automatic retraining completed" >> /home/rahul/Voltaxe/logs/ml_training.log
