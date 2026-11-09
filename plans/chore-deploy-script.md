# デプロイを yarn deploy にまとめる (#49)

- `yarn deploy` = `yarn build` → `aws s3 sync dist/ s3://tax-simulator/ --delete` → CloudFront `E1KSS7SLDOD1TN` の `/*` を無効化
- `--delete` で `dist/` にない古いファイルは消える（バケットのバージョニングは無効）
- profile は `to-kyo.to`
- 配信の構成（S3 のウェブサイト用エンドポイントを CloudFront の取り出し元にする）は README に書く
