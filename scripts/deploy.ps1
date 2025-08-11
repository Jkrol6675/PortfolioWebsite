param(
  [string]$Bucket = $env:S3_BUCKET,
  [string]$DistributionId = $env:CLOUDFRONT_DISTRIBUTION_ID
)

if (-not $Bucket) { Write-Error 'Set $env:S3_BUCKET or pass -Bucket'; exit 1 }

Write-Host "Syncing assets to s3://$Bucket ..."
aws s3 sync website s3://$Bucket --delete --cache-control 'public,max-age=31536000' --exclude '*.html'
aws s3 sync website s3://$Bucket --cache-control 'public,max-age=60' --exclude '*' --include '*.html'

if ($DistributionId) {
  Write-Host "Creating CloudFront invalidation on $DistributionId ..."
  aws cloudfront create-invalidation --distribution-id $DistributionId --paths '/*' | Out-Null
  Write-Host 'Invalidation requested.'
} else {
  Write-Warning 'CLOUDFRONT_DISTRIBUTION_ID not set; skipped invalidation.'
}


