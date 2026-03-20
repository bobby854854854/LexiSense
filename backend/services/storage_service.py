import os
import uuid
import logging
from typing import Optional
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")


def get_s3_client():
    """Get an S3 client instance."""
    if not AWS_ACCESS_KEY_ID or AWS_ACCESS_KEY_ID.startswith("YOUR_"):
        logger.warning("AWS credentials not configured - using mock storage")
        return None
    
    return boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )


async def upload_file_to_s3(
    file_content: bytes,
    filename: str,
    organization_id: str,
    content_type: str = "application/octet-stream"
) -> str:
    """Upload a file to S3 and return the storage key."""
    file_ext = filename.split('.')[-1] if '.' in filename else 'bin'
    storage_key = f"{organization_id}/{uuid.uuid4()}.{file_ext}"
    
    s3_client = get_s3_client()
    if not s3_client:
        logger.info(f"Mock upload: {storage_key}")
        return storage_key
    
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=storage_key,
            Body=file_content,
            ContentType=content_type
        )
        logger.info(f"Uploaded file to S3: {storage_key}")
        return storage_key
    except ClientError as e:
        logger.error(f"Failed to upload to S3: {e}")
        raise ValueError(f"Failed to upload file: {str(e)}")


async def generate_presigned_url(storage_key: str, expiration: int = 3600) -> Optional[str]:
    """Generate a presigned URL for downloading a file."""
    s3_client = get_s3_client()
    if not s3_client:
        return None
    
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': storage_key},
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        logger.error(f"Failed to generate presigned URL: {e}")
        return None


async def delete_file_from_s3(storage_key: str) -> bool:
    """Delete a file from S3."""
    s3_client = get_s3_client()
    if not s3_client:
        logger.info(f"Mock delete: {storage_key}")
        return True
    
    try:
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=storage_key)
        logger.info(f"Deleted file from S3: {storage_key}")
        return True
    except ClientError as e:
        logger.error(f"Failed to delete from S3: {e}")
        return False
