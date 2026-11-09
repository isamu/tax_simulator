# Tax Simulator

https://tax-answer.net/#4000000

# About

年収額からおおよその納税額や社会保険の費用をシミュレートします。
会社員を想定していて、社会保険は厚生年金/保険で会社負担含めて、グラフで可視化しています。
税率・保険料率・控除額は令和8年分（2026年）、歳出の内訳は令和8年度補正後予算のものです。健康保険料は協会けんぽの全国平均で計算しています。国民健康保険・国民年金に切り替えた場合、国民健康保険料は東京23区の共通基準（加入者は本人1人）で計算します。
住宅ローン控除（令和4年以降の入居）と、ふるさと納税の上限額の目安も出します。

各種計算はこちら。

- 年収から各表示値まで: [`src/utils/simulate.ts`](src/utils/simulate.ts)
- 標準報酬月額・所得税・給与所得控除: [`src/utils/tax.ts`](src/utils/tax.ts)
- 住宅ローン控除: [`src/utils/housingLoan.ts`](src/utils/housingLoan.ts)

## ふるさと納税の上限計算（個人事業主向け）

`/furusato/` で、売上・必要経費・青色申告特別控除と、確定申告書の「所得から差し引かれる金額」の各欄から、ふるさと納税の控除上限額の目安を計算します。人的控除（配偶者・扶養など）は区分を選ぶと所得税・住民税の両方の額を自動で求めます。住宅ローン控除で自己負担が2,000円を超える場合はその目安も出します。計算は [`src/utils/furusato.ts`](src/utils/furusato.ts) と [`src/utils/furusatoDeductions.ts`](src/utils/furusatoDeductions.ts)。

## 開発

Vue 3 + Vite + TypeScript。

```
yarn install
yarn dev          # 開発サーバー
yarn build        # dist/ に本番用ファイルを出力
yarn preview      # ビルド結果をローカルで確認
yarn test         # vitest
yarn lint         # ESLint
yarn typecheck    # vue-tsc
yarn format       # Prettier
yarn deploy       # build → S3 に同期 → CloudFront のキャッシュ削除
```

`yarn deploy` は `dist/` を S3 バケット `tax-simulator` に同期し（`dist/` にないファイルは消します）、CloudFront（`E1KSS7SLDOD1TN`）のキャッシュを削除します。AWS の profile `to-kyo.to` が必要です。CloudFront の取り出し元は S3 のウェブサイト用エンドポイントなので、`/furusato/` のようなディレクトリでも `index.html` が返ります。

ファビコンと共有用画像（`public/` の `favicon.ico`・`apple-touch-icon.png`・`icon-512.png`・`og-image.png`・`furusato/og-image.png`）は `scripts/make-images.sh` で作り直せます。ImageMagick とヒラギノ角ゴシック（macOS）が必要です。新しいページを足したら `public/sitemap.xml` にも追加してください。
